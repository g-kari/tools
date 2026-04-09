import { test, expect } from "@playwright/test";

test.describe("カラーフォーマット変換ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-converter");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/カラーフォーマット変換/);
  });

  test("カラープレビューが表示される", async ({ page }) => {
    const swatch = page.getByRole("img", { name: /現在の色/ });
    await expect(swatch).toBeVisible();
  });

  test("フォーマットセクションが表示される", async ({ page }) => {
    const section = page
      .getByRole("region", { name: /カラーフォーマット/ })
      .or(page.locator(".ccv-formats-section"));
    await expect(section).toBeVisible();

    // 各フォーマットバッジが表示される
    for (const label of ["HEX", "RGB", "HSL", "HSV", "CMYK", "OKLCH"]) {
      await expect(page.locator(".ccv-format-badge", { hasText: label })).toBeVisible();
    }
  });

  test("HEX入力欄に値を入力すると他のフォーマットが更新される", async ({ page }) => {
    const hexInput = page.locator("#ccv-hex-input");
    await hexInput.fill("#FF0000");

    // RGB値が更新されること（R=255）
    const rInput = page.locator("#ccv-rgb-r");
    await expect(rInput).toHaveValue("255");

    // G,Bは0
    const gInput = page.locator("#ccv-rgb-g");
    await expect(gInput).toHaveValue("0");
    const bInput = page.locator("#ccv-rgb-b");
    await expect(bInput).toHaveValue("0");
  });

  test("RGB入力を変更するとHEXが更新される", async ({ page }) => {
    const rInput = page.locator("#ccv-rgb-r");
    await rInput.fill("255");
    await rInput.press("Tab");

    const gInput = page.locator("#ccv-rgb-g");
    await gInput.fill("0");
    await gInput.press("Tab");

    const bInput = page.locator("#ccv-rgb-b");
    await bInput.fill("0");
    await bInput.press("Tab");

    // HEX値がFF0000に更新される
    const hexValue = page.locator(".ccv-format-value").first();
    await expect(hexValue).toContainText("FF0000");
  });

  test("無効なHEXを入力するとエラーメッセージが表示される", async ({ page }) => {
    const hexInput = page.locator("#ccv-hex-input");
    await hexInput.fill("#GGGGGG");

    const errorMsg = page.locator(".ccv-error-msg");
    await expect(errorMsg).toBeVisible();
  });

  test("コピーボタンが各フォーマットに存在する", async ({ page }) => {
    const copyBtns = page.locator(".ccv-copy-btn");
    // HEX, RGB, HSL, HSV, CMYK, OKLCH の6つ
    await expect(copyBtns).toHaveCount(6);
  });

  test("Tips カードが表示される", async ({ page }) => {
    const tips = page.locator(".tips-card").or(page.getByText("使い方"));
    await expect(tips.first()).toBeVisible();
  });

  test("ナビゲーションに「カラーフォーマット変換」が表示される", async ({ page }) => {
    await page.goto("/top");
    const navLink = page.getByRole("link", { name: "カラーフォーマット変換" });
    await expect(navLink).toBeVisible();
  });
});
