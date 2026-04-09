import { test, expect } from "@playwright/test";

test.describe("テキスト置換 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/text-replace");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/テキスト置換/);
  });

  test("should have find and replace inputs", async ({ page }) => {
    await expect(page.locator("#find-input")).toBeVisible();
    await expect(page.locator("#replace-input")).toBeVisible();
    await expect(page.locator("#input-text")).toBeVisible();
    await expect(page.locator("#output-text")).toBeVisible();
  });

  test("should have option toggles", async ({ page }) => {
    const options = page.locator(".text-replace-options");
    await expect(options).toBeVisible();
    await expect(options.locator("label")).toHaveCount(4);
  });

  test("should replace text", async ({ page }) => {
    await page.locator("#input-text").fill("hello world hello");
    await page.locator("#find-input").fill("hello");
    await page.locator("#replace-input").fill("hi");

    const output = await page.locator("#output-text").inputValue();
    expect(output).toContain("hi");
  });

  test("should show match count badge", async ({ page }) => {
    await page.locator("#input-text").fill("abc abc abc");
    await page.locator("#find-input").fill("abc");

    const badge = page.locator(".text-replace-match-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("3 件マッチ");
  });

  test("should show no match badge when not found", async ({ page }) => {
    await page.locator("#input-text").fill("hello world");
    await page.locator("#find-input").fill("xyz");

    const badge = page.locator(".text-replace-match-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("マッチなし");
  });

  test("should toggle regex mode", async ({ page }) => {
    const regexLabel = page.locator(".text-replace-option-label").filter({ hasText: "正規表現" });
    await regexLabel.click();
    const checkbox = regexLabel.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
  });

  test("should support regex pattern matching", async ({ page }) => {
    // Enable regex mode
    const regexLabel = page.locator(".text-replace-option-label").filter({ hasText: "正規表現" });
    await regexLabel.click();

    await page.locator("#input-text").fill("foo123bar456");
    await page.locator("#find-input").fill("\\d+");
    await page.locator("#replace-input").fill("NUM");

    const output = await page.locator("#output-text").inputValue();
    expect(output).toContain("NUM");
  });

  test("should clear input when clear button is clicked", async ({ page }) => {
    await page.locator("#input-text").fill("some text");
    await page.locator("#find-input").fill("some");

    const clearBtn = page.locator('button[aria-label="すべてクリア"]');
    await clearBtn.click();

    await expect(page.locator("#input-text")).toHaveValue("");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("should display usage tips", async ({ page }) => {
    const tips = page.locator(".tips-card, .info-box");
    await expect(tips.first()).toBeVisible();
  });

  test("should have navigation link in category dropdown", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "テキスト" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/text-replace"]');
    await expect(link).toBeVisible();
  });
});
