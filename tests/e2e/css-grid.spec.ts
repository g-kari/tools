import { test, expect } from "@playwright/test";

test.describe("CSS Gridジェネレーター - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/css-grid");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/CSS Grid/);
  });

  test("should show grid preview area", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("grid");
  });

  test("should show generated CSS code", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("display: grid");
  });

  test("should have copy CSS button", async ({ page }) => {
    const copyBtn = page.locator("button").filter({ hasText: /コピー/ });
    await expect(copyBtn.first()).toBeVisible();
  });

  test("should have reset button", async ({ page }) => {
    const resetBtn = page.locator("button").filter({ hasText: /リセット/ });
    await expect(resetBtn.first()).toBeVisible();
  });

  test("should have grid container settings", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("grid-template-columns");
  });

  test("should have gap setting", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("gap");
  });

  test("should add items", async ({ page }) => {
    const addBtn = page
      .locator("button")
      .filter({ hasText: /アイテム追加|追加/ })
      .first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("should have navigation link in category dropdown", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "画像" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/css-grid"]');
    await expect(link).toBeVisible();
  });
});
