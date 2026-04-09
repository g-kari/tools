import { test, expect } from "@playwright/test";

test.describe("タイピング速度測定ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/typing-speed");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/タイピング速度測定/);
    await expect(page.getByRole("heading", { name: "設定" })).toBeVisible();
  });

  test("テスト時間の選択ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "15秒" })).toBeVisible();
    await expect(page.getByRole("button", { name: "30秒" })).toBeVisible();
    await expect(page.getByRole("button", { name: "60秒" })).toBeVisible();
    await expect(page.getByRole("button", { name: "120秒" })).toBeVisible();
  });

  test("テキスト種類の選択ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "English" })).toBeVisible();
    await expect(page.getByRole("button", { name: "日本語" })).toBeVisible();
    await expect(page.getByRole("button", { name: "コード" })).toBeVisible();
  });

  test("テスト開始ボタンが表示される（idle状態）", async ({ page }) => {
    await expect(page.getByRole("button", { name: "テスト開始" })).toBeVisible();
  });

  test("テスト開始でキャンセルボタンが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "テスト開始" }).click();
    await expect(page.getByRole("button", { name: /キャンセル/ })).toBeVisible();
  });

  test("テスト開始後にタイマーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "テスト開始" }).click();
    // タイマーが表示されること
    const timerDisplay = page.locator(".typing-timer-value");
    await expect(timerDisplay).toBeVisible();
  });

  test("テスト時間を15秒に変更できる", async ({ page }) => {
    await page.getByRole("button", { name: "15秒" }).click();
    const timerDisplay = page.locator(".typing-timer-value");
    await expect(timerDisplay).toHaveText("15");
  });

  test("テキスト種類を変更できる", async ({ page }) => {
    const japaneseBtn = page.getByRole("button", { name: "日本語" });
    await japaneseBtn.click();
    await expect(japaneseBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("キャンセルでidle状態に戻る", async ({ page }) => {
    await page.getByRole("button", { name: "テスト開始" }).click();
    await page.getByRole("button", { name: /キャンセル/ }).click();
    await expect(page.getByRole("button", { name: "テスト開始" })).toBeVisible();
  });
});
