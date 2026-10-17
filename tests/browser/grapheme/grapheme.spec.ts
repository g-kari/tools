import { expect, test, type Page } from "@playwright/test";
// Reuse the six canonical E2E scenarios without replacing their assertions.
import "../../e2e/grapheme-count.spec";

const observations = new WeakMap<Page, { external: string[]; errors: string[] }>();
test.beforeEach(async ({ page }) => {
  const observed = { external: [] as string[], errors: [] as string[] };
  observations.set(page, observed);
  page.on("pageerror", (error) => observed.errors.push(error.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:4199") {
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
    // DOM visibility allows opacity:0. Wait for the real entrance animations to
    // finish naturally before accepting visual evidence; do not disable motion.
    const entranceOpacity = await page
      .locator(".tool-container")
      .evaluate((element) => getComputedStyle(element).opacity);
    await expect(page.locator(".tool-container")).toHaveCSS("opacity", "1");
    const statsGrid = page.locator(".ts-stats-grid");
    for (let index = 0; index < (await statsGrid.count()); index++) {
      await expect(statsGrid.nth(index)).toHaveCSS("opacity", "1");
    }
    const paintedState = await page.evaluate(() => {
      const container = document.querySelector(".tool-container");
      if (!container) throw new Error("描画対象のカードがありません");
      const style = getComputedStyle(container);
      const bounds = container.getBoundingClientRect();
      return {
        container: {
          opacity: style.opacity,
          transform: style.transform,
          width: bounds.width,
          height: bounds.height,
        },
        statsGridOpacities: Array.from(
          document.querySelectorAll(".ts-stats-grid"),
          (grid) => getComputedStyle(grid).opacity,
        ),
        graphemes: document.querySelector('[data-testid="grapheme-count"]')?.textContent,
        codePoints: document.querySelector('[data-testid="char-count"]')?.textContent,
      };
    });
    await testInfo.attach("painted-state", {
      body: JSON.stringify({ entranceOpacity, ...paintedState }),
      contentType: "application/json",
    });
    await page.screenshot({ path: testInfo.outputPath("final-state.png"), fullPage: true });
  }
});
