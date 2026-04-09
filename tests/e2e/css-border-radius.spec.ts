import { test, expect } from "@playwright/test";

test.describe("CSS Border Radiusジェネレーターページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-border-radius");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "CSS Border Radiusジェネレーター" }),
    ).toBeVisible();
  });

  test("プリセットセクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "プリセット" })).toBeVisible();
  });

  test("プリセットボタンが複数表示される", async ({ page }) => {
    const presetBtns = page.locator(".cbr-preset-btn");
    await expect(presetBtns).toHaveCount(8);
  });

  test("オプションセクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "オプション" })).toBeVisible();
  });

  test("単位 px ボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("単位: px")).toBeVisible();
  });

  test("単位 % ボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("単位: %")).toBeVisible();
  });

  test("楕円モードボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("楕円モード（水平・垂直を独立制御）")).toBeVisible();
  });

  test("コーナー設定セクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "コーナー設定" })).toBeVisible();
  });

  test("4コーナーのラベルが表示される", async ({ page }) => {
    await expect(page.getByText("左上")).toBeVisible();
    await expect(page.getByText("右上")).toBeVisible();
    await expect(page.getByText("左下")).toBeVisible();
    await expect(page.getByText("右下")).toBeVisible();
  });

  test("プレビューセクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "ライブプレビュー" })).toBeVisible();
    await expect(page.locator(".cbr-preview-box")).toBeVisible();
  });

  test("CSS出力エリアが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "生成 CSS" })).toBeVisible();
    await expect(page.locator(".cbr-css-output")).toBeVisible();
  });

  test("生成CSSに border-radius が含まれる", async ({ page }) => {
    const cssOutput = page.locator(".cbr-css-output");
    await expect(cssOutput).toContainText("border-radius:");
  });

  test("生成CSSに .element セレクタが含まれる", async ({ page }) => {
    const cssOutput = page.locator(".cbr-css-output");
    await expect(cssOutput).toContainText(".element {");
  });

  test("プリセット「円形」を適用できる", async ({ page }) => {
    await page.getByLabel("「円形」プリセットを適用").click();
    const cssOutput = page.locator(".cbr-css-output");
    await expect(cssOutput).toContainText("50%");
  });

  test("プリセット「ピル型」を適用できる", async ({ page }) => {
    await page.getByLabel("「ピル型」プリセットを適用").click();
    const cssOutput = page.locator(".cbr-css-output");
    await expect(cssOutput).toContainText("9999px");
  });

  test("単位を % に切り替えられる", async ({ page }) => {
    await page.getByLabel("単位: %").click();
    await expect(page.getByLabel("単位: %")).toHaveAttribute("aria-pressed", "true");
  });

  test("楕円モードを ON にできる", async ({ page }) => {
    await page.getByLabel("楕円モード（水平・垂直を独立制御）").click();
    await expect(page.getByLabel("楕円モード（水平・垂直を独立制御）")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("楕円モード ON で H/V ラベルが表示される", async ({ page }) => {
    await page.getByLabel("楕円モード（水平・垂直を独立制御）").click();
    // 楕円モード時に各コーナーに H/V ラベルが表示される
    const axisLabels = page.locator(".cbr-input-axis-label");
    await expect(axisLabels.first()).toBeVisible();
  });

  test("リセットボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("すべての設定をリセット")).toBeVisible();
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(page.getByLabel("生成されたCSSをクリップボードにコピー")).toBeVisible();
  });

  test("プレビュー幅スライダーが表示される", async ({ page }) => {
    await expect(page.getByLabel("プレビューの幅")).toBeVisible();
  });

  test("プレビュー高さスライダーが表示される", async ({ page }) => {
    await expect(page.getByLabel("プレビューの高さ")).toBeVisible();
  });

  test("ページにTipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });
});
