import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

// Environment variable item type
export interface EnvItem {
  key: string;
  value: string;
  category: "cloudflare" | "request" | "runtime";
}

// Server environment result type
export interface ServerEnvResult {
  items?: EnvItem[];
  timestamp?: string;
  error?: string;
}

// Server function to get server environment information
export const getServerEnv = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerEnvResult> => {
    try {
      const items: EnvItem[] = [];

      // Cloudflare-specific headers
      const cfHeaders = [
        { key: "CF-Ray", label: "CF-Ray (リクエストID)" },
        { key: "CF-IPCountry", label: "CF-IPCountry (国コード)" },
        { key: "CF-Connecting-IP", label: "CF-Connecting-IP (クライアントIP)" },
        { key: "CF-Visitor", label: "CF-Visitor (プロトコル情報)" },
      ];

      for (const header of cfHeaders) {
        const value = getRequestHeader(
          header.key as Parameters<typeof getRequestHeader>[0]
        );
        if (value && value.trim()) {
          items.push({
            key: header.label,
            value: value.trim(),
            category: "cloudflare",
          });
        }
      }

      // Request headers
      const requestHeaders = [
        { key: "User-Agent", label: "User-Agent" },
        { key: "Accept-Language", label: "Accept-Language (言語設定)" },
        { key: "Accept-Encoding", label: "Accept-Encoding (圧縮形式)" },
      ];

      for (const header of requestHeaders) {
        const value = getRequestHeader(
          header.key as Parameters<typeof getRequestHeader>[0]
        );
        if (value && value.trim()) {
          items.push({
            key: header.label,
            value: value.trim(),
            category: "request",
          });
        }
      }

      // Runtime information
      items.push({
        key: "Runtime",
        value: "Cloudflare Workers",
        category: "runtime",
      });

      items.push({
        key: "Timestamp",
        value: new Date().toISOString(),
        category: "runtime",
      });

      return {
        items,
        timestamp: new Date().toISOString(),
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
