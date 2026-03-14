import { test, expect } from "@playwright/test";

test.describe("CSSグラジェント生成ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-gradient");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "CSSグラジェント生成" })
    ).toBeVisible();
  });

  test("グラジェントタイプタブが3つ表示される", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Linear" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Radial" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Conic" })).toBeVisible();
  });

  test("デフォルトでLinearタブが選択されている", async ({ page }) => {
    const linearTab = page.getByRole("tab", { name: "Linear" });
    await expect(linearTab).toHaveAttribute("aria-selected", "true");
  });

  test("Radialタブに切り替えると設定が表示される", async ({ page }) => {
    await page.getByRole("tab", { name: "Radial" }).click();
    await expect(page.getByRole("tab", { name: "Radial" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByLabel("ラジアル形状")).toBeVisible();
  });

  test("Conicタブに切り替えると設定が表示される", async ({ page }) => {
    await page.getByRole("tab", { name: "Conic" }).click();
    await expect(page.getByRole("tab", { name: "Conic" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByLabel("開始角度")).toBeVisible();
  });

  test("カラーストップが2つ表示される", async ({ page }) => {
    const stopItems = page.locator(".cg-stop-item");
    await expect(stopItems).toHaveCount(2);
  });

  test("カラーストップ追加ボタンが機能する", async ({ page }) => {
    await page.getByLabel("カラーストップを追加").click();
    const stopItems = page.locator(".cg-stop-item");
    await expect(stopItems).toHaveCount(3);
  });

  test("カラーストップを削除できる（2つ以上のとき）", async ({ page }) => {
    // まず3つにする
    await page.getByLabel("カラーストップを追加").click();
    // 削除ボタンで1つ削除
    const removeButtons = page.getByLabel(/カラーストップ.*を削除/);
    await removeButtons.first().click();
    const stopItems = page.locator(".cg-stop-item");
    await expect(stopItems).toHaveCount(2);
  });

  test("2つのとき削除ボタンは無効になる", async ({ page }) => {
    const removeButtons = page.getByLabel(/カラーストップ.*を削除/);
    const firstButton = removeButtons.first();
    await expect(firstButton).toBeDisabled();
  });

  test("プレビューエリアが表示される", async ({ page }) => {
    await expect(page.getByRole("img", { name: /グラジェントプレビュー/ })).toBeVisible();
  });

  test("CSSコードが表示される", async ({ page }) => {
    const codeBlock = page.getByRole("region", { name: "CSSコード" });
    await expect(codeBlock).toBeVisible();
    const text = await codeBlock.textContent();
    expect(text).toContain("linear-gradient");
    expect(text).toContain("background:");
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "CSSをクリップボードにコピー" })
    ).toBeVisible();
  });

  test("プリセットが表示される", async ({ page }) => {
    const presetButtons = page.locator(".cg-preset-btn");
    await expect(presetButtons.first()).toBeVisible();
  });

  test("プリセットを選択するとプレビューが更新される", async ({ page }) => {
    const firstPreset = page.locator(".cg-preset-btn").first();
    await firstPreset.click();
    await expect(firstPreset).toHaveAttribute("aria-pressed", "true");
  });

  test("角度スライダーを変更するとCSSが更新される", async ({ page }) => {
    const codeBlock = page.getByRole("region", { name: "CSSコード" });
    const initialCSS = await codeBlock.textContent();

    const angleSlider = page.getByLabel("グラジェント角度");
    await angleSlider.fill("45");

    const updatedCSS = await codeBlock.textContent();
    expect(updatedCSS).not.toBe(initialCSS);
    expect(updatedCSS).toContain("45deg");
  });

  test("ページタイトルが正しいドキュメントタイトルを持つ", async ({ page }) => {
    await expect(page).toHaveTitle(/CSSグラジェント生成/);
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText(/Linear:/)).toBeVisible();
    await expect(page.getByText(/Radial:/)).toBeVisible();
    await expect(page.getByText(/Conic:/)).toBeVisible();
  });
});
