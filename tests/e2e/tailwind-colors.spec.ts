import { test, expect } from "@playwright/test";

test.describe("Tailwind CSS カラーリファレンス - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tailwind-colors");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Tailwind CSS カラーリファレンス/);
  });

  test("ページ本文に undefined が含まれない", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("アクセシビリティ属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("カラーグリッドが表示される", async ({ page }) => {
    const colorGrid = page.locator(".twc-color-grid");
    await expect(colorGrid).toBeVisible();
  });

  test("22個のカラーファミリーが表示される", async ({ page }) => {
    const colorRows = page.locator(".twc-color-row");
    await expect(colorRows).toHaveCount(22);
  });

  test("カラースウォッチが表示される", async ({ page }) => {
    const swatches = page.locator(".twc-swatch");
    const count = await swatches.count();
    // 22色 × 11シェード = 242スウォッチ
    expect(count).toBe(242);
  });

  test("検索バーが表示される", async ({ page }) => {
    const searchInput = page.locator(".twc-search-input");
    await expect(searchInput).toBeVisible();
  });

  test("カラー名で検索するとフィルタリングされる", async ({ page }) => {
    const searchInput = page.locator(".twc-search-input");
    await searchInput.fill("blue");

    // blueのみ表示（1行）
    const colorRows = page.locator(".twc-color-row");
    await expect(colorRows).toHaveCount(1);

    const colorName = page.locator(".twc-color-name").first();
    await expect(colorName).toHaveText("blue");
  });

  test("検索クエリをクリアすると全カラーが表示される", async ({ page }) => {
    const searchInput = page.locator(".twc-search-input");
    await searchInput.fill("blue");

    const rowsBefore = await page.locator(".twc-color-row").count();
    expect(rowsBefore).toBe(1);

    await searchInput.fill("");
    const rowsAfter = await page.locator(".twc-color-row").count();
    expect(rowsAfter).toBe(22);
  });

  test("存在しない名前で検索するとメッセージが表示される", async ({ page }) => {
    const searchInput = page.locator(".twc-search-input");
    await searchInput.fill("nonexistentcolor12345");

    const noResults = page.locator(".twc-no-results");
    await expect(noResults).toBeVisible();
  });

  test("最近似色セクションが表示される", async ({ page }) => {
    const nearestSection = page.locator(".twc-nearest-section");
    await expect(nearestSection).toBeVisible();
  });

  test("最近似色検索でHEXを入力すると結果が表示される", async ({ page }) => {
    const nearestInput = page.locator(".twc-nearest-input");
    await nearestInput.fill("#3b82f6");

    const result = page.locator(".twc-nearest-result");
    await expect(result).toBeVisible();

    // blue-500 が見つかること
    await expect(result).toContainText("blue-500");
    await expect(result).toContainText("#3b82f6");
  });

  test("最近似色の「クラス名をコピー」ボタンが表示される", async ({ page }) => {
    const nearestInput = page.locator(".twc-nearest-input");
    await nearestInput.fill("#3b82f6");

    const copyButton = page.locator(".twc-nearest-copy-btn button");
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toBeEnabled();
  });

  test("無効なHEXコードでエラーメッセージが表示される", async ({ page }) => {
    const nearestInput = page.locator(".twc-nearest-input");
    await nearestInput.fill("notahex");

    const errorMsg = page.locator(".twc-nearest-error");
    await expect(errorMsg).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tipsCard = page.locator(".info-box").first();
    await expect(tipsCard).toBeVisible();
    const tipsText = await tipsCard.textContent();
    expect(tipsText).toContain("使い方");
  });
});
