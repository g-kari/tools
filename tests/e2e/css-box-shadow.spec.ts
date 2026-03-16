import { test, expect } from "@playwright/test";

test.describe("CSS Box Shadowジェネレーターページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-box-shadow");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "CSS Box Shadowジェネレーター" })
    ).toBeVisible();
  });

  test("プリセットセクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "プリセット" })
    ).toBeVisible();
  });

  test("プリセットボタンが複数表示される", async ({ page }) => {
    const presetBtns = page.locator(".cbs-preset-btn");
    await expect(presetBtns).toHaveCount(6);
  });

  test("デフォルトで1つのレイヤーが表示される", async ({ page }) => {
    const layers = page.locator(".cbs-layer-card");
    await expect(layers).toHaveCount(1);
  });

  test("レイヤーを追加できる", async ({ page }) => {
    await page.getByLabel("シャドウレイヤーを追加").click();
    const layers = page.locator(".cbs-layer-card");
    await expect(layers).toHaveCount(2);
  });

  test("レイヤーを削除できる", async ({ page }) => {
    await page.getByLabel("シャドウレイヤーを追加").click();
    await page.getByLabel("レイヤー2を削除").click();
    const layers = page.locator(".cbs-layer-card");
    await expect(layers).toHaveCount(1);
  });

  test("最後の1レイヤーは削除できない", async ({ page }) => {
    await page.getByLabel("レイヤー1を削除").click();
    const layers = page.locator(".cbs-layer-card");
    await expect(layers).toHaveCount(1);
  });

  test("レイヤーをクリックするとプロパティパネルが開く", async ({ page }) => {
    await page.getByLabel("レイヤー1のプロパティを開く").click();
    await expect(page.getByLabel("水平オフセット")).toBeVisible();
    await expect(page.getByLabel("垂直オフセット")).toBeVisible();
    await expect(page.getByLabel("ぼかし半径")).toBeVisible();
    await expect(page.getByLabel("広がり半径")).toBeVisible();
  });

  test("inset チェックボックスが機能する", async ({ page }) => {
    await page.getByLabel("レイヤー1のプロパティを開く").click();
    const checkbox = page.getByLabel("inset（内側シャドウ）");
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(page.locator(".cbs-layer-badge")).toHaveText("inset");
  });

  test("プレビューセクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "ライブプレビュー" })
    ).toBeVisible();
    await expect(page.locator(".cbs-preview-card")).toBeVisible();
  });

  test("背景切り替えボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("背景: ライト")).toBeVisible();
    await expect(page.getByLabel("背景: ダーク")).toBeVisible();
    await expect(page.getByLabel("背景: カラー")).toBeVisible();
  });

  test("背景をダークに切り替えられる", async ({ page }) => {
    await page.getByLabel("背景: ダーク").click();
    await expect(page.locator(".cbs-preview-bg--dark")).toBeVisible();
  });

  test("CSS出力エリアが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "生成 CSS" })
    ).toBeVisible();
    await expect(page.locator(".cbs-css-output")).toBeVisible();
  });

  test("生成CSSに box-shadow が含まれる", async ({ page }) => {
    const cssOutput = page.locator(".cbs-css-output");
    await expect(cssOutput).toContainText("box-shadow:");
  });

  test("生成CSSに .element セレクタが含まれる", async ({ page }) => {
    const cssOutput = page.locator(".cbs-css-output");
    await expect(cssOutput).toContainText(".element {");
  });

  test("プリセット「ソフト」を適用できる", async ({ page }) => {
    await page.getByLabel("「ソフト」プリセットを適用").click();
    const cssOutput = page.locator(".cbs-css-output");
    await expect(cssOutput).toContainText("box-shadow:");
  });

  test("プリセット「二重影」は2レイヤーを生成する", async ({ page }) => {
    await page.getByLabel("「二重影」プリセットを適用").click();
    const layers = page.locator(".cbs-layer-card");
    await expect(layers).toHaveCount(2);
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(
      page.getByLabel("生成されたCSSをクリップボードにコピー")
    ).toBeVisible();
  });

  test("リセットボタンでデフォルト状態に戻る", async ({ page }) => {
    await page.getByLabel("シャドウレイヤーを追加").click();
    await page.getByLabel("すべての設定をリセット").click();
    const layers = page.locator(".cbs-layer-card");
    await expect(layers).toHaveCount(1);
  });

  test("ページにTipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });
});
