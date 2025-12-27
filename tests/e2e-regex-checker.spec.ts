import { test, expect } from '@playwright/test';

test.describe('Regex Checker - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

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

  test('should show alert when testing with empty pattern', async ({ page }) => {
    const testButton = page.locator('button.btn-primary');

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('正規表現パターンを入力してください');
      await dialog.accept();
    });

    await testButton.click();
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
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('使い方');
    expect(usageText).toContain('フラグの説明');
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation link to regex checker', async ({ page }) => {
    await page.goto('/');
    const regexLink = page.locator('.nav-links a[href="/regex-checker"]');
    await expect(regexLink).toBeVisible();
    await expect(regexLink).toContainText('正規表現');
  });

  test('should navigate to regex checker from other pages', async ({ page }) => {
    await page.goto('/');
    await page.click('.nav-links a[href="/regex-checker"]');
    await expect(page).toHaveURL('/regex-checker');
  });

  test('should show active state on regex link when on regex-checker page', async ({ page }) => {
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('正規表現');
  });
});
