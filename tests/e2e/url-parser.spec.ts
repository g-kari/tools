import { test, expect } from '@playwright/test';

test.describe('URLパーサー/ビルダー - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/url-parser');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/URLパーサー/);
  });

  test('should have mode tabs', async ({ page }) => {
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible();
    await expect(page.locator('[role="tab"]')).toHaveCount(2);
  });

  test('should show parser mode by default', async ({ page }) => {
    const parserTab = page.locator('[role="tab"]').filter({ hasText: 'パーサー' });
    await expect(parserTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should have URL input in parser mode', async ({ page }) => {
    await expect(page.locator('.url-parser-input')).toBeVisible();
  });

  test('should parse a valid URL', async ({ page }) => {
    await page.locator('.url-parser-input').fill('https://example.com/path?key=value#section');
    await page.locator('.url-parser-btn--primary').click();

    const resultGrid = page.locator('.url-parser-result-grid');
    await expect(resultGrid).toBeVisible();
    await expect(resultGrid).toContainText('https:');
    await expect(resultGrid).toContainText('example.com');
  });

  test('should show error for invalid URL', async ({ page }) => {
    await page.locator('.url-parser-input').fill('not-a-valid-url');
    await page.locator('.url-parser-btn--primary').click();

    const error = page.locator('.error-message');
    await expect(error).toBeVisible();
  });

  test('should parse query parameters', async ({ page }) => {
    await page.locator('.url-parser-input').fill('https://example.com?page=1&limit=10');
    await page.locator('.url-parser-btn--primary').click();

    const queryTable = page.locator('.url-parser-query-table');
    await expect(queryTable).toBeVisible();
    await expect(queryTable).toContainText('page');
    await expect(queryTable).toContainText('limit');
  });

  test('should show quick example chips', async ({ page }) => {
    const chips = page.locator('.url-parser-chips');
    await expect(chips).toBeVisible();
    const chipButtons = chips.locator('.url-parser-chip');
    await expect(chipButtons).toHaveCount(4);
  });

  test('should load sample URL when chip is clicked', async ({ page }) => {
    const firstChip = page.locator('.url-parser-chip').first();
    await firstChip.click();
    const inputValue = await page.locator('.url-parser-input').inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
  });

  test('should switch to builder mode', async ({ page }) => {
    const builderTab = page.locator('[role="tab"]').filter({ hasText: 'ビルダー' });
    await builderTab.click();
    await expect(builderTab).toHaveAttribute('aria-selected', 'true');

    await expect(page.locator('#build-hostname')).toBeVisible();
  });

  test('should build a URL in builder mode', async ({ page }) => {
    const builderTab = page.locator('[role="tab"]').filter({ hasText: 'ビルダー' });
    await builderTab.click();

    await page.locator('#build-hostname').fill('example.com');
    await page.locator('button[aria-label="URLを生成"]').click();

    const resultUrl = page.locator('.url-parser-result-url-value');
    await expect(resultUrl).toContainText('example.com');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test('should have navigation link in category dropdown', async ({ page }) => {
    await page.goto('/');
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '変換' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/url-parser"]');
    await expect(link).toBeVisible();
  });
});
