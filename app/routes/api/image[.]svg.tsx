/**
 * @fileoverview ダミー画像生成APIルート
 * SVG形式のプレースホルダー画像を動的に生成して返すAPIエンドポイント。
 * Cloudflare Workers Cache APIを使用してCDNキャッシュを明示的に制御。
 * @module routes/api/image.svg
 */

import { createFileRoute } from "@tanstack/react-router";
import {
  generateSvgImage,
  parseImageParams,
} from "../../functions/dummy-image";

/**
 * キャッシュ用のレスポンスヘッダーを生成
 * @returns {Record<string, string>} レスポンスヘッダー
 */
function getCacheHeaders(): Record<string, string> {
  return {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=31536000, immutable",
    "CDN-Cache-Control": "public, max-age=31536000, immutable",
  };
}

export const Route = createFileRoute("/api/image.svg")({
  server: {
    handlers: {
      /**
       * ダミーSVG画像を生成して返すGETハンドラー
       * Cloudflare Workers Cache APIを使用してキャッシュを制御。
       *
       * @param {Object} context - リクエストコンテキスト
       * @param {Request} context.request - HTTPリクエストオブジェクト
       *
       * @queryParam {number} [w=300] - 画像の幅 (1-4096)
       * @queryParam {number} [h=150] - 画像の高さ (1-4096)
       * @queryParam {string} [bg=6750A4] - 背景色 (HEX形式、#なし)
       * @queryParam {string} [text=FFFFFF] - テキスト色 (HEX形式、#なし)
       *
       * @returns {Response} 200: SVG画像 (Content-Type: image/svg+xml)
       *   - Cache-Control: public, max-age=31536000, immutable
       *   - CDN-Cache-Control: public, max-age=31536000, immutable
       *   - X-Cache-Status: HIT または MISS
       * @returns {Response} 500: エラー時のデフォルトSVG画像
       *   - Cache-Control: no-store
       *
       * @example
       * // 基本的な使用例
       * GET /api/image.svg?w=800&h=600
       *
       * @example
       * // カスタム色を指定
       * GET /api/image.svg?w=1200&h=630&bg=FF0000&text=FFFFFF
       */
      GET: async ({ request }) => {
        try {
          // Cloudflare Workers Cache API
          const cache = caches.default;
          const cacheKey = new Request(request.url, { method: "GET" });

          // キャッシュをチェック
          const cachedResponse = await cache.match(cacheKey);
          if (cachedResponse) {
            // キャッシュヒット: X-Cache-Statusヘッダーを追加して返す
            const headers = new Headers(cachedResponse.headers);
            headers.set("X-Cache-Status", "HIT");
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              headers,
            });
          }

          // キャッシュミス: SVGを生成
          const url = new URL(request.url);
          const { width, height, bgColor, textColor } = parseImageParams(
            url.searchParams
          );
          const svg = generateSvgImage(width, height, bgColor, textColor);

          const response = new Response(svg, {
            headers: {
              ...getCacheHeaders(),
              "X-Cache-Status": "MISS",
            },
          });

          // キャッシュに保存（非同期で実行、レスポンスを待たない）
          const responseToCache = new Response(svg, {
            headers: getCacheHeaders(),
          });
          cache.put(cacheKey, responseToCache);

          return response;
        } catch (error) {
          // エラー時はデフォルトのエラー画像を返す
          const errorSvg = generateSvgImage(300, 150, "FF0000", "FFFFFF");
          return new Response(errorSvg, {
            status: 500,
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "no-store",
            },
          });
        }
      },
    },
  },
  component: () => null,
});
