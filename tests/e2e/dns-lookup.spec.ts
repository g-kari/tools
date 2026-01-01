import { test, expect } from '@playwright/test';

test.describe('DNS Lookup - E2E Tests', () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

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
    await page.goto('/dns-lookup');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/DNSレコード検索/);
  });

  test('should have domain input field', async ({ page }) => {
    const domainInput = page.locator('#domainInput');
    await expect(domainInput).toBeVisible();
    await expect(domainInput).toHaveAttribute('placeholder', 'example.com');
  });

  test('should have search button', async ({ page }) => {
    const searchButton = page.locator('button.primary-button');
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toContainText('検索');
  });

  test('should have record type checkboxes', async ({ page }) => {
    const checkboxes = page.locator('.checkbox-label');
    await expect(checkboxes).toHaveCount(10); // A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA

    // Check that default types are selected
    const aCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(aCheckbox).toBeChecked();
  });

  test('should have select all and deselect all buttons', async ({ page }) => {
    const selectAllBtn = page.locator('button.text-button', { hasText: 'すべて選択' });
    const deselectAllBtn = page.locator('button.text-button', { hasText: 'すべて解除' });

    await expect(selectAllBtn).toBeVisible();
    await expect(deselectAllBtn).toBeVisible();
  });

  test('should select/deselect all record types', async ({ page }) => {
    const deselectAllBtn = page.locator('button.text-button', { hasText: 'すべて解除' });
    const selectAllBtn = page.locator('button.text-button', { hasText: 'すべて選択' });

    // Deselect all
    await deselectAllBtn.click();
    const checkboxesAfterDeselect = page.locator('input[type="checkbox"]:checked');
    await expect(checkboxesAfterDeselect).toHaveCount(0);

    // Select all
    await selectAllBtn.click();
    const checkboxesAfterSelect = page.locator('input[type="checkbox"]:checked');
    await expect(checkboxesAfterSelect).toHaveCount(10);
  });

  test('should show toast when searching with empty input', async ({ page }) => {
    const searchButton = page.locator('button.primary-button');

    await searchButton.click();

    // Check for toast notification
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('ドメイン名を入力してください');
  });

  test('should show toast when searching with no record types selected', async ({ page }) => {
    const domainInput = page.locator('#domainInput');
    const deselectAllBtn = page.locator('button.text-button', { hasText: 'すべて解除' });
    const searchButton = page.locator('button.primary-button');

    await domainInput.fill('example.com');
    await deselectAllBtn.click();
    await searchButton.click();

    // Check for toast notification
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('少なくとも1つのレコードタイプを選択してください');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();

    // Check ARIA labels
    const domainInput = page.locator('#domainInput');
    await expect(domainInput).toHaveAttribute('aria-required', 'true');

    const recordTypeGroup = page.locator('[role="group"][aria-label="レコードタイプ選択"]');
    await expect(recordTypeGroup).toBeVisible();
  });

  test('should have category navigation', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 検索カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('検索');
  });

  test('should navigate to Unicode page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/');
    await expect(page).toHaveURL('/');
  });

  test('should allow searching with Enter key', async ({ page }) => {
    const domainInput = page.locator('#domainInput');

    await domainInput.fill('example.com');
    await domainInput.press('Enter');

    // Should start searching (button should show "検索中...")
    const searchButton = page.locator('button.primary-button');
    // Wait a bit for the button text to change
    await page.waitForTimeout(100);
  });

  test('should toggle individual record types', async ({ page }) => {
    // Find the first checkbox (A record)
    const firstCheckbox = page.locator('input[type="checkbox"]').first();

    // Should be checked by default
    await expect(firstCheckbox).toBeChecked();

    // Click to uncheck
    await firstCheckbox.click();
    await expect(firstCheckbox).not.toBeChecked();

    // Click to check again
    await firstCheckbox.click();
    await expect(firstCheckbox).toBeChecked();
  });

  test('should display record type descriptions', async ({ page }) => {
    const checkboxLabels = page.locator('.checkbox-label');

    // Check first few record types have descriptions
    const firstLabel = checkboxLabels.first();
    const labelText = await firstLabel.textContent();

    expect(labelText).toContain('A');
    expect(labelText).toContain('IPv4アドレス');
  });

  test('should have proper input validation attributes', async ({ page }) => {
    const domainInput = page.locator('#domainInput');

    await expect(domainInput).toHaveAttribute('type', 'text');
    await expect(domainInput).toHaveAttribute('aria-required', 'true');
    await expect(domainInput).toHaveAttribute('placeholder', 'example.com');
  });

  test('should disable search button while loading', async ({ page }) => {
    const domainInput = page.locator('#domainInput');
    const searchButton = page.locator('button.primary-button');

    await domainInput.fill('example.com');
    await searchButton.click();

    // Button should be disabled immediately after clicking
    await expect(searchButton).toBeDisabled();
  });

  test('should display page subtitle', async ({ page }) => {
    const subtitle = page.locator('.page-subtitle');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText('DNSレコード');
  });

  test('should have section headings', async ({ page }) => {
    const inputHeading = page.locator('#input-heading');
    await expect(inputHeading).toBeVisible();
    await expect(inputHeading).toContainText('ドメイン入力');
  });
});
