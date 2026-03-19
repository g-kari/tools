import { test, expect } from '@playwright/test';

test.describe('行列計算ツール (/matrix)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/matrix');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/行列計算/);
    await expect(page.getByRole('heading', { name: '行列計算ツール' })).toBeVisible();
  });

  test('演算モードタブが表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: '二項演算 (A ○ B)' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '単項演算 (A のみ)' })).toBeVisible();
  });

  test('デフォルトは二項演算モード', async ({ page }) => {
    await expect(page.getByRole('tab', { name: '二項演算 (A ○ B)' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  test('二項演算ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: /A \+ B/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /A − B/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /A × B/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /kA/ })).toBeVisible();
  });

  test('サンプルボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '2×2' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3×3' })).toBeVisible();
  });

  test('デフォルト行列が設定されている', async ({ page }) => {
    // デフォルト A = [[1,2],[3,4]]
    const textareas = page.locator('textarea');
    const firstTextarea = textareas.first();
    await expect(firstTextarea).toHaveValue('1 2\n3 4');
  });

  test('2×2 加算が正しく計算される', async ({ page }) => {
    // A = [[1,2],[3,4]], B = [[5,6],[7,8]] → A+B = [[6,8],[10,12]]
    const matrixResult = page.locator('.matrix-result-section');
    await expect(matrixResult).toBeVisible();
  });

  test('単項演算モードに切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: '単項演算 (A のみ)' }).click();
    await expect(page.getByRole('tab', { name: '単項演算 (A のみ)' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    // 転置・行列式・逆行列・トレース・ランクボタンが表示される
    await expect(page.getByRole('button', { name: /Aᵀ/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /det\(A\)/ })).toBeVisible();
  });

  test('転置演算が正しく実行される', async ({ page }) => {
    await page.getByRole('tab', { name: '単項演算 (A のみ)' }).click();
    await page.getByRole('button', { name: /Aᵀ/ }).click();
    // 結果が表示される
    await expect(page.locator('.matrix-result-section')).toBeVisible();
  });

  test('サンプルボタンで行列が変更される', async ({ page }) => {
    await page.getByRole('button', { name: '3×3' }).click();
    const firstTextarea = page.locator('textarea').first();
    await expect(firstTextarea).toHaveValue('1 2 3\n0 1 4\n5 6 0');
  });

  test('無効な行列入力でエラーが表示される', async ({ page }) => {
    const firstTextarea = page.locator('textarea').first();
    await firstTextarea.fill('1 2\n3');
    // エラーメッセージが表示される
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('スカラー倍でスカラー入力フィールドが表示される', async ({ page }) => {
    await page.getByRole('button', { name: /kA/ }).click();
    // スカラー値の入力が表示される
    const scalarInput = page.locator('input[type="number"]').first();
    await expect(scalarInput).toBeVisible();
  });
});
