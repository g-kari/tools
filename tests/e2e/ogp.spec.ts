import { test, expect } from "@playwright/test";

test.describe("OGP Checker - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ogp");
    // Wait for the main content to be visible
    await page.waitForSelector(".tool-container", { state: "visible" });
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/OGP/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("should have URL input field", async ({ page }) => {
    const urlInput = page.locator("#urlInput");
    await expect(urlInput).toBeVisible();
  });

  test("should have check button", async ({ page }) => {
    const checkButton = page.locator('button[aria-label="OGP情報を取得"]');
    await expect(checkButton).toBeVisible();
    await expect(checkButton).toContainText("チェック");
  });

  test("should show inline error when checking empty input", async ({ page }) => {
    const checkButton = page.locator('button[aria-label="OGP情報を取得"]');

    await checkButton.click();

    // Check for inline error message
    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("URLを入力してください");
  });

  test("should have form visible", async ({ page }) => {
    const form = page.locator('form[aria-label="OGPチェックフォーム"]');
    await expect(form).toBeVisible();
  });

  test("should display usage instructions", async ({ page }) => {
    const usageSection = page.locator(".info-box");
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain("URL");
    expect(usageText).toContain("チェック");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    // Check for ARIA roles
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Check for skip link
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should have navigation link to OGP checker", async ({ page }) => {
    const navLink = page.locator('nav a[href="/ogp"]');
    await expect(navLink).toBeVisible();
    await expect(navLink).toContainText("OGP");

    // Should be active
    await expect(navLink).toHaveAttribute("data-active", "true");
  });

  test("should focus on URL input on page load", async ({ page }) => {
    const urlInput = page.locator("#urlInput");
    // Wait for the input to be focused
    await expect(urlInput).toBeFocused({ timeout: 2000 });
  });

  test("should have proper form structure", async ({ page }) => {
    // Check for proper labeling
    const label = page.locator('label[for="urlInput"]');
    await expect(label).toBeVisible();
    await expect(label).toContainText("URL");

    // Check for placeholder
    const urlInput = page.locator("#urlInput");
    await expect(urlInput).toHaveAttribute("placeholder", "https://example.com");
  });

  test("should have sr-only help text", async ({ page }) => {
    const helpText = page.locator("#url-help");
    await expect(helpText).toBeAttached();
    await expect(helpText).toHaveClass(/sr-only/);
  });
});
