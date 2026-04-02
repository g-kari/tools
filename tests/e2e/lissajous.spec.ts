import { test, expect } from '@playwright/test';

test.describe('リサジュー図形ビジュアライザー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lissajous');
  });

  test('ページが正常に表示される', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'リサジュー図形ビジュアライザー' })
    ).toBeVisible();
  });

  test('キャンバスが表示される', async ({ page }) => {
    const canvas = page.getByRole('img', { name: 'リサジュー図形の描画エリア' });
    await expect(canvas).toBeVisible();
  });

  test('プリセットボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: /プリセット: 円/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /プリセット: 8の字/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /プリセット: 3:2/ })).toBeVisible();
  });

  test('一時停止・再開ボタンが動作する', async ({ page }) => {
    await expect(page.getByRole('button', { name: '⏸ 一時停止' })).toBeVisible();

    await page.getByRole('button', { name: '⏸ 一時停止' }).click();
    await expect(page.getByRole('button', { name: '▶ 再開' })).toBeVisible();

    await page.getByRole('button', { name: '▶ 再開' }).click();
    await expect(page.getByRole('button', { name: '⏸ 一時停止' })).toBeVisible();
  });

  test('リセットボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'リセット' })).toBeVisible();
  });

  test('全体を描画ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '全体を描画' })).toBeVisible();
  });

  test('速度ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '速度: 遅い' })).toBeVisible();
    await expect(page.getByRole('button', { name: '速度: 普通' })).toBeVisible();
    await expect(page.getByRole('button', { name: '速度: 速い' })).toBeVisible();
  });

  test('X軸周波数スライダーが存在する', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'X軸の周波数' });
    await expect(slider).toBeVisible();
  });

  test('Y軸周波数スライダーが存在する', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Y軸の周波数' });
    await expect(slider).toBeVisible();
  });

  test('位相差スライダーが存在する', async ({ page }) => {
    const slider = page.getByRole('slider', { name: '位相差' });
    await expect(slider).toBeVisible();
  });

  test('情報パネルに図形名が表示される', async ({ page }) => {
    await expect(page.getByText('リサジュー図形 (3:2)')).toBeVisible();
  });

  test('数式が表示される', async ({ page }) => {
    await expect(page.getByText(/x = A·sin/)).toBeVisible();
  });

  test('プリセット適用で情報が更新される', async ({ page }) => {
    await page.getByRole('button', { name: /プリセット: 円/ }).click();
    await expect(page.getByText('円')).toBeVisible();
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.getByText('リサジュー図形とは')).toBeVisible();
    await expect(page.getByText('使い方')).toBeVisible();
  });

  test('色選択入力が存在する', async ({ page }) => {
    await expect(page.getByLabel('線の色')).toBeVisible();
    await expect(page.getByLabel('背景色')).toBeVisible();
  });

  test('描画点チェックボックスが存在する', async ({ page }) => {
    const checkbox = page.getByLabel('描画点を表示');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeChecked();
  });
});
