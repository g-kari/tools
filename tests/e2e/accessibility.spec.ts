import { test, expect } from '@playwright/test';

test.describe('Accessibility - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test('should have aria-live status element on main page', async ({ page }) => {
    await page.goto('/');
    const statusElement = page.locator('#status-message');
    await expect(statusElement).toBeAttached();
  });

  test('should have aria-live status element on WHOIS page', async ({ page }) => {
    await page.goto('/whois');
    const statusElement = page.locator('#status-message');
    await expect(statusElement).toBeAttached();
  });

  test('should have proper ARIA labels on input fields', async ({ page }) => {
    await page.goto('/');
    const inputTextarea = page.locator('#inputText');
    await expect(inputTextarea).toHaveAttribute('aria-label');
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');
    const label = page.locator('label[for="inputText"]');
    await expect(label).toBeVisible();
  });

  test('should have navigation with aria-label', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav[aria-label]');
    await expect(nav).toBeVisible();
  });

  test('should have skip link for keyboard navigation', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('should have main content target for skip link', async ({ page }) => {
    await page.goto('/');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });
});
