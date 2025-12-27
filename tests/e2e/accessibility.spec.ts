import { test, expect } from '@playwright/test';

test.describe('Accessibility - E2E Tests', () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

  test.describe('Main page accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
    });

    test('should have aria-live status element', async ({ page }) => {
      const statusElement = page.locator('#status-message');
      await expect(statusElement).toBeAttached();
    });

    test('should have proper ARIA labels on input fields', async ({ page }) => {
      const inputTextarea = page.locator('#inputText');
      await expect(inputTextarea).toHaveAttribute('aria-label');
    });

    test('should have proper form labels', async ({ page }) => {
      const label = page.locator('label[for="inputText"]');
      await expect(label).toBeVisible();
    });

    test('should have navigation with aria-label', async ({ page }) => {
      const nav = page.locator('nav[aria-label]');
      await expect(nav).toBeVisible();
    });

    test('should have skip link for keyboard navigation', async ({ page }) => {
      const skipLink = page.locator('.skip-link');
      await expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    test('should have main content target for skip link', async ({ page }) => {
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('WHOIS page accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/whois', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
    });

    test('should have aria-live status element', async ({ page }) => {
      const statusElement = page.locator('#status-message');
      await expect(statusElement).toBeAttached();
    });
  });
});
