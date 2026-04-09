import { test, expect } from "@playwright/test";

test.describe("テトリス (/tetris)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tetris");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/テトリス/);
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("テトリス");
  });

  test("ゲームスタートボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "ゲームスタート" }).first()).toBeVisible();
  });

  test("スコアが表示される", async ({ page }) => {
    await expect(page.locator('[aria-label*="スコア"]').first()).toBeVisible();
  });

  test("ベストスコアが表示される", async ({ page }) => {
    await expect(page.locator('[aria-label*="ベストスコア"]')).toBeVisible();
  });

  test("レベルが表示される", async ({ page }) => {
    await expect(page.locator('[aria-label*="レベル"]')).toBeVisible();
  });

  test("ラインカウントが表示される", async ({ page }) => {
    await expect(page.locator('[aria-label*="ライン"]')).toBeVisible();
  });

  test("メインキャンバスが表示される", async ({ page }) => {
    await expect(page.getByRole("application", { name: "テトリスゲームボード" })).toBeVisible();
  });

  test("ネクストピースキャンバスが表示される", async ({ page }) => {
    await expect(page.locator('[aria-label="ネクストピース"]')).toBeVisible();
  });

  test("操作説明が表示される", async ({ page }) => {
    await expect(page.locator(".tetris-instructions")).toBeVisible();
  });

  test("ゲーム開始後に一時停止ボタンが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).first().click();
    await expect(page.getByRole("button", { name: "一時停止" })).toBeVisible();
  });

  test("ゲーム開始後に新しいゲームボタンが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).first().click();
    await expect(page.getByRole("button", { name: "新しいゲーム" })).toBeVisible();
  });

  test("一時停止ボタンをクリックすると再開ボタンになる", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).first().click();
    await page.getByRole("button", { name: "一時停止" }).click();
    await expect(page.getByRole("button", { name: "再開" }).first()).toBeVisible();
  });

  test("再開ボタンをクリックすると一時停止ボタンに戻る", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).first().click();
    await page.getByRole("button", { name: "一時停止" }).click();
    await page.getByRole("button", { name: "再開" }).first().click();
    await expect(page.getByRole("button", { name: "一時停止" })).toBeVisible();
  });

  test("ゲームボードのaria-labelが設定されている", async ({ page }) => {
    await expect(page.getByRole("application", { name: "テトリスゲームボード" })).toBeVisible();
  });

  test("ナビゲーションのゲームカテゴリにテトリスが含まれる", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "ツールナビゲーション" });
    const gameCategory = nav.getByRole("button", { name: /ゲーム/ });
    await gameCategory.hover();
    await expect(page.getByRole("menuitem", { name: "テトリス" })).toBeVisible();
  });
});
