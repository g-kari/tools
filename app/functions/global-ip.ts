import { createServerFn } from "@tanstack/react-start";
import {
  getRequestIP,
  getRequestHeader,
} from "@tanstack/react-start/server";

// Global IP result type
export interface GlobalIpResult {
  ip?: string;
  error?: string;
}

// Server function to get client's global IP address
export const getGlobalIp = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      // Cloudflare Workers provides client IP in CF-Connecting-IP header
      const cfConnectingIp = getRequestHeader(
        "CF-Connecting-IP" as Parameters<typeof getRequestHeader>[0]
      );
      if (cfConnectingIp && cfConnectingIp.trim()) {
        return { ip: cfConnectingIp.trim() };
      }

      // Use getRequestIP with xForwardedFor enabled for proxy environments.
      // Note: X-Forwarded-For can be spoofed by clients. This value should only be
      // considered reliable when the app is deployed behind a trusted proxy/load
      // balancer that sanitizes/overwrites this header (for example, Cloudflare),
      // and MUST NOT be used for security-sensitive decisions (auth, rate limiting, etc.).
      const ip = getRequestIP({ xForwardedFor: true });
      if (ip && ip.trim()) {
        return { ip: ip.trim() };
      }

      return {
        error: "IPアドレスを取得できませんでした",
      };
    } catch (err) {
      return {
        error:
          err instanceof Error ? err.message : "IPアドレスの取得に失敗しました",
      };
    }
  }
);
