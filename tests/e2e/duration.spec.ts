import { test, expect } from '@playwright/test';

test.describe('時間計算・変換 - E2E テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/duration');
    await page.waitForLoadState('networkidle');
  });

  test('ページが正常に表示される', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
  });

  test('正しいページタイトルが表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/時間計算/);
  });

  test('3つのタブが表示される', async ({ page }) => {
    const convertTab = page.locator('.dur-tab-btn', { hasText: '変換' });
    const calcTab = page.locator('.dur-tab-btn', { hasText: '加算' });
    const framesTab = page.locator('.dur-tab-btn', { hasText: 'フレーム' });
    await expect(convertTab).toBeVisible();
    await expect(calcTab).toBeVisible();
    await expect(framesTab).toBeVisible();
  });

  test('デフォルトで変換タブがアクティブ', async ({ page }) => {
    const convertTab = page.locator('.dur-tab-btn', { hasText: '変換' });
    await expect(convertTab).toHaveClass(/active/);
  });

  test('変換タブで秒数を変換できる', async ({ page }) => {
    await page.locator('#dur-convert-input').fill('3661');
    const results = page.locator('.dur-result-grid').first();
    await expect(results).toBeVisible();
    const text = await results.textContent();
    expect(text).toContain('01:01:01');
  });

  test('変換タブでHH:MM:SS形式を変換できる', async ({ page }) => {
    await page.locator('#dur-convert-input').fill('01:30:00');
    const components = page.locator('.dur-components');
    await expect(components).toBeVisible();
  });

  test('無効な入力でエラーが表示される', async ({ page }) => {
    await page.locator('#dur-convert-input').fill('invalid-input');
    const error = page.locator('.dur-error');
    await expect(error).toBeVisible();
  });

  test('計算タブに切り替えられる', async ({ page }) => {
    await page.locator('.dur-tab-btn', { hasText: '加算' }).click();
    const calcA = page.locator('#dur-calc-a');
    await expect(calcA).toBeVisible();
  });

  test('計算タブで時間の加算ができる', async ({ page }) => {
    await page.locator('.dur-tab-btn', { hasText: '加算' }).click();
    await page.locator('#dur-calc-a').fill('3600');
    await page.locator('#dur-calc-b').fill('1800');
    const results = page.locator('.dur-result-grid');
    await expect(results).toBeVisible();
    const text = await results.textContent();
    expect(text).toContain('01:30:00');
  });

  test('フレーム変換タブに切り替えられる', async ({ page }) => {
    await page.locator('.dur-tab-btn', { hasText: 'フレーム' }).click();
    const frameInput = page.locator('#dur-frame-input');
    await expect(frameInput).toBeVisible();
  });

  test('フレーム変換タブで時間からフレーム数に変換できる', async ({ page }) => {
    await page.locator('.dur-tab-btn', { hasText: 'フレーム' }).click();
    await page.locator('#dur-frame-input').fill('00:01:00');
    const results = page.locator('.dur-result-grid');
    await expect(results).toBeVisible();
  });

  test('フレームレートボタンが表示される', async ({ page }) => {
    const fpsBtn = page.locator('.dur-fps-btn').first();
    await expect(fpsBtn).toBeVisible();
  });

  test('アクセシビリティ: role属性が正しく設定されている', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });

  test('ナビゲーションの変換カテゴリに時間計算リンクが表示される', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '変換' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/duration"]');
    await expect(link).toBeVisible();
  });
});
