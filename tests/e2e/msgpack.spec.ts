import { test, expect } from "@playwright/test";

test.describe("MessagePack Encode/Decode - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/msgpack");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/MessagePack/);
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

  test("should encode JSON to MessagePack hex", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill('{"name": "test"}');
    await encodeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    // MessagePack hex output should contain space-separated hex bytes
    expect(output).toMatch(/^[0-9a-f]{2}( [0-9a-f]{2})*$/);
  });

  test("should display byte count after encoding", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const encodeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill('{"key": "value"}');
    await encodeButton.click();

    const byteCount = page.locator("#byteCount");
    await expect(byteCount).toBeVisible();
    await expect(byteCount).toContainText("バイト");
  });

  test("should decode MessagePack hex to JSON (round-trip)", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();
    const decodeButton = page.locator("button.btn-secondary").first();

    const originalJson = '{"name":"太郎","age":30}';
    await inputTextarea.fill(originalJson);
    await encodeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const encodedHex = await outputTextarea.inputValue();

    // Now decode it back
    await inputTextarea.fill(encodedHex);
    await decodeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const decoded = await outputTextarea.inputValue();
    const parsedDecoded = JSON.parse(decoded);
    const parsedOriginal = JSON.parse(originalJson);
    expect(parsedDecoded).toEqual(parsedOriginal);
  });

  test("should clear both textareas", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();
    const clearButton = page.locator("button.btn-clear");

    await inputTextarea.fill('{"test": true}');
    await encodeButton.click();

    await expect(outputTextarea).not.toHaveValue("");

    await clearButton.click();

    await expect(inputTextarea).toHaveValue("");
    await expect(outputTextarea).toHaveValue("");
  });

  test("should show toast when encoding empty input", async ({ page }) => {
    const encodeButton = page.locator("button.btn-primary").first();

    await encodeButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("JSONを入力してください");
  });

  test("should show error for invalid JSON", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const encodeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill("not valid json");
    await encodeButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
  });

  test("should show error for invalid hex on decode", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const decodeButton = page.locator("button.btn-secondary").first();

    await inputTextarea.fill("zz ff gg");
    await decodeButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
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
    expect(usageText).not.toContain("undefined");
  });

  test("should have navigation link to MessagePack in navigation", async ({ page }) => {
    const msgpackLink = page.locator('a[href="/msgpack"]');
    await expect(msgpackLink).toBeAttached();
  });
});
