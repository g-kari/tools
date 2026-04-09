import { test, expect } from "@playwright/test";

test.describe("マンデルブロット集合ビジュアライザー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mandelbrot");
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "マンデルブロット集合ビジュアライザー" }),
    ).toBeVisible();
  });

  test("キャンバスが表示される", async ({ page }) => {
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("情報パネルにズーム倍率・座標範囲が表示される", async ({ page }) => {
    await expect(page.getByText("ズーム倍率")).toBeVisible();
    await expect(page.getByText("実軸範囲")).toBeVisible();
    await expect(page.getByText("虚軸範囲")).toBeVisible();
  });

  test("カラースキームのボタンが全種表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "クラシック" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ファイア" })).toBeVisible();
    await expect(page.getByRole("button", { name: "オーシャン" })).toBeVisible();
    await expect(page.getByRole("button", { name: "グレー" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ネオン" })).toBeVisible();
  });

  test("カラースキームを切り替えられる", async ({ page }) => {
    const fireBtn = page.getByRole("button", { name: "ファイア" });
    await fireBtn.click();
    await expect(fireBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("プリセットボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /全体像/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /海馬の谷/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /ミニブロット/ })).toBeVisible();
  });

  test("プリセットをクリックすると座標が変わる", async ({ page }) => {
    // 全体像から海馬の谷へ移動
    const initialText = await page.locator(".mandelbrot__info").textContent();
    await page.getByRole("button", { name: /海馬の谷/ }).click();
    // 描画完了を少し待つ
    await page.waitForTimeout(500);
    const newText = await page.locator(".mandelbrot__info").textContent();
    expect(newText).not.toBe(initialText);
  });

  test("リセットボタンでデフォルト表示に戻る", async ({ page }) => {
    // プリセットに移動してからリセット
    await page.getByRole("button", { name: /スパイラル/ }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "リセット" }).click();
    await page.waitForTimeout(200);
    await expect(page.getByText("×1.0")).toBeVisible();
  });

  test("最大反復回数スライダーが動作する", async ({ page }) => {
    const slider = page.getByRole("slider", { name: "最大反復回数" });
    await expect(slider).toBeVisible();
    await expect(page.getByText("128")).toBeVisible();
  });

  test("操作ヒントが表示される", async ({ page }) => {
    await expect(page.getByText(/クリック.*ズームイン/)).toBeVisible();
    await expect(page.getByText(/右クリック.*ズームアウト/)).toBeVisible();
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/マンデルブロット集合ビジュアライザー/);
  });

  test("トップページのカタログにリンクが表示される", async ({ page }) => {
    await page.goto("/top");
    await expect(
      page.getByRole("link", { name: /マンデルブロット集合ビジュアライザー/ }),
    ).toBeVisible();
  });
});
