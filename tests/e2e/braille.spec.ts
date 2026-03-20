import { expect, test } from "@playwright/test";

test.describe("点字（Braille）変換ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/braille");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /テキスト入力/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /点字/ })).toBeVisible();
  });

  test("入力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#braille-input")).toBeVisible();
  });

  test("出力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#braille-output")).toBeVisible();
  });

  test("テキストを入力すると点字に変換される", async ({ page }) => {
    await page.locator("#braille-input").fill("a");
    const output = await page.locator("#braille-output").textContent();
    expect(output).toContain("\u2801"); // ⠁
  });

  test("大文字入力で大文字インジケーターが付加される", async ({ page }) => {
    await page.locator("#braille-input").fill("A");
    const output = await page.locator("#braille-output").textContent();
    expect(output).toContain("\u2820"); // ⠠ 大文字インジケーター
  });

  test("数字入力で数字インジケーターが付加される", async ({ page }) => {
    await page.locator("#braille-input").fill("1");
    const output = await page.locator("#braille-output").textContent();
    expect(output).toContain("\u283C"); // ⠼ 数字インジケーター
  });

  test("空入力では変換結果なしが表示される", async ({ page }) => {
    const output = await page.locator("#braille-output").textContent();
    expect(output).toContain("変換結果がここに表示されます");
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /コピー/ })).toBeVisible();
  });

  test("クリアボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /クリア/ })).toBeVisible();
  });

  test("入力が空の場合コピー・クリアボタンが無効", async ({ page }) => {
    await expect(page.getByRole("button", { name: /コピー/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: /クリア/ })).toBeDisabled();
  });

  test("入力後にクリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#braille-input").fill("hello");
    await page.getByRole("button", { name: /クリア/ }).click();
    await expect(page.locator("#braille-input")).toHaveValue("");
    const output = await page.locator("#braille-output").textContent();
    expect(output).toContain("変換結果がここに表示されます");
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("対応文字")).toBeVisible();
    await expect(page.getByText(/Grade 1/)).toBeVisible();
  });
});
