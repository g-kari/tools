import { test, expect } from "@playwright/test";

test.describe("Random Data Generator - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/random-data");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/ランダムデータ生成/);
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display field selection section with checkboxes", async ({ page }) => {
    const fieldGrid = page.locator(".random-data-field-grid");
    await expect(fieldGrid).toBeVisible();

    const checkboxes = fieldGrid.locator('input[type="checkbox"]');
    // 14フィールドが存在すること
    await expect(checkboxes).toHaveCount(14);
  });

  test("should have default fields pre-selected", async ({ page }) => {
    const fieldGrid = page.locator(".random-data-field-grid");
    const checkedBoxes = fieldGrid.locator('input[type="checkbox"]:checked');
    // デフォルト選択: japaneseName, email, japanesePhone, japaneseAddress
    await expect(checkedBoxes).toHaveCount(4);
  });

  test("should generate data with default settings", async ({ page }) => {
    const generateBtn = page.locator(".random-data-generate-btn");
    await generateBtn.click();

    const outputArea = page.locator(".random-data-output-area");
    await expect(outputArea).toBeVisible();
    const outputText = await outputArea.inputValue();
    expect(outputText.length).toBeGreaterThan(0);
    // JSON形式のデフォルトなのでJSONらしい内容を確認
    expect(outputText).toContain("[");
  });

  test("should show preview table after generating in JSON format", async ({ page }) => {
    const generateBtn = page.locator(".random-data-generate-btn");
    await generateBtn.click();

    const previewWrapper = page.locator(".random-data-preview-wrapper");
    await expect(previewWrapper).toBeVisible();
    const table = page.locator(".random-data-preview-table");
    await expect(table).toBeVisible();
  });

  test("should display all-select and clear buttons", async ({ page }) => {
    const selectAllBtn = page.locator('button:has-text("すべて選択")');
    await expect(selectAllBtn).toBeVisible();

    const clearBtn = page.locator('button:has-text("クリア")').first();
    await expect(clearBtn).toBeVisible();
  });

  test("should select all fields when clicking すべて選択", async ({ page }) => {
    const selectAllBtn = page.locator('button:has-text("すべて選択")');
    await selectAllBtn.click();

    const checkedBoxes = page.locator('.random-data-field-grid input[type="checkbox"]:checked');
    await expect(checkedBoxes).toHaveCount(14);
  });

  test("should clear all fields when clicking クリア", async ({ page }) => {
    const clearBtn = page.locator('button:has-text("クリア")').first();
    await clearBtn.click();

    const checkedBoxes = page.locator('.random-data-field-grid input[type="checkbox"]:checked');
    await expect(checkedBoxes).toHaveCount(0);
  });

  test("should show number range settings when number field is selected", async ({ page }) => {
    // まずclearして、numberだけ選択
    await page.locator('button:has-text("クリア")').first().click();
    const numberLabel = page.locator(".random-data-field-grid label", { hasText: "数値" });
    await numberLabel.click();

    const rangeSettings = page.locator("input#number-min");
    await expect(rangeSettings).toBeVisible();
  });

  test("should show date range settings when date field is selected", async ({ page }) => {
    await page.locator('button:has-text("クリア")').first().click();
    const dateLabel = page.locator(".random-data-field-grid label", { hasText: "日付" });
    await dateLabel.click();

    const dateStartYear = page.locator("input#date-start-year");
    await expect(dateStartYear).toBeVisible();
  });

  test("should show copy and download buttons after generation", async ({ page }) => {
    const generateBtn = page.locator(".random-data-generate-btn");
    await generateBtn.click();

    const copyBtn = page.locator('button:has-text("コピー")');
    await expect(copyBtn).toBeVisible();

    const downloadBtn = page.locator(".random-data-download-btn");
    await expect(downloadBtn).toBeVisible();
  });

  test("should generate CSV format output", async ({ page }) => {
    const formatSelect = page.locator(".random-data-format-select");
    await formatSelect.selectOption("csv");

    const generateBtn = page.locator(".random-data-generate-btn");
    await generateBtn.click();

    const outputArea = page.locator(".random-data-output-area");
    const outputText = await outputArea.inputValue();
    // CSV形式はコンマ区切り
    expect(outputText).toContain(",");
    // ヘッダー行が存在する
    const lines = outputText.split("\n");
    expect(lines.length).toBeGreaterThan(1);
  });

  test("should generate TSV format output", async ({ page }) => {
    const formatSelect = page.locator(".random-data-format-select");
    await formatSelect.selectOption("tsv");

    // 2フィールド以上選択されていることを確認（デフォルトは4つ）
    const generateBtn = page.locator(".random-data-generate-btn");
    await generateBtn.click();

    const outputArea = page.locator(".random-data-output-area");
    const outputText = await outputArea.inputValue();
    // TSV形式はタブ区切り
    expect(outputText).toContain("\t");
  });

  test("should not show preview table for CSV format", async ({ page }) => {
    const formatSelect = page.locator(".random-data-format-select");
    await formatSelect.selectOption("csv");

    await page.locator(".random-data-generate-btn").click();

    const previewWrapper = page.locator(".random-data-preview-wrapper");
    await expect(previewWrapper).not.toBeVisible();
  });

  test("should show error toast when no fields are selected", async ({ page }) => {
    await page.locator('button:has-text("クリア")').first().click();

    await page.locator(".random-data-generate-btn").click();

    // トーストが表示される
    const toast = page.locator('.toast, [role="alert"]');
    await expect(toast).toBeVisible({ timeout: 3000 });
  });

  test("should display usage tips section", async ({ page }) => {
    const infoBox = page.locator(".info-box").first();
    await expect(infoBox).toBeVisible();
    const text = await infoBox.textContent();
    expect(text).toContain("使い方");
  });

  test("should have active navigation category 生成", async ({ page }) => {
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("生成");
  });

  test("should show ランダムデータ生成 link in 生成 category dropdown", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "生成" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/random-data"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("ランダムデータ生成");
  });

  test("should generate correct number of records", async ({ page }) => {
    const countInput = page.locator("input#random-data-count");
    await countInput.fill("5");

    await page.locator(".random-data-generate-btn").click();

    const outputArea = page.locator(".random-data-output-area");
    const outputText = await outputArea.inputValue();
    const parsed = JSON.parse(outputText);
    expect(parsed).toHaveLength(5);
  });
});
