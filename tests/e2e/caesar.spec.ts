import { expect, test } from "@playwright/test";

test.describe("シーザー暗号・ROT13ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/caesar");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /シーザー暗号|ROT13/i })).toBeVisible();
  });

  test("モード切替ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "デコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ブルートフォース解析" })).toBeVisible();
  });

  test("入力エリアと変換結果エリアが表示される", async ({ page }) => {
    await expect(page.locator("#caesar-input")).toBeVisible();
    await expect(page.locator("#caesar-output")).toBeVisible();
  });

  test("ROT13ボタンでシフト量が13に設定される", async ({ page }) => {
    await page.getByRole("button", { name: "ROT13" }).click();
    const slider = page.locator(".caesar-shift-slider");
    await expect(slider).toHaveValue("13");
  });

  test("エンコードモードでテキストを変換できる", async ({ page }) => {
    await page.locator("#caesar-input").fill("Hello");
    await expect(page.locator("#caesar-output")).toContainText("Uryyb");
  });

  test("シフト量を変えると変換結果が変わる", async ({ page }) => {
    await page.locator("#caesar-input").fill("ABC");
    const numberInput = page.locator(".caesar-shift-number");
    await numberInput.fill("3");
    await numberInput.blur();
    await expect(page.locator("#caesar-output")).toContainText("DEF");
  });

  test("デコードモードで元のテキストに戻せる", async ({ page }) => {
    await page.locator("#caesar-input").fill("Uryyb");
    await page.getByRole("button", { name: "デコード" }).click();
    await expect(page.locator("#caesar-output")).toContainText("Hello");
  });

  test("ブルートフォース解析モードで26パターン表示される", async ({ page }) => {
    await page.locator("#caesar-input").fill("Hello");
    await page.getByRole("button", { name: "ブルートフォース解析" }).click();
    const rows = page.locator(".caesar-brute-table tbody tr");
    await expect(rows).toHaveCount(26);
  });

  test("コピーボタンが出力がある場合に有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: /コピー/ });
    await expect(copyBtn).toBeDisabled();

    await page.locator("#caesar-input").fill("Hello");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がクリアされる", async ({ page }) => {
    await page.locator("#caesar-input").fill("Hello");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#caesar-input")).toHaveValue("");
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("シーザー暗号について")).toBeVisible();
  });

  test("空入力では変換結果が空の状態メッセージを表示する", async ({ page }) => {
    await expect(page.locator("#caesar-output")).toContainText("変換結果がここに表示されます");
  });
});
