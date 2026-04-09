import { test, expect } from "@playwright/test";

test.describe("JSONPath評価 - E2E Tests", () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(
    page: import("@playwright/test").Page,
    categoryName: string,
    linkHref: string,
  ) {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: categoryName });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/json-path");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/JSONPath/);
  });

  test("should have JSON input textarea", async ({ page }) => {
    const jsonTextarea = page.locator("#jsonInput");
    await expect(jsonTextarea).toBeVisible();
  });

  test("should have JSONPath query input", async ({ page }) => {
    const pathInput = page.locator("#pathQuery");
    await expect(pathInput).toBeVisible();
  });

  test("should have action buttons", async ({ page }) => {
    const sampleBtn = page.locator("button", { hasText: "サンプル読込" });
    const formatBtn = page.locator("button", { hasText: "JSON整形" });
    const clearBtn = page.locator("button", { hasText: "クリア" });
    const evalBtn = page.locator("button", { hasText: "評価" });

    await expect(sampleBtn).toBeVisible();
    await expect(formatBtn).toBeVisible();
    await expect(clearBtn).toBeVisible();
    await expect(evalBtn).toBeVisible();
  });

  test("should load sample JSON when sample button is clicked", async ({ page }) => {
    const sampleBtn = page.locator("button", { hasText: "サンプル読込" });
    await sampleBtn.click();

    const jsonTextarea = page.locator("#jsonInput");
    const jsonValue = await jsonTextarea.inputValue();
    expect(jsonValue).toContain("store");
    expect(jsonValue).toContain("book");

    const pathInput = page.locator("#pathQuery");
    const pathValue = await pathInput.inputValue();
    expect(pathValue).toBe("$.store.book[*].title");
  });

  test("should evaluate JSONPath and show results", async ({ page }) => {
    // サンプルデータを読み込む
    await page.locator("button", { hasText: "サンプル読込" }).click();

    // 評価ボタンをクリック
    await page.locator("button", { hasText: "評価" }).click();

    // 結果エリアを確認
    const resultArea = page.locator('[role="region"][aria-label="JSONPath評価結果"]');
    await expect(resultArea).toBeVisible();
    const resultText = await resultArea.textContent();
    expect(resultText).toContain("Sayings of the Century");
  });

  test("should show error when JSON is empty and evaluate is clicked", async ({ page }) => {
    const evalBtn = page.locator("button", { hasText: "評価" });
    await evalBtn.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("JSONを入力してください");
  });

  test("should clear all inputs when clear button is clicked", async ({ page }) => {
    await page.locator("button", { hasText: "サンプル読込" }).click();

    const jsonTextarea = page.locator("#jsonInput");
    const pathInput = page.locator("#pathQuery");
    await expect(jsonTextarea).not.toHaveValue("");

    await page.locator("button", { hasText: "クリア" }).click();

    await expect(jsonTextarea).toHaveValue("");
    await expect(pathInput).toHaveValue("");
  });

  test("should set path when chip button is clicked", async ({ page }) => {
    const chip = page.locator(".json-path-chip").first();
    await chip.click();

    const pathInput = page.locator("#pathQuery");
    const pathValue = await pathInput.inputValue();
    expect(pathValue.length).toBeGreaterThan(0);
  });

  test("should have copy result button", async ({ page }) => {
    const copyBtn = page.locator("button", { hasText: "結果をコピー" });
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeDisabled();
  });

  test("should enable copy button after evaluation", async ({ page }) => {
    await page.locator("button", { hasText: "サンプル読込" }).click();
    await page.locator("button", { hasText: "評価" }).click();

    const copyBtn = page.locator("button", { hasText: "結果をコピー" });
    await expect(copyBtn).toBeEnabled();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display usage instructions", async ({ page }) => {
    const allInfoBoxes = page.locator(".info-box");
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(" ");

    expect(combinedText).toContain("使い方");
    expect(combinedText).not.toContain("undefined");
  });

  test("should have navigation link to json-path in category dropdown", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const jsonPathLink = dropdown.locator('a[href="/json-path"]');
    await expect(jsonPathLink).toBeVisible();
    await expect(jsonPathLink).toContainText("JSONPath評価");
  });

  test("should navigate to json-path from other pages via category", async ({ page }) => {
    await page.goto("/");
    await navigateViaCategory(page, "変換", "/json-path");
    await expect(page).toHaveURL("/json-path");
  });

  test("should show active state on category button when on json-path page", async ({ page }) => {
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("変換");
  });
});
