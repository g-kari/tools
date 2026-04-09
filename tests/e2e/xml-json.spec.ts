import { test, expect } from "@playwright/test";

test.describe("XML/JSON変換 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/xml-json");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/XML\/JSON変換|XML.JSON/);
  });

  test("should have mode tabs", async ({ page }) => {
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible();
    await expect(page.locator('[role="tab"]')).toHaveCount(2);
  });

  test("should show XML to JSON mode by default", async ({ page }) => {
    const xmlToJsonTab = page.locator('[role="tab"]').filter({ hasText: "XML → JSON" });
    await expect(xmlToJsonTab).toHaveAttribute("aria-selected", "true");
  });

  test("should have input and output textareas", async ({ page }) => {
    await expect(page.locator("#input-text")).toBeVisible();
    await expect(page.locator("#output-text")).toBeVisible();
  });

  test("should have convert, sample, and clear buttons", async ({ page }) => {
    await expect(page.locator("#convert-btn")).toBeVisible();
    await expect(page.locator('button[aria-label="サンプルデータを読み込む"]')).toBeVisible();
    await expect(page.locator('button[aria-label="すべてクリア"]')).toBeVisible();
  });

  test("should show error for empty input", async ({ page }) => {
    await page.locator("#convert-btn").click();
    const error = page.locator(".error-message");
    await expect(error).toBeVisible();
    await expect(error).toContainText("XML");
  });

  test("should load sample XML when sample button is clicked", async ({ page }) => {
    await page.locator('button[aria-label="サンプルデータを読み込む"]').click();
    const inputValue = await page.locator("#input-text").inputValue();
    expect(inputValue).toContain("<?xml");
  });

  test("should clear when clear button is clicked", async ({ page }) => {
    await page.locator("#input-text").fill("<root><item>test</item></root>");
    await page.locator('button[aria-label="すべてクリア"]').click();
    await expect(page.locator("#input-text")).toHaveValue("");
    await expect(page.locator("#output-text")).toHaveValue("");
  });

  test("should switch to JSON to XML mode", async ({ page }) => {
    const jsonToXmlTab = page.locator('[role="tab"]').filter({ hasText: "JSON → XML" });
    await jsonToXmlTab.click();
    await expect(jsonToXmlTab).toHaveAttribute("aria-selected", "true");
  });

  test("should load sample JSON when in JSON to XML mode", async ({ page }) => {
    const jsonToXmlTab = page.locator('[role="tab"]').filter({ hasText: "JSON → XML" });
    await jsonToXmlTab.click();
    await page.locator('button[aria-label="サンプルデータを読み込む"]').click();
    const inputValue = await page.locator("#input-text").inputValue();
    expect(inputValue).toContain("{");
  });

  test("should show error for invalid JSON in JSON to XML mode", async ({ page }) => {
    const jsonToXmlTab = page.locator('[role="tab"]').filter({ hasText: "JSON → XML" });
    await jsonToXmlTab.click();
    await page.locator("#input-text").fill("not valid json");
    await page.locator("#convert-btn").click();
    const error = page.locator(".error-message");
    await expect(error).toBeVisible();
  });

  test("should convert JSON to XML successfully", async ({ page }) => {
    const jsonToXmlTab = page.locator('[role="tab"]').filter({ hasText: "JSON → XML" });
    await jsonToXmlTab.click();
    await page.locator("#input-text").fill('{"root": {"item": "value"}}');
    await page.locator("#convert-btn").click();
    const output = await page.locator("#output-text").inputValue();
    expect(output).toContain("<?xml");
    expect(output).toContain("<root>");
    expect(output).toContain("<item>value</item>");
  });

  test("should have indent selector", async ({ page }) => {
    const indentSelect = page.locator(".xml-json-indent-select");
    await expect(indentSelect).toBeVisible();
  });

  test("should display usage tips", async ({ page }) => {
    const tips = page.locator(".tips-card, .info-box");
    await expect(tips.first()).toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("should have navigation link in category dropdown", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/xml-json"]');
    await expect(link).toBeVisible();
  });
});
