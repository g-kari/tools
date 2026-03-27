import { expect, test } from "@playwright/test";

test.describe("ADFGVX暗号ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/adfgvx");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /ADFGVX暗号/i })).toBeVisible();
  });

  test("キー入力エリアとテキスト入力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#adfgvx-polybius-key")).toBeVisible();
    await expect(page.locator("#adfgvx-transposition-key")).toBeVisible();
    await expect(page.locator("#adfgvx-input")).toBeVisible();
    await expect(page.locator("#adfgvx-output")).toBeVisible();
  });

  test("ポリビウス方陣が表示される", async ({ page }) => {
    const grid = page.getByRole("grid", { name: "ポリビウス方陣" });
    await expect(grid).toBeVisible();
  });

  test("暗号化モードでテキストを入力するとADFGVX文字が出力される", async ({ page }) => {
    await page.getByRole("button", { name: "暗号化" }).click();
    await page.locator("#adfgvx-polybius-key").fill("KEY");
    await page.locator("#adfgvx-transposition-key").fill("SECRET");
    await page.locator("#adfgvx-input").fill("HELLO");
    const output = page.locator("#adfgvx-output");
    await expect(output).not.toContainText("変換結果がここに表示されます");
    const text = await output.textContent();
    expect(text).toMatch(/^[ADFGVX]+$/);
  });

  test("「結果を入力にセット」で往復変換が成功する", async ({ page }) => {
    await page.getByRole("button", { name: "暗号化" }).click();
    await page.locator("#adfgvx-polybius-key").fill("KEY");
    await page.locator("#adfgvx-transposition-key").fill("SECRET");
    await page.locator("#adfgvx-input").fill("HELLO");
    const encrypted = await page.locator("#adfgvx-output").textContent();
    await page.getByRole("button", { name: "結果を入力にセット" }).click();
    await expect(page.locator("#adfgvx-input")).toHaveValue(encrypted!);
    await expect(page.locator("#adfgvx-output")).toContainText("HELLO");
  });

  test("コピーボタンが無効→有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();
    await page.locator("#adfgvx-polybius-key").fill("KEY");
    await page.locator("#adfgvx-transposition-key").fill("SECRET");
    await page.locator("#adfgvx-input").fill("HELLO");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#adfgvx-input").fill("HELLO");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#adfgvx-input")).toHaveValue("");
  });

  test("転置キーが空の場合は変換されない", async ({ page }) => {
    await page.locator("#adfgvx-transposition-key").fill("");
    await page.locator("#adfgvx-input").fill("HELLO");
    await expect(page.locator("#adfgvx-output")).toContainText("有効な転置キーを入力してください");
  });
});
