import { test, expect } from "@playwright/test";

test.describe("JSON Flatten - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/json-flatten");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/JSONフラット化/);
  });

  test("should have input and output textareas", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");

    await expect(inputTextarea).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test("should have mode toggle buttons", async ({ page }) => {
    const flattenBtn = page.locator("button[aria-pressed]", { hasText: "フラット化" });
    const unflattenBtn = page.locator("button[aria-pressed]", { hasText: "アンフラット化" });

    await expect(flattenBtn).toBeVisible();
    await expect(unflattenBtn).toBeVisible();
  });

  test("should have all action buttons", async ({ page }) => {
    const convertButton = page.locator("button.btn-primary", { hasText: "フラット化" });
    const sampleButton = page.locator("button", { hasText: "サンプル" });
    const clearButton = page.locator("button.btn-clear");

    await expect(convertButton).toBeVisible();
    await expect(sampleButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test("should flatten nested JSON", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const convertButton = page.locator("button.btn-primary");

    await inputTextarea.fill('{"user":{"name":"太郎","age":30}}');
    await convertButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    expect(output).toContain('"user.name"');
    expect(output).toContain('"太郎"');
    expect(output).toContain('"user.age"');
  });

  test("should load sample data", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "サンプル" });
    const inputTextarea = page.locator("#inputText");

    await sampleButton.click();
    const value = await inputTextarea.inputValue();
    expect(value.length).toBeGreaterThan(0);
    expect(value).toContain("{");
  });

  test("should clear both textareas", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const convertButton = page.locator("button.btn-primary");
    const clearButton = page.locator("button.btn-clear");

    await inputTextarea.fill('{"a":{"b":1}}');
    await convertButton.click();
    await expect(outputTextarea).not.toHaveValue("");

    await clearButton.click();
    await expect(inputTextarea).toHaveValue("");
    await expect(outputTextarea).toHaveValue("");
  });

  test("should show error when converting empty input", async ({ page }) => {
    const convertButton = page.locator("button.btn-primary");
    await convertButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("JSONを入力してください");
  });

  test("should show error for invalid JSON", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const convertButton = page.locator("button.btn-primary");

    await inputTextarea.fill("invalid json");
    await convertButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
  });

  test("should switch to unflatten mode", async ({ page }) => {
    const unflattenBtn = page.locator("button", { hasText: "アンフラット化" }).first();
    await unflattenBtn.click();

    const inputLabel = page.locator('label[for="inputText"]');
    await expect(inputLabel).toContainText("フラット");
  });

  test("should unflatten flat JSON", async ({ page }) => {
    const unflattenBtn = page.locator("button[aria-pressed]", { hasText: "アンフラット化" });
    await unflattenBtn.click();

    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const convertButton = page.locator("button.btn-primary");

    await inputTextarea.fill('{"user.name":"太郎","user.age":30}');
    await convertButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    expect(output).toContain('"user"');
    expect(output).toContain('"name"');
    expect(output).toContain('"太郎"');
  });

  test("should have options fieldset", async ({ page }) => {
    const delimiterSelect = page.locator("#delimiter");
    await expect(delimiterSelect).toBeVisible();
  });

  test("should change delimiter and flatten with new delimiter", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const convertButton = page.locator("button.btn-primary");
    const delimiterSelect = page.locator("#delimiter");

    await delimiterSelect.selectOption("/");
    await inputTextarea.fill('{"user":{"name":"太郎"}}');
    await convertButton.click();

    const output = await outputTextarea.inputValue();
    expect(output).toContain('"user/name"');
  });

  test("should display tips card with usage instructions", async ({ page }) => {
    const infoBox = page.locator(".info-box");
    await expect(infoBox).toBeVisible();

    const infoText = await infoBox.textContent();
    expect(infoText).toContain("使い方");
    expect(infoText).not.toContain("undefined");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });
});
