import { test, expect } from "@playwright/test";

test.describe("Security Headers Checker - E2E Tests", () => {
  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(
    page: import("@playwright/test").Page,
    categoryName: string,
    linkHref: string
  ) {
    const categoryBtn = page.locator(".nav-category-btn", {
      hasText: categoryName,
    });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/security-headers");
    // Wait for React hydration
    await page.waitForLoadState("networkidle");
  });

  test("should load the page without 'undefined' content", async ({
    page,
  }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/セキュリティヘッダーチェック/);
  });

  test("should have URL input field", async ({ page }) => {
    const urlInput = page.locator("#urlInput");
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveAttribute("placeholder", "https://example.com");
  });

  test("should have check button", async ({ page }) => {
    const checkButton = page.locator("button.btn-primary");
    await expect(checkButton).toBeVisible();
    await expect(checkButton).toContainText("チェック");
  });

  test("should show toast when checking with empty input", async ({
    page,
  }) => {
    const checkButton = page.locator("button.btn-primary");

    await checkButton.click();

    // Check for toast notification
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("URLを入力してください");
  });

  test("should show error for invalid URL format", async ({ page }) => {
    const urlInput = page.locator("#urlInput");
    const checkButton = page.locator("button.btn-primary");

    await urlInput.fill("not-a-url");
    await checkButton.click();

    // Wait for error message
    const errorSection = page.locator(".error-message");
    await expect(errorSection).toBeVisible();
    await expect(errorSection).toContainText("無効なURL形式です");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display usage instructions", async ({ page }) => {
    const usageSection = page.locator(".info-box").first();
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain("使い方");
    expect(usageText).not.toContain("undefined");
  });

  test("should display security headers information", async ({ page }) => {
    const infoBoxes = page.locator(".info-box");
    await expect(infoBoxes.nth(1)).toBeVisible();

    const infoText = await infoBoxes.nth(1).textContent();
    expect(infoText).toContain("セキュリティヘッダーについて");
    expect(infoText).toContain("Content-Security-Policy");
    expect(infoText).toContain("Strict-Transport-Security");
  });

  test("should have category navigation", async ({ page }) => {
    const navCategories = page.locator(".nav-categories");
    await expect(navCategories).toBeVisible();

    // 検証カテゴリがアクティブであることを確認
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("検証");
  });

  test("should navigate to other pages via category dropdown", async ({
    page,
  }) => {
    await navigateViaCategory(page, "変換", "/");
    await expect(page).toHaveURL("/");
  });

  test("should trigger check on Enter key press", async ({ page }) => {
    const urlInput = page.locator("#urlInput");

    await urlInput.fill("invalid-url");
    await urlInput.press("Enter");

    // Error should appear
    const errorSection = page.locator(".error-message");
    await expect(errorSection).toBeVisible();
  });

  test("should show loading state during check", async ({ page }) => {
    const urlInput = page.locator("#urlInput");
    const checkButton = page.locator("button.btn-primary");

    // 有効なURLを入力
    await urlInput.fill("https://example.com");

    // チェックボタンをクリック
    await checkButton.click();

    // ローディング状態を確認（短時間で完了する可能性があるため、すぐに確認）
    // Note: このテストは実際のネットワークリクエストに依存するため、
    // モックがない場合はスキップする可能性があります
    const loadingOrResult =
      (await page.locator(".loading").count()) > 0 ||
      (await page.locator(".security-score").count()) > 0;
    expect(loadingOrResult).toBe(true);
  });

  test("should display all security check sections", async ({ page }) => {
    const usageText = await page.locator(".info-box").nth(1).textContent();

    // 主要なセキュリティヘッダーが説明されていることを確認
    expect(usageText).toContain("Content-Security-Policy");
    expect(usageText).toContain("Strict-Transport-Security");
    expect(usageText).toContain("X-Content-Type-Options");
    expect(usageText).toContain("X-Frame-Options");
    expect(usageText).toContain("Referrer-Policy");
    expect(usageText).toContain("Permissions-Policy");
    expect(usageText).toContain("X-XSS-Protection");
  });

  test("should have proper ARIA labels", async ({ page }) => {
    const form = page.locator('form[aria-label="セキュリティヘッダーチェックフォーム"]');
    await expect(form).toBeVisible();

    const urlInput = page.locator("#urlInput");
    await expect(urlInput).toHaveAttribute(
      "aria-label",
      "チェックするURL"
    );

    const checkButton = page.locator("button.btn-primary");
    await expect(checkButton).toHaveAttribute(
      "aria-label",
      "セキュリティヘッダーをチェック"
    );
  });
});
