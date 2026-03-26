import { test, expect } from "@playwright/test";

test.describe("EditorConfig ジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editorconfig");
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/EditorConfig ジェネレーター/);
  });

  test("セクション見出しが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "プリセット" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "グローバル設定" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "ファイルタイプ別オーバーライド" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /生成された .editorconfig/ })
    ).toBeVisible();
  });

  test("デフォルトで出力に [*] セクションが含まれる", async ({ page }) => {
    const output = page.getByRole("textbox", {
      name: "生成された .editorconfig の内容",
    });
    await expect(output).toContainText("[*]");
    await expect(output).toContainText("indent_style = space");
    await expect(output).toContainText("end_of_line = lf");
  });

  test("プリセットボタンが存在する", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /プリセット「Webフロントエンド標準」を適用/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /プリセット「Go標準」を適用/ })
    ).toBeVisible();
  });

  test("Go プリセットを適用するとタブインデントになる", async ({ page }) => {
    await page
      .getByRole("button", { name: /プリセット「Go標準」を適用/ })
      .click();
    const output = page.getByRole("textbox", {
      name: "生成された .editorconfig の内容",
    });
    await expect(output).toContainText("indent_style = tab");
  });

  test("Windowsプリセットを適用すると CRLF になる", async ({ page }) => {
    await page
      .getByRole("button", { name: /プリセット「Windowsフレンドリー」を適用/ })
      .click();
    const output = page.getByRole("textbox", {
      name: "生成された .editorconfig の内容",
    });
    await expect(output).toContainText("end_of_line = crlf");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(
      page.getByRole("button", {
        name: ".editorconfig の内容をクリップボードにコピー",
      })
    ).toBeVisible();
  });

  test("ダウンロードボタンが存在する", async ({ page }) => {
    await expect(
      page.getByRole("button", {
        name: ".editorconfig ファイルをダウンロード",
      })
    ).toBeVisible();
  });

  test("リセットボタンが存在する", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "設定をリセット" })
    ).toBeVisible();
  });

  test("リセット後にデフォルト設定に戻る", async ({ page }) => {
    // Goプリセットを適用してから
    await page
      .getByRole("button", { name: /プリセット「Go標準」を適用/ })
      .click();
    // リセット
    await page.getByRole("button", { name: "設定をリセット" }).click();
    const output = page.getByRole("textbox", {
      name: "生成された .editorconfig の内容",
    });
    // デフォルト（space）に戻る
    await expect(output).toContainText("indent_style = space");
  });
});
