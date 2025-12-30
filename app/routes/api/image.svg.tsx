import { createFileRoute } from "@tanstack/react-router";
import {
  generateSvgImage,
  parseImageParams,
} from "../../functions/dummy-image";

export const Route = createFileRoute("/api/image/svg")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const { width, height, bgColor, textColor } = parseImageParams(
            url.searchParams
          );
          const svg = generateSvgImage(width, height, bgColor, textColor);

          return new Response(svg, {
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=31536000, immutable",
              "CDN-Cache-Control": "public, max-age=31536000, immutable",
            },
          });
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
