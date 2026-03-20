import { expect, test } from "@playwright/test";

test.describe("アフィン暗号ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/affine");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /アフィン暗号/i })).toBeVisible();
  });

  test("モード切替ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "デコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ブルートフォース解析" })).toBeVisible();
  });

  test("入力エリアと変換結果エリアが表示される", async ({ page }) => {
    await expect(page.locator("#affine-input")).toBeVisible();
    await expect(page.locator("#affine-output")).toBeVisible();
  });

  test("パラメータ選択 a と入力 b が表示される", async ({ page }) => {
    await expect(page.locator("#affine-param-a")).toBeVisible();
    await expect(page.locator("#affine-param-b")).toBeVisible();
  });

  test("エンコードモードでテキストを変換できる", async ({ page }) => {
    // a=5, b=8 (デフォルト) で 'A' -> 'I'
    await page.locator("#affine-input").fill("A");
    await expect(page.locator("#affine-output")).toContainText("I");
  });

  test("デコードモードでエンコードを逆変換できる", async ({ page }) => {
    await page.locator("#affine-input").fill("I");
    await page.getByRole("button", { name: "デコード" }).click();
    await expect(page.locator("#affine-output")).toContainText("A");
  });

  test("ブルートフォース解析モードで解析結果テーブルが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ブルートフォース解析" }).click();
    await page.locator("#affine-input").fill("Hello");
    await expect(page.locator(".affine-brute-table")).toBeVisible();
  });

  test("コピーボタンが無効→有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();
    await page.locator("#affine-input").fill("test");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#affine-input").fill("Hello");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#affine-input")).toHaveValue("");
  });
});
