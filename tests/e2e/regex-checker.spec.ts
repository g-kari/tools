import { test, expect } from '@playwright/test';

test.describe('Regex Checker - E2E Tests', () => {
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
    await page.goto('/regex-checker');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/正規表現/);
  });

  test('should have pattern and flags input fields', async ({ page }) => {
    const patternInput = page.locator('#patternInput');
    const flagsInput = page.locator('#flagsInput');
    await expect(patternInput).toBeVisible();
    await expect(flagsInput).toBeVisible();
  });

  test('should have test string textarea', async ({ page }) => {
    const testStringTextarea = page.locator('#testString');
    await expect(testStringTextarea).toBeVisible();
  });

  test('should have test and clear buttons', async ({ page }) => {
    const testButton = page.locator('button.btn-primary');
    const clearButton = page.locator('button.btn-clear');
    await expect(testButton).toBeVisible();
    await expect(testButton).toContainText('テスト');
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toContainText('クリア');
  });

  test('should show toast when testing with empty pattern', async ({ page }) => {
    const testButton = page.locator('button.btn-primary');

    await testButton.click();

    // Check for toast notification
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('正規表現パターンを入力してください');
  });

  test('should test a simple regex pattern', async ({ page }) => {
    const patternInput = page.locator('#patternInput');
    const testStringTextarea = page.locator('#testString');
    const testButton = page.locator('button.btn-primary');

    await patternInput.fill('\\d+');
    await testStringTextarea.fill('123 456 789');
    await page.locator('#flagsInput').fill('g');
    await testButton.click();

    const resultSection = page.locator('#result-title');
    await expect(resultSection).toBeVisible();
    await expect(resultSection).toContainText('テスト結果');
  });

  test('should clear all inputs when clear button is clicked', async ({ page }) => {
    const patternInput = page.locator('#patternInput');
    const flagsInput = page.locator('#flagsInput');
    const testStringTextarea = page.locator('#testString');
    const clearButton = page.locator('button.btn-clear');

    await patternInput.fill('test');
    await flagsInput.fill('g');
    await testStringTextarea.fill('test string');
    await clearButton.click();

    await expect(patternInput).toHaveValue('');
    await expect(flagsInput).toHaveValue('');
    await expect(testStringTextarea).toHaveValue('');
  });

  test('should show error for invalid regex', async ({ page }) => {
    const patternInput = page.locator('#patternInput');
    const testStringTextarea = page.locator('#testString');
    const testButton = page.locator('button.btn-primary');

    await patternInput.fill('[');
    await testStringTextarea.fill('test');
    await testButton.click();

    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
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
    expect(usageText).toContain('使い方');
    expect(usageText).toContain('フラグの説明');
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation link to regex checker in category dropdown', async ({ page }) => {
    await page.goto('/');
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '検証' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const regexLink = dropdown.locator('a[href="/regex-checker"]');
    await expect(regexLink).toBeVisible();
    await expect(regexLink).toContainText('正規表現');
  });

  test('should navigate to regex checker from other pages via category', async ({ page }) => {
    await page.goto('/');
    await navigateViaCategory(page, '検証', '/regex-checker');
    await expect(page).toHaveURL('/regex-checker');
  });

  test('should show active state on category button when on regex-checker page', async ({ page }) => {
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('検証');
  });
});
