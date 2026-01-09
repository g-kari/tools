import { test, expect } from '@playwright/test';

test.describe('Sticker Converter - E2E Tests', () => {
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
    await page.goto('/sticker-converter');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/スタンプコンバーター/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'スタンプコンバーター' });
    await expect(heading).toBeVisible();
  });

  test('should display the page subtitle', async ({ page }) => {
    const subtitle = page.locator('.page-subtitle');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText('Discord・Slack用のスタンプ画像を生成');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 画像カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('画像');
  });

  test('should show スタンプ変換 link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '画像' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const stickerConverterLink = dropdown.locator('a[href="/sticker-converter"]');
    await expect(stickerConverterLink).toBeVisible();
    await expect(stickerConverterLink).toContainText('スタンプ変換');
  });

  test('should display dropzone', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('クリックして画像を選択');
  });

  test('should have file input with accept attribute', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  test('should display dropzone hint', async ({ page }) => {
    const dropzoneHint = page.locator('.dropzone-hint');
    await expect(dropzoneHint).toBeVisible();
    await expect(dropzoneHint).toContainText('PNG, JPEG, GIF, WebP対応');
  });

  test('should display platform selector', async ({ page }) => {
    const platformSelector = page.locator('select#platform');
    await expect(platformSelector).toBeVisible();
    await expect(platformSelector).toHaveValue('discord');
  });

  test('should have Discord and Slack platform options', async ({ page }) => {
    const platformSelector = page.locator('select#platform');
    const options = await platformSelector.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('Discord'))).toBeTruthy();
    expect(options.some(opt => opt.includes('Slack'))).toBeTruthy();
  });

  test('should display Discord platform limits', async ({ page }) => {
    const platformSelector = page.locator('select#platform');
    await platformSelector.selectOption('discord');
    const selectedOption = await platformSelector.locator('option:checked').textContent();
    expect(selectedOption).toContain('320');
    expect(selectedOption).toContain('512KB');
  });

  test('should display Slack platform limits', async ({ page }) => {
    const platformSelector = page.locator('select#platform');
    await platformSelector.selectOption('slack');
    const selectedOption = await platformSelector.locator('option:checked').textContent();
    expect(selectedOption).toContain('128');
    expect(selectedOption).toContain('1MB');
  });

  test('should display output format selector', async ({ page }) => {
    const formatSection = page.locator('h2.section-title:has-text("出力形式")');
    await expect(formatSection).toBeVisible();
  });

  test('should have PNG and WebP format options', async ({ page }) => {
    const pngOption = page.locator('input[type="radio"][value="png"]');
    const webpOption = page.locator('input[type="radio"][value="webp"]');

    await expect(pngOption).toBeVisible();
    await expect(webpOption).toBeVisible();
  });

  test('should have PNG selected by default', async ({ page }) => {
    const pngOption = page.locator('input[type="radio"][value="png"]');
    await expect(pngOption).toBeChecked();
  });

  test('should not display quality slider for PNG', async ({ page }) => {
    const pngOption = page.locator('input[type="radio"][value="png"]');
    await pngOption.check();

    const qualitySlider = page.locator('input#outputQuality');
    await expect(qualitySlider).not.toBeVisible();
  });

  test('should display quality slider for WebP', async ({ page }) => {
    const webpOption = page.locator('input[type="radio"][value="webp"]');
    await webpOption.check();

    const qualitySlider = page.locator('input#outputQuality');
    await expect(qualitySlider).toBeVisible();
  });

  test('should not display preview initially', async ({ page }) => {
    const previewSection = page.locator('h2.section-title:has-text("プレビュー")');
    await expect(previewSection).not.toBeVisible();
  });

  test('should have platform help text', async ({ page }) => {
    const helpText = page.locator('#platform-help');
    await expect(helpText).toBeVisible();
    await expect(helpText).toContainText('プラットフォームに応じて自動的にサイズと容量制限を適用します');
  });

  test('should display format labels correctly', async ({ page }) => {
    const pngLabel = page.locator('.format-label:has-text("PNG")');
    const webpLabel = page.locator('.format-label:has-text("WebP")');

    await expect(pngLabel).toBeVisible();
    await expect(pngLabel).toContainText('ロスレス');

    await expect(webpLabel).toBeVisible();
    await expect(webpLabel).toContainText('高圧縮');
  });

  test('should have accessible file input label', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('aria-label', '画像ファイルを選択');
  });

  test('should have accessible dropzone', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toHaveAttribute('role', 'button');
    await expect(dropzone).toHaveAttribute('tabIndex', '0');
    await expect(dropzone).toHaveAttribute('aria-label', '画像ファイルをアップロード');
  });

  test('should have status region for announcements', async ({ page }) => {
    const statusRegion = page.locator('[role="status"][aria-live="polite"]');
    await expect(statusRegion).toBeAttached();
  });

  test('should change platform selection', async ({ page }) => {
    const platformSelector = page.locator('select#platform');

    // Start with Discord
    await expect(platformSelector).toHaveValue('discord');

    // Change to Slack
    await platformSelector.selectOption('slack');
    await expect(platformSelector).toHaveValue('slack');

    // Change back to Discord
    await platformSelector.selectOption('discord');
    await expect(platformSelector).toHaveValue('discord');
  });

  test('should change output format selection', async ({ page }) => {
    const pngOption = page.locator('input[type="radio"][value="png"]');
    const webpOption = page.locator('input[type="radio"][value="webp"]');

    // Start with PNG
    await expect(pngOption).toBeChecked();

    // Change to WebP
    await webpOption.check();
    await expect(webpOption).toBeChecked();
    await expect(pngOption).not.toBeChecked();

    // Change back to PNG
    await pngOption.check();
    await expect(pngOption).toBeChecked();
    await expect(webpOption).not.toBeChecked();
  });

  test('should navigate from category dropdown', async ({ page }) => {
    await page.goto('/');
    await navigateViaCategory(page, '画像', '/sticker-converter');
    await expect(page).toHaveURL('/sticker-converter');
    const heading = page.getByRole('heading', { name: 'スタンプコンバーター' });
    await expect(heading).toBeVisible();
  });

  test('should have converter section', async ({ page }) => {
    const converterSection = page.locator('.converter-section');
    await expect(converterSection).toBeVisible();
  });

  test('should have file selection section', async ({ page }) => {
    const fileSection = page.locator('h2.section-title:has-text("ファイル選択")');
    await expect(fileSection).toBeVisible();
  });

  test('should have platform section', async ({ page }) => {
    const platformSection = page.locator('h2.section-title:has-text("プラットフォーム")');
    await expect(platformSection).toBeVisible();
  });

  test('should have output format section', async ({ page }) => {
    const formatSection = page.locator('h2.section-title:has-text("出力形式")');
    await expect(formatSection).toBeVisible();
  });

  test('should adjust quality slider for WebP', async ({ page }) => {
    const webpOption = page.locator('input[type="radio"][value="webp"]');
    await webpOption.check();

    const qualitySlider = page.locator('input#outputQuality');
    await expect(qualitySlider).toBeVisible();

    // Check default value (should be around 0.92)
    const defaultValue = await qualitySlider.inputValue();
    expect(parseFloat(defaultValue)).toBeGreaterThan(0.9);

    // Adjust quality
    await qualitySlider.fill('0.75');
    const newValue = await qualitySlider.inputValue();
    expect(parseFloat(newValue)).toBe(0.75);
  });

  test('should display quality help text for WebP', async ({ page }) => {
    const webpOption = page.locator('input[type="radio"][value="webp"]');
    await webpOption.check();

    const helpText = page.locator('.help-text:has-text("品質を下げるとファイルサイズが小さくなります")');
    await expect(helpText).toBeVisible();
  });

  test('should have upload icon in dropzone', async ({ page }) => {
    const uploadIcon = page.locator('.upload-icon');
    await expect(uploadIcon).toBeVisible();
    await expect(uploadIcon).toHaveAttribute('aria-hidden', 'true');
  });

  test('should display dropzone text', async ({ page }) => {
    const dropzoneText = page.locator('.dropzone-text');
    await expect(dropzoneText).toBeVisible();
    await expect(dropzoneText).toContainText('クリックして画像を選択、またはドラッグ&ドロップ');
  });
});
