import { test, expect } from "@playwright/test";

test.describe("数式評価ツール - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/math-eval");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/数式/);
  });

  test("should have math input field", async ({ page }) => {
    await expect(page.locator("#math-input")).toBeVisible();
  });

  test("should evaluate a simple arithmetic expression", async ({ page }) => {
    await page.locator("#math-input").fill("2 + 3");
    // Wait for real-time evaluation
    await page.waitForTimeout(300);
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("5");
  });

  test("should evaluate multiplication", async ({ page }) => {
    await page.locator("#math-input").fill("6 * 7");
    await page.waitForTimeout(300);
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("42");
  });

  test("should evaluate division", async ({ page }) => {
    await page.locator("#math-input").fill("10 / 4");
    await page.waitForTimeout(300);
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("2.5");
  });

  test("should show sample expressions", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("sin");
  });

  test("should load sample expression when clicked", async ({ page }) => {
    const sampleBtn = page
      .locator("button")
      .filter({ hasText: /sin|cos|sqrt|PI/i })
      .first();
    if (await sampleBtn.isVisible()) {
      await sampleBtn.click();
      const inputValue = await page.locator("#math-input").inputValue();
      expect(inputValue.length).toBeGreaterThan(0);
    }
  });

  test("should show history after evaluating", async ({ page }) => {
    await page.locator("#math-input").fill("1 + 1");
    // Trigger evaluate (Ctrl+Enter or button)
    await page.keyboard.press("Control+Enter");
    await page.waitForTimeout(300);
    // History should appear
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("1 + 1");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("should have navigation link in category dropdown", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/math-eval"]');
    await expect(link).toBeVisible();
  });
});
