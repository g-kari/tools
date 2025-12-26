import { test, expect } from '@playwright/test';

test.describe('Unicode Escape Converter - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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

    const output = await outputTextarea.inputValue();
    expect(output).toContain('\\u');
    expect(output).not.toBe('');
  });

  test('should decode Unicode escape to text', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const decodeButton = page.locator('button.btn-secondary').first();

    await inputTextarea.fill('\\u3053\\u3093\\u306b\\u3061\\u306f');
    await decodeButton.click();

    const output = await outputTextarea.inputValue();
    expect(output).toBe('こんにちは');
  });

  test('should clear both textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-primary').first();
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
    const encodeButton = page.locator('button.btn-primary').first();

    // Set up dialog handler
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('テキストを入力してください');
      await dialog.accept();
    });

    await encodeButton.click();
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

test.describe('WHOIS Lookup - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/whois');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/WHOIS/);
  });

  test('should have domain input field', async ({ page }) => {
    const domainInput = page.locator('#domainInput');
    await expect(domainInput).toBeVisible();
  });

  test('should have search button', async ({ page }) => {
    const searchButton = page.locator('button.btn-primary');
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toContainText('検索');
  });

  test('should show alert when searching with empty input', async ({ page }) => {
    const searchButton = page.locator('button.btn-primary');

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('ドメイン名を入力してください');
      await dialog.accept();
    });

    await searchButton.click();
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
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation links', async ({ page }) => {
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    const unicodeLink = page.locator('.nav-links a[href="/"]');
    await expect(unicodeLink).toBeVisible();
    await expect(unicodeLink).toContainText('Unicode変換');

    const whoisLink = page.locator('.nav-links a[href="/whois"]');
    await expect(whoisLink).toBeVisible();
    await expect(whoisLink).toContainText('WHOIS検索');
  });

  test('should navigate to Unicode page when clicking the link', async ({ page }) => {
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should show error for invalid domain format', async ({ page }) => {
    const domainInput = page.locator('#domainInput');
    const searchButton = page.locator('button.btn-primary');

    await domainInput.fill('invalid');
    await searchButton.click();

    // Wait for error message
    const errorSection = page.locator('.error-message');
    await expect(errorSection).toBeVisible({ timeout: 10000 });
    await expect(errorSection).toContainText('無効なドメイン形式です');
  });
});

test.describe('Navigation - E2E Tests', () => {
  test('should navigate from Unicode page to WHOIS page', async ({ page }) => {
    await page.goto('/');
    await page.click('.nav-links a[href="/whois"]');
    await expect(page).toHaveURL('/whois');
  });

  test('should navigate from WHOIS page to Unicode page', async ({ page }) => {
    await page.goto('/whois');
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should show active state on Unicode link when on main page', async ({ page }) => {
    await page.goto('/');
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('Unicode変換');
  });

  test('should show active state on WHOIS link when on whois page', async ({ page }) => {
    await page.goto('/whois');
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('WHOIS検索');
  });
});
