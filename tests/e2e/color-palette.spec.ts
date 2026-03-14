import { test, expect } from "@playwright/test";

test.describe("Color Palette Generator - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-palette");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正常に読み込まれること", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示されること", async ({ page }) => {
    await expect(page).toHaveTitle(/カラーパレット生成/);
  });

  test("アクセシビリティ属性が正しく設定されていること", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("カラーピッカーが表示されること", async ({ page }) => {
    const colorPicker = page.locator("input[type='color']");
    await expect(colorPicker).toBeVisible();
  });

  test("HEXテキスト入力が表示されること", async ({ page }) => {
    const hexInput = page.locator(".cp-hex-input");
    await expect(hexInput).toBeVisible();
    await expect(hexInput).toHaveValue(/^#[0-9A-Fa-f]{6}$/);
  });

  test("アルゴリズム選択タブが表示されること", async ({ page }) => {
    const tabs = page.locator(".cp-algo-tab");
    const count = await tabs.count();
    expect(count).toBe(6);
  });

  test("初期状態でパレットが生成されること", async ({ page }) => {
    const swatches = page.locator(".cp-swatch");
    const count = await swatches.count();
    expect(count).toBeGreaterThan(0);
  });

  test("アルゴリズムタブをクリックするとパレットが更新されること", async ({
    page,
  }) => {
    // 三色タブをクリック
    const triadicTab = page.locator(".cp-algo-tab", { hasText: "三色" });
    await triadicTab.click();

    const swatches = page.locator(".cp-swatch");
    await expect(swatches).toHaveCount(3);
  });

  test("モノクロアルゴリズムで6色生成されること", async ({ page }) => {
    const monoTab = page.locator(".cp-algo-tab", { hasText: "モノクロ" });
    await monoTab.click();

    const swatches = page.locator(".cp-swatch");
    await expect(swatches).toHaveCount(6);
  });

  test("類似色アルゴリズムで5色生成されること", async ({ page }) => {
    const analogousTab = page.locator(".cp-algo-tab", { hasText: "類似色" });
    await analogousTab.click();

    const swatches = page.locator(".cp-swatch");
    await expect(swatches).toHaveCount(5);
  });

  test("各スウォッチにHEXコードが表示されること", async ({ page }) => {
    const hexDisplays = page.locator(".cp-swatch-hex");
    const count = await hexDisplays.count();
    expect(count).toBeGreaterThan(0);

    const firstHex = await hexDisplays.first().textContent();
    expect(firstHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test("各スウォッチにコピーボタンが存在すること", async ({ page }) => {
    const copyBtns = page.locator(".cp-swatch-copy-btn");
    const count = await copyBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test("CSS変数エクスポートボタンが存在すること", async ({ page }) => {
    const cssBtn = page.locator("button", { hasText: "CSS変数としてコピー" });
    await expect(cssBtn).toBeVisible();
  });

  test("JSONエクスポートボタンが存在すること", async ({ page }) => {
    const jsonBtn = page.locator("button", { hasText: "JSONとしてコピー" });
    await expect(jsonBtn).toBeVisible();
  });

  test("TipsCardが表示されること", async ({ page }) => {
    const tipsCard = page.locator(".info-box").first();
    await expect(tipsCard).toBeVisible();
  });

  test("ナビゲーションに「カラーパレット生成」リンクが存在すること", async ({
    page,
  }) => {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "画像" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/color-palette"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("カラーパレット生成");
  });
});
