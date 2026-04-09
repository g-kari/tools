import { expect, test } from "@playwright/test";

test.describe("Morse Code変換ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/morse-code");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Morse Code/ })).toBeVisible();
  });

  test("モード切替ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /テキスト → Morse Code/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Morse Code → テキスト/ })).toBeVisible();
  });

  test("入力エリアと出力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#morse-code-input")).toBeVisible();
    await expect(page.locator("#morse-code-output")).toBeVisible();
  });

  test("テキスト→Morse Codeモードでテキストを変換できる", async ({ page }) => {
    await page.locator("#morse-code-input").fill("SOS");
    await expect(page.locator("#morse-code-output")).toHaveValue("... --- ...");
  });

  test("HELLO WORLDをMorse Codeに変換できる", async ({ page }) => {
    await page.locator("#morse-code-input").fill("HELLO WORLD");
    await expect(page.locator("#morse-code-output")).toHaveValue(
      ".... . .-.. .-.. --- / .-- --- .-. .-.. -..",
    );
  });

  test("小文字入力も正しく変換される", async ({ page }) => {
    await page.locator("#morse-code-input").fill("hello");
    const output = await page.locator("#morse-code-output").inputValue();
    expect(output).toBe(".... . .-.. .-.. ---");
  });

  test("Morse Code→テキストモードに切り替えられる", async ({ page }) => {
    await page.getByRole("button", { name: /Morse Code → テキスト/ }).click();
    await expect(page.locator("#morse-code-input")).toBeVisible();
    await page.locator("#morse-code-input").fill("... --- ...");
    await expect(page.locator("#morse-code-output")).toHaveValue("SOS");
  });

  test("コピーボタンが出力がある場合に有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: /コピー/ });
    await expect(copyBtn).toBeDisabled();

    await page.locator("#morse-code-input").fill("SOS");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がクリアされる", async ({ page }) => {
    await page.locator("#morse-code-input").fill("HELLO");
    await page.getByRole("button", { name: /クリア/ }).click();
    await expect(page.locator("#morse-code-input")).toHaveValue("");
    await expect(page.locator("#morse-code-output")).toHaveValue("");
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("Morse Codeの記法")).toBeVisible();
    await expect(page.getByText("対応文字")).toBeVisible();
  });

  test("モード切り替え時に入力がクリアされる", async ({ page }) => {
    await page.locator("#morse-code-input").fill("HELLO");
    await page.getByRole("button", { name: /Morse Code → テキスト/ }).click();
    await expect(page.locator("#morse-code-input")).toHaveValue("");
  });

  test("空入力では出力が空になる", async ({ page }) => {
    await page.locator("#morse-code-input").fill("");
    await expect(page.locator("#morse-code-output")).toHaveValue("");
  });
});
