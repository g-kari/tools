import { createServerFn } from "@tanstack/react-start";

// Contact information
interface ContactInfo {
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// WHOIS API types
export interface WhoisResult {
  domain: string;
  registrar?: string;
  createdDate?: string;
  expiryDate?: string;
  updatedDate?: string;
  nameServers?: string[];
  status?: string[];
  registrant?: ContactInfo;
  administrative?: ContactInfo;
  technical?: ContactInfo;
  billing?: ContactInfo;
  abuse?: ContactInfo;
  error?: string;
}

// RDAP response types
interface RdapResponse {
  ldhName?: string;
  handle?: string;
  status?: string[];
  events?: Array<{
    eventAction: string;
    eventDate: string;
  }>;
  nameservers?: Array<{
    ldhName: string;
  }>;
  entities?: Array<{
    roles?: string[];
    vcardArray?: [
      string,
      Array<[string, Record<string, unknown>, string, string | string[]]>,
    ];
    publicIds?: Array<{
      type: string;
      identifier: string;
    }>;
  }>;
  remarks?: Array<{
    title?: string;
    description?: string[];
  }>;
  errorCode?: number;
  title?: string;
  description?: string[];
}

// IANA RDAP Bootstrap file URL
const IANA_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";

// Bootstrap file structure
interface BootstrapFile {
  version: string;
  publication: string;
  services: Array<[string[], string[]]>;
}

// Function to get TLD from domain
function getTld(domain: string): string {
  const parts = domain.split(".");
  return parts[parts.length - 1].toLowerCase();
}

// Function to fetch and parse IANA bootstrap file
async function getBootstrapData(): Promise<Record<string, string>> {
  try {
    const response = await fetch(IANA_BOOTSTRAP_URL, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bootstrap: ${response.status}`);
    }

    const data: BootstrapFile = await response.json();
    const mapping: Record<string, string> = {};

    // Parse services array: [[tlds], [urls]]
    for (const service of data.services) {
      const tlds = service[0];
      const urls = service[1];
      if (urls.length > 0) {
        const serverUrl = urls[0].replace(/\/$/, ""); // Remove trailing slash
        for (const tld of tlds) {
          mapping[tld.toLowerCase()] = serverUrl;
        }
      }
    }

    return mapping;
  } catch {
    return {};
  }
}

// Function to query a single RDAP server
async function queryRdapServer(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: "application/rdap+json",
    },
  });
}

// Helper function to parse vCard array into ContactInfo
function parseVcardToContact(
  vcardArray?: [
    string,
    Array<[string, Record<string, unknown>, string, string | string[]]>,
  ]
): ContactInfo | undefined {
  if (!vcardArray || !vcardArray[1]) {
    return undefined;
  }

  const vcard = vcardArray[1];
  const contact: ContactInfo = {};

  for (const entry of vcard) {
    const [type, , , value] = entry;

    switch (type) {
      case "fn":
        contact.name = typeof value === "string" ? value : undefined;
        break;
      case "org":
        contact.organization =
          typeof value === "string"
            ? value
            : Array.isArray(value)
              ? value[0]
              : undefined;
        break;
      case "email":
        contact.email = typeof value === "string" ? value : undefined;
        break;
      case "tel":
        contact.phone = typeof value === "string" ? value : undefined;
        break;
      case "adr":
        if (Array.isArray(value)) {
          const parts = value.filter((v) => v && typeof v === "string");
          contact.address = parts.join(", ");
        }
        break;
    }
  }

  if (!contact.name && !contact.organization && !contact.email) {
    return undefined;
  }

  return contact;
}

// Parse RDAP response into WhoisResult
function parseRdapResponse(data: RdapResponse, domain: string): WhoisResult {
  const result: WhoisResult = { domain };

  result.domain = data.ldhName || domain;

  if (data.status) {
    result.status = data.status;
  }

  if (data.events) {
    for (const event of data.events) {
      switch (event.eventAction) {
        case "registration":
          result.createdDate = event.eventDate;
          break;
        case "expiration":
          result.expiryDate = event.eventDate;
          break;
        case "last changed":
        case "last update of RDAP database":
          if (!result.updatedDate) {
            result.updatedDate = event.eventDate;
          }
          break;
      }
    }
  }

  if (data.nameservers) {
    result.nameServers = data.nameservers
      .map((ns) => ns.ldhName)
      .filter(Boolean);
  }

  if (data.entities) {
    for (const entity of data.entities) {
      const roles = entity.roles || [];

      if (roles.includes("registrar")) {
        if (entity.vcardArray && entity.vcardArray[1]) {
          const fnEntry = entity.vcardArray[1].find(
            (entry) => entry[0] === "fn"
          );
          if (fnEntry) {
            result.registrar = fnEntry[3] as string;
          }
        }
        if (!result.registrar && entity.publicIds) {
          const ianaId = entity.publicIds.find(
            (id) => id.type === "IANA Registrar ID"
          );
          if (ianaId) {
            result.registrar = `IANA ID: ${ianaId.identifier}`;
          }
        }
      }

      const contactInfo = parseVcardToContact(entity.vcardArray);

      if (roles.includes("registrant") && contactInfo) {
        result.registrant = contactInfo;
      }
      if (roles.includes("administrative") && contactInfo) {
        result.administrative = contactInfo;
      }
      if (roles.includes("technical") && contactInfo) {
        result.technical = contactInfo;
      }
      if (roles.includes("billing") && contactInfo) {
        result.billing = contactInfo;
      }
      if (roles.includes("abuse") && contactInfo) {
        result.abuse = contactInfo;
      }
    }
  }

  return result;
}

// Function to query RDAP
async function queryRdap(domain: string): Promise<WhoisResult> {
  const result: WhoisResult = { domain };
  const tld = getTld(domain);

  const bootstrap = await getBootstrapData();
  const serversToTry: string[] = [];

  if (bootstrap[tld]) {
    serversToTry.push(
      `${bootstrap[tld]}/domain/${encodeURIComponent(domain)}`
    );
  }

  serversToTry.push(`https://rdap.org/domain/${encodeURIComponent(domain)}`);

  let lastError = "";

  for (const serverUrl of serversToTry) {
    try {
      const response = await queryRdapServer(serverUrl);

      if (response.ok) {
        const data: RdapResponse = await response.json();
        return parseRdapResponse(data, domain);
      }

      if (response.status === 404) {
        result.error = "ドメインが見つかりませんでした";
        return result;
      }

      lastError = `HTTP ${response.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }
  }

  result.error = `WHOIS情報を取得できませんでした (${lastError})`;
  return result;
}

// Server function for WHOIS lookup
export const lookupWhois = createServerFn({ method: "GET" })
  .validator((data: string) => {
    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(data)) {
      throw new Error("無効なドメイン形式です");
    }
    return data.toLowerCase();
  })
  .handler(async ({ data: domain }) => {
    return await queryRdap(domain);
  });
