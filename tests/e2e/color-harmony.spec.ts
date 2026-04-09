import { test, expect } from "@playwright/test";

test.describe("カラーハーモニーツール", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-harmony");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/カラーハーモニー/);
  });

  test("カラーピッカーが表示される", async ({ page }) => {
    const colorPicker = page.locator("input[type='color']");
    await expect(colorPicker).toBeVisible();
  });

  test("HEXテキスト入力が表示される", async ({ page }) => {
    const hexInput = page.locator("#ch-hex-input");
    await expect(hexInput).toBeVisible();
    const value = await hexInput.inputValue();
    expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/i);
  });

  test("5つのスキームセクションが表示される", async ({ page }) => {
    const sections = page.locator(".ch-scheme-section");
    await expect(sections).toHaveCount(5);
  });

  test("補色スキームに2色のスウォッチが表示される", async ({ page }) => {
    const complementarySection = page
      .locator(".ch-scheme-section")
      .filter({ hasText: "補色" })
      .first();
    const swatches = complementarySection.locator(".ch-swatch");
    await expect(swatches).toHaveCount(2);
  });

  test("類似色スキームに5色のスウォッチが表示される", async ({ page }) => {
    const analogousSection = page
      .locator(".ch-scheme-section")
      .filter({ hasText: "類似色" })
      .first();
    const swatches = analogousSection.locator(".ch-swatch");
    await expect(swatches).toHaveCount(5);
  });

  test("トライアドスキームに3色のスウォッチが表示される", async ({ page }) => {
    const triadicSection = page
      .locator(".ch-scheme-section")
      .filter({ hasText: "トライアド" })
      .first();
    const swatches = triadicSection.locator(".ch-swatch");
    await expect(swatches).toHaveCount(3);
  });

  test("テトラッドスキームに4色のスウォッチが表示される", async ({ page }) => {
    const tetradicSection = page
      .locator(".ch-scheme-section")
      .filter({ hasText: "テトラッド" })
      .first();
    const swatches = tetradicSection.locator(".ch-swatch");
    await expect(swatches).toHaveCount(4);
  });

  test("各スウォッチにHEXコードが表示される", async ({ page }) => {
    const hexDisplay = page.locator(".ch-swatch-hex").first();
    const text = await hexDisplay.textContent();
    expect(text).toMatch(/^#[0-9A-Fa-f]{6}$/i);
  });

  test("各スウォッチにHEX/RGB/HSLコピーボタンがある", async ({ page }) => {
    const firstSwatch = page.locator(".ch-swatch").first();
    await expect(firstSwatch.locator(".ch-copy-btn", { hasText: "HEX" })).toBeVisible();
    await expect(firstSwatch.locator(".ch-copy-btn", { hasText: "RGB" })).toBeVisible();
    await expect(firstSwatch.locator(".ch-copy-btn", { hasText: "HSL" })).toBeVisible();
  });

  test("CSS変数コピーボタンが5つある", async ({ page }) => {
    const exportBtns = page.locator(".ch-export-btn");
    await expect(exportBtns).toHaveCount(5);
  });

  test("BASEバッジが表示される", async ({ page }) => {
    const baseBadge = page.locator(".ch-swatch-base-badge");
    await expect(baseBadge.first()).toBeVisible();
    await expect(baseBadge.first()).toContainText("BASE");
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tipsSection = page.locator(".info-box").first();
    await expect(tipsSection).toBeVisible();
  });
});
