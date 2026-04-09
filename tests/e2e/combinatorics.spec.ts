import { test, expect } from "@playwright/test";

test.describe("順列・組合せ計算ツール (/combinatorics)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/combinatorics");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/順列・組合せ計算/);
    await expect(page.getByRole("heading", { name: "順列・組合せ計算ツール" })).toBeVisible();
  });

  test("デフォルト値で計算結果が表示される", async ({ page }) => {
    // デフォルト n=10, r=3
    await expect(page.getByText("₍10₎C₍3₎")).toBeVisible();
    await expect(page.getByText("₍10₎P₍3₎")).toBeVisible();
  });

  test("10C3 = 120 が正しく表示される", async ({ page }) => {
    await page.getByLabel("n（全体の数）").fill("10");
    await page.getByLabel("r（選ぶ数）").fill("3");
    // 組合せ結果に 120 が表示される
    const resultSection = page.locator(".combinatorics-results");
    await expect(resultSection).toContainText("120");
  });

  test("5P3 = 60 が正しく表示される", async ({ page }) => {
    await page.getByLabel("n（全体の数）").fill("5");
    await page.getByLabel("r（選ぶ数）").fill("3");
    const resultSection = page.locator(".combinatorics-results");
    await expect(resultSection).toContainText("60");
  });

  test("プリセットボタンで値がセットされる", async ({ page }) => {
    await page.getByText("52C5 (ポーカー)").click();
    await expect(page.getByLabel("n（全体の数）")).toHaveValue("52");
    await expect(page.getByLabel("r（選ぶ数）")).toHaveValue("5");
    // ポーカーの手の数 2598960 が表示される
    await expect(page.locator(".combinatorics-results")).toContainText("2,598,960");
  });

  test("r > n のときバリデーションエラーが表示される", async ({ page }) => {
    await page.getByLabel("n（全体の数）").fill("3");
    await page.getByLabel("r（選ぶ数）").fill("5");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("r は n 以下");
  });

  test("計算ステップタブが切り替わる", async ({ page }) => {
    await page.getByLabel("n（全体の数）").fill("5");
    await page.getByLabel("r（選ぶ数）").fill("2");
    // 組合せタブ（デフォルト）
    await expect(page.getByRole("tab", { name: "組合せ nCr の計算手順" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // 順列タブに切替
    await page.getByRole("tab", { name: "順列 nPr の計算手順" }).click();
    await expect(page.getByRole("tab", { name: "順列 nPr の計算手順" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("パスカルの三角形が表示される", async ({ page }) => {
    await page.getByLabel("n（全体の数）").fill("5");
    await page.getByLabel("r（選ぶ数）").fill("2");
    await expect(page.locator(".combinatorics-pascal-container")).toBeVisible();
  });

  test("n が大きいときパスカルの三角形が非表示になる", async ({ page }) => {
    await page.getByLabel("n（全体の数）").fill("20");
    await page.getByLabel("r（選ぶ数）").fill("5");
    await expect(page.locator(".combinatorics-pascal-container")).not.toBeVisible();
  });

  test("階乗の補足が表示される", async ({ page }) => {
    await page.getByLabel("n（全体の数）").fill("6");
    await page.getByLabel("r（選ぶ数）").fill("2");
    await expect(page.locator(".combinatorics-factorials")).toBeVisible();
  });

  test("アクセシビリティ: ランドマークとラベルが設定されている", async ({ page }) => {
    await expect(page.getByLabel("n（全体の数）")).toBeVisible();
    await expect(page.getByLabel("r（選ぶ数）")).toBeVisible();
  });
});
