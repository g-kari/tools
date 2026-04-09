import { expect, test } from "@playwright/test";

test.describe("NATOフォネティックアルファベットページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/nato-alphabet");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /NATO/ })).toBeVisible();
  });

  test("入力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#nato-input")).toBeVisible();
  });

  test("テキスト入力でカード形式の変換結果が表示される", async ({ page }) => {
    await page.locator("#nato-input").fill("A");
    await expect(page.locator(".nato-result-grid")).toContainText("Alpha");
  });

  test("HELLO を変換できる", async ({ page }) => {
    await page.locator("#nato-input").fill("HELLO");
    const grid = page.locator(".nato-result-grid");
    await expect(grid).toContainText("Hotel");
    await expect(grid).toContainText("Echo");
    await expect(grid).toContainText("Lima");
    await expect(grid).toContainText("Oscar");
  });

  test("小文字入力も正しく変換される", async ({ page }) => {
    await page.locator("#nato-input").fill("abc");
    const grid = page.locator(".nato-result-grid");
    await expect(grid).toContainText("Alpha");
    await expect(grid).toContainText("Bravo");
    await expect(grid).toContainText("Charlie");
  });

  test("数字を変換できる", async ({ page }) => {
    await page.locator("#nato-input").fill("0");
    await expect(page.locator(".nato-result-grid")).toContainText("Zero");
  });

  test("テキスト形式の出力が表示される", async ({ page }) => {
    await page.locator("#nato-input").fill("AB");
    await expect(page.locator("#nato-text-output")).toBeVisible();
    await expect(page.locator("#nato-text-output")).toHaveValue("Alpha - Bravo");
  });

  test("コピーボタンが出力がある場合に有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: /コピー/ });
    await expect(copyBtn).toBeDisabled();

    await page.locator("#nato-input").fill("SOS");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がクリアされる", async ({ page }) => {
    await page.locator("#nato-input").fill("HELLO");
    await page.getByRole("button", { name: /クリア/ }).click();
    await expect(page.locator("#nato-input")).toHaveValue("");
  });

  test("リファレンステーブルが表示される", async ({ page }) => {
    await expect(page.locator(".nato-reference-grid")).toBeVisible();
    await expect(page.locator(".nato-reference-grid")).toContainText("Alpha");
    await expect(page.locator(".nato-reference-grid")).toContainText("Zulu");
  });

  test("空入力時はプレースホルダーメッセージが表示される", async ({ page }) => {
    await expect(page.locator(".nato-result-empty")).toBeVisible();
  });
});
