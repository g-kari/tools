import { test, expect } from '@playwright/test';

test.describe('robots.txtジェネレーター - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/robots-txt');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/robots\.txt/);
  });

  test('should show generated robots.txt output', async ({ page }) => {
    const output = page.locator('textarea, pre, .output, [class*="output"], [class*="robots"]').first();
    await expect(output).toBeVisible();
  });

  test('should contain User-agent in output', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('User-agent');
  });

  test('should have copy button', async ({ page }) => {
    const copyBtn = page.locator('button').filter({ hasText: /コピー/ });
    await expect(copyBtn.first()).toBeVisible();
  });

  test('should have download button', async ({ page }) => {
    const downloadBtn = page.locator('button').filter({ hasText: /ダウンロード/ });
    await expect(downloadBtn.first()).toBeVisible();
  });

  test('should show common user agent options', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Googlebot');
  });

  test('should have add rule functionality', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /追加/ }).first();
    await expect(addBtn).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test('should have navigation link in category dropdown', async ({ page }) => {
    await page.goto('/');
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '生成' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/robots-txt"]');
    await expect(link).toBeVisible();
  });
});
