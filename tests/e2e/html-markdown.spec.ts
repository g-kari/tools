import { expect, test } from "@playwright/test";

test.describe("HTML→Markdown変換ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/html-markdown");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /HTML.*Markdown/ })).toBeVisible();
  });

  test("入力エリアと出力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#html-markdown-input")).toBeVisible();
    await expect(page.locator("#html-markdown-output")).toBeVisible();
  });

  test("見出しタグを変換できる", async ({ page }) => {
    await page.locator("#html-markdown-input").fill("<h1>タイトル</h1>");
    await expect(page.locator("#html-markdown-output")).toHaveValue("# タイトル");
  });

  test("段落タグを変換できる", async ({ page }) => {
    await page.locator("#html-markdown-input").fill("<p>テキスト</p>");
    await expect(page.locator("#html-markdown-output")).toHaveValue("テキスト");
  });

  test("太字を変換できる", async ({ page }) => {
    await page.locator("#html-markdown-input").fill("<p><strong>太字</strong></p>");
    const output = await page.locator("#html-markdown-output").inputValue();
    expect(output).toContain("**太字**");
  });

  test("サンプルボタンでサンプルHTMLが読み込まれる", async ({ page }) => {
    await page.getByRole("button", { name: /サンプルを読み込む/ }).click();
    const value = await page.locator("#html-markdown-input").inputValue();
    expect(value.length).toBeGreaterThan(0);
    const output = await page.locator("#html-markdown-output").inputValue();
    expect(output).toContain("# ");
  });

  test("コピーボタンが出力がある場合に有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: /コピー/ });
    await expect(copyBtn).toBeDisabled();
    await page.locator("#html-markdown-input").fill("<h1>テスト</h1>");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がクリアされる", async ({ page }) => {
    await page.locator("#html-markdown-input").fill("<h1>テスト</h1>");
    await page.getByRole("button", { name: /クリア/ }).click();
    await expect(page.locator("#html-markdown-input")).toHaveValue("");
    await expect(page.locator("#html-markdown-output")).toHaveValue("");
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("対応するHTML要素")).toBeVisible();
  });

  test("空入力では出力が空になる", async ({ page }) => {
    await page.locator("#html-markdown-input").fill("");
    await expect(page.locator("#html-markdown-output")).toHaveValue("");
  });
});
