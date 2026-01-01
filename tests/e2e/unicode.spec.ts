import { test, expect } from '@playwright/test';

test.describe('Unicode Escape Converter - E2E Tests', () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Unicode/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Web ツール集');
  });

  test('should have input and output textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');

    await expect(inputTextarea).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test('should have all action buttons', async ({ page }) => {
    const encodeButton = page.locator('button.btn-primary').first();
    const decodeButton = page.locator('button.btn-secondary').first();
    const clearButton = page.locator('button.btn-clear');

    await expect(encodeButton).toBeVisible();
    await expect(decodeButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test('should encode text to Unicode escape', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-primary').first();

    await inputTextarea.fill('こんにちは');
    await encodeButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    expect(output).toContain('\\u');
  });

  test('should decode Unicode escape to text', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const decodeButton = page.locator('button.btn-secondary').first();

    await inputTextarea.fill('\\u3053\\u3093\\u306b\\u3061\\u306f');
    await decodeButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).toHaveValue('こんにちは');
  });

  test('should clear both textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-primary').first();
    const clearButton = page.locator('button.btn-clear');

    await inputTextarea.fill('テスト');
    await encodeButton.click();

    // Wait for output to have content
    await expect(outputTextarea).not.toHaveValue('');

    // Click clear
    await clearButton.click();

    // Both should be empty
    await expect(inputTextarea).toHaveValue('');
    await expect(outputTextarea).toHaveValue('');
  });

  test('should show toast when encoding empty input', async ({ page }) => {
    const encodeButton = page.locator('button.btn-primary').first();

    await encodeButton.click();

    // Check for toast notification
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('テキストを入力してください');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for ARIA roles
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Check for skip link
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions with \\uXXXX format', async ({ page }) => {
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('\\uXXXX');
    expect(usageText).not.toContain('undefined');
  });
});
