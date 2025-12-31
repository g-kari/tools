import { test, expect } from '@playwright/test';

test.describe('Color Extractor - E2E Tests', () => {
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
    await page.goto('/color-extractor');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/カラーコード抽出/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('画像アップロード');
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
    expect(usageText).toContain('カラーコード抽出とは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 画像カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('画像');
  });

  test('should show カラー抽出 link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '画像' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const colorExtractorLink = dropdown.locator('a[href="/color-extractor"]');
    await expect(colorExtractorLink).toBeVisible();
    await expect(colorExtractorLink).toContainText('カラー抽出');
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
    await expect(dropzoneHint).toContainText('PNG, JPEG, WebP, GIF対応');
  });

  test('should not display color count slider initially', async ({ page }) => {
    const colorCountSlider = page.locator('input#colorCount');
    await expect(colorCountSlider).not.toBeVisible();
  });

  test('should not display preview initially', async ({ page }) => {
    const previewSection = page.locator('.preview-container');
    await expect(previewSection).not.toBeVisible();
  });

  test('should not display color grid initially', async ({ page }) => {
    const colorGrid = page.locator('.color-grid');
    await expect(colorGrid).not.toBeVisible();
  });

  test('should navigate to UUID page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '生成', '/uuid');
    await expect(page).toHaveURL('/uuid');
  });

  test('should navigate to Unicode page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '変換', '/');
    await expect(page).toHaveURL('/');
  });

  test.describe('Image Upload and Color Extraction', () => {
    test('should upload image and display preview', async ({ page }) => {
      // テスト用の小さな画像を作成（Canvas APIを使用）
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d')!;

        // 赤と青のグラデーション
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 5, 10);
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(5, 0, 5, 10);

        return canvas.toDataURL('image/png');
      });

      // Data URLをBlobに変換してファイルアップロード
      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // 画像処理が完了するまで待機（再分析ボタンが表示されるのを待つ）
      const reanalyzeButton = page.locator('button.btn-primary:has-text("再分析")');
      await expect(reanalyzeButton).toBeVisible({ timeout: 10000 });

      // プレビューが表示されることを確認
      const previewSection = page.locator('.preview-container');
      await expect(previewSection).toBeVisible();

      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
    });

    test('should display color count slider after upload', async ({ page }) => {
      // テスト用画像を作成
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 10, 10);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // カラーカウントスライダーが表示される
      const colorCountSlider = page.locator('input#colorCount');
      await expect(colorCountSlider).toBeVisible({ timeout: 10000 });
    });

    test('should extract colors after upload', async ({ page }) => {
      // テスト用画像を作成（赤と青）
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 10, 20);
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(10, 0, 10, 20);

        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // カラーグリッドが表示される
      const colorGrid = page.locator('.color-grid');
      await expect(colorGrid).toBeVisible({ timeout: 10000 });

      // カラーカードが表示される
      const colorCards = page.locator('.color-card');
      const count = await colorCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display color information', async ({ page }) => {
      // テスト用画像を作成
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 10, 10);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // カラー情報が表示される
      await expect(page.locator('.color-hex').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.color-rgb').first()).toBeVisible();
      await expect(page.locator('.color-usage').first()).toBeVisible();

      // HEXコードの形式を確認
      const hexText = await page.locator('.color-hex').first().textContent();
      expect(hexText).toMatch(/^#[0-9A-F]{6}$/);
    });

    test('should have copy all button after extraction', async ({ page }) => {
      // テスト用画像を作成
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 10, 10);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // すべてコピーボタンが表示される
      const copyAllButton = page.locator('.btn-copy-all');
      await expect(copyAllButton).toBeVisible({ timeout: 10000 });
      await expect(copyAllButton).toContainText('すべてコピー');
    });

    test('should have re-analyze button after upload', async ({ page }) => {
      // テスト用画像を作成
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 10, 10);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // 再分析ボタンが表示される
      const reanalyzeButton = page.locator('button.btn-primary:has-text("再分析")');
      await expect(reanalyzeButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Color Count Adjustment', () => {
    test('should update colors when slider changes', async ({ page }) => {
      // テスト用画像をアップロード
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 10, 10);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // カラーカウントスライダーを変更
      const colorCountSlider = page.locator('input#colorCount');
      await expect(colorCountSlider).toBeVisible({ timeout: 10000 });

      // 再分析ボタンをクリック
      const reanalyzeButton = page.locator('button.btn-primary:has-text("再分析")');
      await expect(reanalyzeButton).toBeVisible();

      // スライダーの値を変更
      await colorCountSlider.fill('5');
      await reanalyzeButton.click();

      // カラーカードが更新される（再分析ボタンが「分析中...」から「再分析」に戻るのを待つ）
      await expect(reanalyzeButton).toHaveText('再分析', { timeout: 10000 });
      const colorCards = page.locator('.color-card');
      const count = await colorCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
