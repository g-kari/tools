import { test, expect } from "@playwright/test";

test.describe("Topページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/ツール一覧/);
  });

  test("検索バーが表示されている", async ({ page }) => {
    await expect(page.locator("#tool-search")).toBeVisible();
  });

  test("カテゴリセクションが複数表示されている", async ({ page }) => {
    const categories = page.locator(".top-category-section");
    const count = await categories.count();
    expect(count).toBeGreaterThanOrEqual(9);
  });

  test("ツールカードが表示されている", async ({ page }) => {
    const cards = page.locator(".top-tool-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(10);
  });

  test("ナビゲーションにホームリンクが表示されている", async ({ page }) => {
    await expect(page.locator(".nav-home-link")).toBeVisible();
  });
});
