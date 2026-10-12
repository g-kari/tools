import { test as base, expect } from "@playwright/test";

const blockedShellAssetOrigins = new Set([
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://pagead2.googlesyndication.com",
]);

/** Block external HTTP resources during real-application tests. */
export const test = base.extend<{ offlineTransport: void }>({
  offlineTransport: [
    async ({ context, baseURL }, use, testInfo) => {
      const origin = new URL(baseURL ?? "http://127.0.0.1:8788").origin;
      if (origin !== "http://127.0.0.1:8788" && origin !== "http://localhost:8788") {
        throw new Error("Expected loopback app server");
      }
      const blockedOrigins: Record<string, number> = {};
      const unexpectedOrigins: string[] = [];
      const pageErrors: string[] = [];
      const hydrationWarnings: string[] = [];
      context.on("page", (page) => {
        page.on("pageerror", (error) => pageErrors.push(error.message));
        page.on("console", (message) => {
          if (
            ["warning", "error"].includes(message.type()) &&
            /hydrat(?:ion|e|ing|ed)|did not match|server HTML|server rendered/i.test(message.text())
          ) {
            hydrationWarnings.push(message.text());
          }
        });
      });
      await context.route("**/*", (route) => {
        const requestOrigin = new URL(route.request().url()).origin;
        if (requestOrigin === origin) return route.continue();
        blockedOrigins[requestOrigin] = (blockedOrigins[requestOrigin] ?? 0) + 1;
        if (!blockedShellAssetOrigins.has(requestOrigin)) unexpectedOrigins.push(requestOrigin);
        return route.abort("blockedbyclient");
      });
      await use();
      testInfo.annotations.push({
        type: "blocked_external_http",
        description: JSON.stringify(blockedOrigins),
      });
      expect(unexpectedOrigins).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(hydrationWarnings).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
