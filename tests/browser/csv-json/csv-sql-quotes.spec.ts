import { test, expect, type Page } from "@playwright/test";
import { assertCsvSqlRecovery, malformedCsvSqlInputs } from "./csv-sql-recovery-assertions";

const externalRequests = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const attempts: string[] = [];
  externalRequests.set(page, attempts);
  await page.route("**/*", (route) => {
    const origin = new URL(route.request().url()).origin;
    if (origin !== "http://127.0.0.1:4195") {
      attempts.push(origin);
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
});
test.afterEach(async ({ page }) => {
  expect(externalRequests.get(page)).toEqual([]);
});

for (const [viewportName, viewport] of [
  ["desktop", { width: 1280, height: 800 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  test.describe(viewportName, () => {
    test.use({ viewport });
    for (const malformed of malformedCsvSqlInputs) {
      test(`CSV SQL repairs ${malformed.name} without stale SQL or lost input`, async ({
        page,
      }) => {
        await assertCsvSqlRecovery(page, malformed, "csv-sql-component-error");
      });
    }
  });
}
