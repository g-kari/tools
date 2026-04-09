import { test, expect } from "@playwright/test";

test.describe("統計計算ツール", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/statistics");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page.locator("h2")).toContainText("統計計算ツール");
  });

  test("空の初期状態では空メッセージが表示される", async ({ page }) => {
    await expect(page.locator(".statistics-empty")).toBeVisible();
  });

  test("数値を入力すると統計が表示される", async ({ page }) => {
    await page.fill("#stats-input", "1, 2, 3, 4, 5");
    await expect(page.locator(".statistics-cards").first()).toBeVisible();
    await expect(page.locator(".statistics-count-badge")).toContainText("5 件");
  });

  test("サンプルボタンでデータを読み込める", async ({ page }) => {
    await page.getByRole("button", { name: "身長データ" }).click();
    await expect(page.locator(".statistics-count-badge")).toBeVisible();
    await expect(page.locator(".statistics-results")).toBeVisible();
  });

  test("平均・中央値・合計が表示される", async ({ page }) => {
    await page.fill("#stats-input", "1, 2, 3, 4, 5");
    await expect(page.locator(".statistics-section-title").first()).toContainText("基本統計量");
    // カードが存在することを確認
    await expect(page.locator(".statistics-card")).toHaveCount.greaterThan(0);
  });

  test("度数分布テーブルが表示される", async ({ page }) => {
    await page.fill("#stats-input", "10, 20, 30, 40, 50, 60, 70, 80, 90, 100");
    await expect(page.locator(".statistics-freq-table")).toBeVisible();
  });

  test("meta title が正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/統計計算ツール/);
  });
});
