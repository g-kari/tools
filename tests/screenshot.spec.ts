import { test, expect } from '@playwright/test';

test.describe('Screenshot tests', () => {
  test('capture homepage screenshot', async ({ page }) => {
    await page.goto('/');

    // Wait for fonts to load
    await page.waitForLoadState('networkidle');

    // Verify the page loaded correctly
    await expect(page.locator('h1')).toContainText('Unicode エスケープ変換ツール');

    // Take full page screenshot
    await page.screenshot({
      path: 'screenshots/homepage.png',
      fullPage: true,
    });
  });

  test('capture mobile homepage screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Unicode エスケープ変換ツール');

    await page.screenshot({
      path: 'screenshots/homepage-mobile.png',
      fullPage: true,
    });
  });

  test('capture 404 page screenshot', async ({ page }) => {
    await page.goto('/nonexistent-page');

    await page.waitForLoadState('networkidle');

    // Verify 404 page loaded
    await expect(page.locator('h1')).toContainText('404');

    await page.screenshot({
      path: 'screenshots/404-page.png',
      fullPage: true,
    });
  });
});
