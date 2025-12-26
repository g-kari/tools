import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

let router: ReturnType<typeof createTanStackRouter> | undefined;

export function getRouter() {
  if (!router) {
    router = createTanStackRouter({
      routeTree,
      scrollRestoration: true,
    });
  }
  return router;
}

// Alias for backward compatibility
export const createRouter = getRouter;

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
