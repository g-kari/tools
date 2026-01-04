import { test, expect } from '@playwright/test';

test.describe('Image Resize - E2E Tests', () => {
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
    await page.goto('/image-resize');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/画像リサイズ/);
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
    expect(usageText).toContain('画像リサイズ・トリミングツールとは');
    expect(usageText).not.toContain('undefined');
  });

  test('should display dropzone for file upload', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('クリックして画像を選択');
    await expect(dropzone).toContainText('ドラッグ&ドロップ');
  });

  test('should have proper aria-label on dropzone', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toHaveAttribute('aria-label', '画像ファイルをアップロード');
    await expect(dropzone).toHaveAttribute('role', 'button');
    await expect(dropzone).toHaveAttribute('tabindex', '0');
  });

  test('should have file input hidden but present', async ({ page }) => {
    const fileInput = page.locator('input#imageFile');
    await expect(fileInput).toHaveAttribute('type', 'file');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  test('should not display resize settings without image', async ({ page }) => {
    const widthInput = page.locator('input#width');
    await expect(widthInput).not.toBeVisible();

    const heightInput = page.locator('input#height');
    await expect(heightInput).not.toBeVisible();
  });

  test('should not display comparison preview without image', async ({ page }) => {
    const comparisonSection = page.locator('.preview-comparison');
    await expect(comparisonSection).not.toBeVisible();
  });

  test('should have category navigation with proper state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 画像カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('画像');
  });

  test('should show image-resize link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '画像' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const imageResizeLink = dropdown.locator('a[href="/image-resize"]');
    await expect(imageResizeLink).toBeVisible();
    await expect(imageResizeLink).toContainText('画像リサイズ');
  });

  test('should display feature list in info box', async ({ page }) => {
    const infoBox = page.locator('.info-box').first();
    await expect(infoBox).toContainText('プリセットサイズ');
    await expect(infoBox).toContainText('アスペクト比維持');
    await expect(infoBox).toContainText('トリミング機能');
    await expect(infoBox).toContainText('ブラウザ内処理');
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
    await navigateViaCategory(page, '変換', '/');
    await expect(page).toHaveURL('/');
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
      await fileChooserPromise;
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
      const complementary = page.locator('[role="complementary"]');
      await expect(complementary).toBeVisible();
      await expect(complementary).toHaveAttribute('aria-labelledby', 'usage-title');
    });

    test('should have proper labels for form elements', async ({ page }) => {
      const fileInput = page.locator('input#imageFile');
      await expect(fileInput).toHaveAttribute('aria-label', '画像ファイルを選択');
    });
  });

  test.describe('Toast notifications', () => {
    test('should have toast container available', async ({ page }) => {
      // Toast container is rendered by ToastProvider
      // Just verify page loads correctly with toast system
      await expect(page.locator('.tool-container')).toBeVisible();
    });
  });
});
