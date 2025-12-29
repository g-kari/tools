import { createServerFn } from "@tanstack/react-start";

// DNS record types
export interface MXRecord {
  priority: number;
  exchange: string;
}

export interface EmailDNSResult {
  domain: string;
  mx: {
    records: MXRecord[];
    status: "success" | "error" | "not_found";
    error?: string;
  };
  spf: {
    record?: string;
    status: "success" | "error" | "not_found";
    error?: string;
    details?: {
      version?: string;
      mechanisms?: string[];
      isValid: boolean;
    };
  };
  dmarc: {
    record?: string;
    status: "success" | "error" | "not_found";
    error?: string;
    details?: {
      policy?: string;
      subdomainPolicy?: string;
      percentage?: number;
      isValid: boolean;
    };
  };
  dkim?: {
    selector: string;
    record?: string;
    status: "success" | "error" | "not_found";
    error?: string;
  };
}

// DNS over HTTPS query
const DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query";

interface DoHAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DoHResponse {
  Status: number;
  Answer?: DoHAnswer[];
}

// Query DNS over HTTPS
async function queryDNS(
  domain: string,
  type: string
): Promise<DoHResponse | null> {
  try {
    const url = new URL(DOH_ENDPOINT);
    url.searchParams.set("name", domain);
    url.searchParams.set("type", type);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/dns-json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

// Parse MX records
function parseMXRecords(response: DoHResponse | null): MXRecord[] {
  if (!response || !response.Answer) {
    return [];
  }

  return response.Answer.map((answer) => {
    const parts = answer.data.split(" ");
    return {
      priority: parseInt(parts[0], 10),
      exchange: parts[1].replace(/\.$/, ""), // Remove trailing dot
    };
  }).sort((a, b) => a.priority - b.priority);
}

// Parse TXT records
function parseTXTRecords(response: DoHResponse | null): string[] {
  if (!response || !response.Answer) {
    return [];
  }

  return response.Answer.map((answer) => {
    // Remove quotes from TXT record data
    return answer.data.replace(/^"|"$/g, "");
  });
}

// Validate SPF record
function validateSPF(record: string): {
  version?: string;
  mechanisms?: string[];
  isValid: boolean;
} {
  const isValid = record.startsWith("v=spf1");
  if (!isValid) {
    return { isValid: false };
  }

  const parts = record.split(/\s+/);
  const version = parts[0];
  const mechanisms = parts.slice(1);

  return {
    version,
    mechanisms,
    isValid: true,
  };
}

// Validate DMARC record
function validateDMARC(record: string): {
  policy?: string;
  subdomainPolicy?: string;
  percentage?: number;
  isValid: boolean;
} {
  const isValid = record.startsWith("v=DMARC1");
  if (!isValid) {
    return { isValid: false };
  }

  const parts = record.split(";").map((p) => p.trim());
  const result: {
    policy?: string;
    subdomainPolicy?: string;
    percentage?: number;
    isValid: boolean;
  } = { isValid: true };

  for (const part of parts) {
    const [key, value] = part.split("=").map((s) => s.trim());
    if (key === "p") {
      result.policy = value;
    } else if (key === "sp") {
      result.subdomainPolicy = value;
    } else if (key === "pct") {
      result.percentage = parseInt(value, 10);
    }
  }

  return result;
}

// Query email DNS records
async function queryEmailDNS(
  domain: string,
  dkimSelector?: string
): Promise<EmailDNSResult> {
  const result: EmailDNSResult = {
    domain,
    mx: {
      records: [],
      status: "error",
    },
    spf: {
      status: "error",
    },
    dmarc: {
      status: "error",
    },
  };

  // Query MX records
  try {
    const mxResponse = await queryDNS(domain, "MX");
    if (mxResponse && mxResponse.Status === 0) {
      const mxRecords = parseMXRecords(mxResponse);
      if (mxRecords.length > 0) {
        result.mx = {
          records: mxRecords,
          status: "success",
        };
      } else {
        result.mx = {
          records: [],
          status: "not_found",
          error: "MXレコードが見つかりませんでした",
        };
      }
    } else {
      result.mx = {
        records: [],
        status: "not_found",
        error: "MXレコードが見つかりませんでした",
      };
    }
  } catch (err) {
    result.mx = {
      records: [],
      status: "error",
      error: err instanceof Error ? err.message : "MXレコードの取得に失敗しました",
    };
  }

  // Query SPF records (TXT)
  try {
    const txtResponse = await queryDNS(domain, "TXT");
    const txtRecords = parseTXTRecords(txtResponse);
    const spfRecord = txtRecords.find((record) => record.startsWith("v=spf1"));

    if (spfRecord) {
      const details = validateSPF(spfRecord);
      result.spf = {
        record: spfRecord,
        status: "success",
        details,
      };
    } else {
      result.spf = {
        status: "not_found",
        error: "SPFレコードが見つかりませんでした",
      };
    }
  } catch (err) {
    result.spf = {
      status: "error",
      error: err instanceof Error ? err.message : "SPFレコードの取得に失敗しました",
    };
  }

  // Query DMARC records
  try {
    const dmarcDomain = `_dmarc.${domain}`;
    const dmarcResponse = await queryDNS(dmarcDomain, "TXT");
    const dmarcRecords = parseTXTRecords(dmarcResponse);
    const dmarcRecord = dmarcRecords.find((record) =>
      record.startsWith("v=DMARC1")
    );

    if (dmarcRecord) {
      const details = validateDMARC(dmarcRecord);
      result.dmarc = {
        record: dmarcRecord,
        status: "success",
        details,
      };
    } else {
      result.dmarc = {
        status: "not_found",
        error: "DMARCレコードが見つかりませんでした",
      };
    }
  } catch (err) {
    result.dmarc = {
      status: "error",
      error:
        err instanceof Error ? err.message : "DMARCレコードの取得に失敗しました",
    };
  }

  // Query DKIM records (optional)
  if (dkimSelector) {
    try {
      const dkimDomain = `${dkimSelector}._domainkey.${domain}`;
      const dkimResponse = await queryDNS(dkimDomain, "TXT");
      const dkimRecords = parseTXTRecords(dkimResponse);
      const dkimRecord = dkimRecords.find((record) =>
        record.includes("v=DKIM1")
      );

      if (dkimRecord) {
        result.dkim = {
          selector: dkimSelector,
          record: dkimRecord,
          status: "success",
        };
      } else {
        result.dkim = {
          selector: dkimSelector,
          status: "not_found",
          error: "DKIMレコードが見つかりませんでした",
        };
      }
    } catch (err) {
      result.dkim = {
        selector: dkimSelector,
        status: "error",
        error:
          err instanceof Error ? err.message : "DKIMレコードの取得に失敗しました",
      };
    }
  }

  return result;
}

// Server function for email DNS lookup
export const lookupEmailDNS = createServerFn({ method: "GET" })
  .inputValidator((data: { domain: string; dkimSelector?: string }) => {
    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(data.domain)) {
      throw new Error("無効なドメイン形式です");
    }
    return {
      domain: data.domain.toLowerCase(),
      dkimSelector: data.dkimSelector?.trim(),
    };
  })
  .handler(async ({ data }) => {
    return await queryEmailDNS(data.domain, data.dkimSelector);
  });
