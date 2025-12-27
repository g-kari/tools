import { test, expect } from '@playwright/test';

test.describe('Server Environment - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

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

  test('should have navigation links including サーバー環境', async ({ page }) => {
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    const serverEnvLink = page.locator('.nav-links a[href="/server-env"]');
    await expect(serverEnvLink).toBeVisible();
    await expect(serverEnvLink).toContainText('サーバー環境');
  });

  test('should navigate to Unicode page when clicking the link', async ({ page }) => {
    await page.click('.nav-links a[href="/"]');
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
