import { expect, test } from "@playwright/test";

test.describe("グロンスフェルト暗号ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gronsfeld");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /グロンスフェルト暗号/i })).toBeVisible();
  });

  test("キー入力エリアとテキスト入力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#gronsfeld-key-input")).toBeVisible();
    await expect(page.locator("#gronsfeld-input")).toBeVisible();
    await expect(page.locator("#gronsfeld-output")).toBeVisible();
  });

  test("暗号化モードでテキストを入力すると変換結果が表示される", async ({ page }) => {
    await page.getByRole("button", { name: "暗号化" }).click();
    await page.locator("#gronsfeld-key-input").fill("1234");
    await page.locator("#gronsfeld-input").fill("HELLO");
    await expect(page.locator("#gronsfeld-output")).toContainText("IGOPP");
  });

  test("復号化モードでテキストを入力すると元のテキストに戻る", async ({ page }) => {
    await page.getByRole("button", { name: "復号化" }).click();
    await page.locator("#gronsfeld-key-input").fill("1234");
    await page.locator("#gronsfeld-input").fill("IGOPP");
    await expect(page.locator("#gronsfeld-output")).toContainText("HELLO");
  });

  test("「結果を入力にセット」で往復変換が成功する", async ({ page }) => {
    await page.getByRole("button", { name: "暗号化" }).click();
    await page.locator("#gronsfeld-key-input").fill("1234");
    await page.locator("#gronsfeld-input").fill("HELLO");
    await expect(page.locator("#gronsfeld-output")).toContainText("IGOPP");
    await page.getByRole("button", { name: "結果を入力にセット" }).click();
    await expect(page.locator("#gronsfeld-input")).toHaveValue("IGOPP");
    await expect(page.locator("#gronsfeld-output")).toContainText("HELLO");
  });

  test("コピーボタンが無効→有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();
    await page.locator("#gronsfeld-key-input").fill("1234");
    await page.locator("#gronsfeld-input").fill("test");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#gronsfeld-key-input").fill("1234");
    await page.locator("#gronsfeld-input").fill("Hello");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#gronsfeld-input")).toHaveValue("");
  });

  test("キーが空の場合は変換されない", async ({ page }) => {
    await page.locator("#gronsfeld-key-input").fill("");
    await page.locator("#gronsfeld-input").fill("HELLO");
    await expect(page.locator("#gronsfeld-output")).toContainText(
      "有効な数字キーを入力してください",
    );
  });

  test("英字のみのキーは無効と判定される", async ({ page }) => {
    await page.locator("#gronsfeld-key-input").fill("ABC");
    await page.locator("#gronsfeld-input").fill("HELLO");
    await expect(page.locator("#gronsfeld-output")).toContainText(
      "有効な数字キーを入力してください",
    );
  });
});
