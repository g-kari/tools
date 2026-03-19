import { test, expect } from "@playwright/test";

test.describe("マインスイーパー (/minesweeper)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/minesweeper");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/マインスイーパー/);
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("マインスイーパー");
  });

  test("難易度選択ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "初級" })).toBeVisible();
    await expect(page.getByRole("button", { name: "中級" })).toBeVisible();
    await expect(page.getByRole("button", { name: "上級" })).toBeVisible();
  });

  test("ゲームスタートボタンが表示される", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "ゲームスタート" })
    ).toBeVisible();
  });

  test("デフォルトで「初級」が選択されている", async ({ page }) => {
    const easyBtn = page.getByRole("button", { name: "初級" });
    await expect(easyBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("難易度ボタンをクリックすると選択状態が切り替わる", async ({ page }) => {
    const mediumBtn = page.getByRole("button", { name: "中級" });
    await mediumBtn.click();
    await expect(mediumBtn).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "初級" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  test("ゲームスタートでボードが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(
      page.getByRole("grid", { name: "マインスイーパーボード" })
    ).toBeVisible();
  });

  test("初級スタートで81個のセルが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    const cells = page.getByRole("gridcell");
    await expect(cells).toHaveCount(81);
  });

  test("スタート後にステータスバーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(
      page.getByRole("region", { name: "ゲームステータス" })
    ).toBeVisible();
  });

  test("スタート後にタイマーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(page.locator("time")).toBeVisible();
  });

  test("スタート後のボタンテキストが「新しいゲーム」に変わる", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await expect(
      page.getByRole("button", { name: "新しいゲーム" })
    ).toBeVisible();
  });

  test("セルをクリックすると周囲が開放される", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    const cells = page.getByRole("gridcell");
    await cells.first().click();
    // 少なくとも1セルが開放されること
    const revealedCells = page.locator(".ms-cell.revealed");
    await expect(revealedCells).not.toHaveCount(0);
  });

  test("リセットボタンでゲームをリスタートできる", async ({ page }) => {
    await page.getByRole("button", { name: "ゲームスタート" }).click();
    await page.getByRole("gridcell").first().click();
    await page.getByRole("button", { name: "ゲームをリセット" }).click();
    // リセット後は全セルが未開放
    const revealedCells = page.locator(".ms-cell.revealed");
    await expect(revealedCells).toHaveCount(0);
  });

  test("ナビゲーションのゲームカテゴリにマインスイーパーが含まれる", async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "ツールナビゲーション" });
    const gameCategory = nav.getByRole("button", { name: /ゲーム/ });
    await gameCategory.hover();
    await expect(
      page.getByRole("menuitem", { name: "マインスイーパー" })
    ).toBeVisible();
  });
});
