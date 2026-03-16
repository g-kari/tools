import { test, expect } from "@playwright/test";

test.describe("CSS Filterジェネレーターページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-filter");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "CSS Filterジェネレーター" })
    ).toBeVisible();
  });

  test("プリセットセクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "プリセット" })
    ).toBeVisible();
  });

  test("プリセットボタンが複数表示される", async ({ page }) => {
    const presetBtns = page.locator(".cfl-preset-btn");
    await expect(presetBtns).toHaveCount(9);
  });

  test("フィルター設定セクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "フィルター設定" })
    ).toBeVisible();
  });

  test("Blur スライダーが表示される", async ({ page }) => {
    await expect(page.getByLabel("Blur 0px")).toBeVisible();
  });

  test("Brightness スライダーが表示される", async ({ page }) => {
    await expect(page.getByLabel("Brightness 100%")).toBeVisible();
  });

  test("Grayscale スライダーが表示される", async ({ page }) => {
    await expect(page.getByLabel("Grayscale 0%")).toBeVisible();
  });

  test("プレビューセクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "プレビュー" })
    ).toBeVisible();
    await expect(page.locator(".cfl-preview-canvas")).toBeVisible();
  });

  test("元画像とフィルター後のプレビューが表示される", async ({ page }) => {
    await expect(page.getByText("元画像")).toBeVisible();
    await expect(page.getByText("フィルター後")).toBeVisible();
  });

  test("背景切替ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("group", { name: "背景色選択" })).toBeVisible();
  });

  test("背景をダークに切り替えられる", async ({ page }) => {
    await page.getByRole("button", { name: "ダーク" }).click();
    await expect(page.locator(".cfl-preview-canvas--dark")).toBeVisible();
  });

  test("背景をカラーに切り替えられる", async ({ page }) => {
    await page.getByRole("button", { name: "カラー" }).click();
    await expect(page.locator(".cfl-preview-canvas--colored")).toBeVisible();
  });

  test("CSS出力エリアが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "生成 CSS" })
    ).toBeVisible();
    await expect(page.locator(".cfl-css-output")).toBeVisible();
  });

  test("生成CSSに filter が含まれる", async ({ page }) => {
    const cssOutput = page.locator(".cfl-css-output");
    await expect(cssOutput).toContainText("filter:");
  });

  test("生成CSSに .element セレクタが含まれる", async ({ page }) => {
    const cssOutput = page.locator(".cfl-css-output");
    await expect(cssOutput).toContainText(".element {");
  });

  test("デフォルト状態では filter: none が出力される", async ({ page }) => {
    const cssOutput = page.locator(".cfl-css-output");
    await expect(cssOutput).toContainText("filter: none");
  });

  test("プリセット「モノクロ」を適用できる", async ({ page }) => {
    await page.getByLabel("「モノクロ」プリセットを適用").click();
    const cssOutput = page.locator(".cfl-css-output");
    await expect(cssOutput).toContainText("grayscale(100%)");
  });

  test("プリセット「反転」を適用できる", async ({ page }) => {
    await page.getByLabel("「反転」プリセットを適用").click();
    const cssOutput = page.locator(".cfl-css-output");
    await expect(cssOutput).toContainText("invert(100%)");
  });

  test("プリセット「セピア」を適用できる", async ({ page }) => {
    await page.getByLabel("「セピア」プリセットを適用").click();
    const cssOutput = page.locator(".cfl-css-output");
    await expect(cssOutput).toContainText("sepia(");
  });

  test("リセットボタンが表示される", async ({ page }) => {
    await expect(
      page.getByLabel("すべての設定をリセット")
    ).toBeVisible();
  });

  test("プリセット適用後にリセットで none に戻る", async ({ page }) => {
    await page.getByLabel("「モノクロ」プリセットを適用").click();
    const cssOutput = page.locator(".cfl-css-output");
    await expect(cssOutput).toContainText("grayscale(100%)");

    await page.getByLabel("すべての設定をリセット").click();
    await expect(cssOutput).toContainText("filter: none");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(
      page.getByLabel("CSSをクリップボードにコピー")
    ).toBeVisible();
  });

  test("ページにTipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });

  test("CSS filterとはのTipsが表示される", async ({ page }) => {
    await expect(page.getByText("CSS filterとは")).toBeVisible();
  });
});
