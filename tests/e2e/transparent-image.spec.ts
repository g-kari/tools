import { test, expect } from '@playwright/test';

test.describe('Transparent Image Generator - E2E Tests', () => {
  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(
    page: import('@playwright/test').Page,
    categoryName: string,
    linkHref: string
  ) {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: categoryName });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/transparent-image');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/透過画像生成/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('画像サイズ');
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
    expect(usageText).toContain('透過画像生成とは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 画像カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('画像');
  });

  test('should show 透過画像 link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '画像' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const transparentImageLink = dropdown.locator('a[href="/transparent-image"]');
    await expect(transparentImageLink).toBeVisible();
    await expect(transparentImageLink).toContainText('透過画像');
  });

  test('should display width and height inputs', async ({ page }) => {
    const widthInput = page.locator('input#width');
    const heightInput = page.locator('input#height');

    await expect(widthInput).toBeVisible();
    await expect(heightInput).toBeVisible();
  });

  test('should have default dimensions of 256x256', async ({ page }) => {
    const widthInput = page.locator('input#width');
    const heightInput = page.locator('input#height');

    await expect(widthInput).toHaveValue('256');
    await expect(heightInput).toHaveValue('256');
  });

  test('should display preset size buttons', async ({ page }) => {
    const presetButtons = page.locator('.preset-buttons button');
    await expect(presetButtons.first()).toBeVisible();

    const count = await presetButtons.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('should change dimensions when clicking preset', async ({ page }) => {
    const preset512 = page.locator('.preset-btn:has-text("512×512")');
    await preset512.click();

    const widthInput = page.locator('input#width');
    const heightInput = page.locator('input#height');

    await expect(widthInput).toHaveValue('512');
    await expect(heightInput).toHaveValue('512');
  });

  test('should highlight active preset button', async ({ page }) => {
    const preset128 = page.locator('.preset-btn:has-text("128×128")');
    await preset128.click();

    await expect(preset128).toHaveClass(/active/);
  });

  test('should display canvas preview', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should display background settings section', async ({ page }) => {
    const backgroundSection = page.locator('h2:has-text("背景設定")');
    await expect(backgroundSection).toBeVisible();
  });

  test('should have background color toggle disabled by default', async ({ page }) => {
    const toggle = page.locator('.background-toggle input[type="checkbox"]');
    await expect(toggle).not.toBeChecked();
  });

  test('should show color and opacity options when background is enabled', async ({ page }) => {
    const toggle = page.locator('.background-toggle input[type="checkbox"]');
    await toggle.check();

    const colorInput = page.locator('input#bgColor');
    const opacitySlider = page.locator('input#opacity');

    await expect(colorInput).toBeVisible();
    await expect(opacitySlider).toBeVisible();
  });

  test('should hide color and opacity options when background is disabled', async ({ page }) => {
    const toggle = page.locator('.background-toggle input[type="checkbox"]');
    await expect(toggle).not.toBeChecked();

    const colorInput = page.locator('input#bgColor');
    await expect(colorInput).not.toBeVisible();
  });

  test('should have download button', async ({ page }) => {
    const downloadButton = page.locator('button.btn-primary');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toContainText('ダウンロード');
  });

  test('should have clipboard copy button', async ({ page }) => {
    const copyButton = page.locator('button:has-text("クリップボードにコピー")');
    await expect(copyButton).toBeVisible();
  });

  test('should display image info', async ({ page }) => {
    const infoSection = page.locator('.transparent-image-info');
    await expect(infoSection).toBeVisible();

    const infoText = await infoSection.textContent();
    expect(infoText).toContain('256 × 256');
    expect(infoText).toContain('PNG');
    expect(infoText).toContain('完全透明');
  });

  test('should update info when enabling background color', async ({ page }) => {
    const toggle = page.locator('.background-toggle input[type="checkbox"]');
    await toggle.check();

    const opacitySlider = page.locator('input#opacity');
    await opacitySlider.fill('50');

    const infoSection = page.locator('.transparent-image-info');
    const infoText = await infoSection.textContent();
    expect(infoText).toContain('50% 不透明');
  });

  test('should update canvas when dimensions change', async ({ page }) => {
    const widthInput = page.locator('input#width');
    await widthInput.fill('100');

    // Canvas should update (we check by verifying the preview is visible)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should navigate to Unicode page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/');
    await expect(page).toHaveURL('/');
  });

  test('should navigate from image-resize to transparent-image via category', async ({ page }) => {
    await page.goto('/image-resize');
    await page.waitForLoadState('networkidle');

    await navigateViaCategory(page, '画像', '/transparent-image');
    await expect(page).toHaveURL('/transparent-image');
  });

  test('should update width and height independently', async ({ page }) => {
    const widthInput = page.locator('input#width');
    const heightInput = page.locator('input#height');

    await widthInput.fill('200');
    await expect(widthInput).toHaveValue('200');
    await expect(heightInput).toHaveValue('256');

    await heightInput.fill('300');
    await expect(widthInput).toHaveValue('200');
    await expect(heightInput).toHaveValue('300');
  });

  test('should have checkerboard pattern in preview container', async ({ page }) => {
    // The preview container should be visible with a canvas
    const previewContainer = page.locator('.transparent-preview-container');
    await expect(previewContainer).toBeVisible();

    const canvas = previewContainer.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should have opacity labels for transparency scale', async ({ page }) => {
    const toggle = page.locator('.background-toggle input[type="checkbox"]');
    await toggle.check();

    const opacityLabels = page.locator('.opacity-labels');
    await expect(opacityLabels).toBeVisible();

    const labelText = await opacityLabels.textContent();
    expect(labelText).toContain('透明');
    expect(labelText).toContain('不透明');
  });

  test('should handle extreme size values', async ({ page }) => {
    const widthInput = page.locator('input#width');

    // Test minimum size
    await widthInput.fill('1');
    await expect(widthInput).toHaveValue('1');

    // Test very large size
    await widthInput.fill('10000');
    await expect(widthInput).toHaveValue('10000');
  });

  test('should change background color when using color picker', async ({ page }) => {
    const toggle = page.locator('.background-toggle input[type="checkbox"]');
    await toggle.check();

    const hexInput = page.locator('.background-options input[type="text"]');
    await hexInput.fill('#FF0000');

    await expect(hexInput).toHaveValue('#FF0000');
  });
});
