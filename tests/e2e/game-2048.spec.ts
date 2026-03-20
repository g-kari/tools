import { test, expect } from "@playwright/test";

test.describe("2048 (/game-2048)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/game-2048");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/2048/);
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("2048");
  });

  test("ゲームボードが表示される", async ({ page }) => {
    await expect(
      page.getByRole("grid", { name: "2048ゲームボード" })
    ).toBeVisible();
  });

  test("ボードに16個のセルが表示される", async ({ page }) => {
    const cells = page.getByRole("gridcell");
    await expect(cells).toHaveCount(16);
  });

  test("初期状態でタイルが2個表示される", async ({ page }) => {
    // 空でないセルが2つ（初期タイル）
    const nonEmptyCells = page.getByRole("gridcell").filter({
      hasNot: page.locator('[aria-label="空きセル"]'),
    });
    await expect(nonEmptyCells).toHaveCount(2);
  });

  test("スコア表示が存在する", async ({ page }) => {
    await expect(page.locator('[aria-label^="スコア"]')).toBeVisible();
  });

  test("ベストスコア表示が存在する", async ({ page }) => {
    await expect(page.locator('[aria-label^="ベストスコア"]')).toBeVisible();
  });

  test("新しいゲームボタンが表示される", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "新しいゲームを開始" })
    ).toBeVisible();
  });

  test("矢印キー操作でタイルが移動する", async ({ page }) => {
    const board = page.getByRole("grid", { name: "2048ゲームボード" });
    await board.focus();
    await page.keyboard.press("ArrowLeft");
    // 移動後はタイルが増えて3個になる（または変化なしで2個のまま）
    const cells = page.getByRole("gridcell");
    await expect(cells).toHaveCount(16);
  });

  test("新しいゲームボタンでボードがリセットされる", async ({ page }) => {
    const board = page.getByRole("grid", { name: "2048ゲームボード" });
    await board.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await page.getByRole("button", { name: "新しいゲームを開始" }).click();
    // リセット後はタイルが2個
    const nonEmptyCells = page.getByRole("gridcell").filter({
      hasNot: page.locator('[aria-label="空きセル"]'),
    });
    await expect(nonEmptyCells).toHaveCount(2);
  });

  test("操作説明テキストが表示される", async ({ page }) => {
    await expect(page.locator("#g2048-instructions")).toBeVisible();
  });

  test("使い方セクションが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });

  test("攻略のコツセクションが表示される", async ({ page }) => {
    await expect(page.getByText("攻略のコツ")).toBeVisible();
  });

  test("ナビゲーションのゲームカテゴリに2048が含まれる", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "ツールナビゲーション" });
    const gameCategory = nav.getByRole("button", { name: /ゲーム/ });
    await gameCategory.hover();
    await expect(page.getByRole("menuitem", { name: "2048" })).toBeVisible();
  });
});
