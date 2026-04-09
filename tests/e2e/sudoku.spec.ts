import { test, expect } from "@playwright/test";

test.describe("数独ゲーム (/sudoku)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sudoku");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/数独ゲーム/);
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("数独ゲーム");
  });

  test("難易度選択ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "簡単" })).toBeVisible();
    await expect(page.getByRole("button", { name: "普通" })).toBeVisible();
    await expect(page.getByRole("button", { name: "難しい" })).toBeVisible();
  });

  test("ゲームスタートボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "ゲームスタート" })).toBeVisible();
  });

  test("デフォルトで「簡単」が選択されている", async ({ page }) => {
    const easyBtn = page.getByRole("button", { name: "簡単" });
    await expect(easyBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("難易度ボタンをクリックすると選択状態が切り替わる", async ({ page }) => {
    const mediumBtn = page.getByRole("button", { name: "普通" });
    await mediumBtn.click();
    await expect(mediumBtn).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "簡単" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("ゲームスタートで数独ボードが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(page.getByRole("grid", { name: "数独ボード" })).toBeVisible();
  });

  test("スタート後に81個のセルが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    const cells = page.getByRole("gridcell");
    await expect(cells).toHaveCount(81);
  });

  test("スタート後にタイマーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(page.locator("time")).toBeVisible();
  });

  test("スタート後にヒントボタンが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(page.getByRole("button", { name: /ヒント/ })).toBeVisible();
  });

  test("スタート後にリセットボタンが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(page.getByRole("button", { name: "リセット" })).toBeVisible();
  });

  test("セルをクリックすると選択状態になる", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    const cells = page.getByRole("gridcell");
    const firstCell = cells.first();
    await firstCell.click();
    // 選択されたセルは aria-selected="true" を持つ
    const selectedCells = page.locator('[aria-selected="true"]');
    await expect(selectedCells).toHaveCount(1);
  });

  test("数字入力パッドが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    const numpad = page.getByRole("group", { name: "数字入力パッド" });
    await expect(numpad).toBeVisible();
  });

  test("スタート後のボタンテキストが「新しいゲーム」に変わる", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(page.getByRole("button", { name: "新しいゲーム" })).toBeVisible();
  });

  test("ナビゲーションのゲームカテゴリに数独ゲームが含まれる", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "ツールナビゲーション" });
    // ゲームカテゴリボタンをホバー
    const gameCategory = nav.getByRole("button", { name: /ゲーム/ });
    await gameCategory.hover();
    await expect(page.getByRole("menuitem", { name: "数独ゲーム" })).toBeVisible();
  });
});
