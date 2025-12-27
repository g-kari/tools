import { createServerFn } from "@tanstack/react-start";
import {
  getRequestIP,
  getRequestHeader,
} from "@tanstack/react-start/server";

// Global IP result type
export interface GlobalIpResult {
  ip: string;
  error?: string;
}

// Server function to get client's global IP address
export const getGlobalIp = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      // Cloudflare Workers provides client IP in CF-Connecting-IP header
      const cfConnectingIp = getRequestHeader("CF-Connecting-IP" as any);
      if (cfConnectingIp) {
        return { ip: cfConnectingIp };
      }

      // Use getRequestIP with xForwardedFor enabled for proxy environments
      const ip = getRequestIP({ xForwardedFor: true });
      if (ip) {
        return { ip };
      }

      return {
        ip: "",
        error: "IPアドレスを取得できませんでした",
      };
    } catch (err) {
      return {
        ip: "",
        error:
          err instanceof Error ? err.message : "IPアドレスの取得に失敗しました",
      };
    }
  }
);
