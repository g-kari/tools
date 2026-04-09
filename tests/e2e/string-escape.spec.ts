import { test, expect } from "@playwright/test";

test.describe("String Escape Tool - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/string-escape");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/文字列エスケープ/);
  });

  test("should display input and output textareas", async ({ page }) => {
    await expect(page.locator("#string-escape-input")).toBeVisible();
    await expect(page.locator("#string-escape-output")).toBeVisible();
  });

  test("should display escape mode buttons", async ({ page }) => {
    const modes = page.locator(".string-escape-mode-btn");
    const count = await modes.count();
    expect(count).toBeGreaterThan(3);
  });

  test("should escape JavaScript special characters in realtime", async ({ page }) => {
    const input = page.locator("#string-escape-input");
    await input.fill('Hello\n"World"');

    const output = page.locator("#string-escape-output");
    const outputValue = await output.inputValue();
    expect(outputValue).toContain("\\n");
    expect(outputValue).toContain('\\"');
  });

  test("should load sample text when sample button is clicked", async ({ page }) => {
    const sampleBtn = page.locator('button[aria-label="サンプルテキストを読み込む"]');
    await sampleBtn.click();

    const input = page.locator("#string-escape-input");
    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("should show escaped output when sample is loaded", async ({ page }) => {
    const sampleBtn = page.locator('button[aria-label="サンプルテキストを読み込む"]');
    await sampleBtn.click();

    const output = page.locator("#string-escape-output");
    const outputValue = await output.inputValue();
    expect(outputValue.length).toBeGreaterThan(0);
  });

  test("should clear input when clear button is clicked", async ({ page }) => {
    const input = page.locator("#string-escape-input");
    await input.fill("test text");

    const clearBtn = page.locator('button[aria-label="入力をクリア"]');
    await clearBtn.click();

    await expect(input).toHaveValue("");
  });

  test("should switch to JSON mode when JSON mode button is clicked", async ({ page }) => {
    const jsonBtn = page.locator(".string-escape-mode-btn", { hasText: "JSON" }).first();
    await jsonBtn.click();
    await expect(jsonBtn).toHaveClass(/active/);
  });

  test("should show character count in input area", async ({ page }) => {
    const input = page.locator("#string-escape-input");
    await input.fill("hello");

    const charCount = page.locator(".string-escape-char-count").first();
    await expect(charCount).toContainText("5");
  });

  test("should have copy button for escaped result", async ({ page }) => {
    const input = page.locator("#string-escape-input");
    await input.fill("test");

    const copyBtn = page.locator('button[aria-label="エスケープ済みテキストをコピー"]');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeEnabled();
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });
});

test.describe("Top page - String Escape tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test('should display "文字列エスケープ" in the tool list', async ({ page }) => {
    const link = page.locator('a[href="/string-escape"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("文字列エスケープ");
  });

  test("should navigate to /string-escape when clicking the tool card", async ({ page }) => {
    const link = page.locator('a[href="/string-escape"]');
    await link.click();
    await expect(page).toHaveURL("/string-escape");
  });
});
