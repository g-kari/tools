import { expect, test } from "@playwright/test";

test.describe("ANSIターミナルカラーコードビルダーページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ansi-color");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /ANSIターミナルカラーコードビルダー/ }),
    ).toBeVisible();
  });

  test("プレビューテキスト入力が表示される", async ({ page }) => {
    await expect(page.locator("#ansi-preview-text")).toBeVisible();
    await expect(page.locator("#ansi-preview-text")).toHaveValue("Hello, World!");
  });

  test("プレビューエリアが表示される", async ({ page }) => {
    await expect(page.getByRole("img", { name: /プレビュー/ })).toBeVisible();
  });

  test("テキストスタイルチェックボックスが表示される", async ({ page }) => {
    await expect(page.getByRole("group", { name: "テキストスタイル選択" })).toBeVisible();
  });

  test("プレビューテキストを変更できる", async ({ page }) => {
    const input = page.locator("#ansi-preview-text");
    await input.clear();
    await input.fill("Test Text");
    await expect(input).toHaveValue("Test Text");
  });

  test("出力形式タブが表示される", async ({ page }) => {
    await expect(page.getByRole("tablist", { name: "出力形式選択" })).toBeVisible();
  });

  test("コードブロックが表示される", async ({ page }) => {
    const codeBlock = page.locator(".ansi-color-code-block");
    await expect(codeBlock).toBeVisible();
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /コードをクリップボードにコピー/ }),
    ).toBeVisible();
  });

  test("リセットボタンが存在する", async ({ page }) => {
    await expect(page.getByRole("button", { name: /設定をリセット/ })).toBeVisible();
  });

  test("出力形式を切り替えられる（bash \\e → bash \\033）", async ({ page }) => {
    const tabs = page.getByRole("tablist", { name: "出力形式選択" });
    const octalTab = tabs.getByRole("tab", { name: /bash.*033/ });
    await octalTab.click();
    await expect(octalTab).toHaveAttribute("aria-selected", "true");
  });

  test("前景色セクションが表示される", async ({ page }) => {
    await expect(page.getByText("前景色")).toBeVisible();
  });

  test("背景色セクションが表示される", async ({ page }) => {
    await expect(page.getByText("背景色")).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });
});
