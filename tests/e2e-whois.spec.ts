import { test, expect } from '@playwright/test';

test.describe('WHOIS Lookup - E2E Tests', () => {
  test.describe.configure({ timeout: 15000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/whois');
    // Wait for page load and React hydration
    // Note: Using 'load' instead of 'networkidle' for better reliability in CI environments
    // The WHOIS page is static on mount (no immediate API calls), so 'load' is sufficient
    await page.waitForLoadState('load');
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
    await expect(errorSection).toBeVisible();
    await expect(errorSection).toContainText('無効なドメイン形式です');
  });
});
