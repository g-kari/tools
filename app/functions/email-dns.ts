import { createServerFn } from "@tanstack/react-start";

// Domain validation regex
export const DOMAIN_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

// DNS record types
export interface MXRecord {
  priority: number;
  exchange: string;
  ipAddresses?: string[];
  ptr?: string[];
  ttl?: number;
}

export interface EmailDNSResult {
  domain: string;
  mx: {
    records: MXRecord[];
    status: "success" | "error" | "not_found";
    error?: string;
    warnings?: string[];
  };
  spf: {
    record?: string;
    status: "success" | "error" | "not_found";
    error?: string;
    details?: {
      version?: string;
      mechanisms?: string[];
      isValid: boolean;
      lookupCount?: number;
      warnings?: string[];
      expandedIncludes?: string[];
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
      rua?: string[];
      ruf?: string[];
      isValid: boolean;
      warnings?: string[];
    };
  };
  dkim?: {
    selector: string;
    record?: string;
    status: "success" | "error" | "not_found";
    error?: string;
  };
  recommendations?: string[];
  smtpCheckInstructions?: {
    telnet: string[];
    curl: string[];
    openssl: string[];
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/dns-json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`DNS query failed for ${domain} (${type}): HTTP ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`DNS query error for ${domain} (${type}):`, error.message);
    }
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
      ttl: answer.TTL,
    };
  }).sort((a, b) => a.priority - b.priority);
}

// Resolve IP addresses for a hostname
async function resolveIPAddresses(hostname: string): Promise<string[]> {
  const [ipv4Response, ipv6Response] = await Promise.all([
    queryDNS(hostname, "A"),
    queryDNS(hostname, "AAAA"),
  ]);

  const ips: string[] = [];

  if (ipv4Response?.Answer) {
    ips.push(...ipv4Response.Answer.map(a => a.data));
  }

  if (ipv6Response?.Answer) {
    ips.push(...ipv6Response.Answer.map(a => a.data));
  }

  return ips;
}

// Get PTR records for an IP address
async function getPTRRecords(ip: string): Promise<string[]> {
  // Convert IP to reverse DNS format
  let reverseDomain: string;

  if (ip.includes(':')) {
    // IPv6 - skip for simplicity
    return [];
  } else {
    // IPv4
    const parts = ip.split('.');
    reverseDomain = `${parts[3]}.${parts[2]}.${parts[1]}.${parts[0]}.in-addr.arpa`;
  }

  const ptrResponse = await queryDNS(reverseDomain, "PTR");

  if (!ptrResponse?.Answer) {
    return [];
  }

  return ptrResponse.Answer.map(a => a.data.replace(/\.$/, ''));
}

// Enrich MX records with IP and PTR information
async function enrichMXRecords(records: MXRecord[]): Promise<MXRecord[]> {
  const enrichPromises = records.map(async (record) => {
    const ipAddresses = await resolveIPAddresses(record.exchange);
    const ptr: string[] = [];

    // Get PTR for first IP only (to avoid too many DNS queries)
    if (ipAddresses.length > 0) {
      const ptrRecords = await getPTRRecords(ipAddresses[0]);
      ptr.push(...ptrRecords);
    }

    return {
      ...record,
      ipAddresses: ipAddresses.length > 0 ? ipAddresses : undefined,
      ptr: ptr.length > 0 ? ptr : undefined,
    };
  });

  return Promise.all(enrichPromises);
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

// Validate and expand SPF record
async function validateSPF(
  record: string,
  domain: string,
  visitedDomains: Set<string> = new Set(),
  depth: number = 0,
  startTime?: number
): Promise<{
  version?: string;
  mechanisms?: string[];
  isValid: boolean;
  lookupCount?: number;
  warnings?: string[];
  expandedIncludes?: string[];
}> {
  const isValid = record.startsWith("v=spf1");
  if (!isValid) {
    return { isValid: false };
  }

  const parts = record.split(/\s+/);
  const version = parts[0];
  const mechanisms = parts.slice(1);
  const warnings: string[] = [];
  const expandedIncludes: string[] = [];
  let lookupCount = 0;

  // Set start time for timeout check
  const st = startTime || Date.now();
  const SPF_TIMEOUT_MS = 10000; // 10 seconds total timeout for SPF validation

  // Check timeout
  if (Date.now() - st > SPF_TIMEOUT_MS) {
    warnings.push("SPF検証がタイムアウトしました");
    return {
      version,
      mechanisms,
      isValid: true,
      lookupCount,
      warnings,
      expandedIncludes,
    };
  }

  // Prevent infinite recursion
  if (depth > 10) {
    warnings.push("SPFレコードのネストが深すぎます（10レベル超過）");
    return {
      version,
      mechanisms,
      isValid: true,
      lookupCount,
      warnings,
      expandedIncludes,
    };
  }

  // Prevent circular references
  if (visitedDomains.has(domain)) {
    warnings.push(`循環参照が検出されました: ${domain}`);
    return {
      version,
      mechanisms,
      isValid: true,
      lookupCount,
      warnings,
      expandedIncludes,
    };
  }

  visitedDomains.add(domain);

  // Expand includes
  for (const mechanism of mechanisms) {
    if (mechanism.startsWith("include:")) {
      lookupCount++;
      const includeDomain = mechanism.substring(8);
      expandedIncludes.push(includeDomain);

      // Fetch the included SPF record
      try {
        const txtResponse = await queryDNS(includeDomain, "TXT");
        const txtRecords = parseTXTRecords(txtResponse);
        const includedSPF = txtRecords.find((r) => r.startsWith("v=spf1"));

        if (includedSPF) {
          const expanded = await validateSPF(
            includedSPF,
            includeDomain,
            visitedDomains,
            depth + 1,
            st
          );
          lookupCount += expanded.lookupCount || 0;
          if (expanded.warnings) {
            warnings.push(...expanded.warnings);
          }
          if (expanded.expandedIncludes) {
            expandedIncludes.push(...expanded.expandedIncludes);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "不明なエラー";
        console.error(`SPF include lookup failed for ${includeDomain}:`, errorMsg);
        warnings.push(`include:${includeDomain} の取得に失敗しました`);
      }
    } else if (mechanism.startsWith("a:") || mechanism.startsWith("mx:")) {
      lookupCount++;
    } else if (mechanism === "a" || mechanism === "mx") {
      lookupCount++;
    }
  }

  // Check lookup count
  if (lookupCount > 10) {
    warnings.push(`DNSルックアップ回数が制限を超えています（${lookupCount}/10）`);
  } else if (lookupCount > 8) {
    warnings.push(`DNSルックアップ回数が多めです（${lookupCount}/10）`);
  }

  return {
    version,
    mechanisms,
    isValid: true,
    lookupCount,
    warnings: warnings.length > 0 ? warnings : undefined,
    expandedIncludes: expandedIncludes.length > 0 ? expandedIncludes : undefined,
  };
}

// Validate DMARC record
function validateDMARC(record: string): {
  policy?: string;
  subdomainPolicy?: string;
  percentage?: number;
  rua?: string[];
  ruf?: string[];
  isValid: boolean;
  warnings?: string[];
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
    rua?: string[];
    ruf?: string[];
    isValid: boolean;
    warnings?: string[];
  } = { isValid: true };

  const warnings: string[] = [];

  for (const part of parts) {
    if (!part || part.startsWith("v=")) continue;

    const [key, value] = part.split("=").map((s) => s.trim());

    if (key === "p") {
      result.policy = value;
      if (value === "none") {
        warnings.push("DMARCポリシーが'none'です。'quarantine'または'reject'を推奨します");
      }
    } else if (key === "sp") {
      result.subdomainPolicy = value;
    } else if (key === "pct") {
      result.percentage = parseInt(value, 10);
      if (result.percentage < 100) {
        warnings.push(`DMARC適用率が${result.percentage}%です。100%を推奨します`);
      }
    } else if (key === "rua") {
      result.rua = value.split(",").map((s) => s.trim());
    } else if (key === "ruf") {
      result.ruf = value.split(",").map((s) => s.trim());
    }
  }

  if (!result.policy) {
    warnings.push("DMARCポリシー(p=)が設定されていません");
  }

  if (!result.rua && !result.ruf) {
    warnings.push("レポート送信先(rua/ruf)が設定されていません");
  }

  result.warnings = warnings.length > 0 ? warnings : undefined;

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

  // Parallelize independent DNS queries for better performance
  const [mxResult, txtResult, dmarcResult, dkimResult] = await Promise.allSettled([
    queryDNS(domain, "MX"),
    queryDNS(domain, "TXT"),
    queryDNS(`_dmarc.${domain}`, "TXT"),
    dkimSelector ? queryDNS(`${dkimSelector}._domainkey.${domain}`, "TXT") : Promise.resolve(null),
  ]);

  // Process MX results
  if (mxResult.status === "fulfilled") {
    const mxResponse = mxResult.value;
    try {
      if (mxResponse && mxResponse.Status === 0) {
        const mxRecords = parseMXRecords(mxResponse);
        if (mxRecords.length > 0) {
          // Enrich MX records with IP and PTR information
          const enrichedRecords = await enrichMXRecords(mxRecords);
          const mxWarnings: string[] = [];

          // Check for single MX record
          if (enrichedRecords.length === 1) {
            mxWarnings.push("MXレコードが1つしかありません。冗長性のため複数設定を推奨します");
          }

          result.mx = {
            records: enrichedRecords,
            status: "success",
            warnings: mxWarnings.length > 0 ? mxWarnings : undefined,
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
  } else {
    result.mx = {
      records: [],
      status: "error",
      error: "MXレコードの取得に失敗しました",
    };
  }

  // Process SPF results
  if (txtResult.status === "fulfilled") {
    try {
      const txtRecords = parseTXTRecords(txtResult.value);
      const spfRecord = txtRecords.find((record) => record.startsWith("v=spf1"));

      if (spfRecord) {
        const details = await validateSPF(spfRecord, domain);
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
  } else {
    result.spf = {
      status: "error",
      error: "SPFレコードの取得に失敗しました",
    };
  }

  // Process DMARC results
  if (dmarcResult.status === "fulfilled") {
    try {
      const dmarcRecords = parseTXTRecords(dmarcResult.value);
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
  } else {
    result.dmarc = {
      status: "error",
      error: "DMARCレコードの取得に失敗しました",
    };
  }

  // Process DKIM results (if selector provided)
  if (dkimSelector && dkimResult.status === "fulfilled" && dkimResult.value) {
    try {
      const dkimRecords = parseTXTRecords(dkimResult.value);
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
  } else if (dkimSelector && dkimResult.status === "rejected") {
    result.dkim = {
      selector: dkimSelector,
      status: "error",
      error: "DKIMレコードの取得に失敗しました",
    };
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (result.spf.status === "not_found") {
    recommendations.push("SPFレコードを設定してください");
  }

  if (result.dmarc.status === "not_found") {
    recommendations.push("DMARCレコードを設定してください");
  }

  if (result.mx.status === "success" && result.spf.status === "success" && result.dmarc.status === "success") {
    recommendations.push("基本的なメール認証設定は完了しています");
  }

  if (!dkimSelector) {
    recommendations.push("DKIMセレクタを指定してDKIM検証を実行してください（例: default, google, selector1）");
  }

  result.recommendations = recommendations.length > 0 ? recommendations : undefined;

  // Generate SMTP check instructions
  if (result.mx.status === "success" && result.mx.records.length > 0) {
    const firstMX = result.mx.records[0].exchange;

    result.smtpCheckInstructions = {
      telnet: [
        `telnet ${firstMX} 25`,
        "EHLO example.com",
        "QUIT",
      ],
      curl: [
        `curl -v --url 'smtp://${firstMX}:25' --mail-from 'test@example.com' --mail-rcpt 'recipient@${domain}' -T /dev/null 2>&1 | grep -E '(STARTTLS|250|220)'`,
      ],
      openssl: [
        `# SMTP + STARTTLS接続テスト`,
        `openssl s_client -connect ${firstMX}:25 -starttls smtp -showcerts`,
        "",
        `# SMTPS (465)接続テスト`,
        `openssl s_client -connect ${firstMX}:465 -showcerts`,
      ],
    };
  }

  return result;
}

// Server function for email DNS lookup
export const lookupEmailDNS = createServerFn({ method: "GET" })
  .inputValidator((data: { domain: string; dkimSelector?: string }) => {
    if (!DOMAIN_REGEX.test(data.domain)) {
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
