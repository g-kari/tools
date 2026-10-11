import { test, expect, type Page } from "@playwright/test";
import { assertBase64Recovery, malformedInputs } from "./base64-recovery-assertions";

const externalRequests = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const attempts: string[] = [];
  externalRequests.set(page, attempts);
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:4195") {
      attempts.push(url.origin);
      return route.abort();
    }
    return route.continue();
  });
});
test.afterEach(async ({ page }) => {
  expect(externalRequests.get(page)).toEqual([]);
});

for (const [viewportName, viewport] of [
  ["desktop", { width: 1280, height: 800 }],
  ["mobile viewport", { width: 390, height: 844 }],
] as const) {
  test.describe(viewportName, () => {
    test.use({ viewport });
    for (const [name, codeUnits] of malformedInputs) {
      test(`Base64 ${name} preserves input and supports repair`, async ({ page }) => {
        await assertBase64Recovery(page, codeUnits);
      });
    }
  });
}
