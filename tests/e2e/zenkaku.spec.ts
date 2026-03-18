import { test, expect } from "@playwright/test";

test.describe("全角/半角変換", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/zenkaku");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/全角\/半角変換/);
  });

  test("デフォルトで全角→半角が選択されている", async ({ page }) => {
    const radio = page.locator('input[type="radio"][value="toHankaku"]');
    await expect(radio).toBeChecked();
  });

  test("全角英字を半角に変換できる", async ({ page }) => {
    const input = page.locator("#zenkaku-input");
    await input.fill("ＡＢＣ");
    const output = page.locator("#zenkaku-output");
    await expect(output).toHaveValue("ABC");
  });

  test("半角→全角に切り替えて変換できる", async ({ page }) => {
    const radio = page.locator('input[type="radio"][value="toZenkaku"]');
    await radio.check();
    const input = page.locator("#zenkaku-input");
    await input.fill("ABC");
    const output = page.locator("#zenkaku-output");
    await expect(output).toHaveValue("ＡＢＣ");
  });

  test("クリアボタンで入出力が消える", async ({ page }) => {
    const input = page.locator("#zenkaku-input");
    await input.fill("ＡＢＣ");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(input).toHaveValue("");
  });
});
