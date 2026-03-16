import { test, expect } from "@playwright/test";

test.describe("CSS Transformジェネレーターページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-transform");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "CSS Transformジェネレーター" })
    ).toBeVisible();
  });

  test("プリセットセクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "プリセット" })
    ).toBeVisible();
  });

  test("プリセットボタンが複数表示される", async ({ page }) => {
    const presetBtns = page.locator(".ct-preset-btn");
    await expect(presetBtns).toHaveCount(9);
  });

  test("移動セクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "移動 (translate)" })
    ).toBeVisible();
  });

  test("回転セクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "回転 (rotate)" })
    ).toBeVisible();
  });

  test("拡縮セクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "拡縮 (scale)" })
    ).toBeVisible();
  });

  test("傾斜セクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "傾斜 (skew)" })
    ).toBeVisible();
  });

  test("遠近法セクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "遠近法 (perspective)" })
    ).toBeVisible();
  });

  test("ライブプレビューが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "ライブプレビュー" })
    ).toBeVisible();
    await expect(page.locator(".ct-preview-canvas")).toBeVisible();
  });

  test("プレビューボックスが表示される", async ({ page }) => {
    await expect(page.locator(".ct-preview-box")).toBeVisible();
    await expect(page.locator(".ct-preview-box-label")).toContainText("CSS Transform");
  });

  test("CSS出力エリアが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "生成 CSS" })
    ).toBeVisible();
    await expect(page.locator(".ct-css-output")).toBeVisible();
  });

  test("生成CSSに transform が含まれる", async ({ page }) => {
    const cssOutput = page.locator(".ct-css-output");
    await expect(cssOutput).toContainText("transform:");
  });

  test("生成CSSに .element セレクタが含まれる", async ({ page }) => {
    const cssOutput = page.locator(".ct-css-output");
    await expect(cssOutput).toContainText(".element {");
  });

  test("デフォルト状態では transform: none が出力される", async ({ page }) => {
    const cssOutput = page.locator(".ct-css-output");
    await expect(cssOutput).toContainText("transform: none");
  });

  test("プリセット「右回転」を適用できる", async ({ page }) => {
    await page.getByLabel("「右回転」プリセットを適用").click();
    const cssOutput = page.locator(".ct-css-output");
    await expect(cssOutput).toContainText("rotateZ(45deg)");
  });

  test("プリセット「縮小」を適用できる", async ({ page }) => {
    await page.getByLabel("「縮小」プリセットを適用").click();
    const cssOutput = page.locator(".ct-css-output");
    await expect(cssOutput).toContainText("scale(0.5)");
  });

  test("プリセット「拡大」を適用できる", async ({ page }) => {
    await page.getByLabel("「拡大」プリセットを適用").click();
    const cssOutput = page.locator(".ct-css-output");
    await expect(cssOutput).toContainText("scale(1.5)");
  });

  test("リセットボタンが表示される", async ({ page }) => {
    await expect(
      page.getByLabel("すべての設定をリセット")
    ).toBeVisible();
  });

  test("プリセット適用後にリセットで none に戻る", async ({ page }) => {
    await page.getByLabel("「右回転」プリセットを適用").click();
    const cssOutput = page.locator(".ct-css-output");
    await expect(cssOutput).toContainText("rotateZ(45deg)");

    await page.getByLabel("すべての設定をリセット").click();
    await expect(cssOutput).toContainText("transform: none");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(
      page.getByLabel("生成されたCSSをクリップボードにコピー")
    ).toBeVisible();
  });

  test("ページにTipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });

  test("transform 関数の説明のTipsが表示される", async ({ page }) => {
    await expect(page.getByText("transform 関数の説明")).toBeVisible();
  });

  test("よく使うパターンのTipsが表示される", async ({ page }) => {
    await expect(page.getByText("よく使うパターン")).toBeVisible();
  });
});
