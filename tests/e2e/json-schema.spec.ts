import { test, expect } from "@playwright/test";

test.describe("JSON Schema Generator - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/json-schema");
    await page.waitForLoadState("networkidle");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/JSONスキーマ生成/);
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should have JSON input textarea", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await expect(inputTextarea).toBeVisible();
  });

  test("should have schema output area", async ({ page }) => {
    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toBeVisible();
  });

  test("should load sample JSON when clicking sample button", async ({
    page,
  }) => {
    const sampleButton = page.locator("button", { hasText: "サンプル読込" });
    await sampleButton.click();

    const inputTextarea = page.locator("#jsonInput");
    const value = await inputTextarea.inputValue();
    expect(value.trim()).not.toBe("");
    expect(() => JSON.parse(value)).not.toThrow();
  });

  test("should clear input and output when clicking clear button", async ({
    page,
  }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const clearButton = page.locator("button", { hasText: "クリア" });
    await clearButton.click();

    await expect(inputTextarea).toHaveValue("");
  });

  test("should have copy schema button disabled when no output", async ({
    page,
  }) => {
    const copyButton = page.locator("button", { hasText: "スキーマをコピー" });
    await expect(copyButton).toBeDisabled();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();

    const inputTextarea = page.locator("#jsonInput");
    await expect(inputTextarea).toHaveAttribute("aria-label");

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toHaveAttribute("aria-label");
  });

  test("should have navigation link to JSON Schema generator in category dropdown", async ({
    page,
  }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const schemaLink = dropdown.locator('a[href="/json-schema"]');
    await expect(schemaLink).toBeVisible();
    await expect(schemaLink).toContainText("JSONスキーマ生成");
  });
});
