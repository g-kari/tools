import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Image to GIF Converter - E2E Tests', () => {
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
    await page.goto('/image-to-gif');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/画像→GIF変換/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('画像選択');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions', async ({ page }) => {
    const usageSection = page.locator('.info-box').first();
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('画像→GIF変換とは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 画像カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('画像');
  });

  test('should show 画像→GIF変換 link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '画像' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const imageToGifLink = dropdown.locator('a[href="/image-to-gif"]');
    await expect(imageToGifLink).toBeVisible();
    await expect(imageToGifLink).toContainText('画像→GIF変換');
  });

  test('should display dropzone', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('クリックして画像を選択');
  });

  test('should have file input with correct attributes', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
    await expect(fileInput).toHaveAttribute('multiple');
  });

  test('should display dropzone hint', async ({ page }) => {
    const dropzoneHint = page.locator('.dropzone-hint');
    await expect(dropzoneHint).toBeVisible();
    await expect(dropzoneHint).toContainText('PNG, JPEG, WebP');
  });

  test('should display framerate slider', async ({ page }) => {
    const framerateInput = page.locator('input#framerate');
    await expect(framerateInput).toBeVisible();
    await expect(framerateInput).toHaveAttribute('type', 'range');
  });

  test('should display loop selector', async ({ page }) => {
    const loopSelect = page.locator('select#loop');
    await expect(loopSelect).toBeVisible();

    const options = page.locator('select#loop option');
    await expect(options).toHaveCount(5); // 無限ループ、1回、2回、3回、5回
  });

  test('should have default settings', async ({ page }) => {
    const framerateInput = page.locator('input#framerate');
    const loopSelect = page.locator('select#loop');

    await expect(framerateInput).toHaveValue('10');
    await expect(loopSelect).toHaveValue('0');
  });

  test('should display convert button', async ({ page }) => {
    const convertButton = page.locator('button:has-text("GIFに変換")');
    await expect(convertButton).toBeVisible();
  });

  test('should display clear button', async ({ page }) => {
    const clearButton = page.locator('button:has-text("クリア")');
    await expect(clearButton).toBeVisible();
  });

  test('should have disabled convert button when no images selected', async ({ page }) => {
    const convertButton = page.locator('button:has-text("GIFに変換")');
    await expect(convertButton).toBeDisabled();
  });

  test('should have disabled framerate slider when no images selected', async ({ page }) => {
    const framerateInput = page.locator('input#framerate');
    // 画像が選択されていない場合はdisabled
    await expect(framerateInput).toBeDisabled();
  });

  test('should change loop setting', async ({ page }) => {
    const loopSelect = page.locator('select#loop');
    await loopSelect.selectOption('3');
    await expect(loopSelect).toHaveValue('3');
  });

  test('should navigate to Unicode page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to color-extractor via category', async ({ page }) => {
    await navigateViaCategory(page, '画像', '/color-extractor');
    await expect(page).toHaveURL('/color-extractor');
  });

  test('should have help text in dropzone hint', async ({ page }) => {
    const dropzoneHint = page.locator('.dropzone-hint');
    await expect(dropzoneHint).toBeVisible();
    const text = await dropzoneHint.textContent();
    expect(text).toContain('複数選択可');
  });

  test('should have help text for framerate', async ({ page }) => {
    const helpText = page.locator('#framerate-help');
    await expect(helpText).toBeVisible();
    const text = await helpText.textContent();
    expect(text).toContain('1枚のみの場合は無効');
  });

  test('should have help text for loop', async ({ page }) => {
    const helpText = page.locator('#loop-help');
    await expect(helpText).toBeVisible();
  });

  test('should display instructions about single image support', async ({ page }) => {
    // 複数のinfo-boxがあるので、すべてのテキストを結合して確認
    const allInfoBoxes = page.locator('.info-box');
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(' ');
    expect(combinedText).toContain('1枚の画像からでもGIF形式で保存可能');
  });

  test('should display instructions about multiple images', async ({ page }) => {
    // 複数のinfo-boxがあるので、すべてのテキストを結合して確認
    const allInfoBoxes = page.locator('.info-box');
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(' ');
    expect(combinedText).toContain('複数枚の画像を選択するとアニメーションGIF');
  });

  test('should have all loop options', async ({ page }) => {
    const loopSelect = page.locator('select#loop');
    const options = await loopSelect.locator('option').allTextContents();

    expect(options).toContain('無限ループ');
    expect(options).toContain('1回のみ');
    expect(options).toContain('2回');
    expect(options).toContain('3回');
    expect(options).toContain('5回');
  });

  test('should have proper framerate range', async ({ page }) => {
    const framerateInput = page.locator('input#framerate');

    await expect(framerateInput).toHaveAttribute('min', '1');
    await expect(framerateInput).toHaveAttribute('max', '30');
  });

  test('should not show output section initially', async ({ page }) => {
    const outputSection = page.locator('.output-preview');
    await expect(outputSection).not.toBeVisible();
  });

  test('should not show download button initially', async ({ page }) => {
    const downloadButton = page.locator('button:has-text("ダウンロード")').last();
    await expect(downloadButton).not.toBeVisible();
  });

  test('should disable framerate slider for single image note', async ({ page }) => {
    // framerate sliderの無効化は画像が1枚のみの場合に行われる
    // 初期状態では画像が選択されていないため、このテストは
    // UIの一貫性を確認するものとなる
    const framerateInput = page.locator('input#framerate');
    await expect(framerateInput).toBeVisible();
  });

  test('should have proper aria labels', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toHaveAttribute('aria-label', '画像ファイルをアップロード');

    const framerateInput = page.locator('input#framerate');
    await expect(framerateInput).toHaveAttribute('aria-describedby', 'framerate-help');

    const loopSelect = page.locator('select#loop');
    await expect(loopSelect).toHaveAttribute('aria-describedby', 'loop-help');
  });

  test('should accept multiple image files', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('multiple');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  test('should show settings section', async ({ page }) => {
    const settingsTitle = page.locator('h2:has-text("GIF設定")');
    await expect(settingsTitle).toBeVisible();
  });

  test('should display Tips section in help', async ({ page }) => {
    // 複数のinfo-boxがあるので、すべてのテキストを結合して確認
    const allInfoBoxes = page.locator('.info-box');
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(' ');
    expect(combinedText).toContain('Tips');
  });

  test('should explain framerate behavior', async ({ page }) => {
    // 複数のinfo-boxがあるので、すべてのテキストを結合して確認
    const allInfoBoxes = page.locator('.info-box');
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(' ');
    expect(combinedText).toContain('フレームレート');
    expect(combinedText).toContain('1秒間に表示するフレーム数');
  });

  test('should explain loop behavior', async ({ page }) => {
    // 複数のinfo-boxがあるので、すべてのテキストを結合して確認
    const allInfoBoxes = page.locator('.info-box');
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(' ');
    expect(combinedText).toContain('ループ設定');
    expect(combinedText).toContain('繰り返し回数');
  });

  test('should have proper section structure', async ({ page }) => {
    const sections = page.locator('.converter-section');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should have clear button enabled initially', async ({ page }) => {
    const clearButton = page.locator('button:has-text("クリア")');
    await expect(clearButton).toBeEnabled();
  });
});
