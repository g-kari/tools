import { test, expect } from "@playwright/test";

test.describe("SVG最適化 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/svg-optimizer");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/SVG最適化/);
  });

  test("SVG入力エリアが存在する", async ({ page }) => {
    const inputTextarea = page.locator("#svgInput");
    await expect(inputTextarea).toBeVisible();
  });

  test("最適化結果出力エリアが存在する", async ({ page }) => {
    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toBeVisible();
  });

  test("サンプル読込ボタンが機能する", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "サンプル読込" });
    await sampleButton.click();

    const inputTextarea = page.locator("#svgInput");
    const value = await inputTextarea.inputValue();
    expect(value.trim()).not.toBe("");
    expect(value).toContain("<svg");
  });

  test("最適化ボタンが機能する", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "サンプル読込" });
    await sampleButton.click();

    const optimizeButton = page.locator("button", { hasText: "最適化" });
    await optimizeButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("<svg");
  });

  test("クリアボタンが機能する", async ({ page }) => {
    const inputTextarea = page.locator("#svgInput");
    await inputTextarea.fill('<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>');

    const clearButton = page.locator("button", { hasText: "クリア" });
    await clearButton.click();

    await expect(inputTextarea).toHaveValue("");
  });

  test("コピーボタンが出力前は無効", async ({ page }) => {
    const copyButton = page.locator("button", { hasText: "コピー" });
    await expect(copyButton).toBeDisabled();
  });

  test("ダウンロードボタンが出力前は無効", async ({ page }) => {
    const downloadButton = page.locator("button", { hasText: "ダウンロード" });
    await expect(downloadButton).toBeDisabled();
  });

  test("最適化オプションが存在する", async ({ page }) => {
    const metadataCheckbox = page.locator("label", {
      hasText: "メタデータ削除",
    });
    await expect(metadataCheckbox).toBeVisible();

    const prettifyCheckbox = page.locator("label", {
      hasText: "整形",
    });
    await expect(prettifyCheckbox).toBeVisible();

    const precisionInput = page.locator("#so-precision");
    await expect(precisionInput).toBeVisible();
  });

  test("最適化統計が表示される", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "サンプル読込" });
    await sampleButton.click();

    const optimizeButton = page.locator("button", { hasText: "最適化" });
    await optimizeButton.click();

    const stats = page.locator('[role="status"][aria-label="最適化統計"]');
    await expect(stats).toBeVisible();
    await expect(stats).toContainText("元サイズ");
    await expect(stats).toContainText("削減率");
  });
});
