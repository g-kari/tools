import { createServerFn } from "@tanstack/react-start";

// IP Geolocation result type
export interface IpGeolocationResult {
  ip: string;
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
  error?: string;
}

// ip-api.com response type
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

// Validate IPv4 address
function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === num.toString();
  });
}

// Validate IPv6 address
function isValidIPv6(ip: string): boolean {
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  const ipv6WithIPv4Regex =
    /^([0-9a-fA-F]{0,4}:){2,6}(\d{1,3}\.){3}\d{1,3}$/;
  return ipv6Regex.test(ip) || ipv6WithIPv4Regex.test(ip);
}

// Validate IP address (IPv4 or IPv6)
function isValidIP(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip);
}

// Query ip-api.com for geolocation data
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

// Server function for IP geolocation lookup
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
