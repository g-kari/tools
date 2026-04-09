import { test, expect } from "@playwright/test";

/**
 * AdBannerコンポーネントのE2Eテスト
 *
 * AdBannerコンポーネントがページ上で正しくレンダリングされることを検証します。
 * テスト環境ではGoogle AdSenseのスクリプトは読み込まれませんが、
 * コンポーネントの構造・アクセシビリティ・表示を確認します。
 */
test.describe("AdBanner - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
  });

  test("トップページに広告コンテナ(.ad-banner-wrapper)が存在すること", async ({ page }) => {
    const adBannerWrapper = page.locator(".ad-banner-wrapper").first();
    await expect(adBannerWrapper).toBeAttached();
  });

  test("広告ラベル「広告」テキストが表示されていること", async ({ page }) => {
    // AdBannerコンポーネントは .ad-banner-label クラスの <p> 要素に「広告」テキストを表示する
    const adLabel = page.locator(".ad-banner-label").first();
    await expect(adLabel).toBeAttached();
    await expect(adLabel).toContainText("広告");
  });

  test('広告コンテナにrole="complementary"が設定されていること', async ({ page }) => {
    // AdBannerコンポーネントは <section role="complementary"> を使用する
    const complementarySection = page.locator('[role="complementary"]').first();
    await expect(complementarySection).toBeAttached();
  });

  test("ins.adsbygoogle要素が存在すること", async ({ page }) => {
    // AdSense広告の <ins class="adsbygoogle"> 要素が存在することを確認
    const insElement = page.locator("ins.adsbygoogle").first();
    await expect(insElement).toBeAttached();
  });

  test("広告コンテナがメインコンテンツ(#main-content)内に存在すること", async ({ page }) => {
    // AdBannerはメインコンテンツ内に配置される
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeAttached();

    const adBannerInMain = mainContent.locator(".ad-banner-wrapper").first();
    await expect(adBannerInMain).toBeAttached();
  });

  test("モバイルビューポート(375x667)で広告コンテナが正常に表示されること", async ({ page }) => {
    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    // 広告コンテナがビューポート内に存在することを確認
    const adBannerWrapper = page.locator(".ad-banner-wrapper").first();
    await expect(adBannerWrapper).toBeAttached();

    // 可視性の確認（display:none等で非表示になっていないこと）
    const isVisible = await adBannerWrapper.isVisible();
    expect(isVisible).toBe(true);
  });
});
