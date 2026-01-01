import { createServerFn } from "@tanstack/react-start";

/**
 * DNS record types
 */
export type DnsRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "TXT"
  | "NS"
  | "SOA"
  | "PTR"
  | "SRV"
  | "CAA";

/**
 * DNS record data
 */
export interface DnsRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

/**
 * DNS lookup result for a single record type
 */
export interface DnsTypeResult {
  type: DnsRecordType;
  records: DnsRecord[];
  error?: string;
}

/**
 * Complete DNS lookup result
 */
export interface DnsLookupResult {
  domain: string;
  results: DnsTypeResult[];
  timestamp: string;
}

/**
 * DNS over HTTPS response structure (Cloudflare/Google format)
 */
interface DohResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question?: Array<{
    name: string;
    type: number;
  }>;
  Answer?: DnsRecord[];
  Authority?: DnsRecord[];
  Comment?: string;
}

/**
 * DNS record type to number mapping
 */
const DNS_TYPE_MAP: Record<DnsRecordType, number> = {
  A: 1,
  AAAA: 28,
  CNAME: 5,
  MX: 15,
  TXT: 16,
  NS: 2,
  SOA: 6,
  PTR: 12,
  SRV: 33,
  CAA: 257,
};

/**
 * Validate domain name format
 *
 * Checks if the domain name follows RFC 1035 naming conventions:
 * - Must contain at least one dot
 * - Labels can be up to 63 characters
 * - Labels can contain alphanumeric characters and hyphens
 * - Labels cannot start or end with a hyphen
 *
 * @param domain - Domain name to validate
 * @returns True if domain name is valid, false otherwise
 *
 * @example
 * ```ts
 * isValidDomain("example.com") // true
 * isValidDomain("sub.example.com") // true
 * isValidDomain("example") // false
 * isValidDomain("-example.com") // false
 * ```
 */
function isValidDomain(domain: string): boolean {
  const domainRegex =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return domainRegex.test(domain);
}

/**
 * Query DNS over HTTPS
 *
 * Queries DNS records using DNS-over-HTTPS protocol.
 * Tries Cloudflare DOH first, then falls back to Google DOH.
 *
 * @param domain - Domain name to query
 * @param recordType - DNS record type to query (A, AAAA, MX, etc.)
 * @returns DNS query result with records or error
 *
 * @example
 * ```ts
 * const result = await queryDoh("example.com", "A");
 * console.log(result.records); // [{ name: "example.com", type: 1, TTL: 3600, data: "93.184.216.34" }]
 * ```
 */
async function queryDoh(
  domain: string,
  recordType: DnsRecordType
): Promise<DnsTypeResult> {
  const typeNumber = DNS_TYPE_MAP[recordType];
  const result: DnsTypeResult = {
    type: recordType,
    records: [],
  };

  // Try Cloudflare DOH first
  const dohUrls = [
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${typeNumber}`,
    `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${typeNumber}`,
  ];

  let lastError = "";

  for (const url of dohUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/dns-json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }

      const data: DohResponse = await response.json();

      // Status 0 = NOERROR, 3 = NXDOMAIN
      if (data.Status === 3) {
        result.error = "ドメインが見つかりません";
        return result;
      }

      if (data.Status !== 0) {
        lastError = `DNS Status ${data.Status}`;
        continue;
      }

      // Extract records from Answer section
      if (data.Answer && data.Answer.length > 0) {
        result.records = data.Answer.filter((record) => record.type === typeNumber);
        return result;
      }

      // No records found
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }
  }

  result.error = `DNS問い合わせに失敗しました (${lastError})`;
  return result;
}

/**
 * DNS lookup input parameters
 */
export interface DnsLookupInput {
  domain: string;
  types?: DnsRecordType[];
}

/**
 * Server function for DNS lookup
 */
export const lookupDns = createServerFn({ method: "GET" })
  .inputValidator((data: unknown): DnsLookupInput => {
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid input");
    }

    const input = data as Record<string, unknown>;

    if (typeof input.domain !== "string" || !input.domain) {
      throw new Error("ドメイン名を入力してください");
    }

    const domain = input.domain.toLowerCase().trim();

    if (!isValidDomain(domain)) {
      throw new Error("無効なドメイン形式です");
    }

    // Default to common record types if not specified
    const defaultTypes: DnsRecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"];

    let types = defaultTypes;
    if (Array.isArray(input.types) && input.types.length > 0) {
      types = input.types.filter((t): t is DnsRecordType =>
        typeof t === "string" && t in DNS_TYPE_MAP
      );
      if (types.length === 0) {
        types = defaultTypes;
      }
    }

    return { domain, types };
  })
  .handler(async ({ data }): Promise<DnsLookupResult> => {
    const { domain, types = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] } = data;

    // Query all requested record types in parallel
    const results = await Promise.all(
      types.map((type) => queryDoh(domain, type))
    );

    return {
      domain,
      results,
      timestamp: new Date().toISOString(),
    };
  });
