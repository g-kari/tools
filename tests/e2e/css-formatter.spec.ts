import { test, expect } from "@playwright/test";

test.describe("CSS Formatter - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/css-formatter");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/CSS/);
  });

  test("should have input and output textareas", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");

    await expect(inputTextarea).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test("should have mode selection radio buttons", async ({ page }) => {
    const formatRadio = page.locator('input[name="mode"][value="format"]');
    const minifyRadio = page.locator('input[name="mode"][value="minify"]');
    const validateRadio = page.locator('input[name="mode"][value="validate"]');

    await expect(formatRadio).toBeVisible();
    await expect(minifyRadio).toBeVisible();
    await expect(validateRadio).toBeVisible();
  });

  test("should have action buttons", async ({ page }) => {
    const processButton = page.locator("button.btn-primary");
    const clearButton = page.locator("button.btn-clear");

    await expect(processButton).toBeVisible();
    await expect(processButton).toContainText("整形");
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toContainText("クリア");
  });

  test("should show indent and sort options in format mode", async ({ page }) => {
    const indent2 = page.locator('input[name="indent"][value="2"]');
    const indent4 = page.locator('input[name="indent"][value="4"]');

    await expect(indent2).toBeVisible();
    await expect(indent4).toBeVisible();
  });

  test("should hide format options in minify mode", async ({ page }) => {
    const minifyRadio = page.locator('input[name="mode"][value="minify"]');
    await minifyRadio.click();

    const indent2 = page.locator('input[name="indent"][value="2"]');
    await expect(indent2).not.toBeVisible();
  });

  test("should format CSS input", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const processButton = page.locator("button.btn-primary");
    const outputTextarea = page.locator("#outputText");

    await inputTextarea.fill("div{color:red;font-size:16px;}");
    await processButton.click();

    const output = await outputTextarea.inputValue();
    expect(output).toContain("div {");
    expect(output).toContain("color: red;");
    expect(output).toContain("font-size: 16px;");
  });

  test("should minify CSS input", async ({ page }) => {
    const minifyRadio = page.locator('input[name="mode"][value="minify"]');
    await minifyRadio.click();

    const inputTextarea = page.locator("#inputText");
    const processButton = page.locator("button.btn-primary");
    const outputTextarea = page.locator("#outputText");

    await inputTextarea.fill("div {\n  color: red;\n  font-size: 16px;\n}");
    await processButton.click();

    const output = await outputTextarea.inputValue();
    expect(output).not.toContain("\n");
    expect(output).toContain("div{");
  });

  test("should validate valid CSS", async ({ page }) => {
    const validateRadio = page.locator('input[name="mode"][value="validate"]');
    await validateRadio.click();

    const inputTextarea = page.locator("#inputText");
    const processButton = page.locator("button.btn-primary");
    const outputTextarea = page.locator("#outputText");

    await inputTextarea.fill("div { color: red; }");
    await processButton.click();

    const output = await outputTextarea.inputValue();
    expect(output).toContain("有効");
  });

  test("should show error for empty input", async ({ page }) => {
    const processButton = page.locator("button.btn-primary");
    await processButton.click();

    // トースト通知が表示される
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test("should clear input and output", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const processButton = page.locator("button.btn-primary");
    const clearButton = page.locator("button.btn-clear");
    const outputTextarea = page.locator("#outputText");

    await inputTextarea.fill("div { color: red; }");
    await processButton.click();
    await clearButton.click();

    const inputValue = await inputTextarea.inputValue();
    const outputValue = await outputTextarea.inputValue();
    expect(inputValue).toBe("");
    expect(outputValue).toBe("");
  });
});
