import { expect, test } from "@playwright/test";

test.describe("タップコードページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tap-code");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /タップコード/i })).toBeVisible();
  });

  test("モード切替ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "デコード" })).toBeVisible();
  });

  test("出力形式セレクトが表示される", async ({ page }) => {
    await expect(page.locator("#tap-code-format")).toBeVisible();
  });

  test("グリッドテーブルが表示される", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("入力エリアと変換結果エリアが表示される", async ({ page }) => {
    await expect(page.locator("#tap-code-input")).toBeVisible();
    await expect(page.locator("#tap-code-output")).toBeVisible();
  });

  test("エンコードモードで A をドット記法に変換できる", async ({ page }) => {
    await page.locator("#tap-code-input").fill("A");
    await expect(page.locator("#tap-code-output")).toContainText(". .");
  });

  test("エンコードモードで数字記法に変換できる", async ({ page }) => {
    await page.locator("#tap-code-format").selectOption("numbers");
    await page.locator("#tap-code-input").fill("A");
    await expect(page.locator("#tap-code-output")).toContainText("1 1");
  });

  test("エンコードモードでコンパクト記法に変換できる", async ({ page }) => {
    await page.locator("#tap-code-format").selectOption("numbers-compact");
    await page.locator("#tap-code-input").fill("A");
    await expect(page.locator("#tap-code-output")).toContainText("11");
  });

  test("デコードモードでドット記法をデコードできる", async ({ page }) => {
    await page.getByRole("button", { name: "デコード" }).click();
    await page.locator("#tap-code-input").fill(". .");
    await expect(page.locator("#tap-code-output")).toContainText("A");
  });

  test("コピーボタンが無効→有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();
    await page.locator("#tap-code-input").fill("A");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#tap-code-input").fill("HELLO");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#tap-code-input")).toHaveValue("");
  });

  test("グリッドに C/K セルが表示される", async ({ page }) => {
    await expect(page.getByText("C/K")).toBeVisible();
  });
});
