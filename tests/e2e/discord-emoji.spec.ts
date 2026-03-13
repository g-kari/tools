import { test, expect } from "@playwright/test";

test.describe("Discord絵文字コンバーター - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/discord-emoji");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しく読み込まれること", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("ページタイトルが正しいこと", async ({ page }) => {
    await expect(page).toHaveTitle(/Discord絵文字コンバーター/);
  });

  test("アップロードゾーンが表示されること", async ({ page }) => {
    const dropzone = page.locator(".dropzone");
    await expect(dropzone).toBeVisible();
  });

  test("ヘルプ情報が表示されること", async ({ page }) => {
    const infoBox = page.locator(".info-box").first();
    await expect(infoBox).toBeVisible();
    const text = await infoBox.textContent();
    expect(text).toContain("Discord絵文字コンバーターとは");
  });

  test("アクセシビリティ属性が設定されていること", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("画像カテゴリのナビゲーションにDiscord絵文字リンクが存在すること", async ({
    page,
  }) => {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "画像" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/discord-emoji"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("Discord絵文字");
  });

  test("現在のページが画像カテゴリでアクティブになっていること", async ({
    page,
  }) => {
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("画像");
  });
});
