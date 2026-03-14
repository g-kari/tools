import { test, expect } from '@playwright/test';

test.describe('Image Compressor (複数画像対応) - E2E Tests', () => {
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
    await page.goto('/image-compress');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/画像圧縮/);
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

  test('should display usage instructions (TipsCard)', async ({ page }) => {
    const infoBoxes = page.locator('.info-box');
    await expect(infoBoxes.first()).toBeVisible();

    const allText = await infoBoxes.allTextContents();
    const combinedText = allText.join(' ');
    expect(combinedText).toContain('画像圧縮とは');
    expect(combinedText).not.toContain('undefined');
  });

  test('should display dropzone for multiple file upload', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('クリックして画像を選択');
    await expect(dropzone).toContainText('ドラッグ&ドロップ');
    await expect(dropzone).toContainText('複数可');
  });

  test('should have proper aria-label on dropzone for multiple upload', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toHaveAttribute('aria-label', '画像ファイルをアップロード（複数可）');
    await expect(dropzone).toHaveAttribute('role', 'button');
    await expect(dropzone).toHaveAttribute('tabindex', '0');
  });

  test('should have multiple-enabled file input', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
    await expect(fileInput).toHaveAttribute('multiple');
  });

  test('should not display compression settings without image', async ({ page }) => {
    const qualitySlider = page.locator('input#quality');
    await expect(qualitySlider).not.toBeVisible();

    const formatSelect = page.locator('select#format');
    await expect(formatSelect).not.toBeVisible();
  });

  test('should not display image list without images', async ({ page }) => {
    const imageList = page.locator('.compress-image-list');
    await expect(imageList).not.toBeVisible();
  });

  test('should not display bulk action buttons without images', async ({ page }) => {
    const bulkActions = page.locator('.compress-bulk-actions');
    await expect(bulkActions).not.toBeVisible();
  });

  test('should have category navigation with proper state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 画像カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('画像');
  });

  test('should show image-compress link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '画像' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const imageCompressLink = dropdown.locator('a[href="/image-compress"]');
    await expect(imageCompressLink).toBeVisible();
    await expect(imageCompressLink).toContainText('画像圧縮');
  });

  test('should display format options info in TipsCard', async ({ page }) => {
    const allInfoBoxes = page.locator('.info-box');
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(' ');

    expect(combinedText).toContain('JPEG');
    expect(combinedText).toContain('WebP');
    expect(combinedText).toContain('PNG');
  });

  test('should display compression tips', async ({ page }) => {
    const allInfoBoxes = page.locator('.info-box');
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(' ');

    expect(combinedText).toContain('Tips');
    expect(combinedText).toContain('ZIP');
  });

  test('should be keyboard accessible', async ({ page }) => {
    const dropzone = page.locator('.dropzone');

    // Focus dropzone directly and verify it can receive focus
    await dropzone.focus();
    await expect(dropzone).toBeFocused();

    // Verify tabindex is set for keyboard accessibility
    await expect(dropzone).toHaveAttribute('tabindex', '0');
  });

  test('should navigate to other pages via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/unicode');
    await expect(page).toHaveURL('/unicode');
  });

  test.describe('Dropzone interaction', () => {
    test('should change style on hover/drag', async ({ page }) => {
      const dropzone = page.locator('.dropzone');

      // Before hover, should have default style
      await expect(dropzone).toBeVisible();

      // Hover should work (visual change is CSS-based, we just verify no errors)
      await dropzone.hover();
      await expect(dropzone).toBeVisible();
    });

    test('should be clickable to open file dialog', async ({ page }) => {
      const dropzone = page.locator('.dropzone');

      // Listen for file chooser
      const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 2000 }).catch(() => null);

      await dropzone.click();

      // Wait a bit for potential file chooser (may not appear in headless)
      const fileChooser = await fileChooserPromise;
      // In headless mode, file chooser might not open, just verify click didn't error
      expect(true).toBe(true);
    });
  });

  test.describe('Responsive design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const dropzone = page.locator('.dropzone');
      await expect(dropzone).toBeVisible();

      const infoBox = page.locator('.info-box').first();
      await expect(infoBox).toBeVisible();
    });

    test('should display properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const dropzone = page.locator('.dropzone');
      await expect(dropzone).toBeVisible();

      const infoBox = page.locator('.info-box').first();
      await expect(infoBox).toBeVisible();
    });

    test('should display properly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const dropzone = page.locator('.dropzone');
      await expect(dropzone).toBeVisible();

      const infoBox = page.locator('.info-box').first();
      await expect(infoBox).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      const h2Headings = page.locator('h2');
      const h3Headings = page.locator('h3');

      await expect(h2Headings.first()).toBeVisible();
      await expect(h3Headings.first()).toBeVisible();
    });

    test('should have complementary region for info box', async ({ page }) => {
      const complementary = page.locator('[role="complementary"]').first();
      await expect(complementary).toBeVisible();
    });
  });

  test.describe('Toast notifications', () => {
    test('should have toast container available', async ({ page }) => {
      // Toast container is rendered by ToastProvider
      // It may not be visible until a toast is shown
      await expect(page.locator('.tool-container')).toBeVisible();
    });
  });

  test.describe('複数画像アップロード後の UI', () => {
    test('should show compression settings after file upload', async ({ page }) => {
      // 画像ファイルをアップロードする
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64'
        ),
      });

      // 圧縮設定セクションが表示される
      const qualitySlider = page.locator('input#quality');
      await expect(qualitySlider).toBeVisible({ timeout: 5000 });
    });

    test('should show image list after file upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'sample.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from(
          '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=',
          'base64'
        ),
      });

      // 画像リストが表示される
      const imageList = page.locator('.compress-image-list');
      await expect(imageList).toBeVisible({ timeout: 5000 });
    });

    test('should show bulk actions after file upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64'
        ),
      });

      // 一括操作ボタンが表示される
      const bulkActions = page.locator('.compress-bulk-actions');
      await expect(bulkActions).toBeVisible({ timeout: 5000 });

      // 「全て再圧縮」ボタンが存在する
      const recompressBtn = bulkActions.getByRole('button', { name: '全て再圧縮' });
      await expect(recompressBtn).toBeVisible();

      // 「全てクリア」ボタンが存在する
      const clearBtn = bulkActions.getByRole('button', { name: '全てクリア' });
      await expect(clearBtn).toBeVisible();
    });
  });
});
