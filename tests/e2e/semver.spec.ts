import { test, expect } from "@playwright/test";

test.describe("Semver チェッカー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/semver");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Semver チェッカー/);
  });

  test("バージョン解析: 有効なバージョンのコンポーネントが表示される", async ({ page }) => {
    const input = page.getByLabel("バージョン文字列");
    await input.fill("1.2.3");

    await expect(page.getByText("Major")).toBeVisible();
    await expect(page.getByText("Minor")).toBeVisible();
    await expect(page.getByText("Patch")).toBeVisible();
    await expect(page.getByText("✓ 有効")).toBeVisible();
  });

  test("バージョン解析: プレリリースが表示される", async ({ page }) => {
    const input = page.getByLabel("バージョン文字列");
    await input.fill("1.0.0-alpha.1");
    await expect(page.getByText("alpha.1")).toBeVisible();
  });

  test("バージョン解析: 先頭の v が自動除去される", async ({ page }) => {
    const input = page.getByLabel("バージョン文字列");
    await input.fill("v2.3.4");
    await expect(page.getByText("✓ 有効")).toBeVisible();
    await expect(page.getByText("2.3.4")).toBeVisible();
  });

  test("バージョン解析: 無効なバージョンはエラー表示される", async ({ page }) => {
    const input = page.getByLabel("バージョン文字列");
    await input.fill("invalid-version");
    await expect(page.getByText("✕ 無効")).toBeVisible();
  });

  test("バージョン比較: A > B の結果が表示される", async ({ page }) => {
    await page.getByLabel("比較バージョン A").fill("2.0.0");
    await page.getByLabel("比較バージョン B").fill("1.9.9");
    await expect(page.getByText(">")).toBeVisible();
  });

  test("バージョン比較: A = B の結果が表示される", async ({ page }) => {
    await page.getByLabel("比較バージョン A").fill("1.0.0");
    await page.getByLabel("比較バージョン B").fill("1.0.0");
    await expect(page.getByText("=")).toBeVisible();
  });

  test("バージョン比較: A < B の結果が表示される", async ({ page }) => {
    await page.getByLabel("比較バージョン A").fill("1.0.0");
    await page.getByLabel("比較バージョン B").fill("2.0.0");
    await expect(page.getByText("<")).toBeVisible();
  });

  test("範囲チェック: 満たす場合に成功メッセージが表示される", async ({ page }) => {
    await page.getByLabel("チェックするバージョン").fill("1.5.0");
    await page.getByLabel("範囲式").fill(">=1.0.0");
    await expect(page.getByText(/を満たします/)).toBeVisible();
  });

  test("範囲チェック: 満たさない場合にエラーメッセージが表示される", async ({ page }) => {
    await page.getByLabel("チェックするバージョン").fill("0.9.0");
    await page.getByLabel("範囲式").fill(">=1.0.0");
    await expect(page.getByText(/を満たしません/)).toBeVisible();
  });

  test("範囲チェック: ^ 演算子ボタンが機能する", async ({ page }) => {
    await page.getByLabel("チェックするバージョン").fill("1.5.0");
    await page.getByLabel("^ (互換) を入力").click();
    const rangeInput = page.getByLabel("範囲式");
    await expect(rangeInput).toHaveValue(/^\^/);
  });

  test("次バージョン: patch/minor/major インクリメントが表示される", async ({ page }) => {
    await page.getByLabel("バージョン文字列").fill("1.2.3");
    await expect(page.getByText("1.2.4")).toBeVisible();
    await expect(page.getByText("1.3.0")).toBeVisible();
    await expect(page.getByText("2.0.0")).toBeVisible();
  });

  test("アクセシビリティ: 主要な入力要素にラベルが設定されている", async ({ page }) => {
    await expect(page.getByLabel("バージョン文字列")).toBeVisible();
    await expect(page.getByLabel("比較バージョン A")).toBeVisible();
    await expect(page.getByLabel("比較バージョン B")).toBeVisible();
    await expect(page.getByLabel("チェックするバージョン")).toBeVisible();
    await expect(page.getByLabel("範囲式")).toBeVisible();
  });
});
