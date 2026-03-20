import { test, expect } from '@playwright/test';

test.describe('Web App Manifest ジェネレーター - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/web-manifest');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Manifest/i);
  });

  test('should show the JSON output by default', async ({ page }) => {
    const output = page.locator('pre, code, .tool-output').first();
    await expect(output).toBeVisible();
    const text = await output.textContent();
    expect(text).toContain('"name"');
  });

  test('should have a name input field', async ({ page }) => {
    const nameInput = page.locator('#manifest-name');
    await expect(nameInput).toBeVisible();
  });

  test('should update JSON when name is changed', async ({ page }) => {
    const nameInput = page.locator('#manifest-name');
    await nameInput.fill('Test Application');
    const output = page.locator('pre, code, .tool-output').first();
    const text = await output.textContent();
    expect(text).toContain('Test Application');
  });

  test('should have a display mode selector', async ({ page }) => {
    const displaySelect = page.locator('#manifest-display');
    await expect(displaySelect).toBeVisible();
  });

  test('should have theme color input', async ({ page }) => {
    const themeInput = page.locator('#manifest-theme-color');
    await expect(themeInput).toBeVisible();
  });

  test('should have a copy button', async ({ page }) => {
    const copyBtn = page.locator('button').filter({ hasText: /コピー/ });
    await expect(copyBtn.first()).toBeVisible();
  });

  test('should have a download button', async ({ page }) => {
    const downloadBtn = page.locator('button').filter({ hasText: /ダウンロード/ });
    await expect(downloadBtn.first()).toBeVisible();
  });

  test('should have a reset button', async ({ page }) => {
    const resetBtn = page.locator('button').filter({ hasText: /リセット/ });
    await expect(resetBtn.first()).toBeVisible();
  });

  test('should switch to HTML tags tab', async ({ page }) => {
    const htmlTab = page.locator('.manifest-output-tab', { hasText: 'HTML' });
    await htmlTab.click();
    const output = page.locator('pre, code, .tool-output').first();
    const text = await output.textContent();
    expect(text).toContain('link rel="manifest"');
  });

  test('should show device preview', async ({ page }) => {
    const preview = page.locator('.manifest-device-frame');
    await expect(preview).toBeVisible();
  });

  test('should have icon management section', async ({ page }) => {
    const addIconBtn = page.locator('button').filter({ hasText: /アイコンを追加/ });
    await expect(addIconBtn).toBeVisible();
  });

  test('should have category selection', async ({ page }) => {
    const categorySelect = page.locator('#manifest-category-input');
    await expect(categorySelect).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test('should show navigation link in category dropdown', async ({ page }) => {
    await page.goto('/');
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '生成' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/web-manifest"]');
    await expect(link).toBeVisible();
  });

  test('should contain manifest.json content in output', async ({ page }) => {
    const output = page.locator('pre, code, .tool-output').first();
    const text = await output.textContent();
    expect(text).toContain('"start_url"');
    expect(text).toContain('"display"');
    expect(text).toContain('"theme_color"');
  });
});
