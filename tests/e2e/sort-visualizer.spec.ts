import { test, expect } from '@playwright/test';

test.describe('ソートアルゴリズム可視化', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sort-visualizer');
  });

  test('ページが正常に表示される', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'ソートアルゴリズム可視化' })
    ).toBeVisible();
  });

  test('アルゴリズム選択タブが表示される', async ({ page }) => {
    const labels = [
      'バブルソート',
      '選択ソート',
      '挿入ソート',
      'マージソート',
      'クイックソート',
    ];
    for (const label of labels) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    }
  });

  test('デフォルトでバブルソートが選択されている', async ({ page }) => {
    const tab = page.getByRole('tab', { name: 'バブルソート' });
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  test('アルゴリズムを切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: 'クイックソート' }).click();
    const tab = page.getByRole('tab', { name: 'クイックソート' });
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  test('開始・一時停止ボタンが動作する', async ({ page }) => {
    await page.getByRole('button', { name: /開始/ }).click();
    await expect(page.getByRole('button', { name: /一時停止/ })).toBeVisible();

    await page.getByRole('button', { name: /一時停止/ }).click();
    await expect(page.getByRole('button', { name: /再開/ })).toBeVisible();
  });

  test('シャッフルボタンが動作する', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /シャッフル/ }).first()
    ).toBeVisible();
    await page.getByRole('button', { name: /シャッフル/ }).first().click();
  });

  test('棒グラフが表示される', async ({ page }) => {
    const canvas = page.getByRole('img', {
      name: 'ソートアルゴリズムの可視化',
    });
    await expect(canvas).toBeVisible();
  });

  test('計算量テーブルが表示される', async ({ page }) => {
    await expect(page.getByText('バブルソート の計算量')).toBeVisible();
    await expect(page.getByText('O(n²)')).toBeVisible();
  });

  test('アルゴリズム切替で計算量も更新される', async ({ page }) => {
    await page.getByRole('tab', { name: 'マージソート' }).click();
    await expect(page.getByText('マージソート の計算量')).toBeVisible();
    await expect(page.getByText('O(n log n)').first()).toBeVisible();
  });
});
