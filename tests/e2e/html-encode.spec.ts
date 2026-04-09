import { test, expect } from "@playwright/test";

test.describe("HTML Encode/Decode - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/html-encode");
    // Wait for React hydration
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/HTML/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("should have input and output textareas", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");

    await expect(inputTextarea).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test("should have all action buttons", async ({ page }) => {
    const encodeButton = page.locator("button.btn-primary").first();
    const decodeButton = page.locator("button.btn-secondary").first();
    const clearButton = page.locator("button.btn-clear");

    await expect(encodeButton).toBeVisible();
    await expect(decodeButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test("should encode HTML tags", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill("<h1>Hello, World!</h1>");
    await encodeButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    expect(output).toContain("&lt;");
    expect(output).toContain("&gt;");
    expect(output).not.toContain("<h1>");
  });

  test("should decode HTML entities", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const decodeButton = page.locator("button.btn-secondary").first();

    await inputTextarea.fill("&lt;h1&gt;Hello&lt;/h1&gt;");
    await decodeButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).toHaveValue("<h1>Hello</h1>");
  });

  test("should clear both textareas", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();
    const clearButton = page.locator("button.btn-clear");

    await inputTextarea.fill("<div>テスト</div>");
    await encodeButton.click();

    // Wait for output to have content
    await expect(outputTextarea).not.toHaveValue("");

    // Click clear
    await clearButton.click();

    // Both should be empty
    await expect(inputTextarea).toHaveValue("");
    await expect(outputTextarea).toHaveValue("");
  });

  test("should show toast when encoding empty input", async ({ page }) => {
    const encodeButton = page.locator("button.btn-primary").first();

    await encodeButton.click();

    // Check for toast notification
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("テキストを入力してください");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    // Check for ARIA roles
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Check for skip link
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display usage instructions with HTML entity examples", async ({ page }) => {
    const usageSection = page.locator(".info-box");
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain("&lt;");
    expect(usageText).not.toContain("undefined");
  });

  test("should encode ampersand correctly", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill("a & b");
    await encodeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    expect(output).toContain("&amp;");
  });
});
