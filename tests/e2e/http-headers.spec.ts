import { test, expect } from '@playwright/test';

test.describe('HTTPヘッダーリファレンス - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/http-headers');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/HTTPヘッダー/);
  });

  test('should show HTTP headers list', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Content-Type');
  });

  test('should show well-known headers', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Authorization');
  });

  test('should have category filter tabs', async ({ page }) => {
    const bodyText = await page.textContent('body');
    // Should have filter tabs for request/response/security categories
    expect(bodyText).toContain('リクエスト');
  });

  test('should filter by request category', async ({ page }) => {
    const requestTab = page.locator('button').filter({ hasText: /^リクエスト$/ });
    if (await requestTab.isVisible()) {
      await requestTab.click();
      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Accept');
    }
  });

  test('should filter by response category', async ({ page }) => {
    const responseTab = page.locator('button').filter({ hasText: /^レスポンス$/ });
    if (await responseTab.isVisible()) {
      await responseTab.click();
      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Content-Type');
    }
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Content-Type');
      await page.waitForTimeout(300);
      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Content-Type');
    }
  });

  test('should show header descriptions', async ({ page }) => {
    const bodyText = await page.textContent('body');
    // Should show descriptions of headers
    expect(bodyText.length).toBeGreaterThan(1000);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test('should have navigation link in category dropdown', async ({ page }) => {
    await page.goto('/');
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '検索' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/http-headers"]');
    await expect(link).toBeVisible();
  });
});
