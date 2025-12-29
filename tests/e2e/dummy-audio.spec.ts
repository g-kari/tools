import { test, expect } from '@playwright/test';

test.describe('Dummy Audio Generator - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dummy-audio');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/ダミー音声生成/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('音声設定');
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
    expect(usageText).toContain('ダミー音声生成とは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation links including ダミー音声', async ({ page }) => {
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    const dummyAudioLink = page.locator('.nav-links a[href="/dummy-audio"]');
    await expect(dummyAudioLink).toBeVisible();
    await expect(dummyAudioLink).toContainText('ダミー音声');
  });

  test('should show active state on ダミー音声 link when on dummy-audio page', async ({ page }) => {
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('ダミー音声');
  });

  test('should have waveform select with all options', async ({ page }) => {
    const waveformSelect = page.locator('#waveform');
    await expect(waveformSelect).toBeVisible();

    const options = await waveformSelect.locator('option').allTextContents();
    expect(options).toContain('サイン波');
    expect(options).toContain('矩形波');
    expect(options).toContain('三角波');
    expect(options).toContain('ノコギリ波');
    expect(options).toContain('ホワイトノイズ');
  });

  test('should have frequency input', async ({ page }) => {
    const frequencyInput = page.locator('#frequency');
    await expect(frequencyInput).toBeVisible();
    await expect(frequencyInput).toHaveValue('440');
  });

  test('should have duration input', async ({ page }) => {
    const durationInput = page.locator('#duration');
    await expect(durationInput).toBeVisible();
    await expect(durationInput).toHaveValue('1');
  });

  test('should have volume slider', async ({ page }) => {
    const volumeSlider = page.locator('#volume');
    await expect(volumeSlider).toBeVisible();
    await expect(volumeSlider).toHaveValue('50');
  });

  test('should disable frequency input when noise is selected', async ({ page }) => {
    const waveformSelect = page.locator('#waveform');
    await waveformSelect.selectOption('noise');

    const frequencyInput = page.locator('#frequency');
    await expect(frequencyInput).toBeDisabled();
  });

  test('should enable frequency input for other waveforms', async ({ page }) => {
    const waveformSelect = page.locator('#waveform');
    await waveformSelect.selectOption('sine');

    const frequencyInput = page.locator('#frequency');
    await expect(frequencyInput).toBeEnabled();
  });

  test('should have generate button', async ({ page }) => {
    const generateButton = page.locator('button.btn-primary');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toContainText('音声生成');
  });

  test('should have play button', async ({ page }) => {
    const playButton = page.locator('button.btn-secondary:has-text("再生")');
    await expect(playButton).toBeVisible();
  });

  test('should have download button', async ({ page }) => {
    const downloadButton = page.locator('button.btn-secondary:has-text("WAVダウンロード")');
    await expect(downloadButton).toBeVisible();
  });

  test('should show generation info after clicking generate button', async ({ page }) => {
    await page.click('button.btn-primary');

    const infoSection = page.locator('.audio-info');
    await expect(infoSection).toBeVisible();

    const infoText = await infoSection.textContent();
    expect(infoText).toContain('サイン波');
    expect(infoText).toContain('440 Hz');
    expect(infoText).toContain('1 秒');
  });

  test('should update info when settings change', async ({ page }) => {
    const waveformSelect = page.locator('#waveform');
    await waveformSelect.selectOption('square');

    const frequencyInput = page.locator('#frequency');
    await frequencyInput.fill('880');

    await page.click('button.btn-primary');

    const infoSection = page.locator('.audio-info');
    const infoText = await infoSection.textContent();
    expect(infoText).toContain('矩形波');
    expect(infoText).toContain('880 Hz');
  });

  test('should navigate to Unicode page when clicking the link', async ({ page }) => {
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should change volume label when slider is adjusted', async ({ page }) => {
    const volumeSlider = page.locator('#volume');
    await volumeSlider.fill('75');

    const volumeLabel = page.locator('label[for="volume"]');
    await expect(volumeLabel).toContainText('75%');
  });
});
