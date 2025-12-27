import { test, expect } from '@playwright/test';

test.describe('404 Not Found - E2E Tests', () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

  test('should display 404 page for undefined routes', async ({ page }) => {
    await page.goto('/nonexistent-route');
    const heading = page.locator('.not-found-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('404');
  });

  test('should display Japanese error message on 404 page', async ({ page }) => {
    await page.goto('/invalid-path');
    const title = page.locator('.not-found-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('ページが見つかりません');
  });

  test('should display explanation text on 404 page', async ({ page }) => {
    await page.goto('/missing');
    const message = page.locator('.not-found-message');
    await expect(message).toBeVisible();
    await expect(message).toContainText('お探しのページは存在しないか');
  });

  test('should have link back to home on 404 page', async ({ page }) => {
    await page.goto('/wrong-path');
    const homeLink = page.locator('.not-found-link');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toContainText('ホームに戻る');
  });

  test('should navigate to home when clicking the link on 404 page', async ({ page }) => {
    await page.goto('/some/deep/path');
    await page.click('.not-found-link');
    await expect(page).toHaveURL('/');
  });

  test('should have proper language attribute on 404 page', async ({ page }) => {
    await page.goto('/not-here');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ja');
  });

  test('should include accessibility features on 404 page', async ({ page }) => {
    await page.goto('/missing-page');
    await expect(page.locator('[role="banner"]').first()).toBeVisible();
    await expect(page.locator('[role="main"]').first()).toBeVisible();
    const skipLink = page.locator('.skip-link').first();
    await expect(skipLink).toBeAttached();
  });
});
