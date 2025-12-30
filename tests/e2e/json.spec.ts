import { test, expect } from '@playwright/test';

test.describe('JSON Formatter - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

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
    await page.goto('/json');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/JSON/);
  });

  test('should have input and output textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');

    await expect(inputTextarea).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test('should have all action buttons', async ({ page }) => {
    const formatButton = page.locator('button.btn-primary');
    const minifyButton = page.locator('button.btn-secondary');
    const clearButton = page.locator('button.btn-clear');

    await expect(formatButton).toBeVisible();
    await expect(formatButton).toContainText('フォーマット');
    await expect(minifyButton).toBeVisible();
    await expect(minifyButton).toContainText('圧縮');
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toContainText('クリア');
  });

  test('should format JSON with indentation', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const formatButton = page.locator('button.btn-primary');

    await inputTextarea.fill('{"name":"太郎","age":30}');
    await formatButton.click();

    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    expect(output).toContain('"name": "太郎"');
    expect(output).toContain('\n');
  });

  test('should minify JSON', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const minifyButton = page.locator('button.btn-secondary');

    await inputTextarea.fill('{\n  "name": "太郎",\n  "age": 30\n}');
    await minifyButton.click();

    await expect(outputTextarea).toHaveValue('{"name":"太郎","age":30}');
  });

  test('should clear both textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const formatButton = page.locator('button.btn-primary');
    const clearButton = page.locator('button.btn-clear');

    await inputTextarea.fill('{"test":1}');
    await formatButton.click();

    await expect(outputTextarea).not.toHaveValue('');

    await clearButton.click();

    await expect(inputTextarea).toHaveValue('');
    await expect(outputTextarea).toHaveValue('');
  });

  test('should show error when formatting empty input', async ({ page }) => {
    const formatButton = page.locator('button.btn-primary');

    await formatButton.click();

    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('JSONを入力してください');
  });

  test('should show error when minifying empty input', async ({ page }) => {
    const minifyButton = page.locator('button.btn-secondary');

    await minifyButton.click();

    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('JSONを入力してください');
  });

  test('should show error for invalid JSON', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const formatButton = page.locator('button.btn-primary');

    await inputTextarea.fill('invalid json');
    await formatButton.click();

    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
  });

  test('should clear error when valid JSON is formatted', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const formatButton = page.locator('button.btn-primary');

    await inputTextarea.fill('invalid');
    await formatButton.click();

    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();

    await inputTextarea.fill('{"valid":true}');
    await formatButton.click();

    await expect(errorMessage).not.toBeVisible();
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
    expect(usageText).toContain('使い方');
    expect(usageText).toContain('フォーマット');
    expect(usageText).toContain('圧縮');
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation link to JSON formatter in category dropdown', async ({ page }) => {
    await page.goto('/');
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '変換' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const jsonLink = dropdown.locator('a[href="/json"]');
    await expect(jsonLink).toBeVisible();
    await expect(jsonLink).toContainText('JSON');
  });

  test('should navigate to JSON formatter from other pages via category', async ({ page }) => {
    await page.goto('/');
    await navigateViaCategory(page, '変換', '/json');
    await expect(page).toHaveURL('/json');
  });

  test('should show active state on category button when on json page', async ({ page }) => {
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('変換');
  });
});
