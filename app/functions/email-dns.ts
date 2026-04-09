/**
 * メールDNS設定確認サーバーファンクション
 *
 * ドメインのMX・SPF・DMARC・DKIMレコードをCloudflare DNS over HTTPS (DoH)で取得し、
 * メール送受信設定の検証と改善提案を行う。
 */
import { createServerFn } from "@tanstack/react-start";

/**
 * ドメイン名のバリデーション用正規表現
 * RFC 1123に準拠したドメイン名形式を検証する
 */
export const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * MXレコード情報
 */
export interface MXRecord {
  /** メールサーバーの優先度（数値が小さいほど優先） */
  priority: number;
  /** メールサーバーのホスト名 */
  exchange: string;
  /** メールサーバーのIPアドレス一覧（A/AAAAレコードで解決） */
  ipAddresses?: string[];
  /** メールサーバーの逆引きホスト名（PTRレコード） */
  ptr?: string[];
  /** レコードのTTL（秒） */
  ttl?: number;
}

/**
 * メールDNS設定確認の総合結果
 */
export interface EmailDNSResult {
  /** 検索対象のドメイン名 */
  domain: string;
  /** MXレコード情報 */
  mx: {
    /** MXレコードの一覧（優先度順） */
    records: MXRecord[];
    /** 取得ステータス */
    status: "success" | "error" | "not_found";
    /** エラーメッセージ */
    error?: string;
    /** 設定上の警告メッセージ */
    warnings?: string[];
  };
  /** SPFレコード情報 */
  spf: {
    /** SPFレコードのテキスト */
    record?: string;
    /** 取得ステータス */
    status: "success" | "error" | "not_found";
    /** エラーメッセージ */
    error?: string;
    /** SPFの詳細情報と検証結果 */
    details?: {
      /** SPFバージョン（通常 "v=spf1"） */
      version?: string;
      /** SPFメカニズムの一覧 */
      mechanisms?: string[];
      /** SPFレコードが有効かどうか */
      isValid: boolean;
      /** DNSルックアップ数（上限10） */
      lookupCount?: number;
      /** 設定上の警告メッセージ */
      warnings?: string[];
      /** includeで展開されたドメイン一覧 */
      expandedIncludes?: string[];
    };
  };
  /** DMARCレコード情報 */
  dmarc: {
    /** DMARCレコードのテキスト */
    record?: string;
    /** 取得ステータス */
    status: "success" | "error" | "not_found";
    /** エラーメッセージ */
    error?: string;
    /** DMARCの詳細情報と検証結果 */
    details?: {
      /** DMARCポリシー（none/quarantine/reject） */
      policy?: string;
      /** サブドメインポリシー */
      subdomainPolicy?: string;
      /** ポリシー適用割合（%） */
      percentage?: number;
      /** 集計レポート送信先 */
      rua?: string[];
      /** 障害レポート送信先 */
      ruf?: string[];
      /** DMARCレコードが有効かどうか */
      isValid: boolean;
      /** 設定上の警告メッセージ */
      warnings?: string[];
    };
  };
  /** DKIMレコード情報 */
  dkim?: {
    /** DKIMセレクタ名 */
    selector: string;
    /** DKIMレコードのテキスト */
    record?: string;
    /** 取得ステータス */
    status: "success" | "error" | "not_found";
    /** エラーメッセージ */
    error?: string;
  };
  /** 設定改善のための推奨事項 */
  recommendations?: string[];
  /** SMTPサーバー接続確認コマンド例 */
  smtpCheckInstructions?: {
    /** telnetコマンド例 */
    telnet: string[];
    /** curlコマンド例 */
    curl: string[];
    /** opensslコマンド例 */
    openssl: string[];
  };
}

/** Cloudflare DNS over HTTPSエンドポイント */
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

/**
 * DNS over HTTPS (DoH) でDNSレコードを問い合わせる
 * @param domain - 問い合わせ対象のドメイン名
 * @param type - DNSレコードタイプ（"A", "AAAA", "MX", "TXT"など）
 * @returns DoHレスポンス、または取得失敗の場合はnull
 */
async function queryDNS(domain: string, type: string): Promise<DoHResponse | null> {
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

/**
 * DoHレスポンスからMXレコードを解析する
 * @param response - DoHレスポンス
 * @returns MXレコードの一覧（優先度順にソート済み）
 */
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

/**
 * ホスト名のIPアドレスを解決する（A/AAAAレコード両方を取得）
 * @param hostname - 解決対象のホスト名
 * @returns IPv4・IPv6アドレスの一覧
 */
async function resolveIPAddresses(hostname: string): Promise<string[]> {
  const [ipv4Response, ipv6Response] = await Promise.all([
    queryDNS(hostname, "A"),
    queryDNS(hostname, "AAAA"),
  ]);

  const ips: string[] = [];

  if (ipv4Response?.Answer) {
    ips.push(...ipv4Response.Answer.map((a) => a.data));
  }

  if (ipv6Response?.Answer) {
    ips.push(...ipv6Response.Answer.map((a) => a.data));
  }

  return ips;
}

/**
 * IPアドレスのPTRレコード（逆引きホスト名）を取得する
 * IPv6は未対応（空配列を返す）
 * @param ip - 逆引き対象のIPアドレス
 * @returns PTRレコードのホスト名一覧
 */
async function getPTRRecords(ip: string): Promise<string[]> {
  // Convert IP to reverse DNS format
  let reverseDomain: string;

  if (ip.includes(":")) {
    // IPv6 - skip for simplicity
    return [];
  } else {
    // IPv4
    const parts = ip.split(".");
    reverseDomain = `${parts[3]}.${parts[2]}.${parts[1]}.${parts[0]}.in-addr.arpa`;
  }

  const ptrResponse = await queryDNS(reverseDomain, "PTR");

  if (!ptrResponse?.Answer) {
    return [];
  }

  return ptrResponse.Answer.map((a) => a.data.replace(/\.$/, ""));
}

/**
 * MXレコードにIP・PTRレコード情報を付加する
 * クエリ数を抑えるため、最初のIPのPTRのみを取得する
 * @param records - MXレコードの一覧
 * @returns IP・PTR情報を付加したMXレコードの一覧
 */
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

/**
 * DoHレスポンスからTXTレコードの文字列一覧を取得する
 * @param response - DoHレスポンス
 * @returns TXTレコードの文字列一覧（クォート除去済み）
 */
function parseTXTRecords(response: DoHResponse | null): string[] {
  if (!response || !response.Answer) {
    return [];
  }

  return response.Answer.map((answer) => {
    // Remove quotes from TXT record data
    return answer.data.replace(/^"|"$/g, "");
  });
}

/**
 * SPFレコードを検証・展開する
 *
 * include:メカニズムを再帰的に展開してDNSルックアップ数を集計する。
 * 循環参照・深さ超過・タイムアウトを検出して警告を付加する。
 * @param record - 検証対象のSPFレコード文字列
 * @param domain - SPFレコードが属するドメイン（循環参照検出用）
 * @param visitedDomains - 訪問済みドメインのセット（内部再帰用）
 * @param depth - 現在の再帰深さ（内部再帰用）
 * @param startTime - 検証開始時刻（タイムアウト管理用）
 * @returns SPF検証結果（有効性・メカニズム・警告など）
 */
async function validateSPF(
  record: string,
  domain: string,
  visitedDomains: Set<string> = new Set(),
  depth: number = 0,
  startTime?: number,
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
            st,
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

/**
 * DMARCレコードを解析・検証する
 * @param record - 検証対象のDMARCレコード文字列
 * @returns DMARC検証結果（ポリシー・集計レポート先・有効性など）
 */
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

/**
 * ドメインのメール関連DNS設定（MX・SPF・DMARC・DKIM）を一括取得・検証する
 * @param domain - 検索対象のドメイン名
 * @param dkimSelector - DKIMセレクタ名（省略時はDKIM検索をスキップ）
 * @returns メールDNS設定の総合結果
 */
async function queryEmailDNS(domain: string, dkimSelector?: string): Promise<EmailDNSResult> {
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
      const dmarcRecord = dmarcRecords.find((record) => record.startsWith("v=DMARC1"));

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
        error: err instanceof Error ? err.message : "DMARCレコードの取得に失敗しました",
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
      const dkimRecord = dkimRecords.find((record) => record.includes("v=DKIM1"));

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
        error: err instanceof Error ? err.message : "DKIMレコードの取得に失敗しました",
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

  if (
    result.mx.status === "success" &&
    result.spf.status === "success" &&
    result.dmarc.status === "success"
  ) {
    recommendations.push("基本的なメール認証設定は完了しています");
  }

  if (!dkimSelector) {
    recommendations.push(
      "DKIMセレクタを指定してDKIM検証を実行してください（例: default, google, selector1）",
    );
  }

  result.recommendations = recommendations.length > 0 ? recommendations : undefined;

  // Generate SMTP check instructions
  if (result.mx.status === "success" && result.mx.records.length > 0) {
    const firstMX = result.mx.records[0].exchange;

    result.smtpCheckInstructions = {
      telnet: [`telnet ${firstMX} 25`, "EHLO example.com", "QUIT"],
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

/**
 * ドメインのメール関連DNS設定を検索するサーバーファンクション
 *
 * MX・SPF・DMARC・DKIMレコードを一括取得し、設定の検証と改善提案を行う。
 * DKIMセレクタを指定した場合はDKIMレコードも検索する。
 * @throws 無効なドメイン形式またはDKIMセレクタ形式の場合
 */
export const lookupEmailDNS = createServerFn({ method: "GET" })
  .inputValidator((data: { domain: string; dkimSelector?: string }) => {
    if (!DOMAIN_REGEX.test(data.domain)) {
      throw new Error("無効なドメイン形式です");
    }
    const trimmedSelector = data.dkimSelector?.trim();
    if (trimmedSelector !== undefined && trimmedSelector !== "") {
      if (!/^[a-zA-Z0-9_-]{1,63}$/.test(trimmedSelector)) {
        throw new Error(
          "無効なDKIMセレクター形式です（英数字・ハイフン・アンダースコアのみ使用可能）",
        );
      }
    }
    return {
      domain: data.domain.toLowerCase(),
      dkimSelector: trimmedSelector || undefined,
    };
  })
  .handler(async ({ data }) => {
    return await queryEmailDNS(data.domain, data.dkimSelector);
  });
