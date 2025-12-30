import { test, expect } from '@playwright/test';

test.describe('Dummy Image Generator - E2E Tests', () => {
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

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 生成カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('生成');
  });

  test('should show ダミー画像 link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '生成' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const dummyImageLink = dropdown.locator('a[href="/dummy-image"]');
    await expect(dummyImageLink).toBeVisible();
    await expect(dummyImageLink).toContainText('ダミー画像');
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

  test('should navigate to Unicode page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/');
    await expect(page).toHaveURL('/');
  });

  test('should navigate from dummy-audio to dummy-image via category', async ({ page }) => {
    await page.goto('/dummy-audio');
    await page.waitForLoadState('networkidle');

    await navigateViaCategory(page, '生成', '/dummy-image');
    await expect(page).toHaveURL('/dummy-image');
  });

  test.describe('API Endpoints', () => {
    test('SVG API endpoint should return valid image', async ({ page }) => {
      const response = await page.request.get('/api/image.svg?w=100&h=100');
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('image/svg+xml');
      const body = await response.text();
      expect(body).toContain('<svg');
      expect(body).toContain('100 × 100');
    });

    test('PNG API endpoint should return valid image', async ({ page }) => {
      const response = await page.request.get('/api/image.png?w=100&h=100');
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toBe('image/png');
      const buffer = await response.body();
      expect(buffer.length).toBeGreaterThan(0);
    });

    test('JPEG API endpoint should return valid image', async ({ page }) => {
      const response = await page.request.get('/api/image.jpg?w=100&h=100&q=85');
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toBe('image/jpeg');
      const buffer = await response.body();
      expect(buffer.length).toBeGreaterThan(0);
    });

    test('WebP API endpoint should return valid image', async ({ page }) => {
      const response = await page.request.get('/api/image.webp?w=100&h=100');
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toBe('image/webp');
      const buffer = await response.body();
      expect(buffer.length).toBeGreaterThan(0);
    });

    test('API endpoints should support custom colors', async ({ page }) => {
      const response = await page.request.get('/api/image.svg?w=200&h=200&bg=FF0000&text=FFFFFF');
      expect(response.ok()).toBeTruthy();
      const body = await response.text();
      expect(body).toContain('#FF0000');
      expect(body).toContain('#FFFFFF');
    });

    test('API endpoints should have cache headers', async ({ page }) => {
      const response = await page.request.get('/api/image.png?w=100&h=100');
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['cache-control']).toContain('public');
      expect(response.headers()['cache-control']).toContain('max-age=31536000');
    });

    test('PNG API should handle different sizes', async ({ page }) => {
      const smallResponse = await page.request.get('/api/image.png?w=50&h=50');
      const largeResponse = await page.request.get('/api/image.png?w=500&h=500');

      expect(smallResponse.ok()).toBeTruthy();
      expect(largeResponse.ok()).toBeTruthy();

      const smallBuffer = await smallResponse.body();
      const largeBuffer = await largeResponse.body();

      expect(largeBuffer.length).toBeGreaterThan(smallBuffer.length);
    });

    test('JPEG API should handle quality parameter', async ({ page }) => {
      const lowQuality = await page.request.get('/api/image.jpg?w=200&h=200&q=50');
      const highQuality = await page.request.get('/api/image.jpg?w=200&h=200&q=95');

      expect(lowQuality.ok()).toBeTruthy();
      expect(highQuality.ok()).toBeTruthy();

      const lowBuffer = await lowQuality.body();
      const highBuffer = await highQuality.body();

      // Higher quality should result in larger file size
      expect(highBuffer.length).toBeGreaterThanOrEqual(lowBuffer.length);
    });
  });
});
