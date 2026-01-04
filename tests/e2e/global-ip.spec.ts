import { test, expect } from '@playwright/test';

test.describe('Global IP Lookup - E2E Tests', () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(page: import('@playwright/test').Page, categoryName: string, linkHref: string) {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: categoryName });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/global-ip');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/グローバルIP/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('グローバルIPアドレス');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions', async ({ page }) => {
    const usageSection = page.locator('.info-box').first();
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('グローバルIPアドレスとは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have heading with id for accessibility', async ({ page }) => {
    const aboutHeading = page.locator('#about-tool-title');
    await expect(aboutHeading).toBeVisible();
    await expect(aboutHeading).toContainText('このツールについて');
  });

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 検索カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('検索');
  });

  test('should navigate to Unicode page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/');
    await expect(page).toHaveURL('/');
  });

  test('should display either IP address or error message after loading', async ({ page }) => {
    // Wait for loading to complete (either success or error)
    // Use a longer timeout since server function may take time
    await Promise.race([
      page.waitForSelector('.ip-display', { timeout: 8000 }),
      page.waitForSelector('.error-message', { timeout: 8000 }),
    ]).catch(() => {
      // If neither appears, the test will fail below
    });

    // Verify that loading is complete - either IP or error should be visible
    const ipDisplay = page.locator('.ip-display');
    const errorMessage = page.locator('.error-message');
    const isIpVisible = await ipDisplay.isVisible();
    const isErrorVisible = await errorMessage.isVisible();

    // One of them must be visible (mutually exclusive states)
    expect(isIpVisible || isErrorVisible).toBe(true);
  });

  test('should have copy and refresh buttons when IP is displayed', async ({ page }) => {
    // Wait for loading to complete
    await Promise.race([
      page.waitForSelector('.ip-display', { timeout: 8000 }),
      page.waitForSelector('.error-message', { timeout: 8000 }),
    ]).catch(() => {});

    // Check buttons only if IP is displayed
    const ipDisplay = page.locator('.ip-display');
    if (await ipDisplay.isVisible()) {
      const copyButton = page.locator('button.btn-primary');
      const refreshButton = page.locator('button.btn-secondary');

      await expect(copyButton).toBeVisible();
      await expect(copyButton).toContainText('コピー');
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toContainText('再取得');
    }
    // If IP is not displayed (error case), test passes silently
  });
});
