/**
 * IPジオロケーション検索サーバーファンクション
 *
 * ip-api.com APIを使用してIPアドレスの地理情報を取得する。
 * IPv4・IPv6の両形式に対応し、入力検証付きのサーバーファンクションを提供する。
 */
import { createServerFn } from "@tanstack/react-start";

/**
 * IPジオロケーション取得結果
 */
export interface IpGeolocationResult {
  /** 検索対象のIPアドレス */
  ip: string;
  /** 国名 */
  country?: string;
  /** ISO 3166-1 alpha-2 国コード */
  countryCode?: string;
  /** 地域コード */
  region?: string;
  /** 地域名 */
  regionName?: string;
  /** 都市名 */
  city?: string;
  /** 郵便番号 */
  zip?: string;
  /** 緯度 */
  lat?: number;
  /** 経度 */
  lon?: number;
  /** タイムゾーン（例: "Asia/Tokyo"） */
  timezone?: string;
  /** インターネットサービスプロバイダ名 */
  isp?: string;
  /** 組織名 */
  org?: string;
  /** AS番号と名前（例: "AS7922 Comcast Cable..."） */
  as?: string;
  /** AS名 */
  asname?: string;
  /** 逆引きホスト名 */
  reverse?: string;
  /** モバイル回線かどうか */
  mobile?: boolean;
  /** プロキシ・VPN経由かどうか */
  proxy?: boolean;
  /** ホスティングプロバイダかどうか */
  hosting?: boolean;
  /** エラーが発生した場合のメッセージ */
  error?: string;
}

/**
 * ip-api.com APIレスポンス型（内部用）
 */
interface IpApiResponse {
  status: "success" | "fail";
  message?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  asname?: string;
  reverse?: string;
  mobile?: boolean;
  proxy?: boolean;
  hosting?: boolean;
  query?: string;
}

/**
 * IPv4アドレスの形式を検証する
 * @param ip - 検証するIPアドレス文字列
 * @returns 有効なIPv4形式であればtrue
 */
function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * IPv6アドレスの形式を検証する
 * @param ip - 検証するIPアドレス文字列
 * @returns 有効なIPv6形式であればtrue
 */
function isValidIPv6(ip: string): boolean {
  // Reject empty or obviously invalid
  if (!ip || ip.length < 2) return false;

  // Reject multiple consecutive colons (except for :: which appears once)
  if (ip.includes(":::")) return false;

  // Reject leading/trailing single colons (but allow :: at start/end)
  if (
    (ip.startsWith(":") && !ip.startsWith("::")) ||
    (ip.endsWith(":") && !ip.endsWith("::"))
  ) {
    return false;
  }

  // Count :: occurrences (only one allowed)
  const doubleColonCount = (ip.match(/::/g) || []).length;
  if (doubleColonCount > 1) return false;

  // Split by : and validate each group
  const groups = ip.split(":");
  const hasDoubleColon = ip.includes("::");

  // Without ::, must have exactly 8 groups
  // With ::, split produces extra empty strings at boundaries, allow up to 9
  if (!hasDoubleColon && groups.length !== 8) return false;
  if (hasDoubleColon && groups.length > 9) return false;

  // Validate each group
  const hexGroupRegex = /^[0-9a-fA-F]{1,4}$/;
  for (const group of groups) {
    // Skip empty groups when hasDoubleColon (produced by :: compression)
    if (group === "") {
      if (!hasDoubleColon) return false;
      continue;
    }
    if (!hexGroupRegex.test(group)) return false;
  }

  return true;
}

/**
 * IPアドレスの形式を検証する（IPv4・IPv6両対応）
 * @param ip - 検証するIPアドレス文字列
 * @returns 有効なIPアドレス形式であればtrue
 */
function isValidIP(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip);
}

/**
 * ip-api.com APIにジオロケーション情報を問い合わせる
 * @param ip - 検索対象のIPアドレス
 * @returns ジオロケーション情報、またはエラーメッセージを含む結果
 */
async function queryIpApi(ip: string): Promise<IpGeolocationResult> {
  const fields = [
    "status",
    "message",
    "country",
    "countryCode",
    "region",
    "regionName",
    "city",
    "zip",
    "lat",
    "lon",
    "timezone",
    "isp",
    "org",
    "as",
    "asname",
    "reverse",
    "mobile",
    "proxy",
    "hosting",
    "query",
  ].join(",");

  const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${fields}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return {
          ip,
          error:
            "リクエスト制限に達しました。しばらく待ってから再度お試しください",
        };
      }
      return {
        ip,
        error: `APIリクエストに失敗しました (HTTP ${response.status})`,
      };
    }

    const data: IpApiResponse = await response.json();

    if (data.status === "fail") {
      let errorMessage = "情報を取得できませんでした";
      if (data.message === "private range") {
        errorMessage = "プライベートIPアドレスです";
      } else if (data.message === "reserved range") {
        errorMessage = "予約済みIPアドレスです";
      } else if (data.message === "invalid query") {
        errorMessage = "無効なIPアドレスです";
      } else if (data.message) {
        errorMessage = data.message;
      }
      return { ip, error: errorMessage };
    }

    return {
      ip: data.query || ip,
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      regionName: data.regionName,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      as: data.as,
      asname: data.asname,
      reverse: data.reverse,
      mobile: data.mobile,
      proxy: data.proxy,
      hosting: data.hosting,
    };
  } catch (err) {
    return {
      ip,
      error:
        err instanceof Error ? err.message : "通信エラーが発生しました",
    };
  }
}

/**
 * IPアドレスのジオロケーション情報を検索するサーバーファンクション
 *
 * 入力値をIPv4・IPv6形式で検証し、ip-api.com APIから地理情報を取得する。
 * プライベートアドレス・予約アドレスはAPIにより検索不可として扱われる。
 * @throws IPアドレスが空または無効な形式の場合
 */
export const lookupIpGeolocation = createServerFn({ method: "GET" })
  .inputValidator((data: string) => {
    const trimmed = data.trim();
    if (!trimmed) {
      throw new Error("IPアドレスを入力してください");
    }
    if (!isValidIP(trimmed)) {
      throw new Error("無効なIPアドレス形式です");
    }
    return trimmed;
  })
  .handler(async ({ data: ip }) => {
    return await queryIpApi(ip);
  });
