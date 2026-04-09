import { test, expect } from "@playwright/test";

test.describe("HMAC 生成 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/hmac");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/HMAC/);
  });

  test("should have output format tabs (HEX / Base64)", async ({ page }) => {
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible();
    const tabButtons = page.locator('[role="tab"]');
    await expect(tabButtons).toHaveCount(2);
  });

  test("should have HEX tab selected by default", async ({ page }) => {
    const hexTab = page.locator('[role="tab"]').filter({ hasText: "HEX" });
    await expect(hexTab).toHaveAttribute("aria-selected", "true");
  });

  test("should have message input and secret key input", async ({ page }) => {
    await expect(page.locator("#hmac-message")).toBeVisible();
    await expect(page.locator("#hmac-secret")).toBeVisible();
  });

  test("should show empty state when no input", async ({ page }) => {
    const emptyState = page.locator(".hash-empty-state");
    await expect(emptyState).toBeVisible();
  });

  test("should compute HMAC when message and key are entered", async ({ page }) => {
    await page.locator("#hmac-message").fill("Hello");
    await page.locator("#hmac-secret").fill("secret");
    // デバウンスを待つ
    await page.waitForTimeout(300);
    const results = page.locator(".hash-results-grid");
    await expect(results).toBeVisible();
    // 4 つのアルゴリズム結果が表示される
    const items = page.locator(".hash-result-item");
    await expect(items).toHaveCount(4);
  });

  test("should show HMAC-SHA-1 as deprecated", async ({ page }) => {
    await page.locator("#hmac-message").fill("test");
    await page.locator("#hmac-secret").fill("key");
    await page.waitForTimeout(300);
    const deprecated = page.locator(".hash-result-badge-deprecated");
    await expect(deprecated).toBeVisible();
  });

  test("should show all four algorithm names", async ({ page }) => {
    await page.locator("#hmac-message").fill("test");
    await page.locator("#hmac-secret").fill("key");
    await page.waitForTimeout(300);
    const algorithms = page.locator(".hash-result-algorithm");
    const texts = await algorithms.allTextContents();
    expect(texts).toContain("HMAC-SHA-1");
    expect(texts).toContain("HMAC-SHA-256");
    expect(texts).toContain("HMAC-SHA-384");
    expect(texts).toContain("HMAC-SHA-512");
  });

  test("should switch to Base64 format", async ({ page }) => {
    const base64Tab = page.locator('[role="tab"]').filter({ hasText: "Base64" });
    await base64Tab.click();
    await expect(base64Tab).toHaveAttribute("aria-selected", "true");
    await page.locator("#hmac-message").fill("test");
    await page.locator("#hmac-secret").fill("key");
    await page.waitForTimeout(300);
    const items = page.locator(".hash-result-item");
    await expect(items).toHaveCount(4);
  });

  test("should have copy buttons for each result", async ({ page }) => {
    await page.locator("#hmac-message").fill("test");
    await page.locator("#hmac-secret").fill("key");
    await page.waitForTimeout(300);
    const copyButtons = page.locator(".hash-copy-btn");
    await expect(copyButtons).toHaveCount(4);
  });

  test("should clear input when clear button is clicked", async ({ page }) => {
    await page.locator("#hmac-message").fill("Hello");
    await page.locator("#hmac-secret").fill("secret");
    await page.waitForTimeout(300);
    const clearBtn = page.locator('button[aria-label="入力をクリア"]');
    await clearBtn.click();
    await expect(page.locator("#hmac-message")).toHaveValue("");
    await expect(page.locator("#hmac-secret")).toHaveValue("");
  });

  test("should display tips card", async ({ page }) => {
    const tips = page.locator(".tips-card, .info-box");
    await expect(tips.first()).toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("should have navigation link in category dropdown", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "検証" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/hmac"]');
    await expect(link).toBeVisible();
  });
});
