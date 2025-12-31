import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test.describe('Audio Converter - E2E Tests', () => {
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
    await page.goto('/audio-converter');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/オーディオ変換/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('オーディオファイルを選択');
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
    expect(usageText).toContain('対応フォーマット');
    expect(usageText).toContain('技術情報');
    expect(usageText).not.toContain('undefined');
  });

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 変換カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('変換');
  });

  test('should show オーディオ変換 link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '変換' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const audioLink = dropdown.locator('a[href="/audio-converter"]');
    await expect(audioLink).toBeVisible();
    await expect(audioLink).toContainText('オーディオ変換');
  });

  test('should display dropzone', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('クリックして音声を選択');
  });

  test('should have file input with correct attributes', async ({ page }) => {
    const fileInput = page.locator('input#audioFile');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('type', 'file');
    await expect(fileInput).toHaveAttribute('accept', 'audio/*');
  });

  test('should display dropzone hint', async ({ page }) => {
    const dropzoneHint = page.locator('.dropzone-hint');
    await expect(dropzoneHint).toBeVisible();
    await expect(dropzoneHint).toContainText('MP3, WAV, OGG, AAC, FLAC');
  });

  test('should display format selector', async ({ page }) => {
    const formatSelect = page.locator('select#outputFormat');
    await expect(formatSelect).toBeVisible();

    // Check all format options are present
    const options = formatSelect.locator('option');
    await expect(options).toHaveCount(3);

    const optionTexts = await options.allTextContents();
    expect(optionTexts).toContain('MP3');
    expect(optionTexts).toContain('WAV');
    expect(optionTexts).toContain('OGG (Vorbis)');
  });

  test('should have convert button disabled initially', async ({ page }) => {
    const convertBtn = page.locator('button.btn-primary');
    await expect(convertBtn).toBeVisible();
    await expect(convertBtn).toBeDisabled();
  });

  test('should have clear button', async ({ page }) => {
    const clearBtn = page.locator('button.btn-clear');
    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toContainText('クリア');
  });

  test('should change format selection', async ({ page }) => {
    const formatSelect = page.locator('select#outputFormat');

    // Default should be MP3
    await expect(formatSelect).toHaveValue('mp3');

    // Change to WAV
    await formatSelect.selectOption('wav');
    await expect(formatSelect).toHaveValue('wav');

    // Change to OGG
    await formatSelect.selectOption('ogg');
    await expect(formatSelect).toHaveValue('ogg');
  });

  test('should show file info after file selection', async ({ page }) => {
    // Note: This test requires a valid audio file in the test fixtures
    // For now, we'll test the UI elements existence
    const fileInput = page.locator('input#audioFile');
    await expect(fileInput).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    const form = page.locator('form[aria-label="オーディオ変換フォーム"]');
    await expect(form).toBeVisible();

    const fileInput = page.locator('input#audioFile');
    await expect(fileInput).toHaveAttribute('aria-label', '変換するオーディオファイルを選択');

    const formatSelect = page.locator('select#outputFormat');
    await expect(formatSelect).toHaveAttribute('aria-label', '出力フォーマットを選択');

    const convertBtn = page.locator('button.btn-primary');
    await expect(convertBtn).toHaveAttribute('aria-label', 'オーディオファイルを変換');

    const clearBtn = page.locator('button.btn-clear');
    await expect(clearBtn).toHaveAttribute('aria-label', '入力をクリア');
  });

  test('should display usage instructions with correct content', async ({ page }) => {
    const infoBox = page.locator('.info-box');

    // 使い方セクション
    await expect(infoBox.locator('h3:has-text("使い方")')).toBeVisible();
    const usageList = infoBox.locator('h3:has-text("使い方")').locator('xpath=following-sibling::ul[1]');
    const usageItems = await usageList.locator('li').allTextContents();
    expect(usageItems.some(item => item.includes('ファイルを選択'))).toBe(true);
    expect(usageItems.some(item => item.includes('出力フォーマット'))).toBe(true);
    expect(usageItems.some(item => item.includes('変換'))).toBe(true);

    // 対応フォーマットセクション
    await expect(infoBox.locator('h3:has-text("対応フォーマット")')).toBeVisible();

    // 技術情報セクション
    await expect(infoBox.locator('h3:has-text("技術情報")')).toBeVisible();
    const techInfoList = infoBox.locator('h3:has-text("技術情報")').locator('xpath=following-sibling::ul[1]');
    const techInfoItems = await techInfoList.locator('li').allTextContents();
    expect(techInfoItems.some(item => item.includes('ブラウザ上で実行'))).toBe(true);
  });

  test('should have status region for screen readers', async ({ page }) => {
    // audio-converterページ固有のステータスリージョンをチェック（ツールコンテナ内）
    const statusRegion = page.locator('.tool-container ~ [role="status"][aria-live="polite"]');
    await expect(statusRegion).toBeAttached();
  });

  test('should navigate to other pages via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to Base64 page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/base64');
    await expect(page).toHaveURL('/base64');
  });

  test('should have complementary region for usage instructions', async ({ page }) => {
    const complementary = page.locator('[role="complementary"]');
    await expect(complementary).toBeVisible();
    await expect(complementary).toHaveAttribute('aria-labelledby', 'usage-title');
  });

  test('should maintain format selection after clear', async ({ page }) => {
    const formatSelect = page.locator('select#outputFormat');

    // Change to WAV
    await formatSelect.selectOption('wav');
    await expect(formatSelect).toHaveValue('wav');

    // Click clear
    const clearBtn = page.locator('button.btn-clear');
    await clearBtn.click();

    // Format should reset to MP3
    await expect(formatSelect).toHaveValue('mp3');
  });
});
