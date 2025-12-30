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
      const { width, height, bgColor, textColor } = parseImageParams(
        url.searchParams
      );
      const svg = generateSvgImage(width, height, bgColor, textColor);

      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
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
