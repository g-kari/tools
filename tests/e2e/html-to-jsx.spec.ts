import { test, expect } from "@playwright/test";

test.describe("HTML→JSX変換 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/html-to-jsx");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/HTML→JSX変換/);
    await expect(page.getByText("HTML → JSX 変換")).toBeVisible();
  });

  test("入力テキストエリアが表示される", async ({ page }) => {
    const textarea = page.locator("#html-input");
    await expect(textarea).toBeVisible();
  });

  test("出力テキストエリアが表示される", async ({ page }) => {
    const outputTextarea = page.locator(".html-to-jsx-textarea[readonly]");
    await expect(outputTextarea).toBeVisible();
  });

  test("class属性がclassNameに変換される", async ({ page }) => {
    await page.locator("#html-input").fill('<div class="container">');
    const outputTextarea = page.locator(".html-to-jsx-textarea[readonly]");
    await expect(outputTextarea).toHaveValue(/<div className="container">/);
  });

  test("void要素が自己閉じタグに変換される", async ({ page }) => {
    await page.locator("#html-input").fill("<br>");
    const outputTextarea = page.locator(".html-to-jsx-textarea[readonly]");
    await expect(outputTextarea).toHaveValue("<br />");
  });

  test("変換がある場合に変換内容リストが表示される", async ({ page }) => {
    await page.locator("#html-input").fill('<div class="foo">');
    await expect(page.locator(".html-to-jsx-changes")).toBeVisible();
  });

  test("変換内容リストに件数が表示される", async ({ page }) => {
    await page.locator("#html-input").fill('<div class="foo"><span class="bar">');
    await expect(page.locator(".html-to-jsx-change-count").first()).toBeVisible();
  });

  test("コピーボタンが表示される", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "JSX出力をコピー" });
    await expect(copyBtn).toBeVisible();
  });

  test("入力がない場合コピーボタンはdisabled", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "JSX出力をコピー" });
    await expect(copyBtn).toBeDisabled();
  });

  test("クリアボタンクリックで入力がリセットされる", async ({ page }) => {
    const input = page.locator("#html-input");
    await input.fill('<div class="foo">');
    await expect(input).not.toHaveValue("");

    await page.getByRole("button", { name: "入力をクリア" }).click();
    await expect(input).toHaveValue("");
  });

  test("サンプルボタンでサンプルHTMLが読み込まれる", async ({ page }) => {
    await page.getByRole("button", { name: "サンプルを読み込む" }).click();
    const input = page.locator("#html-input");
    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.locator(".tips-card")).toBeVisible();
  });

  test("変換内容エリアにARIAロールが設定されている", async ({ page }) => {
    await page.locator("#html-input").fill('<div class="foo">');
    const changesEl = page.locator(".html-to-jsx-changes");
    await expect(changesEl).toHaveAttribute("role", "status");
    await expect(changesEl).toHaveAttribute("aria-live", "polite");
  });

  test("変換がない場合は変換内容リストが非表示", async ({ page }) => {
    await page.locator("#html-input").fill('<div id="main">テキスト</div>');
    await expect(page.locator(".html-to-jsx-changes")).not.toBeVisible();
  });
});
