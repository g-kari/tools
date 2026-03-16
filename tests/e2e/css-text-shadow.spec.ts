import { test, expect } from "@playwright/test";

test.describe("CSS Text Shadowジェネレーターページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-text-shadow");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "CSS Text Shadowジェネレーター" })
    ).toBeVisible();
  });

  test("プリセットセクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "プリセット" })
    ).toBeVisible();
  });

  test("プリセットボタンが複数表示される", async ({ page }) => {
    const presetBtns = page.locator(".cts-preset-btn");
    await expect(presetBtns).toHaveCount(6);
  });

  test("デフォルトで1つのレイヤーが表示される", async ({ page }) => {
    const layers = page.locator(".cts-layer-card");
    await expect(layers).toHaveCount(1);
  });

  test("レイヤーを追加できる", async ({ page }) => {
    await page.getByLabel("シャドウレイヤーを追加").click();
    const layers = page.locator(".cts-layer-card");
    await expect(layers).toHaveCount(2);
  });

  test("レイヤーを削除できる", async ({ page }) => {
    await page.getByLabel("シャドウレイヤーを追加").click();
    await page.getByLabel("レイヤー2を削除").click();
    const layers = page.locator(".cts-layer-card");
    await expect(layers).toHaveCount(1);
  });

  test("最後の1レイヤーは削除できない", async ({ page }) => {
    await page.getByLabel("レイヤー1を削除").click();
    const layers = page.locator(".cts-layer-card");
    await expect(layers).toHaveCount(1);
  });

  test("レイヤーをクリックするとプロパティパネルが開く", async ({ page }) => {
    await page.getByLabel("レイヤー1のプロパティを開く").click();
    await expect(page.getByLabel("水平オフセット")).toBeVisible();
    await expect(page.getByLabel("垂直オフセット")).toBeVisible();
    await expect(page.getByLabel("ぼかし半径")).toBeVisible();
  });

  test("inset プロパティが存在しない（text-shadowはinset非対応）", async ({
    page,
  }) => {
    await page.getByLabel("レイヤー1のプロパティを開く").click();
    await expect(page.getByLabel("inset（内側シャドウ）")).not.toBeVisible();
  });

  test("プレビューセクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "ライブプレビュー" })
    ).toBeVisible();
    await expect(page.locator(".cts-preview-text")).toBeVisible();
  });

  test("背景切り替えボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("背景: ライト")).toBeVisible();
    await expect(page.getByLabel("背景: ダーク")).toBeVisible();
    await expect(page.getByLabel("背景: カラー")).toBeVisible();
  });

  test("背景をライトに切り替えられる", async ({ page }) => {
    await page.getByLabel("背景: ライト").click();
    await expect(page.locator(".cts-preview-bg--light")).toBeVisible();
  });

  test("CSS出力エリアが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "生成 CSS" })
    ).toBeVisible();
    await expect(page.locator(".cts-css-output")).toBeVisible();
  });

  test("生成CSSに text-shadow が含まれる", async ({ page }) => {
    const cssOutput = page.locator(".cts-css-output");
    await expect(cssOutput).toContainText("text-shadow:");
  });

  test("生成CSSに .element セレクタが含まれる", async ({ page }) => {
    const cssOutput = page.locator(".cts-css-output");
    await expect(cssOutput).toContainText(".element {");
  });

  test("プリセット「シンプル」を適用できる", async ({ page }) => {
    await page.getByLabel("「シンプル」プリセットを適用").click();
    const cssOutput = page.locator(".cts-css-output");
    await expect(cssOutput).toContainText("text-shadow:");
  });

  test("プリセット「ネオン（青）」は3レイヤーを生成する", async ({ page }) => {
    await page.getByLabel("「ネオン（青）」プリセットを適用").click();
    const layers = page.locator(".cts-layer-card");
    await expect(layers).toHaveCount(3);
  });

  test("プリセット「アウトライン」は4レイヤーを生成する", async ({ page }) => {
    await page.getByLabel("「アウトライン」プリセットを適用").click();
    const layers = page.locator(".cts-layer-card");
    await expect(layers).toHaveCount(4);
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(
      page.getByLabel("生成されたCSSをクリップボードにコピー")
    ).toBeVisible();
  });

  test("リセットボタンでデフォルト状態に戻る", async ({ page }) => {
    await page.getByLabel("シャドウレイヤーを追加").click();
    await page.getByLabel("すべての設定をリセット").click();
    const layers = page.locator(".cts-layer-card");
    await expect(layers).toHaveCount(1);
  });

  test("ページにTipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });
});
