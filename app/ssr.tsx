import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { getRouterManifest } from "@tanstack/react-start/router-manifest";
import { createRouter } from "./router";
import {
  generateSvgImage,
  parseImageParams,
} from "./functions/dummy-image";

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // /api/image エンドポイント - ダミー画像を直接返す
    if (url.pathname === "/api/image") {
      try {
        // Cloudflare CDNキャッシュを確認
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), {
          method: "GET",
        });

        // キャッシュから取得を試みる
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
          return cachedResponse;
        }

        // キャッシュにない場合は生成
        const { width, height, bgColor, textColor } = parseImageParams(
          url.searchParams
        );
        const svg = generateSvgImage(width, height, bgColor, textColor);

        const response = new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });

        // レスポンスをCloudflare CDNにキャッシュ
        ctx.waitUntil(cache.put(cacheKey, response.clone()));

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
    }

    const handler = createStartHandler({
      createRouter,
      getRouterManifest,
    })(defaultStreamHandler);

    return handler({
      request,
      cloudflare: { env, ctx },
    });
  },
};
