import { test, expect } from "@playwright/test";

test.describe("色温度変換ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-temperature");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/色温度変換/);
  });

  test("ケルビン入力欄が表示される", async ({ page }) => {
    const input = page.locator("#ct-input");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("6500");
  });

  test("スライダーが表示される", async ({ page }) => {
    const slider = page.locator("#ct-slider");
    await expect(slider).toBeVisible();
  });

  test("カラースウォッチが表示される", async ({ page }) => {
    const swatch = page.locator(".ct-swatch");
    await expect(swatch).toBeVisible();
  });

  test("HEX値が表示される", async ({ page }) => {
    const hexValue = page
      .locator(".ct-value-row")
      .filter({ hasText: "HEX" })
      .locator(".ct-value-code");
    await expect(hexValue).toBeVisible();
    await expect(hexValue).toContainText("#");
  });

  test("RGB値が表示される", async ({ page }) => {
    const rgbValue = page
      .locator(".ct-value-row")
      .filter({ hasText: "RGB" })
      .locator(".ct-value-code");
    await expect(rgbValue).toBeVisible();
    await expect(rgbValue).toContainText("rgb(");
  });

  test("プリセットボタンが表示される", async ({ page }) => {
    const presets = page.locator(".ct-preset-btn");
    await expect(presets).toHaveCount(9);
  });

  test("プリセットボタンをクリックするとケルビン値が変わる", async ({ page }) => {
    // 白熱電球 2700K をクリック
    const incandescent = page.locator(".ct-preset-btn").filter({ hasText: "白熱電球" });
    await incandescent.click();

    const input = page.locator("#ct-input");
    await expect(input).toHaveValue("2700");
  });

  test("ケルビン入力を変更するとHEX値が更新される", async ({ page }) => {
    const input = page.locator("#ct-input");

    // 初期値 (6500K) の HEX を取得
    const hexBefore = await page
      .locator(".ct-value-row")
      .filter({ hasText: "HEX" })
      .locator(".ct-value-code")
      .textContent();

    // 低い温度に変更
    await input.fill("2000");
    await input.press("Tab");

    const hexAfter = await page
      .locator(".ct-value-row")
      .filter({ hasText: "HEX" })
      .locator(".ct-value-code")
      .textContent();
    expect(hexBefore).not.toBe(hexAfter);
  });

  test("HEXコピーボタンが存在する", async ({ page }) => {
    const copyBtn = page
      .locator(".ct-value-row")
      .filter({ hasText: "HEX" })
      .locator(".ct-copy-btn");
    await expect(copyBtn).toBeVisible();
  });

  test("プリセット「ろうそく」ボタンが存在する", async ({ page }) => {
    const candle = page.locator(".ct-preset-btn").filter({ hasText: "ろうそく" });
    await expect(candle).toBeVisible();
  });

  test("スペクトルバーが表示される", async ({ page }) => {
    const spectrum = page.locator(".ct-spectrum-bar");
    await expect(spectrum).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tips = page.locator(".tips-card").or(page.locator('[class*="tips"]'));
    await expect(tips.first()).toBeVisible();
  });
});
