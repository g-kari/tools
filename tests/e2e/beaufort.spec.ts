import { expect, test } from "@playwright/test";

test.describe("ボーフォート暗号ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/beaufort");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /ボーフォート暗号/i })).toBeVisible();
  });

  test("キー入力エリアとテキスト入力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#beaufort-key-input")).toBeVisible();
    await expect(page.locator("#beaufort-input")).toBeVisible();
    await expect(page.locator("#beaufort-output")).toBeVisible();
  });

  test("テキストを入力すると変換結果が表示される", async ({ page }) => {
    await page.locator("#beaufort-key-input").fill("KEY");
    await page.locator("#beaufort-input").fill("HELLO");
    await expect(page.locator("#beaufort-output")).toContainText("DANZQ");
  });

  test("自己逆関数：変換結果を再変換すると元に戻る", async ({ page }) => {
    await page.locator("#beaufort-key-input").fill("KEY");
    await page.locator("#beaufort-input").fill("HELLO");
    await expect(page.locator("#beaufort-output")).toContainText("DANZQ");
    await page.getByRole("button", { name: "結果を入力にセット" }).click();
    await expect(page.locator("#beaufort-input")).toHaveValue("DANZQ");
    await expect(page.locator("#beaufort-output")).toContainText("HELLO");
  });

  test("コピーボタンが無効→有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();
    await page.locator("#beaufort-key-input").fill("KEY");
    await page.locator("#beaufort-input").fill("test");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#beaufort-key-input").fill("KEY");
    await page.locator("#beaufort-input").fill("Hello");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#beaufort-input")).toHaveValue("");
  });

  test("キーが空の場合は変換されない", async ({ page }) => {
    await page.locator("#beaufort-key-input").fill("");
    await page.locator("#beaufort-input").fill("HELLO");
    await expect(page.locator("#beaufort-output")).toContainText(
      "有効なキーワードを入力してください",
    );
  });
});
