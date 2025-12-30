import { test, expect } from '@playwright/test';

test.describe('Server Environment - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

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
    await page.goto('/server-env');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/サーバー環境/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('サーバー環境情報');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions', async ({ page }) => {
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('サーバー環境情報とは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 情報カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('情報');
  });

  test('should navigate to Unicode page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/');
    await expect(page).toHaveURL('/');
  });

  test('should display environment info or error message after loading', async ({ page }) => {
    // Wait for loading to complete (either success or error)
    await Promise.race([
      page.waitForSelector('.env-results', { timeout: 8000 }),
      page.waitForSelector('.error-message', { timeout: 8000 }),
    ]).catch(() => {
      // If neither appears, the test will fail below
    });

    // Verify that loading is complete - either env results or error should be visible
    const envResults = page.locator('.env-results');
    const errorMessage = page.locator('.error-message');
    const isResultsVisible = await envResults.isVisible();
    const isErrorVisible = await errorMessage.isVisible();

    // One of them must be visible (mutually exclusive states)
    expect(isResultsVisible || isErrorVisible).toBe(true);
  });

  test('should have refresh button when results are displayed', async ({ page }) => {
    // Wait for loading to complete
    await Promise.race([
      page.waitForSelector('.env-results', { timeout: 8000 }),
      page.waitForSelector('.error-message', { timeout: 8000 }),
    ]).catch(() => {});

    // Check button only if results are displayed
    const envResults = page.locator('.env-results');
    if (await envResults.isVisible()) {
      const refreshButton = page.locator('button.btn-secondary');

      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toContainText('再取得');
    }
    // If results are not displayed (error case), test passes silently
  });

  test('should display environment category tables when loaded', async ({ page }) => {
    // Wait for results
    await Promise.race([
      page.waitForSelector('.env-results', { timeout: 8000 }),
      page.waitForSelector('.error-message', { timeout: 8000 }),
    ]).catch(() => {});

    const envResults = page.locator('.env-results');
    if (await envResults.isVisible()) {
      // Check that at least one category section is visible
      const categoryTitles = page.locator('.env-category-title');
      const count = await categoryTitles.count();
      expect(count).toBeGreaterThan(0);

      // Check that tables have proper structure
      const tables = page.locator('.env-table');
      const tableCount = await tables.count();
      expect(tableCount).toBeGreaterThan(0);
    }
  });
});
