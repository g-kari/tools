import { test, expect } from "@playwright/test";

test.describe("PHP シリアライズ/アンシリアライズ - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/php-serialize");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/PHP/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("should have input and output textareas", async ({ page }) => {
    await expect(page.locator("#inputText")).toBeVisible();
    await expect(page.locator("#outputText")).toBeVisible();
  });

  test("should have all action buttons", async ({ page }) => {
    await expect(page.locator("button.btn-primary").first()).toBeVisible();
    await expect(page.locator("button.btn-secondary").first()).toBeVisible();
    await expect(page.locator("button.btn-clear")).toBeVisible();
  });

  test("should serialize JSON to PHP serialize format", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const serializeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill('{"name": "Alice", "age": 30}');
    await serializeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    expect(output).toContain("a:");
    expect(output).toContain("s:");
    expect(output).toContain("i:30;");
  });

  test("should unserialize PHP string to JSON (round-trip)", async ({
    page,
  }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const serializeButton = page.locator("button.btn-primary").first();
    const unserializeButton = page.locator("button.btn-secondary").first();

    const originalJson = '{"count":42}';
    await inputTextarea.fill(originalJson);
    await serializeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const serialized = await outputTextarea.inputValue();

    await inputTextarea.fill(serialized);
    await unserializeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const decoded = await outputTextarea.inputValue();
    expect(JSON.parse(decoded)).toEqual(JSON.parse(originalJson));
  });

  test("should serialize null correctly", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const serializeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill("null");
    await serializeButton.click();

    await expect(outputTextarea).toHaveValue("N;");
  });

  test("should clear both textareas", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const serializeButton = page.locator("button.btn-primary").first();
    const clearButton = page.locator("button.btn-clear");

    await inputTextarea.fill('"test"');
    await serializeButton.click();

    await expect(outputTextarea).not.toHaveValue("");

    await clearButton.click();

    await expect(inputTextarea).toHaveValue("");
    await expect(outputTextarea).toHaveValue("");
  });

  test("should show toast when serializing empty input", async ({ page }) => {
    const serializeButton = page.locator("button.btn-primary").first();

    await serializeButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("JSONを入力してください");
  });

  test("should show error for invalid JSON on serialize", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const serializeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill("not valid json");
    await serializeButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
  });

  test("should show error for invalid PHP serialize string on unserialize", async ({
    page,
  }) => {
    const inputTextarea = page.locator("#inputText");
    const unserializeButton = page.locator("button.btn-secondary").first();

    await inputTextarea.fill("X:invalid;");
    await unserializeButton.click();

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

  test("should have navigation link to php-serialize", async ({ page }) => {
    const link = page.locator('a[href="/php-serialize"]');
    await expect(link).toBeAttached();
  });
});
