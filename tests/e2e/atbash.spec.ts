import { expect, test } from "@playwright/test";

test.describe("アトバシュ暗号ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/atbash");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /アトバシュ暗号/i })).toBeVisible();
  });

  test("入力エリアと変換結果エリアが表示される", async ({ page }) => {
    await expect(page.locator("#atbash-input")).toBeVisible();
    await expect(page.locator("#atbash-output")).toBeVisible();
  });

  test("テキストを入力すると変換結果が表示される", async ({ page }) => {
    await page.locator("#atbash-input").fill("HELLO");
    await expect(page.locator("#atbash-output")).toContainText("SVOOL");
  });

  test("小文字も正しく変換される", async ({ page }) => {
    await page.locator("#atbash-input").fill("hello");
    await expect(page.locator("#atbash-output")).toContainText("svool");
  });

  test("自己逆関数：変換結果を再変換すると元に戻る", async ({ page }) => {
    await page.locator("#atbash-input").fill("Hello");
    // Wait for output to appear
    await expect(page.locator("#atbash-output")).toContainText("Svool");
    // Click swap button
    await page.getByRole("button", { name: "結果を入力にセット" }).click();
    await expect(page.locator("#atbash-input")).toHaveValue("Svool");
    await expect(page.locator("#atbash-output")).toContainText("Hello");
  });

  test("コピーボタンが無効→有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();
    await page.locator("#atbash-input").fill("test");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#atbash-input").fill("Hello");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#atbash-input")).toHaveValue("");
  });

  test("アルファベット対応表が表示される", async ({ page }) => {
    await expect(page.locator(".atbash-mapping-grid")).toBeVisible();
  });
});
