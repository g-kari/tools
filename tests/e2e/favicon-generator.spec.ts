import { test, expect } from '@playwright/test';

test.describe('Favicon Generator - E2E Tests', () => {
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
    await page.goto('/favicon-generator');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Favicon/);
  });

  test('should display the image upload section', async ({ page }) => {
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
    expect(usageText).toContain('Favicon生成ツールとは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 生成カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('生成');
  });

  test('should show Favicon生成 link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '生成' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const faviconLink = dropdown.locator('a[href="/favicon-generator"]');
    await expect(faviconLink).toBeVisible();
    await expect(faviconLink).toContainText('Favicon生成');
  });

  test('should display dropzone for file upload', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toBeVisible();

    const dropzoneText = await dropzone.textContent();
    expect(dropzoneText).toContain('クリックして画像を選択');
  });

  test('should have hidden file input', async ({ page }) => {
    const fileInput = page.locator('input#imageFile');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  test('should not show size selection before image upload', async ({ page }) => {
    const sizeGrid = page.locator('.favicon-size-grid');
    await expect(sizeGrid).not.toBeVisible();
  });

  test('should navigate to UUID page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '生成', '/uuid');
    await expect(page).toHaveURL('/uuid');
  });

  test('should navigate from password-generator to favicon-generator via category', async ({ page }) => {
    await page.goto('/password-generator');
    await page.waitForLoadState('networkidle');

    await navigateViaCategory(page, '生成', '/favicon-generator');
    await expect(page).toHaveURL('/favicon-generator');
  });

  test('dropzone should respond to hover state', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toBeVisible();

    // Check dropzone is interactive
    await expect(dropzone).toHaveAttribute('role', 'button');
    await expect(dropzone).toHaveAttribute('tabindex', '0');
  });

  test('should display tips in info box', async ({ page }) => {
    // 複数のinfo-boxがあるので、すべてのテキストを結合して確認
    const allInfoBoxes = page.locator('.info-box');
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(' ');

    expect(combinedText).toContain('Favicon生成ツールとは');
    expect(combinedText).toContain('使い方');
  });

  test('should have upload icon in dropzone', async ({ page }) => {
    const uploadIcon = page.locator('.dropzone .upload-icon');
    await expect(uploadIcon).toBeVisible();
  });

  test('dropzone should have keyboard accessibility', async ({ page }) => {
    const dropzone = page.locator('.dropzone');

    // Focus on dropzone
    await dropzone.focus();

    // Check it's focusable
    await expect(dropzone).toBeFocused();
  });

  test('should display file format hint in dropzone', async ({ page }) => {
    const dropzoneHint = page.locator('.dropzone-hint');
    await expect(dropzoneHint).toBeVisible();

    const hintText = await dropzoneHint.textContent();
    expect(hintText).toContain('PNG');
  });

  test('should display information about generated files', async ({ page }) => {
    // 複数のinfo-boxがあるので、すべてのテキストを結合して確認
    const allInfoBoxes = page.locator('.info-box');
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(' ');

    expect(combinedText).toContain('favicon-16x16.png');
    expect(combinedText).toContain('apple-touch-icon.png');
    expect(combinedText).toContain('android-chrome');
  });

  // Tests that require file upload would need mock files
  test.describe('With uploaded image', () => {
    test.skip('should show size selection after image upload', async () => {
      // This test would require a mock file upload
      // Skipping as it requires actual file interaction
    });

    test.skip('should show all favicon size options', async () => {
      // This test would require a mock file upload
    });

    test.skip('should have select all and deselect all buttons', async () => {
      // This test would require a mock file upload
    });

    test.skip('should show generate button', async () => {
      // This test would require a mock file upload
    });

    test.skip('should show download options after generation', async () => {
      // This test would require a mock file upload
    });
  });
});
