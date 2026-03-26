import { test, expect } from '@playwright/test';

test.describe('EXIFビューワー - E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/exif-viewer');
    await page.waitForLoadState('networkidle');
  });

  test('ページが正しく読み込まれる', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('ページタイトルが正しい', async ({ page }) => {
    await expect(page).toHaveTitle(/EXIFビューワー/);
  });

  test('アクセシビリティ属性が正しく設定されている', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('アップロードゾーンが表示される', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('クリックして画像を選択');
    await expect(dropzone).toContainText('ドラッグ&ドロップ');
  });

  test('JPEG のみ対応のヒントが表示される', async ({ page }) => {
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toContainText('JPEG');
  });

  test('使い方の TipsCard が表示される', async ({ page }) => {
    const infoBoxes = page.locator('.info-box');
    await expect(infoBoxes.first()).toBeVisible();

    const allText = await infoBoxes.allTextContents();
    const combinedText = allText.join(' ');
    expect(combinedText).toContain('使い方');
    expect(combinedText).not.toContain('undefined');
  });

  test('EXIFデータとはのセクションが表示される', async ({ page }) => {
    const infoBoxes = page.locator('.info-box');
    const allText = await infoBoxes.allTextContents();
    const combinedText = allText.join(' ');
    expect(combinedText).toContain('EXIFデータとは');
  });

  test('ファイル入力が正しい accept 属性を持つ', async ({ page }) => {
    const fileInput = page.locator('#exifImageFile');
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toContain('jpeg');
  });
});
