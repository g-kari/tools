/**
 * WHOIS検索サーバーファンクション
 *
 * IANA RDAPブートストラップを使用してTLD別のRDAPサーバーを特定し、
 * ドメイン登録情報を取得する。フォールバックとしてrdap.orgを利用する。
 * ブートストラップデータは1時間キャッシュされる。
 */
import { createServerFn } from "@tanstack/react-start";

/**
 * 連絡先情報（登録者・管理者・技術担当者など）
 */
interface ContactInfo {
  /** 担当者名 */
  name?: string;
  /** 組織名 */
  organization?: string;
  /** メールアドレス */
  email?: string;
  /** 電話番号 */
  phone?: string;
  /** 住所 */
  address?: string;
}

/**
 * WHOISドメイン情報取得結果
 */
export interface WhoisResult {
  /** 検索対象ドメイン名 */
  domain: string;
  /** レジストラ名 */
  registrar?: string;
  /** 登録日時（ISO 8601形式） */
  createdDate?: string;
  /** 有効期限（ISO 8601形式） */
  expiryDate?: string;
  /** 最終更新日時（ISO 8601形式） */
  updatedDate?: string;
  /** ネームサーバー一覧 */
  nameServers?: string[];
  /** ドメインステータス一覧（EPP状態コード） */
  status?: string[];
  /** 登録者情報 */
  registrant?: ContactInfo;
  /** 管理者情報 */
  administrative?: ContactInfo;
  /** 技術担当者情報 */
  technical?: ContactInfo;
  /** 請求先情報 */
  billing?: ContactInfo;
  /** 不正利用報告先情報 */
  abuse?: ContactInfo;
  /** エラーが発生した場合のメッセージ */
  error?: string;
}

/**
 * RDAP APIレスポンス型（内部用）
 */
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
    vcardArray?: [string, Array<[string, Record<string, unknown>, string, string | string[]]>];
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

/** IANA RDAPブートストラップファイルのURL */
const IANA_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";

/** TLD→RDAPサーバーURLのキャッシュ */
let bootstrapCache: Record<string, string> | null = null;
/** キャッシュの最終更新時刻（Unixミリ秒） */
let bootstrapCacheTime = 0;
/** キャッシュの有効期間（1時間） */
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * IANAブートストラップファイルの構造
 */
interface BootstrapFile {
  version: string;
  publication: string;
  services: Array<[string[], string[]]>;
}

/**
 * ドメインからTLD（トップレベルドメイン）を取得する
 * @param domain - ドメイン名
 * @returns 小文字のTLD（例: "com", "jp"）
 */
function getTld(domain: string): string {
  const parts = domain.split(".");
  return parts[parts.length - 1].toLowerCase();
}

/**
 * IANA RDAPブートストラップファイルを取得し、TLD→RDAPサーバーURLのマッピングを返す
 *
 * 結果はメモリ内に1時間キャッシュされる。取得失敗時はキャッシュを返す。
 * @returns TLD（小文字）→RDAPサーバーベースURLのマッピング
 */
async function getBootstrapData(): Promise<Record<string, string>> {
  const now = Date.now();

  // Return cached data if still valid
  if (bootstrapCache && now - bootstrapCacheTime < CACHE_TTL) {
    return bootstrapCache;
  }

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

    // Update cache
    bootstrapCache = mapping;
    bootstrapCacheTime = now;

    return mapping;
  } catch {
    // Return cached data on error, or empty object
    return bootstrapCache || {};
  }
}

/**
 * 単一のRDAPサーバーにドメイン情報を問い合わせる
 * @param url - RDAPエンドポイントURL（ドメイン名含む）
 * @returns fetchレスポンス
 */
async function queryRdapServer(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: "application/rdap+json",
    },
  });
}

/**
 * vCardの配列形式をContactInfoオブジェクトに変換する
 * @param vcardArray - RDAPレスポンスのvcardArray（jCard形式）
 * @returns 連絡先情報、または必要な情報がない場合はundefined
 */
function parseVcardToContact(
  vcardArray?: [string, Array<[string, Record<string, unknown>, string, string | string[]]>],
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
          typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
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

/**
 * RDAPレスポンスをWhoisResultに変換する
 * @param data - RDAPサーバーのレスポンスデータ
 * @param domain - 検索対象のドメイン名（ldhNameが取れない場合のフォールバック）
 * @returns 整形済みのWHOIS情報
 */
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
      .filter((ns): ns is string => Boolean(ns));
  }

  if (data.entities) {
    for (const entity of data.entities) {
      const roles = entity.roles || [];

      if (roles.includes("registrar")) {
        if (entity.vcardArray && entity.vcardArray[1]) {
          const fnEntry = entity.vcardArray[1].find((entry) => entry[0] === "fn");
          if (fnEntry) {
            result.registrar = fnEntry[3] as string;
          }
        }
        if (!result.registrar && entity.publicIds) {
          const ianaId = entity.publicIds.find((id) => id.type === "IANA Registrar ID");
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

/**
 * RDAPプロトコルでドメイン情報を問い合わせる
 *
 * まずIANAブートストラップからTLD固有のRDAPサーバーを試み、
 * 失敗した場合はrdap.orgにフォールバックする。
 * @param domain - 検索対象のドメイン名
 * @returns WHOIS情報、またはエラーメッセージを含む結果
 */
async function queryRdap(domain: string): Promise<WhoisResult> {
  const result: WhoisResult = { domain };
  const tld = getTld(domain);

  const bootstrap = await getBootstrapData();
  const serversToTry: string[] = [];

  if (bootstrap[tld]) {
    serversToTry.push(`${bootstrap[tld]}/domain/${encodeURIComponent(domain)}`);
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

/**
 * ドメインのWHOIS情報を検索するサーバーファンクション
 *
 * 入力値をドメイン形式で検証し、RDAPプロトコルで情報を取得する。
 * 入力は小文字に正規化され、国際化ドメイン名（IDN）はpunycodeで表記される。
 * @throws 無効なドメイン形式の場合
 */
export const lookupWhois = createServerFn({ method: "GET" })
  .inputValidator((data: string) => {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(data)) {
      throw new Error("無効なドメイン形式です");
    }
    return data.toLowerCase();
  })
  .handler(async ({ data: domain }) => {
    return await queryRdap(domain);
  });
