import { test, expect } from "@playwright/test";

test.describe("改行コード変換 - E2E テスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/line-ending");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正常に表示される", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/改行コード変換/);
  });

  test("入力エリアが表示される", async ({ page }) => {
    const input = page.getByTestId("le-input");
    await expect(input).toBeVisible();
  });

  test("変換先ボタンが表示される", async ({ page }) => {
    await expect(page.getByTestId("le-target-lf")).toBeVisible();
    await expect(page.getByTestId("le-target-crlf")).toBeVisible();
    await expect(page.getByTestId("le-target-cr")).toBeVisible();
  });

  test("デフォルトで LF ボタンがアクティブになっている", async ({ page }) => {
    const lfBtn = page.getByTestId("le-target-lf");
    await expect(lfBtn).toHaveClass(/active/);
  });

  test("LF テキスト入力時に「LF」が検出される", async ({ page }) => {
    const input = page.getByTestId("le-input");
    await input.fill("line1\nline2\nline3");
    const badge = page.getByTestId("le-detected-type");
    await expect(badge).toHaveText("LF");
  });

  test("LF 行数が正しく表示される", async ({ page }) => {
    const input = page.getByTestId("le-input");
    await input.fill("line1\nline2\nline3");
    const lfCount = page.getByTestId("le-lf-count");
    await expect(lfCount).toHaveText("2");
    const lineCount = page.getByTestId("le-line-count");
    await expect(lineCount).toHaveText("3");
  });

  test("改行なしテキスト入力時に「None」が検出される", async ({ page }) => {
    const input = page.getByTestId("le-input");
    await input.fill("hello world");
    const badge = page.getByTestId("le-detected-type");
    await expect(badge).toHaveText("None");
  });

  test("変換先を CRLF に切り替えられる", async ({ page }) => {
    const crlfBtn = page.getByTestId("le-target-crlf");
    await crlfBtn.click();
    await expect(crlfBtn).toHaveClass(/active/);
  });

  test("コピーボタンが最初は無効化されている", async ({ page }) => {
    const copyBtn = page.getByTestId("le-copy-btn");
    await expect(copyBtn).toBeDisabled();
  });

  test("クリアボタンが最初は無効化されている", async ({ page }) => {
    const clearBtn = page.getByTestId("le-clear-btn");
    await expect(clearBtn).toBeDisabled();
  });

  test("テキスト入力後にコピー・クリアボタンが有効になる", async ({ page }) => {
    const input = page.getByTestId("le-input");
    await input.fill("test\ntext");
    await expect(page.getByTestId("le-copy-btn")).toBeEnabled();
    await expect(page.getByTestId("le-clear-btn")).toBeEnabled();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    const input = page.getByTestId("le-input");
    await input.fill("some\ntext");
    await page.getByTestId("le-clear-btn").click();
    await expect(input).toHaveValue("");
  });

  test("LF → CRLF 変換で出力エリアが表示される", async ({ page }) => {
    const input = page.getByTestId("le-input");
    await input.fill("line1\nline2");
    await page.getByTestId("le-target-crlf").click();
    const output = page.getByTestId("le-output");
    await expect(output).toBeVisible();
  });

  test("アクセシビリティ: role 属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="group"]')).toBeVisible();
  });

  test("ナビゲーションのテキストカテゴリに改行コード変換リンクが表示される", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "テキスト" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/line-ending"]');
    await expect(link).toBeVisible();
  });
});
