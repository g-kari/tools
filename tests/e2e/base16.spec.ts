import { test, expect } from "@playwright/test";

test.describe("Base16 (Hex) エンコード・デコード", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/base16");
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Base16/);
    await expect(page.getByRole("tab", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "デコード" })).toBeVisible();
  });

  test("入力テキストエリアが表示される", async ({ page }) => {
    await expect(page.getByLabel("エンコード入力テキスト")).toBeVisible();
  });

  test("テキストをエンコードできる", async ({ page }) => {
    await page.getByLabel("エンコード入力テキスト").fill("foo");
    const output = page.getByLabel("Base16エンコード出力");
    await expect(output).toBeVisible();
    const value = await output.inputValue();
    expect(value).toBe("666F6F");
  });

  test("デコードモードに切り替えられる", async ({ page }) => {
    await page.getByRole("tab", { name: "デコード" }).click();
    await expect(page.getByLabel("デコード入力Hex文字列")).toBeVisible();
  });

  test("Hex文字列をデコードできる", async ({ page }) => {
    await page.getByRole("tab", { name: "デコード" }).click();
    await page.getByLabel("デコード入力Hex文字列").fill("666F6F");
    const output = page.getByLabel("デコード結果");
    await expect(output).toBeVisible();
    const value = await output.inputValue();
    expect(value).toBe("foo");
  });

  test("無効なHex文字列にエラーが表示される", async ({ page }) => {
    await page.getByRole("tab", { name: "デコード" }).click();
    await page.getByLabel("デコード入力Hex文字列").fill("GGGG");
    await expect(page.getByRole("alert", { name: "デコードエラー" })).toBeVisible();
  });

  test("クリアボタンが動作する", async ({ page }) => {
    await page.getByLabel("エンコード入力テキスト").fill("test");
    await page.getByRole("button", { name: "入力をクリア" }).click();
    await expect(page.getByLabel("エンコード入力テキスト")).toHaveValue("");
  });

  test("大文字・小文字を切り替えられる", async ({ page }) => {
    await page.getByLabel("エンコード入力テキスト").fill("foo");

    // 大文字（デフォルト）の結果確認
    const outputUpper = await page.getByLabel("Base16エンコード出力").inputValue();
    expect(outputUpper).toBe("666F6F");

    // 小文字に切り替え
    await page.getByRole("radio", { name: "小文字（a–f）" }).click();
    const outputLower = await page.getByLabel("Base16エンコード出力").inputValue();
    expect(outputLower).toBe("666f6f");
  });

  test("スペース区切りオプションが動作する", async ({ page }) => {
    await page.getByLabel("エンコード入力テキスト").fill("foo");
    await page.getByRole("radio", { name: "スペース" }).click();
    const output = await page.getByLabel("Base16エンコード出力").inputValue();
    expect(output).toBe("66 6F 6F");
  });

  test("コロン区切りオプションが動作する", async ({ page }) => {
    await page.getByLabel("エンコード入力テキスト").fill("foo");
    await page.getByRole("radio", { name: "コロン（:）" }).click();
    const output = await page.getByLabel("Base16エンコード出力").inputValue();
    expect(output).toBe("66:6F:6F");
  });
});
