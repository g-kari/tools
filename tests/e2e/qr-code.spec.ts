import { test, expect } from "@playwright/test";

test.describe("QR Code Generator - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/qr-code");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/QRコード生成/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator(".section-title").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("QRコード設定");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should show QRコード link in category dropdown", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "生成" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const qrLink = dropdown.locator('a[href="/qr-code"]');
    await expect(qrLink).toBeVisible();
    await expect(qrLink).toContainText("QRコード");
  });

  test("should have category navigation with active state", async ({ page }) => {
    const navCategories = page.locator(".nav-categories");
    await expect(navCategories).toBeVisible();
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("生成");
  });

  test("should display QR code canvas on load with default URL", async ({ page }) => {
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("should have text input field", async ({ page }) => {
    const input = page.locator("input#qr-text");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("https://example.com");
  });

  test("should have size selector", async ({ page }) => {
    const sizeSelect = page.locator("select#qr-size");
    await expect(sizeSelect).toBeVisible();
  });

  test("should have error correction level selector", async ({ page }) => {
    const errorSelect = page.locator("select#qr-error-level");
    await expect(errorSelect).toBeVisible();
  });

  test("should have color inputs", async ({ page }) => {
    const fgColorInput = page.locator("input#qr-fg-color");
    const bgColorInput = page.locator("input#qr-bg-color");
    await expect(fgColorInput).toBeVisible();
    await expect(bgColorInput).toBeVisible();
  });

  test("should have download and copy buttons", async ({ page }) => {
    const downloadBtn = page.locator('button:has-text("PNGでダウンロード")');
    const copyBtn = page.locator('button:has-text("クリップボードにコピー")');
    await expect(downloadBtn).toBeVisible();
    await expect(copyBtn).toBeVisible();
  });

  test("should update QR code when text input changes", async ({ page }) => {
    const input = page.locator("input#qr-text");
    await input.fill("https://new-url.example.com");
    // Canvas should still be visible after update
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("should show placeholder when text is cleared", async ({ page }) => {
    const input = page.locator("input#qr-text");
    await input.fill("");
    const placeholder = page.locator(".qr-placeholder-text");
    await expect(placeholder).toBeVisible();
  });

  test("should display usage instructions in TipsCard", async ({ page }) => {
    const tipsCard = page.locator(".info-box").first();
    await expect(tipsCard).toBeVisible();
    const tipsText = await tipsCard.textContent();
    expect(tipsText).toContain("QRコードとは");
    expect(tipsText).not.toContain("undefined");
  });

  test("should have download button enabled when QR is generated", async ({ page }) => {
    const downloadBtn = page.locator('button:has-text("PNGでダウンロード")');
    await expect(downloadBtn).not.toBeDisabled();
  });

  test("should have download button disabled when text is empty", async ({ page }) => {
    const input = page.locator("input#qr-text");
    await input.fill("");
    const downloadBtn = page.locator('button:has-text("PNGでダウンロード")');
    await expect(downloadBtn).toBeDisabled();
  });
});
