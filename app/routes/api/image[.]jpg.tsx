/**
 * @fileoverview JPEG形式のダミー画像生成APIルート
 * JPEG形式のプレースホルダー画像を動的に生成して返すAPIエンドポイント。
 * Cloudflare Workers Cache APIを使用してCDNキャッシュを明示的に制御。
 * @module routes/api/image.jpg
 */

import { createFileRoute } from "@tanstack/react-router";
import {
  generateSvgImage,
  parseImageParams,
  convertSvgToPng,
  convertPngToJpeg,
} from "../../functions/dummy-image";

/**
 * キャッシュ用のレスポンスヘッダーを生成
 * @returns {Record<string, string>} レスポンスヘッダー
 */
function getCacheHeaders(): Record<string, string> {
  return {
    "Content-Type": "image/jpeg",
    "Cache-Control": "public, max-age=31536000, immutable",
    "CDN-Cache-Control": "public, max-age=31536000, immutable",
  };
}

/**
 * URLパラメータから画質を取得する
 * @param searchParams - URLSearchParams オブジェクト
 * @returns 画質 (1-100, デフォルト: 85)
 */
function parseQuality(searchParams: URLSearchParams): number {
  const q = parseInt(searchParams.get("q") || "", 10);
  if (isNaN(q)) return 85;
  return Math.max(1, Math.min(100, q));
}

export const Route = createFileRoute("/api/image.jpg")({
  server: {
    handlers: {
      /**
       * ダミーJPEG画像を生成して返すGETハンドラー
       * Cloudflare Workers Cache APIを使用してキャッシュを制御。
       *
       * @param {Object} context - リクエストコンテキスト
       * @param {Request} context.request - HTTPリクエストオブジェクト
       *
       * @queryParam {number} [w=300] - 画像の幅 (1-4096)
       * @queryParam {number} [h=150] - 画像の高さ (1-4096)
       * @queryParam {string} [bg=6750A4] - 背景色 (HEX形式、#なし)
       * @queryParam {string} [text=FFFFFF] - テキスト色 (HEX形式、#なし)
       * @queryParam {number} [q=85] - 画質 (1-100)
       *
       * @returns {Response} 200: JPEG画像 (Content-Type: image/jpeg)
       *   - Cache-Control: public, max-age=31536000, immutable
       *   - CDN-Cache-Control: public, max-age=31536000, immutable
       *   - X-Cache-Status: HIT または MISS
       * @returns {Response} 500: エラー時のデフォルトSVG画像
       *   - Cache-Control: no-store
       *
       * @example
       * // 基本的な使用例
       * GET /api/image.jpg?w=800&h=600
       *
       * @example
       * // カスタム色と画質を指定
       * GET /api/image.jpg?w=1200&h=630&bg=FF0000&text=FFFFFF&q=90
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

          // キャッシュミス: SVG→PNG→JPEGに変換
          const url = new URL(request.url);
          const { width, height, bgColor, textColor } = parseImageParams(
            url.searchParams
          );
          const quality = parseQuality(url.searchParams);

          const svg = generateSvgImage(width, height, bgColor, textColor);
          const pngBuffer = await convertSvgToPng(svg);
          const jpegBuffer = await convertPngToJpeg(pngBuffer, quality);

          const response = new Response(jpegBuffer, {
            headers: {
              ...getCacheHeaders(),
              "X-Cache-Status": "MISS",
            },
          });

          // キャッシュに保存（完了を待機）
          const responseToCache = new Response(jpegBuffer, {
            headers: getCacheHeaders(),
          });
          await cache.put(cacheKey, responseToCache);

          return response;
        } catch (error) {
          console.error("JPEG generation error:", error);
          // エラー時はデフォルトのエラー画像を返す（SVG）
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
