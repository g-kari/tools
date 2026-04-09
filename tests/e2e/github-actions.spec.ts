import { test, expect } from "@playwright/test";

test.describe("GitHub Actions ビルダー - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/github-actions");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/GitHub Actions/);
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display template buttons", async ({ page }) => {
    const templateBtns = page.locator(".ga-template-btn");
    await expect(templateBtns.first()).toBeVisible();
    const count = await templateBtns.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("should display workflow output area", async ({ page }) => {
    const output = page.locator(".ga-output");
    await expect(output).toBeVisible();
    const text = await output.textContent();
    expect(text).toContain("name:");
  });

  test("should have copy button", async ({ page }) => {
    const copyBtn = page.locator("button", { hasText: "コピー" });
    await expect(copyBtn).toBeVisible();
  });

  test("should apply Node.js CI template on click", async ({ page }) => {
    const nodeBtn = page.locator(".ga-template-btn", { hasText: "Node.js CI" });
    await nodeBtn.click();
    const output = page.locator(".ga-output");
    await expect(output).toContainText("Node.js");
  });

  test("should update workflow name when typing", async ({ page }) => {
    const nameInput = page
      .locator('input[aria-label*="ワークフロー名"]')
      .or(page.locator(".ga-name-input"));
    if ((await nameInput.count()) > 0) {
      await nameInput.fill("My Test Workflow");
      const output = page.locator(".ga-output");
      await expect(output).toContainText("My Test Workflow");
    }
  });

  test("should show navigation link in 生成 category", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "生成" });
    await categoryBtn.hover();
    const link = page.locator('.nav-dropdown a[href="/github-actions"]');
    await expect(link).toBeVisible();
  });
});
