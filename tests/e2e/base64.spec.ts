import { test, expect } from '@playwright/test';

test.describe('Base64 Encode/Decode - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/base64');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Base64/);
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

  test('should encode text to Base64 format', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-primary').first();

    await inputTextarea.fill('こんにちは 世界');
    await encodeButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    // Base64 encoded string should only contain A-Za-z0-9+/=
    expect(output).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  test('should decode Base64 encoded text', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const decodeButton = page.locator('button.btn-secondary').first();

    await inputTextarea.fill('44GT44KT44Gr44Gh44Gv');
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

  test('should display usage instructions', async ({ page }) => {
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('Base64');
    expect(usageText).not.toContain('undefined');
  });

  test('should encode ASCII text correctly', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-primary').first();

    await inputTextarea.fill('Hello World');
    await encodeButton.click();

    await expect(outputTextarea).toHaveValue('SGVsbG8gV29ybGQ=');
  });

  test('should decode ASCII Base64 correctly', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const decodeButton = page.locator('button.btn-secondary').first();

    await inputTextarea.fill('SGVsbG8gV29ybGQ=');
    await decodeButton.click();

    await expect(outputTextarea).toHaveValue('Hello World');
  });

  test('should handle round-trip conversion', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-primary').first();
    const decodeButton = page.locator('button.btn-secondary').first();

    const originalText = 'Hello 世界 123 🎉';

    // Encode
    await inputTextarea.fill(originalText);
    await encodeButton.click();

    // Wait for encoding
    await expect(outputTextarea).not.toHaveValue('');
    const encoded = await outputTextarea.inputValue();

    // Now decode
    await inputTextarea.fill(encoded);
    await decodeButton.click();

    // Should get back original text
    await expect(outputTextarea).toHaveValue(originalText);
  });

  test('should show alert when decoding invalid Base64', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const decodeButton = page.locator('button.btn-secondary').first();

    await inputTextarea.fill('invalid!!!');
    await decodeButton.click();

    // Check for toast notification
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('無効なBase64文字列です');
  });
});
