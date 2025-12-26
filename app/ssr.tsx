import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { getRouterManifest } from "@tanstack/react-start/router-manifest";
import { createRouter } from "./router";

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
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
