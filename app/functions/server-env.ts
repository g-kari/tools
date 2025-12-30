import { createServerFn } from "@tanstack/react-start";
import {
  getRequest,
  getRequestHeaders,
  getRequestUrl,
  getRequestHost,
  getRequestProtocol,
  getRequestIP,
} from "@tanstack/react-start/server";

// Server environment item type
export interface EnvItem {
  key: string;
  value: string;
  category:
    | "cloudflare-geo"
    | "cloudflare-network"
    | "cloudflare-security"
    | "request-url"
    | "request-headers"
    | "request-client-hints"
    | "runtime";
}

// Server environment result type
export interface ServerEnvResult {
  items?: EnvItem[];
  error?: string;
}

// Cloudflare cf object type (partial)
interface CloudflareCfObject {
  asn?: number;
  asOrganization?: string;
  colo?: string;
  country?: string;
  city?: string;
  continent?: string;
  latitude?: string;
  longitude?: string;
  postalCode?: string;
  region?: string;
  regionCode?: string;
  timezone?: string;
  isEUCountry?: string;
  httpProtocol?: string;
  requestPriority?: string;
  tlsVersion?: string;
  tlsCipher?: string;
  tlsClientAuth?: {
    certPresented?: string;
    certVerified?: string;
    certIssuerDN?: string;
    certSubjectDN?: string;
    certSerial?: string;
    certFingerprintSHA256?: string;
  };
  botManagement?: {
    score?: number;
    verifiedBot?: boolean;
    corporateProxy?: boolean;
    staticResource?: boolean;
  };
  // Add more fields as needed
  [key: string]: unknown;
}

// Request with Cloudflare cf property
interface CloudflareRequest extends Request {
  cf?: CloudflareCfObject;
}

// Server function to get server environment information
export const getServerEnv = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerEnvResult> => {
    try {
      const items: EnvItem[] = [];
      const request = getRequest() as CloudflareRequest;
      const headers = getRequestHeaders();

      // === Cloudflare cf object information ===
      const cf = request.cf;
      if (cf) {
        // Geo information
        const geoFields: Array<{
          key: keyof CloudflareCfObject;
          label: string;
        }> = [
          { key: "country", label: "国コード (country)" },
          { key: "city", label: "都市 (city)" },
          { key: "region", label: "地域 (region)" },
          { key: "regionCode", label: "地域コード (regionCode)" },
          { key: "continent", label: "大陸 (continent)" },
          { key: "postalCode", label: "郵便番号 (postalCode)" },
          { key: "latitude", label: "緯度 (latitude)" },
          { key: "longitude", label: "経度 (longitude)" },
          { key: "timezone", label: "タイムゾーン (timezone)" },
          { key: "isEUCountry", label: "EU国 (isEUCountry)" },
        ];

        for (const field of geoFields) {
          const value = cf[field.key];
          if (value !== undefined && value !== null && value !== "") {
            items.push({
              key: field.label,
              value: String(value),
              category: "cloudflare-geo",
            });
          }
        }

        // Network information
        const networkFields: Array<{
          key: keyof CloudflareCfObject;
          label: string;
        }> = [
          { key: "asn", label: "ASN (Autonomous System Number)" },
          { key: "asOrganization", label: "AS組織名 (asOrganization)" },
          { key: "colo", label: "データセンター (colo)" },
          { key: "httpProtocol", label: "HTTPプロトコル (httpProtocol)" },
          { key: "requestPriority", label: "リクエスト優先度 (requestPriority)" },
        ];

        for (const field of networkFields) {
          const value = cf[field.key];
          if (value !== undefined && value !== null && value !== "") {
            items.push({
              key: field.label,
              value: String(value),
              category: "cloudflare-network",
            });
          }
        }

        // Security/TLS information
        const securityFields: Array<{
          key: keyof CloudflareCfObject;
          label: string;
        }> = [
          { key: "tlsVersion", label: "TLSバージョン (tlsVersion)" },
          { key: "tlsCipher", label: "TLS暗号スイート (tlsCipher)" },
        ];

        for (const field of securityFields) {
          const value = cf[field.key];
          if (value !== undefined && value !== null && value !== "") {
            items.push({
              key: field.label,
              value: String(value),
              category: "cloudflare-security",
            });
          }
        }

        // TLS Client Auth (if present)
        if (cf.tlsClientAuth) {
          const tlsAuth = cf.tlsClientAuth;
          if (tlsAuth.certPresented) {
            items.push({
              key: "クライアント証明書提示 (certPresented)",
              value: tlsAuth.certPresented,
              category: "cloudflare-security",
            });
          }
          if (tlsAuth.certVerified) {
            items.push({
              key: "証明書検証済み (certVerified)",
              value: tlsAuth.certVerified,
              category: "cloudflare-security",
            });
          }
        }

        // Bot Management (if present)
        if (cf.botManagement) {
          const bot = cf.botManagement;
          if (bot.score !== undefined) {
            items.push({
              key: "Botスコア (botManagement.score)",
              value: String(bot.score),
              category: "cloudflare-security",
            });
          }
          if (bot.verifiedBot !== undefined) {
            items.push({
              key: "検証済みBot (verifiedBot)",
              value: String(bot.verifiedBot),
              category: "cloudflare-security",
            });
          }
        }

        // Add any other cf properties not explicitly handled
        const handledKeys = new Set([
          "country",
          "city",
          "region",
          "regionCode",
          "continent",
          "postalCode",
          "latitude",
          "longitude",
          "timezone",
          "isEUCountry",
          "asn",
          "asOrganization",
          "colo",
          "httpProtocol",
          "requestPriority",
          "tlsVersion",
          "tlsCipher",
          "tlsClientAuth",
          "botManagement",
        ]);

        for (const [key, value] of Object.entries(cf)) {
          if (
            !handledKeys.has(key) &&
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            const displayValue =
              typeof value === "object" ? JSON.stringify(value) : String(value);
            items.push({
              key: `cf.${key}`,
              value: displayValue,
              category: "cloudflare-network",
            });
          }
        }
      }

      // === URL/Request information ===
      try {
        const url = getRequestUrl();
        items.push({
          key: "リクエストURL",
          value: url.href,
          category: "request-url",
        });
        items.push({
          key: "ホスト",
          value: url.host,
          category: "request-url",
        });
        items.push({
          key: "パス",
          value: url.pathname,
          category: "request-url",
        });
        if (url.search) {
          items.push({
            key: "クエリ文字列",
            value: url.search,
            category: "request-url",
          });
        }
      } catch {
        // Fallback
        try {
          items.push({
            key: "ホスト",
            value: getRequestHost(),
            category: "request-url",
          });
        } catch {
          // ignore
        }
      }

      try {
        items.push({
          key: "プロトコル",
          value: getRequestProtocol(),
          category: "request-url",
        });
      } catch {
        // ignore
      }

      // Client IP
      try {
        const ip = getRequestIP({ xForwardedFor: true });
        if (ip) {
          items.push({
            key: "クライアントIP",
            value: ip,
            category: "request-url",
          });
        }
      } catch {
        // ignore
      }

      items.push({
        key: "HTTPメソッド",
        value: request.method,
        category: "request-url",
      });

      // === Request Headers ===
      // Standard headers
      const standardHeaders = [
        { key: "host", label: "Host" },
        { key: "user-agent", label: "User-Agent" },
        { key: "accept", label: "Accept" },
        { key: "accept-language", label: "Accept-Language (言語設定)" },
        { key: "accept-encoding", label: "Accept-Encoding (圧縮形式)" },
        { key: "connection", label: "Connection" },
        { key: "cache-control", label: "Cache-Control" },
        { key: "pragma", label: "Pragma" },
        { key: "dnt", label: "DNT (Do Not Track)" },
        { key: "upgrade-insecure-requests", label: "Upgrade-Insecure-Requests" },
        { key: "referer", label: "Referer" },
        { key: "origin", label: "Origin" },
        { key: "x-forwarded-for", label: "X-Forwarded-For" },
        { key: "x-forwarded-proto", label: "X-Forwarded-Proto" },
        { key: "x-forwarded-host", label: "X-Forwarded-Host" },
        { key: "x-real-ip", label: "X-Real-IP" },
        { key: "x-requested-with", label: "X-Requested-With" },
        { key: "if-modified-since", label: "If-Modified-Since" },
        { key: "if-none-match", label: "If-None-Match" },
      ];

      // Cloudflare-specific headers
      const cfHeaders = [
        { key: "cf-ray", label: "CF-Ray (リクエストID)" },
        { key: "cf-connecting-ip", label: "CF-Connecting-IP (クライアントIP)" },
        { key: "cf-ipcountry", label: "CF-IPCountry (国コード)" },
        { key: "cf-visitor", label: "CF-Visitor (プロトコル情報)" },
        { key: "cf-ew-via", label: "CF-EW-Via" },
        { key: "true-client-ip", label: "True-Client-IP" },
      ];

      // Client Hints headers
      const clientHintHeaders = [
        { key: "sec-ch-ua", label: "Sec-CH-UA (User-Agent Brands)" },
        { key: "sec-ch-ua-mobile", label: "Sec-CH-UA-Mobile (モバイル判定)" },
        { key: "sec-ch-ua-platform", label: "Sec-CH-UA-Platform (OS)" },
        {
          key: "sec-ch-ua-platform-version",
          label: "Sec-CH-UA-Platform-Version",
        },
        { key: "sec-ch-ua-arch", label: "Sec-CH-UA-Arch (アーキテクチャ)" },
        { key: "sec-ch-ua-bitness", label: "Sec-CH-UA-Bitness (ビット数)" },
        { key: "sec-ch-ua-model", label: "Sec-CH-UA-Model (デバイスモデル)" },
        {
          key: "sec-ch-ua-full-version-list",
          label: "Sec-CH-UA-Full-Version-List",
        },
        { key: "sec-ch-prefers-color-scheme", label: "Sec-CH-Prefers-Color-Scheme" },
        { key: "sec-ch-prefers-reduced-motion", label: "Sec-CH-Prefers-Reduced-Motion" },
        { key: "sec-fetch-dest", label: "Sec-Fetch-Dest (取得先)" },
        { key: "sec-fetch-mode", label: "Sec-Fetch-Mode (モード)" },
        { key: "sec-fetch-site", label: "Sec-Fetch-Site (サイト)" },
        { key: "sec-fetch-user", label: "Sec-Fetch-User" },
      ];

      // Get all headers and categorize them
      const processedHeaders = new Set<string>();

      // Process CF headers first
      for (const header of cfHeaders) {
        const value = (headers as Record<string, string | undefined>)[
          header.key
        ];
        if (value && value.trim()) {
          items.push({
            key: header.label,
            value: value.trim(),
            category: "cloudflare-network",
          });
          processedHeaders.add(header.key);
        }
      }

      // Process client hint headers
      for (const header of clientHintHeaders) {
        const value = (headers as Record<string, string | undefined>)[
          header.key
        ];
        if (value && value.trim()) {
          items.push({
            key: header.label,
            value: value.trim(),
            category: "request-client-hints",
          });
          processedHeaders.add(header.key);
        }
      }

      // Process standard headers
      for (const header of standardHeaders) {
        const value = (headers as Record<string, string | undefined>)[
          header.key
        ];
        if (value && value.trim()) {
          items.push({
            key: header.label,
            value: value.trim(),
            category: "request-headers",
          });
          processedHeaders.add(header.key);
        }
      }

      // Add any remaining headers not explicitly handled
      // Use request.headers to iterate
      request.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        // Skip already processed, cookies, and authorization headers for security
        if (
          processedHeaders.has(lowerKey) ||
          lowerKey === "cookie" ||
          lowerKey === "authorization" ||
          lowerKey === "x-api-key" ||
          lowerKey.includes("token") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("password")
        ) {
          return;
        }
        items.push({
          key: key,
          value: value,
          category: "request-headers",
        });
      });

      // === Runtime information ===
      items.push({
        key: "ランタイム",
        value: "Cloudflare Workers",
        category: "runtime",
      });

      items.push({
        key: "サーバータイムスタンプ",
        value: new Date().toISOString(),
        category: "runtime",
      });

      // Navigator information (limited in Workers)
      if (typeof navigator !== "undefined") {
        items.push({
          key: "Navigator.userAgent",
          value: navigator.userAgent || "N/A",
          category: "runtime",
        });
      }

      return {
        items,
      };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : "サーバー環境情報の取得に失敗しました",
      };
    }
  }
);
