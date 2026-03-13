import { test, expect } from '@playwright/test';

test.describe('Diff Checker - E2E Tests', () => {
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
    await page.goto('/diff');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/テキスト差分/);
  });

  test('should have two textareas for input', async ({ page }) => {
    const textareas = page.locator('textarea');
    await expect(textareas).toHaveCount(2);
  });

  test('should show diff results after comparing texts', async ({ page }) => {
    const textareas = page.locator('textarea');
    const oldTextarea = textareas.nth(0);
    const newTextarea = textareas.nth(1);

    await oldTextarea.fill('hello\nworld');
    await newTextarea.fill('hello\nJapan');

    const compareButton = page.locator('button.btn-primary');
    await compareButton.click();

    // 差分結果が表示されることを確認
    const resultArea = page.locator('.diff-result, .result-area, [class*="diff"]').first();
    await expect(resultArea).toBeVisible();
  });

  test('should clear textareas when clear button is clicked', async ({ page }) => {
    const textareas = page.locator('textarea');
    const oldTextarea = textareas.nth(0);
    const newTextarea = textareas.nth(1);

    await oldTextarea.fill('some text');
    await newTextarea.fill('other text');

    const clearButton = page.locator('button.btn-clear');
    await clearButton.click();

    await expect(oldTextarea).toHaveValue('');
    await expect(newTextarea).toHaveValue('');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should navigate to diff page from other pages via category', async ({ page }) => {
    await page.goto('/');
    await navigateViaCategory(page, '検証', '/diff');
    await expect(page).toHaveURL('/diff');
  });
});
