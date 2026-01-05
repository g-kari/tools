import { test, expect } from '@playwright/test';

test.describe('Emoji Converter - E2E Tests', () => {
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
    await page.goto('/emoji-converter');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/絵文字コンバーター/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: '絵文字コンバーター' });
    await expect(heading).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // 画像カテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('画像');
  });

  test('should show 絵文字変換 link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '画像' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const emojiConverterLink = dropdown.locator('a[href="/emoji-converter"]');
    await expect(emojiConverterLink).toBeVisible();
    await expect(emojiConverterLink).toContainText('絵文字変換');
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
    await expect(dropzoneHint).toContainText('PNG, JPEG, GIF対応');
  });

  test('should display platform selector', async ({ page }) => {
    const platformSelector = page.locator('select#platform');
    await expect(platformSelector).toBeVisible();
    await expect(platformSelector).toHaveValue('discord');
  });

  test('should have Discord and Slack platform options', async ({ page }) => {
    const platformSelector = page.locator('select#platform');
    const options = await platformSelector.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('Discord'))).toBeTruthy();
    expect(options.some(opt => opt.includes('Slack'))).toBeTruthy();
  });

  test('should not display edit options initially', async ({ page }) => {
    const editSection = page.locator('h2.section-title:has-text("編集オプション")');
    await expect(editSection).not.toBeVisible();
  });

  test('should not display preview initially', async ({ page }) => {
    const previewSection = page.locator('h2.section-title:has-text("プレビュー")');
    await expect(previewSection).not.toBeVisible();
  });

  test('should navigate to UUID page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '生成', '/uuid');
    await expect(page).toHaveURL('/uuid');
  });

  test('should navigate to カラー抽出 page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '画像', '/color-extractor');
    await expect(page).toHaveURL('/color-extractor');
  });

  test.describe('Image Upload and Processing', () => {
    test('should upload image and display preview', async ({ page }) => {
      // テスト用の小さな画像を作成
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;

        // 赤い四角形
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);

        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // プレビューが表示される
      const previewSection = page.locator('h2.section-title:has-text("プレビュー")');
      await expect(previewSection).toBeVisible({ timeout: 10000 });

      const canvas = page.locator('canvas.preview-canvas');
      await expect(canvas).toBeVisible();
    });

    test('should display edit options after upload', async ({ page }) => {
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // 編集オプションが表示される
      const editSection = page.locator('h2.section-title:has-text("編集オプション")');
      await expect(editSection).toBeVisible({ timeout: 10000 });
    });

    test('should display file size info after upload', async ({ page }) => {
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // ファイルサイズ情報が表示される
      const fileSizeInfo = page.locator('.file-size-info');
      await expect(fileSizeInfo).toBeVisible({ timeout: 10000 });
      await expect(fileSizeInfo).toContainText('KB');
    });

    test('should have download and reset buttons after upload', async ({ page }) => {
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // ダウンロードボタンとリセットボタンが表示される
      const downloadButton = page.locator('button:has-text("ダウンロード")');
      await expect(downloadButton).toBeVisible({ timeout: 10000 });

      const resetButton = page.locator('button.btn-clear:has-text("リセット")');
      await expect(resetButton).toBeVisible();
    });
  });

  test.describe('Edit Options', () => {
    test.beforeEach(async ({ page }) => {
      // 画像をアップロード
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // 編集オプションが表示されるまで待機
      await expect(page.locator('h2.section-title:has-text("編集オプション")')).toBeVisible({ timeout: 10000 });
    });

    test('should have text embedding option', async ({ page }) => {
      const textEmbedding = page.locator('summary:has-text("テキスト埋め込み")');
      await textEmbedding.scrollIntoViewIfNeeded();
      await expect(textEmbedding).toBeVisible();

      await textEmbedding.click();
      await page.waitForTimeout(100);

      const textInput = page.locator('input#text');
      await expect(textInput).toBeAttached();
    });

    test('should have rotation/flip option', async ({ page }) => {
      const rotationFlip = page.locator('summary:has-text("回転・反転")');
      await rotationFlip.scrollIntoViewIfNeeded();
      await expect(rotationFlip).toBeVisible();

      await rotationFlip.click();
      await page.waitForTimeout(100);

      const rotationSlider = page.locator('input#rotation');
      await expect(rotationSlider).toBeAttached();
    });

    test('should have filter option', async ({ page }) => {
      const filter = page.locator('summary:has-text("フィルター")');
      await filter.scrollIntoViewIfNeeded();
      await expect(filter).toBeVisible();

      await filter.click();
      await page.waitForTimeout(100);

      const brightnessSlider = page.locator('input#brightness');
      await expect(brightnessSlider).toBeAttached();

      const contrastSlider = page.locator('input#contrast');
      await expect(contrastSlider).toBeAttached();

      const saturationSlider = page.locator('input#saturation');
      await expect(saturationSlider).toBeAttached();
    });

    test('should have transparency option', async ({ page }) => {
      const transparency = page.locator('summary:has-text("透過処理")');
      await expect(transparency).toBeVisible();

      await transparency.click();

      // details内のチェックボックスを選択
      const transparentCheckbox = transparency.locator('..').locator('input[type="checkbox"]').first();
      await expect(transparentCheckbox).toBeAttached();
    });

    test('should have border option', async ({ page }) => {
      const border = page.locator('summary:has-text("枠線")');
      await expect(border).toBeVisible();

      await border.click();

      // details内のチェックボックスを選択
      const borderCheckbox = border.locator('..').locator('input[type="checkbox"]').first();
      await expect(borderCheckbox).toBeAttached();
    });

    test('should apply text to preview', async ({ page }) => {
      const textEmbedding = page.locator('summary:has-text("テキスト埋め込み")');
      await textEmbedding.click();

      const textInput = page.locator('input#text');
      await textInput.fill('TEST');

      // プレビューが更新されるまで少し待機
      await page.waitForTimeout(500);

      const canvas = page.locator('canvas.preview-canvas');
      await expect(canvas).toBeVisible();
    });

    test('should apply rotation to preview', async ({ page }) => {
      const rotationFlip = page.locator('summary:has-text("回転・反転")');
      await rotationFlip.click();

      const rotationSlider = page.locator('input#rotation');
      await rotationSlider.fill('90');

      // プレビューが更新されるまで少し待機
      await page.waitForTimeout(500);

      const canvas = page.locator('canvas.preview-canvas');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Platform Switching', () => {
    test('should switch between Discord and Slack', async ({ page }) => {
      const platformSelector = page.locator('select#platform');

      // Discordを選択
      await platformSelector.selectOption('discord');
      await expect(platformSelector).toHaveValue('discord');

      // Slackを選択
      await platformSelector.selectOption('slack');
      await expect(platformSelector).toHaveValue('slack');
    });

    test('should display different size limits for platforms', async ({ page }) => {
      // 画像をアップロード
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // ファイルサイズ情報を確認
      const fileSizeInfo = page.locator('.file-size-info');
      await expect(fileSizeInfo).toBeVisible({ timeout: 10000 });

      // Discordの制限が表示される
      await expect(fileSizeInfo).toContainText('256');

      // Slackに切り替え
      const platformSelector = page.locator('select#platform');
      await platformSelector.selectOption('slack');

      // Slackの制限が表示される
      await expect(fileSizeInfo).toContainText('1024');
    });
  });

  test.describe('Reset Functionality', () => {
    test('should reset all settings when reset button is clicked', async ({ page }) => {
      // 画像をアップロード
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // プレビューが表示されることを確認
      await expect(page.locator('h2.section-title:has-text("プレビュー")')).toBeVisible({ timeout: 10000 });

      // リセットボタンをクリック（button-group内のリセットボタン）
      const resetButton = page.locator('.button-group button:has-text("リセット")');
      await resetButton.click();

      // プレビューが非表示になる
      await expect(page.locator('h2.section-title:has-text("プレビュー")')).not.toBeVisible();

      // 編集オプションが非表示になる
      await expect(page.locator('h2.section-title:has-text("編集オプション")')).not.toBeVisible();
    });

    test('should have reset all button in edit options section', async ({ page }) => {
      // 画像をアップロード
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // プレビューが表示されることを確認
      await expect(page.locator('h2.section-title:has-text("プレビュー")')).toBeVisible({ timeout: 10000 });

      // 全てリセットボタンが存在することを確認
      const resetAllButton = page.locator('.reset-all-button');
      await expect(resetAllButton).toBeVisible();
      await expect(resetAllButton).toHaveText('全てリセット');
    });

    test('should have reset buttons in each edit section', async ({ page }) => {
      // 画像をアップロード
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // プレビューが表示されることを確認
      await expect(page.locator('h2.section-title:has-text("プレビュー")')).toBeVisible({ timeout: 10000 });

      // 各セクションにリセットボタンが存在することを確認
      const resetSectionButtons = page.locator('.reset-section-button');
      await expect(resetSectionButtons).toHaveCount(6);
    });

    test('should reset filter options when filter reset button is clicked', async ({ page }) => {
      // 画像をアップロード
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // プレビューが表示されることを確認
      await expect(page.locator('h2.section-title:has-text("プレビュー")')).toBeVisible({ timeout: 10000 });

      // フィルターセクションを開く
      const filterDetails = page.locator('details:has(summary:has-text("フィルター"))');
      await filterDetails.locator('summary').click();

      // 明るさスライダーの値を変更
      const brightnessSlider = page.locator('#brightness');
      await brightnessSlider.fill('150');
      await expect(brightnessSlider).toHaveValue('150');

      // フィルターリセットボタンをクリック
      const filterResetButton = filterDetails.locator('.reset-section-button');
      await filterResetButton.click();

      // 明るさが100に戻ることを確認
      await expect(brightnessSlider).toHaveValue('100');
    });

    test('should reset all edit options when reset all button is clicked', async ({ page }) => {
      // 画像をアップロード
      const imageDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 128, 128);
        return canvas.toDataURL('image/png');
      });

      const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // プレビューが表示されることを確認
      await expect(page.locator('h2.section-title:has-text("プレビュー")')).toBeVisible({ timeout: 10000 });

      // フィルターセクションを開いて値を変更
      const filterDetails = page.locator('details:has(summary:has-text("フィルター"))');
      await filterDetails.locator('summary').click();
      const brightnessSlider = page.locator('#brightness');
      await brightnessSlider.fill('150');

      // 回転セクションを開いて値を変更
      const transformDetails = page.locator('details:has(summary:has-text("回転・反転"))');
      await transformDetails.locator('summary').click();
      const rotationSlider = page.locator('#rotation');
      await rotationSlider.fill('90');

      // 全てリセットボタンをクリック
      const resetAllButton = page.locator('.reset-all-button');
      await resetAllButton.click();

      // 値がデフォルトに戻ることを確認
      await expect(brightnessSlider).toHaveValue('100');
      await expect(rotationSlider).toHaveValue('0');
    });
  });

    test('should have proper ARIA labels', async ({ page }) => {
      const dropzone = page.locator('.dropzone');
      await expect(dropzone).toHaveAttribute('aria-label', '画像ファイルをアップロード');

      const fileInput = page.locator('input#imageFile');
      await expect(fileInput).toHaveAttribute('aria-label', '画像ファイルを選択');

      const platformSelect = page.locator('select#platform');
      await expect(platformSelect).toHaveAttribute('aria-describedby', 'platform-help');
    });

    test('should have status region for screen readers', async ({ page }) => {
      // main-content内のステータス領域を特定（複数あるためfirstを使用）
      const statusRegion = page.locator('#main-content [role="status"]');
      await expect(statusRegion).toBeAttached();
      await expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });

    test('should be keyboard navigable', async ({ page }) => {
      const dropzone = page.locator('.dropzone');

      // dropzoneがtabIndex=0を持つことを確認
      await expect(dropzone).toHaveAttribute('tabIndex', '0');

      // dropzoneにフォーカスを当てる
      await dropzone.focus();

      // フォーカスされていることを確認
      await expect(dropzone).toBeFocused();
    });

  test.describe('Zoom functionality', () => {
    test.beforeEach(async ({ page }) => {
      // ダミー画像を作成してアップロード
      const buffer = Buffer.alloc(100);
      buffer.write('PNG');

      await page.setInputFiles('input#imageFile', {
        name: 'test.png',
        mimeType: 'image/png',
        buffer: buffer,
      });

      // 編集オプションが表示されるまで待機
      await expect(page.locator('h2.section-title:has-text("編集オプション")')).toBeVisible({ timeout: 10000 });
    });

    test('should have zoom controls in crop section', async ({ page }) => {
      // トリミングセクションを開く
      const cropSection = page.locator('summary:has-text("トリミング")');
      await expect(cropSection).toBeVisible();
      await cropSection.click();

      // トリミングを有効化
      const cropCheckbox = page.locator('.md3-checkbox-label:has-text("トリミングを有効化")').locator('..');
      await cropCheckbox.locator('input[type="checkbox"]').check();

      // ズームセクションが表示されることを確認
      const zoomSection = page.locator('.crop-zoom-section');
      await expect(zoomSection).toBeVisible();

      // ズームスライダーが存在することを確認
      const zoomSlider = page.locator('input#cropZoom');
      await expect(zoomSlider).toBeVisible();
    });

    test('should have zoom preset buttons', async ({ page }) => {
      // トリミングセクションを開く
      const cropSection = page.locator('summary:has-text("トリミング")');
      await cropSection.click();

      // トリミングを有効化
      const cropCheckbox = page.locator('.md3-checkbox-label:has-text("トリミングを有効化")').locator('..');
      await cropCheckbox.locator('input[type="checkbox"]').check();

      // プリセットボタンが存在することを確認
      const presetButtons = page.locator('.zoom-preset-button');
      await expect(presetButtons).toHaveCount(4);
    });

    test('should have zoom in/out buttons', async ({ page }) => {
      // トリミングセクションを開く
      const cropSection = page.locator('summary:has-text("トリミング")');
      await cropSection.click();

      // トリミングを有効化
      const cropCheckbox = page.locator('.md3-checkbox-label:has-text("トリミングを有効化")').locator('..');
      await cropCheckbox.locator('input[type="checkbox"]').check();

      // ズームイン/アウトボタンが存在することを確認
      const zoomInButton = page.locator('.zoom-button[aria-label="ズームイン"]');
      const zoomOutButton = page.locator('.zoom-button[aria-label="ズームアウト"]');
      await expect(zoomInButton).toBeVisible();
      await expect(zoomOutButton).toBeVisible();
    });

    test('should show pan controls when zoom is over 100%', async ({ page }) => {
      // トリミングセクションを開く
      const cropSection = page.locator('summary:has-text("トリミング")');
      await cropSection.click();

      // トリミングを有効化
      const cropCheckbox = page.locator('.md3-checkbox-label:has-text("トリミングを有効化")').locator('..');
      await cropCheckbox.locator('input[type="checkbox"]').check();

      // 200%プリセットをクリック
      const preset200 = page.locator('.zoom-preset-button:has-text("200%")');
      await preset200.click();

      // パンコントロールが表示されることを確認
      const panControls = page.locator('.pan-controls');
      await expect(panControls).toBeVisible();

      // パンスライダーが存在することを確認
      const panXSlider = page.locator('input#cropPanX');
      const panYSlider = page.locator('input#cropPanY');
      await expect(panXSlider).toBeVisible();
      await expect(panYSlider).toBeVisible();
    });

    test('should reset zoom with crop reset button', async ({ page }) => {
      // トリミングセクションを開く
      const cropSection = page.locator('summary:has-text("トリミング")');
      await cropSection.click();

      // トリミングを有効化
      const cropCheckbox = page.locator('.md3-checkbox-label:has-text("トリミングを有効化")').locator('..');
      await cropCheckbox.locator('input[type="checkbox"]').check();

      // ズームを変更
      const preset200 = page.locator('.zoom-preset-button:has-text("200%")');
      await preset200.click();

      // ズームスライダーの値を確認
      const zoomSlider = page.locator('input#cropZoom');
      await expect(zoomSlider).toHaveValue('200');

      // リセットボタンをクリック
      const resetButton = cropSection.locator('..').locator('.reset-section-button[aria-label="トリミング設定をリセット"]');
      await resetButton.click();

      // ズームがリセットされることを確認（トリミングが無効になるので再度有効化）
      await cropCheckbox.locator('input[type="checkbox"]').check();
      await expect(zoomSlider).toHaveValue('100');
    });
  });


  test.describe('Output format functionality', () => {
    test('should have output format selection', async ({ page }) => {
      const formatSelect = page.locator('select#outputFormat');
      await expect(formatSelect).toBeVisible();

      // 出力形式の選択肢を確認
      const options = await formatSelect.locator('option').allTextContents();
      expect(options).toContain('PNG（無劣化）');
      expect(options).toContain('WebP（高圧縮）');
      expect(options).toContain('AVIF（最高圧縮）');
    });

    test('should show quality slider for WebP', async ({ page }) => {
      const formatSelect = page.locator('select#outputFormat');
      await formatSelect.selectOption('webp');

      // 品質スライダーが表示されることを確認
      const qualitySlider = page.locator('input#outputQuality');
      await expect(qualitySlider).toBeVisible();
    });

    test('should show quality slider for AVIF', async ({ page }) => {
      const formatSelect = page.locator('select#outputFormat');
      await formatSelect.selectOption('avif');

      // 品質スライダーが表示されることを確認
      const qualitySlider = page.locator('input#outputQuality');
      await expect(qualitySlider).toBeVisible();
    });

    test('should not show quality slider for PNG', async ({ page }) => {
      const formatSelect = page.locator('select#outputFormat');
      await formatSelect.selectOption('png');

      // 品質スライダーが非表示であることを確認
      const qualitySlider = page.locator('input#outputQuality');
      await expect(qualitySlider).not.toBeVisible();
    });

    test('should have reset button for output format', async ({ page }) => {
      // リセットボタンが存在することを確認
      const resetButton = page.locator('.reset-section-button[aria-label="出力形式設定をリセット"]');
      await expect(resetButton).toBeVisible();
    });
  });
});
