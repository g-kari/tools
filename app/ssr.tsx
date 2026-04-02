import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { getRouterManifest } from "@tanstack/react-start/router-manifest";
import { createRouter } from "./router";

/** 許可するオリジンのパターン（0g0.xyz およびすべてのサブドメイン） */
const ALLOWED_ORIGIN_PATTERN = /^https?:\/\/([\w-]+\.)*0g0\.xyz(:\d+)?$/;

/**
 * リクエストの Origin ヘッダーを検証し、許可される場合はそのオリジンを返す
 * @param origin リクエストの Origin ヘッダー値
 * @returns 許可されるオリジン文字列、許可されない場合は null
 */
function getAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  return ALLOWED_ORIGIN_PATTERN.test(origin) ? origin : null;
}

/**
 * レスポンスに CORS ヘッダーを付与する
 * @param response 元のレスポンス
 * @param allowedOrigin 許可するオリジン（null の場合はヘッダーを付与しない）
 * @returns CORS ヘッダーを付与した新しいレスポンス
 */
function addCorsHeaders(response: Response, allowedOrigin: string | null): Response {
  if (!allowedOrigin) return response;

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  headers.append("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const origin = request.headers.get("Origin");
    const allowedOrigin = getAllowedOrigin(origin);

    // OPTIONS プリフライトリクエストを処理
    if (request.method === "OPTIONS") {
      if (allowedOrigin) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
            Vary: "Origin",
          },
        });
      }
      return new Response(null, { status: 204 });
    }

    const handler = createStartHandler({
      createRouter,
      getRouterManifest,
    })(defaultStreamHandler);

    const response = await handler({
      request,
      cloudflare: { env, ctx },
    });

    return addCorsHeaders(response, allowedOrigin);
  },
};
