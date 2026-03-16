import { test, expect } from "@playwright/test";

test.describe("日付計算ツール (/date-calc)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/date-calc");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/日付計算ツール/);
  });

  test("3つのセクションが表示される", async ({ page }) => {
    await expect(page.getByText("日付差計算")).toBeVisible();
    await expect(page.getByText("日付の加算 / 減算")).toBeVisible();
    await expect(page.getByText("日付情報")).toBeVisible();
  });

  test("日付差計算セクション: 入力フィールドが存在する", async ({ page }) => {
    const inputs = page.locator('input[type="datetime-local"]');
    await expect(inputs).toHaveCount(3); // diff x2 + arith or info
  });

  test("日付差計算セクション: 差が自動的に表示される", async ({ page }) => {
    // 結果が表示されていることを確認（デフォルト値で自動計算）
    await expect(page.getByText("日付の差")).toBeVisible();
    await expect(page.getByText("合計日数")).toBeVisible();
  });

  test("入れ替えボタンが動作する", async ({ page }) => {
    await page.getByRole("button", { name: /入れ替え/ }).click();
    // 入れ替え後もセクションが正常表示される
    await expect(page.getByText("合計日数")).toBeVisible();
  });

  test("「今」ボタンが動作する", async ({ page }) => {
    const nowButtons = page.getByRole("button", { name: /現在時刻に設定/ });
    await nowButtons.first().click();
    // エラーなく動作する
    await expect(page.getByText("合計日数")).toBeVisible();
  });

  test("日付加算/減算セクション: 結果が表示される", async ({ page }) => {
    await expect(page.getByText("計算結果")).toBeVisible();
  });

  test("日付加算/減算: 単位セレクトが動作する", async ({ page }) => {
    const unitSelect = page.getByLabel("単位");
    await unitSelect.selectOption("months");
    await expect(unitSelect).toHaveValue("months");
    await expect(page.getByText("計算結果")).toBeVisible();
  });

  test("日付加算/減算: 操作セレクトが動作する", async ({ page }) => {
    const opSelect = page.getByLabel("加算または減算");
    await opSelect.selectOption("subtract");
    await expect(opSelect).toHaveValue("subtract");
  });

  test("日付情報セクション: 曜日が表示される", async ({ page }) => {
    await expect(page.getByText("曜日")).toBeVisible();
    await expect(page.getByText("ISO 週番号")).toBeVisible();
    await expect(page.getByText("年の何日目")).toBeVisible();
    await expect(page.getByText("四半期")).toBeVisible();
    await expect(page.getByText("閏年")).toBeVisible();
  });

  test("日付情報: Unix タイムスタンプが表示される", async ({ page }) => {
    await expect(page.getByText("Unix タイムスタンプ")).toBeVisible();
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });

  test("アクセシビリティ: セクション見出しが存在する", async ({ page }) => {
    const headings = page.getByRole("heading", { level: 2 });
    await expect(headings).toHaveCount(3);
  });
});
