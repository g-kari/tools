import { test, expect } from '@playwright/test';

test.describe('Dummy Image Generator - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dummy-image');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/ダミー画像生成/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('画像設定');
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
    expect(usageText).toContain('ダミー画像生成とは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation links including ダミー画像', async ({ page }) => {
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    const dummyImageLink = page.locator('.nav-links a[href="/dummy-image"]');
    await expect(dummyImageLink).toBeVisible();
    await expect(dummyImageLink).toContainText('ダミー画像');
  });

  test('should show active state on ダミー画像 link', async ({ page }) => {
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('ダミー画像');
  });

  test('should display width and height inputs', async ({ page }) => {
    const widthInput = page.locator('input#width');
    const heightInput = page.locator('input#height');

    await expect(widthInput).toBeVisible();
    await expect(heightInput).toBeVisible();
  });

  test('should have default dimensions', async ({ page }) => {
    const widthInput = page.locator('input#width');
    const heightInput = page.locator('input#height');

    await expect(widthInput).toHaveValue('800');
    await expect(heightInput).toHaveValue('600');
  });

  test('should display color pickers', async ({ page }) => {
    const bgColorInput = page.locator('input#bgColor');
    const textColorInput = page.locator('input#textColor');

    await expect(bgColorInput).toBeVisible();
    await expect(textColorInput).toBeVisible();
  });

  test('should display format selector', async ({ page }) => {
    const formatSelect = page.locator('select#format');
    await expect(formatSelect).toBeVisible();

    const options = page.locator('select#format option');
    await expect(options).toHaveCount(3);
  });

  test('should display preset size buttons', async ({ page }) => {
    const presetButtons = page.locator('.preset-buttons button');
    await expect(presetButtons.first()).toBeVisible();

    const count = await presetButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should change dimensions when clicking preset', async ({ page }) => {
    const ogpPreset = page.locator('button:has-text("OGP画像")');
    await ogpPreset.click();

    const widthInput = page.locator('input#width');
    const heightInput = page.locator('input#height');

    await expect(widthInput).toHaveValue('1200');
    await expect(heightInput).toHaveValue('630');
  });

  test('should display canvas preview', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should update canvas when dimensions change', async ({ page }) => {
    const widthInput = page.locator('input#width');
    await widthInput.fill('400');

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveAttribute('width', '400');
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
    const infoSection = page.locator('.image-info');
    await expect(infoSection).toBeVisible();

    const infoText = await infoSection.textContent();
    expect(infoText).toContain('800 × 600');
    expect(infoText).toContain('PNG');
  });

  test('should show quality slider when JPEG is selected', async ({ page }) => {
    const formatSelect = page.locator('select#format');
    await formatSelect.selectOption('jpeg');

    const qualitySlider = page.locator('input#quality');
    await expect(qualitySlider).toBeVisible();
  });

  test('should hide quality slider when PNG is selected', async ({ page }) => {
    const formatSelect = page.locator('select#format');
    await formatSelect.selectOption('png');

    const qualitySlider = page.locator('input#quality');
    await expect(qualitySlider).not.toBeVisible();
  });

  test('should show quality slider when WebP is selected', async ({ page }) => {
    const formatSelect = page.locator('select#format');
    await formatSelect.selectOption('webp');

    const qualitySlider = page.locator('input#quality');
    await expect(qualitySlider).toBeVisible();
  });

  test('should navigate to Unicode page when clicking the link', async ({ page }) => {
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should navigate from dummy-audio to dummy-image', async ({ page }) => {
    await page.goto('/dummy-audio');
    await page.waitForLoadState('networkidle');

    const dummyImageLink = page.locator('.nav-links a[href="/dummy-image"]');
    await dummyImageLink.click();

    await expect(page).toHaveURL('/dummy-image');
  });
});
