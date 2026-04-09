import { test, expect } from "@playwright/test";

test.describe("Port Check - E2E Tests", () => {
  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(
    page: import("@playwright/test").Page,
    categoryName: string,
    linkHref: string,
  ) {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: categoryName });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/port-check");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/ポートチェック/);
  });

  test("should have host input field", async ({ page }) => {
    const hostInput = page.locator("#hostInput");
    await expect(hostInput).toBeVisible();
  });

  test("should have ports input field", async ({ page }) => {
    const portsInput = page.locator("#portsInput");
    await expect(portsInput).toBeVisible();
  });

  test("should have timeout input field", async ({ page }) => {
    const timeoutInput = page.locator("#timeoutInput");
    await expect(timeoutInput).toBeVisible();
  });

  test("should have check button", async ({ page }) => {
    const checkButton = page.locator("button.btn-primary");
    await expect(checkButton).toBeVisible();
    await expect(checkButton).toContainText("チェック");
  });

  test("should have preset buttons", async ({ page }) => {
    const presetButtons = page.locator(".port-preset-btn");
    await expect(presetButtons).toHaveCount(5);
  });

  test("should set preset ports when clicking Web preset", async ({ page }) => {
    const webPreset = page.locator(".port-preset-btn", { hasText: "Web" });
    await webPreset.click();
    const portsInput = page.locator("#portsInput");
    await expect(portsInput).toHaveValue("80,443");
  });

  test("should set preset ports when clicking SSH preset", async ({ page }) => {
    const sshPreset = page.locator(".port-preset-btn", { hasText: "SSH" });
    await sshPreset.click();
    const portsInput = page.locator("#portsInput");
    await expect(portsInput).toHaveValue("22");
  });

  test("should show toast when checking with empty host", async ({ page }) => {
    const portsInput = page.locator("#portsInput");
    await portsInput.fill("80");
    const checkButton = page.locator("button.btn-primary");
    await checkButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("ホスト名またはIPアドレスを入力してください");
  });

  test("should show toast when checking with empty ports", async ({ page }) => {
    const hostInput = page.locator("#hostInput");
    await hostInput.fill("example.com");
    const portsInput = page.locator("#portsInput");
    await portsInput.fill("");
    const checkButton = page.locator("button.btn-primary");
    await checkButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("有効なポート番号を入力してください");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display usage instructions", async ({ page }) => {
    const usageSection = page.locator(".info-box");
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain("使い方");
  });

  test("should have port-check navigation link in ネットワーク category", async ({ page }) => {
    await navigateViaCategory(page, "ネットワーク", "/port-check");
    await expect(page).toHaveURL("/port-check");
  });

  test("should have ネットワーク category active when on port-check page", async ({ page }) => {
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("ネットワーク");
  });

  test("should have labels associated with inputs", async ({ page }) => {
    // アクセシビリティ: label と input の関連付け確認
    const hostLabel = page.locator('label[for="hostInput"]');
    await expect(hostLabel).toBeVisible();
    const portsLabel = page.locator('label[for="portsInput"]');
    await expect(portsLabel).toBeVisible();
    const timeoutLabel = page.locator('label[for="timeoutInput"]');
    await expect(timeoutLabel).toBeVisible();
  });
});
