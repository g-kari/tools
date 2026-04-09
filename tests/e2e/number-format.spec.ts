import { expect, test } from "@playwright/test";

test.describe("数値フォーマットページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/number-format");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /数値フォーマット/ })).toBeVisible();
  });

  test("数値入力欄が表示される", async ({ page }) => {
    await expect(page.getByPlaceholder("例: 1234567.89")).toBeVisible();
  });

  test("デフォルト値が設定されている", async ({ page }) => {
    const input = page.getByPlaceholder("例: 1234567.89");
    await expect(input).toHaveValue("1234567.89");
  });

  test("ロケール比較表が表示される", async ({ page }) => {
    await expect(page.getByRole("table", { name: /ロケール別フォーマット比較/ })).toBeVisible();
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /コピー/ })).toBeVisible();
  });

  test("クリアボタンで入力がクリアされる", async ({ page }) => {
    const input = page.getByPlaceholder("例: 1234567.89");
    await input.fill("9999");
    await page.getByRole("button", { name: /クリア/ }).click();
    await expect(input).toHaveValue("");
  });

  test("数値入力でフォーマット結果が更新される", async ({ page }) => {
    const input = page.getByPlaceholder("例: 1234567.89");
    await input.fill("1000");
    // フォーマット結果が表示されることを確認
    await expect(page.locator(".number-format-result-value")).toBeVisible();
  });

  test("無効な入力でエラーが表示される", async ({ page }) => {
    const input = page.getByPlaceholder("例: 1234567.89");
    await input.fill("abc");
    await expect(page.locator(".number-format-result-error")).toBeVisible();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("フォーマット種別")).toBeVisible();
  });
});
