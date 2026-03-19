import { test, expect } from "@playwright/test";

test.describe("JSON Merge Tool - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/json-merge");
    await page.waitForLoadState("networkidle");
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/JSONマージ/);
  });

  test("should have two JSON input textareas by default", async ({ page }) => {
    const inputs = page.locator('textarea[id^="json-input-"]');
    await expect(inputs).toHaveCount(2);
  });

  test("should have merge and other action buttons", async ({ page }) => {
    await expect(page.locator('button.btn-primary')).toBeVisible();
    await expect(page.locator('button.btn-primary')).toContainText("マージ");
    await expect(page.locator('button.btn-secondary').first()).toBeVisible();
    await expect(page.locator('button.btn-clear')).toBeVisible();
  });

  test("should merge two JSON objects", async ({ page }) => {
    await page.locator("#json-input-0").fill('{"a": 1, "b": 2}');
    await page.locator("#json-input-1").fill('{"b": 3, "c": 4}');
    await page.locator("button.btn-primary").click();
    const output = await page.locator("#outputText").inputValue();
    const parsed = JSON.parse(output);
    expect(parsed).toEqual({ a: 1, b: 3, c: 4 });
  });

  test("should load sample data", async ({ page }) => {
    const sampleBtn = page.locator("button", { hasText: "サンプル" });
    await sampleBtn.click();
    const input0 = await page.locator("#json-input-0").inputValue();
    const input1 = await page.locator("#json-input-1").inputValue();
    expect(input0.trim()).not.toBe("");
    expect(input1.trim()).not.toBe("");
  });

  test("should add a third input when clicking +JSON追加", async ({ page }) => {
    const addBtn = page.locator("button", { hasText: "+ JSON追加" });
    await addBtn.click();
    const inputs = page.locator('textarea[id^="json-input-"]');
    await expect(inputs).toHaveCount(3);
  });

  test("should show delete button when there are more than 2 inputs", async ({
    page,
  }) => {
    await expect(page.locator("button.btn-remove")).toHaveCount(0);
    const addBtn = page.locator("button", { hasText: "+ JSON追加" });
    await addBtn.click();
    await expect(page.locator("button.btn-remove")).toHaveCount(3);
  });

  test("should show error when less than 2 JSONs provided", async ({
    page,
  }) => {
    await page.locator("button.btn-primary").click();
    const errorEl = page.locator('[role="alert"], .error-message, [aria-live="assertive"]');
    await expect(errorEl.first()).toBeVisible();
  });

  test("should show error for invalid JSON", async ({ page }) => {
    await page.locator("#json-input-0").fill("not json");
    await page.locator("#json-input-1").fill('{"b": 2}');
    await page.locator("button.btn-primary").click();
    const errorEl = page.locator('[role="alert"], .error-message, [aria-live="assertive"]');
    await expect(errorEl.first()).toBeVisible();
  });

  test("should clear inputs when clicking clear", async ({ page }) => {
    await page.locator("#json-input-0").fill('{"a": 1}');
    await page.locator("#json-input-1").fill('{"b": 2}');
    await page.locator("button.btn-clear").click();
    expect(await page.locator("#json-input-0").inputValue()).toBe("");
    expect(await page.locator("#json-input-1").inputValue()).toBe("");
  });

  test("should merge with deep merge option", async ({ page }) => {
    await page.locator("select").first().selectOption("deep");
    await page
      .locator("#json-input-0")
      .fill('{"user": {"name": "太郎", "age": 30}}');
    await page
      .locator("#json-input-1")
      .fill('{"user": {"age": 31, "email": "taro@example.com"}}');
    await page.locator("button.btn-primary").click();
    const output = await page.locator("#outputText").inputValue();
    const parsed = JSON.parse(output);
    expect(parsed.user.name).toBe("太郎");
    expect(parsed.user.age).toBe(31);
    expect(parsed.user.email).toBe("taro@example.com");
  });

  test("should support keyboard shortcut Ctrl+Enter", async ({ page }) => {
    await page.locator("#json-input-0").fill('{"a": 1}');
    await page.locator("#json-input-1").fill('{"b": 2}');
    await page.keyboard.press("Control+Enter");
    const output = await page.locator("#outputText").inputValue();
    expect(output.trim()).not.toBe("");
  });
});
