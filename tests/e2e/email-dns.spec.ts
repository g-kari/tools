import { test, expect } from '@playwright/test';

test.describe('Email DNS Checker - E2E Tests', () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

  test.beforeEach(async ({ page }) => {
    await page.goto('/email-dns');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/メールDNS/);
  });

  test('should have domain input field', async ({ page }) => {
    const domainInput = page.locator('#domainInput');
    await expect(domainInput).toBeVisible();
  });

  test('should have DKIM selector input field', async ({ page }) => {
    const dkimInput = page.locator('#dkimSelectorInput');
    await expect(dkimInput).toBeVisible();
  });

  test('should have check button', async ({ page }) => {
    const checkButton = page.locator('button.btn-primary');
    await expect(checkButton).toBeVisible();
    await expect(checkButton).toContainText('検証');
  });

  test('should show alert when checking with empty input', async ({ page }) => {
    const checkButton = page.locator('button.btn-primary');

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('ドメイン名を入力してください');
      await dialog.accept();
    });

    await checkButton.click();
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
    expect(usageText).toContain('MX');
    expect(usageText).toContain('SPF');
    expect(usageText).toContain('DMARC');
    expect(usageText).toContain('DKIM');
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation links', async ({ page }) => {
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    const unicodeLink = page.locator('.nav-links a[href="/"]');
    await expect(unicodeLink).toBeVisible();
    await expect(unicodeLink).toContainText('Unicode変換');

    const emailDnsLink = page.locator('.nav-links a[href="/email-dns"]');
    await expect(emailDnsLink).toBeVisible();
    await expect(emailDnsLink).toContainText('メールDNS');
  });

  test('should navigate to Unicode page when clicking the link', async ({ page }) => {
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should show error for invalid domain format', async ({ page }) => {
    const domainInput = page.locator('#domainInput');
    const checkButton = page.locator('button.btn-primary');

    await domainInput.fill('invalid');
    await checkButton.click();

    // Wait for error message
    const errorSection = page.locator('.error-message');
    await expect(errorSection).toBeVisible();
    await expect(errorSection).toContainText('無効なドメイン形式です');
  });

  test('should allow entering DKIM selector', async ({ page }) => {
    const dkimInput = page.locator('#dkimSelectorInput');

    await dkimInput.fill('google');
    await expect(dkimInput).toHaveValue('google');
  });

  test('should show loading state when checking', async ({ page }) => {
    const domainInput = page.locator('#domainInput');
    const checkButton = page.locator('button.btn-primary');

    await domainInput.fill('gmail.com');

    // Click and immediately check for loading state
    await checkButton.click();

    // Loading indicator should appear
    const loadingIndicator = page.locator('.loading');
    // Use waitFor with a short timeout since it might disappear quickly
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should display result sections after successful check', async ({ page }) => {
    const domainInput = page.locator('#domainInput');
    const checkButton = page.locator('button.btn-primary');

    await domainInput.fill('gmail.com');
    await checkButton.click();

    // Wait for results to appear
    const resultTitle = page.locator('#result-title');
    await expect(resultTitle).toBeVisible({ timeout: 15000 });
    await expect(resultTitle).toContainText('gmail.com');

    // Check that result cards are present
    const resultCards = page.locator('.result-card');
    await expect(resultCards.first()).toBeVisible();
  });

  test('should handle Enter key press in domain input', async ({ page }) => {
    const domainInput = page.locator('#domainInput');

    // Set up dialog handler first
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await domainInput.focus();
    await domainInput.press('Enter');

    // Should trigger validation (alert should have been shown)
  });

  test('should handle Enter key press in DKIM selector input', async ({ page }) => {
    const dkimInput = page.locator('#dkimSelectorInput');

    // Set up dialog handler first
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await dkimInput.focus();
    await dkimInput.press('Enter');

    // Should trigger validation (alert should have been shown)
  });

  test('should focus on domain input on page load', async ({ page }) => {
    const domainInput = page.locator('#domainInput');

    // Check if domain input is focused
    await expect(domainInput).toBeFocused();
  });
});
