/**
 * @fileoverview PNG形式のダミー画像生成APIルート
 * PNG形式のプレースホルダー画像を動的に生成して返すAPIエンドポイント。
 * Cloudflare Workers Cache APIを使用してCDNキャッシュを明示的に制御。
 * @module routes/api/image.png
 */

import { createFileRoute } from "@tanstack/react-router";
import {
  generateSvgImage,
  parseImageParams,
  convertSvgToPng,
  parseTargetFileSize,
  createPaddedImageStream,
} from "../../functions/dummy-image";

/**
 * キャッシュ用のレスポンスヘッダーを生成
 * @returns {Record<string, string>} レスポンスヘッダー
 */
function getCacheHeaders(): Record<string, string> {
  return {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=31536000, immutable",
    "CDN-Cache-Control": "public, max-age=31536000, immutable",
  };
}

export const Route = createFileRoute("/api/image.png")({
  server: {
    handlers: {
      /**
       * ダミーPNG画像を生成して返すGETハンドラー
       * Cloudflare Workers Cache APIを使用してキャッシュを制御。
       *
       * @param {Object} context - リクエストコンテキスト
       * @param {Request} context.request - HTTPリクエストオブジェクト
       *
       * @queryParam {number} [w=300] - 画像の幅 (1-4096)
       * @queryParam {number} [h=150] - 画像の高さ (1-4096)
       * @queryParam {string} [bg=6750A4] - 背景色 (HEX形式、#なし)
       * @queryParam {string} [text=FFFFFF] - テキスト色 (HEX形式、#なし)
       * @queryParam {number} [size] - 目標ファイル容量 (MB、最大500)
       *
       * @returns {Response} 200: PNG画像 (Content-Type: image/png)
       *   - Cache-Control: public, max-age=31536000, immutable
       *   - CDN-Cache-Control: public, max-age=31536000, immutable
       *   - X-Cache-Status: HIT または MISS
       * @returns {Response} 500: エラー時のデフォルトPNG画像
       *   - Cache-Control: no-store
       *
       * @example
       * // 基本的な使用例
       * GET /api/image.png?w=800&h=600
       *
       * @example
       * // カスタム色を指定
       * GET /api/image.png?w=1200&h=630&bg=FF0000&text=FFFFFF
       */
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const targetFileSize = parseTargetFileSize(url.searchParams);

          // 容量指定のない通常画像のみCloudflare Workers Cache APIを使用
          const cache = (caches as unknown as { default: Cache }).default;
          const cacheKey = new Request(request.url, { method: "GET" });

          // キャッシュをチェック
          const cachedResponse = targetFileSize === 0 ? await cache.match(cacheKey) : undefined;
          if (cachedResponse) {
            // キャッシュヒット: X-Cache-Statusヘッダーを追加して返す
            const headers = new Headers(cachedResponse.headers);
            headers.set("X-Cache-Status", "HIT");
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              headers,
            });
          }

          // キャッシュミス: SVGを生成してPNGに変換
          const { width, height, bgColor, textColor } = parseImageParams(url.searchParams);
          const svg = generateSvgImage(width, height, bgColor, textColor);
          const pngBuffer = await convertSvgToPng(svg);

          if (targetFileSize > 0) {
            const { stream, contentLength } = createPaddedImageStream(pngBuffer, targetFileSize);
            return new Response(stream, {
              headers: {
                "Content-Type": "image/png",
                "Content-Length": String(contentLength),
                "Cache-Control": "no-store",
                "X-Cache-Status": "BYPASS",
              },
            });
          }

          const response = new Response(pngBuffer, {
            headers: {
              ...getCacheHeaders(),
              "X-Cache-Status": "MISS",
            },
          });

          // キャッシュに保存（完了を待機）
          const responseToCache = new Response(pngBuffer, {
            headers: getCacheHeaders(),
          });
          await cache.put(cacheKey, responseToCache);

          return response;
        } catch (error) {
          console.error("PNG generation error:", error);
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
