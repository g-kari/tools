import { test, expect } from '@playwright/test';

test.describe('Email DNS Checker - E2E Tests', () => {
  // Timeout is configured in playwright.config.ts (CI: 30 seconds, local: 10 seconds)

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

  test('should show error message when checking with empty input', async ({ page }) => {
    const checkButton = page.locator('button.btn-primary');

    await checkButton.click();

    // Wait for error message to appear
    const errorSection = page.locator('.error-message');
    await expect(errorSection).toBeVisible();
    await expect(errorSection).toContainText('ドメイン名を入力してください');
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

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 検証カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('検証');
  });

  test('should show メールDNS link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '検証' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const emailDnsLink = dropdown.locator('a[href="/email-dns"]');
    await expect(emailDnsLink).toBeVisible();
    await expect(emailDnsLink).toContainText('メールDNS');
  });

  test('should navigate to Unicode page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/');
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

    // Set up promise to wait for loading state before clicking
    const loadingPromise = page.waitForSelector('.loading', { state: 'visible', timeout: 5000 });

    // Click and wait for loading indicator to appear
    await checkButton.click();
    await loadingPromise;

    // Verify loading indicator is visible
    const loadingIndicator = page.locator('.loading');
    await expect(loadingIndicator).toBeVisible();
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

    // Check that all DNS record sections are present
    const resultCards = page.locator('.result-card');
    await expect(resultCards.first()).toBeVisible();

    // Verify MX section with status indicator
    const mxSection = page.locator('.result-card').filter({ hasText: 'MXレコード' });
    await expect(mxSection).toBeVisible();
    await expect(mxSection.locator('.status-icon')).toBeVisible();

    // Verify SPF section with status indicator
    const spfSection = page.locator('.result-card').filter({ hasText: 'SPFレコード' });
    await expect(spfSection).toBeVisible();
    await expect(spfSection.locator('.status-icon')).toBeVisible();

    // Verify DMARC section with status indicator
    const dmarcSection = page.locator('.result-card').filter({ hasText: 'DMARCレコード' });
    await expect(dmarcSection).toBeVisible();
    await expect(dmarcSection.locator('.status-icon')).toBeVisible();

    // DKIM section is optional (only if selector provided), so we don't check it here
  });

  test('should handle Enter key press in domain input', async ({ page }) => {
    const domainInput = page.locator('#domainInput');

    await domainInput.focus();
    await domainInput.press('Enter');

    // Should trigger validation and show error message
    const errorSection = page.locator('.error-message');
    await expect(errorSection).toBeVisible();
    await expect(errorSection).toContainText('ドメイン名を入力してください');
  });

  test('should handle Enter key press in DKIM selector input', async ({ page }) => {
    const dkimInput = page.locator('#dkimSelectorInput');

    await dkimInput.focus();
    await dkimInput.press('Enter');

    // Should trigger validation and show error message (domain is empty)
    const errorSection = page.locator('.error-message');
    await expect(errorSection).toBeVisible();
    await expect(errorSection).toContainText('ドメイン名を入力してください');
  });

  test('should focus on domain input on page load', async ({ page }) => {
    const domainInput = page.locator('#domainInput');

    // Check if domain input is focused
    await expect(domainInput).toBeFocused();
  });
});
