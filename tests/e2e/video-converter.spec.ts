import { test, expect } from '@playwright/test';

test.describe('Video Converter - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-converter');
    await page.waitForLoadState('networkidle');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/動画変換/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.page-title');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('動画変換');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display file input', async ({ page }) => {
    const fileInput = page.locator('input#videoFile');
    await expect(fileInput).toBeVisible();
    await expect(fileInput).toHaveAttribute('accept', 'video/*');
  });

  test('should display format selector', async ({ page }) => {
    const formatSelect = page.locator('select#format');
    await expect(formatSelect).toBeVisible();

    // Check available formats
    const options = await formatSelect.locator('option').all();
    expect(options.length).toBeGreaterThanOrEqual(4);
  });

  test('should display resolution selectors', async ({ page }) => {
    const widthSelect = page.locator('select#width');
    const heightSelect = page.locator('select#height');

    await expect(widthSelect).toBeVisible();
    await expect(heightSelect).toBeVisible();
  });

  test('should display framerate selector', async ({ page }) => {
    const framerateSelect = page.locator('select#framerate');
    await expect(framerateSelect).toBeVisible();

    // Check default value
    await expect(framerateSelect).toHaveValue('auto');
  });

  test('should display bitrate selectors', async ({ page }) => {
    const videoBitrateSelect = page.locator('select#videoBitrate');
    const audioBitrateSelect = page.locator('select#audioBitrate');

    await expect(videoBitrateSelect).toBeVisible();
    await expect(audioBitrateSelect).toBeVisible();
  });

  test('should have disabled convert button initially', async ({ page }) => {
    const convertButton = page.locator('button:has-text("変換")');
    await expect(convertButton).toBeDisabled();
  });

  test('should display clear button', async ({ page }) => {
    const clearButton = page.locator('button:has-text("クリア")');
    await expect(clearButton).toBeVisible();
  });

  test('should change format options', async ({ page }) => {
    const formatSelect = page.locator('select#format');

    // Change to WebM
    await formatSelect.selectOption('webm');
    await expect(formatSelect).toHaveValue('webm');

    // Change to AVI
    await formatSelect.selectOption('avi');
    await expect(formatSelect).toHaveValue('avi');
  });

  test('should change resolution options', async ({ page }) => {
    const widthSelect = page.locator('select#width');
    const heightSelect = page.locator('select#height');

    await widthSelect.selectOption('1280');
    await expect(widthSelect).toHaveValue('1280');

    await heightSelect.selectOption('720');
    await expect(heightSelect).toHaveValue('720');
  });

  test('should change framerate', async ({ page }) => {
    const framerateSelect = page.locator('select#framerate');

    await framerateSelect.selectOption('30');
    await expect(framerateSelect).toHaveValue('30');
  });

  test('should change bitrate settings', async ({ page }) => {
    const videoBitrateSelect = page.locator('select#videoBitrate');
    const audioBitrateSelect = page.locator('select#audioBitrate');

    await videoBitrateSelect.selectOption('4000');
    await expect(videoBitrateSelect).toHaveValue('4000');

    await audioBitrateSelect.selectOption('192');
    await expect(audioBitrateSelect).toHaveValue('192');
  });

  test('should display usage instructions', async ({ page }) => {
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('動画変換とは');
    expect(usageText).toContain('オプションについて');
  });

  test('should have all format options', async ({ page }) => {
    const formatSelect = page.locator('select#format');
    const optionTexts = await formatSelect.locator('option').allTextContents();

    expect(optionTexts).toContain('MP4 (H.264)');
    expect(optionTexts).toContain('WebM (VP8)');
    expect(optionTexts).toContain('AVI (MPEG-4)');
    expect(optionTexts).toContain('MOV (H.264)');
  });

  test('should have resolution presets', async ({ page }) => {
    const widthSelect = page.locator('select#width');
    const widthOptions = await widthSelect.locator('option').allTextContents();

    expect(widthOptions.some(text => text.includes('720p'))).toBeTruthy();
    expect(widthOptions.some(text => text.includes('1080p'))).toBeTruthy();
    expect(widthOptions.some(text => text.includes('4K'))).toBeTruthy();
  });

  test('should navigate to video converter from menu', async ({ page }) => {
    await page.goto('/');

    // Open "変換" category
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '変換' });
    await categoryBtn.hover();

    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();

    const link = dropdown.locator('a[href="/video-converter"]');
    await link.click();

    await page.waitForURL('/video-converter');
    await expect(page.locator('.page-title')).toContainText('動画変換');
  });
});
