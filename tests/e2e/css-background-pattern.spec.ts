import { test, expect } from "@playwright/test";

test.describe("CSS背景パターン生成 (/css-background-pattern)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-background-pattern");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/CSS背景パターン生成/);
  });

  test("6種類のパターンタブが表示される", async ({ page }) => {
    const tabs = ["縞模様", "斜め縞", "グリッド", "市松", "水玉", "ジグザグ"];
    for (const label of tabs) {
      await expect(page.getByRole("tab", { name: label })).toBeVisible();
    }
  });

  test("デフォルトで縞模様タブが選択されている", async ({ page }) => {
    const tab = page.getByRole("tab", { name: "縞模様" });
    await expect(tab).toHaveAttribute("aria-selected", "true");
  });

  test("タブを切り替えるとaria-selectedが更新される", async ({ page }) => {
    const dotsTab = page.getByRole("tab", { name: "水玉" });
    await dotsTab.click();
    await expect(dotsTab).toHaveAttribute("aria-selected", "true");

    const stripesTab = page.getByRole("tab", { name: "縞模様" });
    await expect(stripesTab).toHaveAttribute("aria-selected", "false");
  });

  test("カラー1のカラーピッカーが表示される", async ({ page }) => {
    await expect(page.getByLabel("カラー1のカラーピッカー")).toBeVisible();
  });

  test("カラー2のカラーピッカーが表示される", async ({ page }) => {
    await expect(page.getByLabel("カラー2のカラーピッカー")).toBeVisible();
  });

  test("サイズスライダーが表示される", async ({ page }) => {
    await expect(page.getByLabel("パターンサイズ")).toBeVisible();
  });

  test("プレビューエリアが表示される", async ({ page }) => {
    const preview = page.getByRole("img", { name: /パターンプレビュー/ });
    await expect(preview).toBeVisible();
  });

  test("CSSコードブロックが表示される", async ({ page }) => {
    const codeBlock = page.getByRole("region", { name: "CSSコード" });
    await expect(codeBlock).toBeVisible();
  });

  test("CSSコードブロックにbackgroundが含まれる", async ({ page }) => {
    const codeBlock = page.getByRole("region", { name: "CSSコード" });
    await expect(codeBlock).toContainText("background:");
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "CSSをクリップボードにコピー" })).toBeVisible();
  });

  test("6つのプリセットボタンが表示される", async ({ page }) => {
    const presetGroup = page.getByRole("group", { name: "パターンプリセット" });
    const buttons = presetGroup.getByRole("button");
    await expect(buttons).toHaveCount(6);
  });

  test("プリセットボタンをクリックするとaria-pressedが変わる", async ({ page }) => {
    const presetGroup = page.getByRole("group", { name: "パターンプリセット" });
    const firstPreset = presetGroup.getByRole("button").first();
    await firstPreset.click();
    await expect(firstPreset).toHaveAttribute("aria-pressed", "true");
  });

  test("水玉タブに切り替えると点サイズスライダーが表示される", async ({ page }) => {
    await page.getByRole("tab", { name: "水玉" }).click();
    await expect(page.getByLabel("点の半径")).toBeVisible();
  });

  test("市松タブに切り替えると角度スライダーが表示されない", async ({ page }) => {
    await page.getByRole("tab", { name: "市松" }).click();
    await expect(page.getByLabel("パターン角度")).not.toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText("対応するパターン種類")).toBeVisible();
  });
});
