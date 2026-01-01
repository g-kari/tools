import { test, expect } from '@playwright/test';

test.describe('Hash Generator - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/hash');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/ハッシュ生成/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Web ツール集');
  });

  test('should have input, salt, algorithm selector and output textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const saltInput = page.locator('#salt');
    const algorithmSelect = page.locator('#algorithm');
    const outputTextarea = page.locator('#outputHash');

    await expect(inputTextarea).toBeVisible();
    await expect(saltInput).toBeVisible();
    await expect(algorithmSelect).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test('should have all action buttons', async ({ page }) => {
    const generateButton = page.locator('button.btn-primary').first();
    const copyButton = page.locator('button.btn-secondary').first();
    const clearButton = page.locator('button.btn-clear');

    await expect(generateButton).toBeVisible();
    await expect(copyButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test('should generate MD5 hash', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const algorithmSelect = page.locator('#algorithm');
    const outputTextarea = page.locator('#outputHash');
    const generateButton = page.locator('button.btn-primary').first();

    await algorithmSelect.selectOption('MD5');
    await inputTextarea.fill('hello');
    await generateButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    expect(output).toBe('5d41402abc4b2a76b9719d911017c592');
    expect(output).toHaveLength(32); // MD5 is 32 hex chars
  });

  test('should generate SHA-256 hash', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const algorithmSelect = page.locator('#algorithm');
    const outputTextarea = page.locator('#outputHash');
    const generateButton = page.locator('button.btn-primary').first();

    await algorithmSelect.selectOption('SHA-256');
    await inputTextarea.fill('hello');
    await generateButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    expect(output).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    expect(output).toHaveLength(64); // SHA-256 is 64 hex chars
  });

  test('should generate SHA-512 hash', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const algorithmSelect = page.locator('#algorithm');
    const outputTextarea = page.locator('#outputHash');
    const generateButton = page.locator('button.btn-primary').first();

    await algorithmSelect.selectOption('SHA-512');
    await inputTextarea.fill('hello');
    await generateButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    expect(output).toHaveLength(128); // SHA-512 is 128 hex chars
  });

  test('should generate different hash with salt', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const saltInput = page.locator('#salt');
    const algorithmSelect = page.locator('#algorithm');
    const outputTextarea = page.locator('#outputHash');
    const generateButton = page.locator('button.btn-primary').first();

    await algorithmSelect.selectOption('SHA-256');
    await inputTextarea.fill('password');

    // Generate without salt
    await generateButton.click();
    await expect(outputTextarea).not.toHaveValue('');
    const hashWithoutSalt = await outputTextarea.inputValue();

    // Clear and generate with salt
    const clearButton = page.locator('button.btn-clear');
    await clearButton.click();

    await inputTextarea.fill('password');
    await saltInput.fill('salt123');
    await generateButton.click();

    await expect(outputTextarea).not.toHaveValue('');
    const hashWithSalt = await outputTextarea.inputValue();

    // Hashes should be different
    expect(hashWithSalt).not.toBe(hashWithoutSalt);
  });

  test('should clear all fields', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const saltInput = page.locator('#salt');
    const outputTextarea = page.locator('#outputHash');
    const generateButton = page.locator('button.btn-primary').first();
    const clearButton = page.locator('button.btn-clear');

    await inputTextarea.fill('test');
    await saltInput.fill('salt');
    await generateButton.click();

    // Wait for output to have content
    await expect(outputTextarea).not.toHaveValue('');

    // Click clear
    await clearButton.click();

    // All fields should be empty
    await expect(inputTextarea).toHaveValue('');
    await expect(saltInput).toHaveValue('');
    await expect(outputTextarea).toHaveValue('');
  });

  test('should show toast when generating hash with empty input', async ({ page }) => {
    const generateButton = page.locator('button.btn-primary').first();

    await generateButton.click();

    // Check for toast notification
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('テキストを入力してください');
  });

  test('should disable copy button when no hash is generated', async ({ page }) => {
    const copyButton = page.locator('button.btn-secondary').first();
    await expect(copyButton).toBeDisabled();
  });

  test('should enable copy button after hash generation', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const generateButton = page.locator('button.btn-primary').first();
    const copyButton = page.locator('button.btn-secondary').first();

    await inputTextarea.fill('test');
    await generateButton.click();

    await expect(copyButton).toBeEnabled();
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
    expect(usageText).toContain('使い方');
    expect(usageText).not.toContain('undefined');
  });

  test('should display security warning about MD5 and SHA-1', async ({ page }) => {
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('セキュリティ');
    expect(usageText).toContain('MD5');
    expect(usageText).toContain('SHA-1');
  });

  test('should handle Japanese text correctly', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputHash');
    const generateButton = page.locator('button.btn-primary').first();

    await inputTextarea.fill('こんにちは');
    await generateButton.click();

    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    // Should only contain hex characters
    expect(output).toMatch(/^[0-9a-f]+$/);
  });

  test('should handle emoji correctly', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputHash');
    const generateButton = page.locator('button.btn-primary').first();

    await inputTextarea.fill('😀🎉');
    await generateButton.click();

    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    // Should only contain hex characters
    expect(output).toMatch(/^[0-9a-f]+$/);
  });

  test('should switch between different algorithms', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const algorithmSelect = page.locator('#algorithm');
    const outputTextarea = page.locator('#outputHash');
    const generateButton = page.locator('button.btn-primary').first();

    await inputTextarea.fill('test');

    // Test MD5
    await algorithmSelect.selectOption('MD5');
    await generateButton.click();
    await expect(outputTextarea).not.toHaveValue('');
    const md5Hash = await outputTextarea.inputValue();
    expect(md5Hash).toHaveLength(32);

    // Test SHA-256
    await algorithmSelect.selectOption('SHA-256');
    await generateButton.click();
    await expect(outputTextarea).not.toHaveValue('');
    const sha256Hash = await outputTextarea.inputValue();
    expect(sha256Hash).toHaveLength(64);

    // Hashes should be different
    expect(md5Hash).not.toBe(sha256Hash);
  });

  test('should have monospace font for output', async ({ page }) => {
    const outputTextarea = page.locator('#outputHash');
    const fontFamily = await outputTextarea.evaluate((el) =>
      window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily).toContain('monospace');
  });
});
