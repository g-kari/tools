import { expect, test, type Page } from "@playwright/test";
import { registerJsonFlattenCollisionTests } from "./assertions";

const observations = new WeakMap<Page, { external: string[]; errors: string[] }>();

test.beforeEach(async ({ page }) => {
  const observed = { external: [] as string[], errors: [] as string[] };
  observations.set(page, observed);
  page.on("pageerror", (error) => observed.errors.push(error.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:4198") {
      observed.external.push(url.origin);
      return route.abort();
    }
    return route.continue();
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const observed = observations.get(page);
  expect(observed?.external).toEqual([]);
  expect(observed?.errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  if (testInfo.status === "passed") {
    await page.screenshot({ path: testInfo.outputPath("final-state.png"), fullPage: true });
  }
});

registerJsonFlattenCollisionTests();
