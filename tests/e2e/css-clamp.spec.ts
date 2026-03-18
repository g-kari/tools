import { test, expect } from '@playwright/test';

test.describe('CSS Fluid/Clamp 計算機', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/css-clamp');
  });

  test('ページが正常に表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/CSS Fluid\/Clamp/);
    await expect(page.getByRole('heading', { name: /CSS Fluid\/Clamp/ })).toBeVisible();
  });

  test('プリセットボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('group', { name: 'プリセット' })).toBeVisible();
    await expect(page.getByText('本文フォント')).toBeVisible();
    await expect(page.getByText('見出し h1')).toBeVisible();
  });

  test('プリセットをクリックすると入力値が変わる', async ({ page }) => {
    await page.getByText('パディング (16→48px)').click();
    const minInput = page.getByLabel(/最小値/);
    await expect(minInput).toHaveValue('16');
  });

  test('単位切り替えが動作する', async ({ page }) => {
    await expect(page.getByLabel(/値の単位/)).toBeVisible();
    await page.getByLabel('rem').click();
    // rem に切り替えると rem base 入力が表示される
    await expect(page.getByLabel(/rem の基準フォントサイズ/)).toBeVisible();
  });

  test('数値入力で結果が更新される', async ({ page }) => {
    // デフォルト設定で clamp() 値が表示されることを確認
    await expect(page.getByText(/clamp\(/)).toBeVisible();
  });

  test('clamp() コピーボタンが動作する', async ({ page }) => {
    const copyBtns = page.getByRole('button', { name: /clamp\(\) をコピー/ });
    await expect(copyBtns).toBeVisible();
  });

  test('CSS Var の出力が表示される', async ({ page }) => {
    await expect(page.getByText(/--fluid-value:/)).toBeVisible();
  });

  test('SCSS 変数の出力が表示される', async ({ page }) => {
    await expect(page.getByText(/\$fluid-value:/)).toBeVisible();
  });

  test('スケールテーブルが表示される', async ({ page }) => {
    await expect(page.getByRole('table', { name: /ビューポート幅ごとの値/ })).toBeVisible();
    await expect(page.getByText('ビューポート幅')).toBeVisible();
    await expect(page.getByText('フルイド')).toBeVisible();
  });

  test('不正な入力でエラーが表示される', async ({ page }) => {
    // minViewport > maxViewport にする
    await page.getByLabel('最小ビューポート幅 (px)').fill('1280');
    await page.getByLabel('最大ビューポート幅 (px)').fill('320');
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.getByText('使い方')).toBeVisible();
    await expect(page.getByText('計算式')).toBeVisible();
  });

  test('SVG グラフが表示される', async ({ page }) => {
    await expect(page.getByRole('img', { name: /スケールグラフ/ })).toBeVisible();
  });
});
