import { test, expect } from "@playwright/test";

test.describe("スネークゲーム (/snake)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/snake");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/スネークゲーム/);
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("スネークゲーム");
  });

  test("ゲームスタートボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "ゲームスタート" })).toBeVisible();
  });

  test("スコアが表示される", async ({ page }) => {
    await expect(page.locator('[aria-label*="スコア"]').first()).toBeVisible();
  });

  test("ベストスコアが表示される", async ({ page }) => {
    await expect(page.locator('[aria-label*="ベストスコア"]')).toBeVisible();
  });

  test("キャンバスが表示される", async ({ page }) => {
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("操作説明が表示される", async ({ page }) => {
    await expect(page.locator(".snake-instructions")).toBeVisible();
  });

  test("ゲーム開始後に新しいゲームボタンが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(page.getByRole("button", { name: "新しいゲーム" })).toBeVisible();
  });

  test("ゲーム開始後に一時停止ボタンが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(page.getByRole("button", { name: "一時停止" })).toBeVisible();
  });

  test("一時停止ボタンをクリックすると再開ボタンになる", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await page.getByRole("button", { name: "一時停止" }).click();
    await expect(page.getByRole("button", { name: "再開" })).toBeVisible();
  });

  test("再開ボタンをクリックすると一時停止ボタンに戻る", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await page.getByRole("button", { name: "一時停止" }).click();
    await page.getByRole("button", { name: "再開" }).click();
    await expect(page.getByRole("button", { name: "一時停止" })).toBeVisible();
  });

  test("ゲームボードのaria-labelが設定されている", async ({ page }) => {
    await expect(page.getByRole("application", { name: "スネークゲームボード" })).toBeVisible();
  });

  test("ナビゲーションのゲームカテゴリにスネークが含まれる", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "ツールナビゲーション" });
    const gameCategory = nav.getByRole("button", { name: /ゲーム/ });
    await gameCategory.hover();
    await expect(page.getByRole("menuitem", { name: "スネークゲーム" })).toBeVisible();
  });
});
