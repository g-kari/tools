import { test, expect } from '@playwright/test';

test.describe('Unicode Escape Converter - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    // This test prevents the "undefined" bug from happening again
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Unicode エスケープ変換ツール');
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Unicode エスケープ変換ツール');
  });

  test('should have input and output textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');

    await expect(inputTextarea).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test('should have all action buttons', async ({ page }) => {
    const encodeButton = page.locator('button.btn-encode');
    const decodeButton = page.locator('button.btn-decode');
    const clearButton = page.locator('button.btn-clear');

    await expect(encodeButton).toBeVisible();
    await expect(decodeButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test('should encode text to Unicode escape', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-encode');

    await inputTextarea.fill('こんにちは');
    await encodeButton.click();

    const output = await outputTextarea.inputValue();
    expect(output).toContain('\\u');
    expect(output).not.toBe('');
  });

  test('should decode Unicode escape to text', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const decodeButton = page.locator('button.btn-decode');

    await inputTextarea.fill('\\u3053\\u3093\\u306b\\u3061\\u306f');
    await decodeButton.click();

    const output = await outputTextarea.inputValue();
    expect(output).toBe('こんにちは');
  });

  test('should clear both textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-encode');
    const clearButton = page.locator('button.btn-clear');

    await inputTextarea.fill('テスト');
    await encodeButton.click();

    // Verify output has content
    await expect(outputTextarea).not.toHaveValue('');

    // Click clear
    await clearButton.click();

    // Both should be empty
    await expect(inputTextarea).toHaveValue('');
    await expect(outputTextarea).toHaveValue('');
  });

  test('should show alert when encoding empty input', async ({ page }) => {
    const encodeButton = page.locator('button.btn-encode');

    // Set up dialog handler
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('テキストを入力してください');
      await dialog.accept();
    });

    await encodeButton.click();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for ARIA labels
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[aria-live="polite"]')).toBeAttached();

    // Check for skip link
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions with \\uXXXX format', async ({ page }) => {
    // Verify the escaped backslash is rendered correctly (not as undefined)
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('\\uXXXX');
    expect(usageText).not.toContain('undefined');
  });
});

test.describe('404 Page - E2E Tests', () => {
  test('should display 404 page for unknown routes', async ({ page }) => {
    const response = await page.goto('/nonexistent-page');

    expect(response?.status()).toBe(404);
  });

  test('should show 404 heading and message', async ({ page }) => {
    await page.goto('/nonexistent-page');

    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('h2')).toContainText('ページが見つかりません');
  });

  test('should have link back to home', async ({ page }) => {
    await page.goto('/nonexistent-page');

    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toContainText('ホームに戻る');
  });

  test('should navigate back to home when clicking the link', async ({ page }) => {
    await page.goto('/nonexistent-page');

    await page.click('a[href="/"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Unicode エスケープ変換ツール');
  });

  test('404 page should not contain undefined', async ({ page }) => {
    await page.goto('/nonexistent-page');

    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });
});
