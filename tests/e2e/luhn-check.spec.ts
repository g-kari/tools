import { test, expect } from "@playwright/test";

test.describe("Luhn Check Tool - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/luhn-check");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Luhn.*クレジットカード/);
  });

  test("should display the card number input field", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test("should validate a valid Visa card number in realtime", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await input.fill("4532015112830366");

    const banner = page.locator(".luhn-result-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/valid/);
    await expect(banner).toContainText("有効");
  });

  test("should show invalid for wrong card number", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await input.fill("4532015112830367");

    const banner = page.locator(".luhn-result-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/invalid/);
    await expect(banner).toContainText("無効");
  });

  test("should detect Visa card type", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await input.fill("4111111111111111");

    const banner = page.locator(".luhn-result-banner");
    await expect(banner).toContainText("Visa");
  });

  test("should detect Mastercard type", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await input.fill("5500005555555559");

    const banner = page.locator(".luhn-result-banner");
    await expect(banner).toContainText("Mastercard");
  });

  test("should detect American Express type", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await input.fill("378282246310005");

    const banner = page.locator(".luhn-result-banner");
    await expect(banner).toContainText("American Express");
  });

  test("should display formatted card number in details section", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await input.fill("4532015112830366");

    const formatted = page.locator(".luhn-formatted-display");
    await expect(formatted).toBeVisible();
    await expect(formatted).toContainText("4532");
  });

  test("should display details grid when input is provided", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await input.fill("4111111111111111");

    const detailsSection = page.locator(".luhn-details-section");
    await expect(detailsSection).toBeVisible();

    const grid = page.locator(".luhn-details-grid");
    await expect(grid).toBeVisible();
  });

  test("should handle spaced input correctly", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await input.fill("4532 0151 1283 0366");

    const banner = page.locator(".luhn-result-banner");
    await expect(banner).toHaveClass(/valid/);
  });

  test("should clear input when clear button is clicked", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await input.fill("4111111111111111");

    await expect(page.locator(".luhn-result-banner")).toBeVisible();

    const clearBtn = page.locator('button[aria-label="入力をクリア"]');
    await clearBtn.click();

    await expect(input).toHaveValue("");
    await expect(page.locator(".luhn-result-banner")).not.toBeVisible();
  });

  test("should display test card numbers table", async ({ page }) => {
    const testSection = page.locator(".luhn-test-section");
    await expect(testSection).toBeVisible();

    const table = page.locator(".luhn-test-table");
    await expect(table).toBeVisible();
  });

  test('should fill input when "使用" button is clicked', async ({ page }) => {
    const firstUseBtn = page.locator(".luhn-use-btn").first();
    await firstUseBtn.click();

    const input = page.locator("#luhn-input");
    const value = await input.inputValue();
    expect(value.replace(/\D/g, "").length).toBeGreaterThan(10);
  });

  test("should show copy button after valid input", async ({ page }) => {
    const input = page.locator("#luhn-input");
    await input.fill("4111111111111111");

    const copyBtn = page.locator('button[aria-label="フォーマット済み番号をコピー"]');
    await expect(copyBtn).toBeVisible();
  });

  test("should show TipsCard with usage information", async ({ page }) => {
    const tipsCard = page.locator('.tips-card, [class*="tips"]').first();
    await expect(tipsCard).toBeVisible();
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });
});

test.describe("Top page - Luhn Check tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test('should display "Luhn" in the tool list', async ({ page }) => {
    const luhnLink = page.locator('a[href="/luhn-check"]');
    await expect(luhnLink).toBeVisible();
    await expect(luhnLink).toContainText("Luhn");
  });

  test("should navigate to /luhn-check when clicking the tool card", async ({ page }) => {
    const luhnLink = page.locator('a[href="/luhn-check"]').first();
    await luhnLink.click();

    await expect(page).toHaveURL("/luhn-check");
  });
});
