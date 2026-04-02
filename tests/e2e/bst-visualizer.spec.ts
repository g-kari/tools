import { test, expect } from '@playwright/test';

test.describe('二分探索木ビジュアライザー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bst-visualizer');
  });

  test('ページが正常に表示される', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: '二分探索木ビジュアライザー' })
    ).toBeVisible();
  });

  test('初期状態で空状態メッセージが表示される', async ({ page }) => {
    await expect(page.getByText('値を入力して「挿入」ボタンを押すか、プリセットを選択してください。')).toBeVisible();
  });

  test('数値を入力して挿入できる', async ({ page }) => {
    await page.getByLabel('操作する値').fill('50');
    await page.getByRole('button', { name: '挿入' }).click();
    await expect(page.getByRole('status')).toContainText('50 を挿入しました。');
  });

  test('Enterキーで挿入できる', async ({ page }) => {
    await page.getByLabel('操作する値').fill('42');
    await page.getByLabel('操作する値').press('Enter');
    await expect(page.getByRole('status')).toContainText('42 を挿入しました。');
  });

  test('挿入後に SVG ツリーが表示される', async ({ page }) => {
    await page.getByLabel('操作する値').fill('50');
    await page.getByRole('button', { name: '挿入' }).click();
    await expect(page.getByRole('img', { name: '二分探索木の可視化' })).toBeVisible();
  });

  test('挿入後にノード数が更新される', async ({ page }) => {
    for (const v of ['50', '30', '70']) {
      await page.getByLabel('操作する値').fill(v);
      await page.getByRole('button', { name: '挿入' }).click();
    }
    await expect(page.getByText('3')).toBeVisible();
  });

  test('探索ボタンが初期状態で無効', async ({ page }) => {
    await expect(page.getByRole('button', { name: '探索' })).toBeDisabled();
  });

  test('削除ボタンが初期状態で無効', async ({ page }) => {
    await expect(page.getByRole('button', { name: '削除' })).toBeDisabled();
  });

  test('クリアボタンが初期状態で無効', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'クリア' })).toBeDisabled();
  });

  test('プリセット「基本」を読み込める', async ({ page }) => {
    await page.getByRole('button', { name: '基本' }).click();
    await expect(page.getByRole('status')).toContainText('プリセットを読み込みました。');
    await expect(page.getByRole('img', { name: '二分探索木の可視化' })).toBeVisible();
  });

  test('プリセット読み込み後に走査結果が表示される', async ({ page }) => {
    await page.getByRole('button', { name: '基本' }).click();
    await expect(page.getByLabel('中順（昇順）走査結果')).toBeVisible();
    await expect(page.getByLabel('前順走査結果')).toBeVisible();
    await expect(page.getByLabel('後順走査結果')).toBeVisible();
  });

  test('中順走査が昇順になっている', async ({ page }) => {
    await page.getByRole('button', { name: '基本' }).click();
    const inorderText = await page.getByLabel('中順（昇順）走査結果').textContent();
    const values = (inorderText ?? '').split(', ').map(Number);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  test('探索で値が見つかる', async ({ page }) => {
    await page.getByRole('button', { name: '基本' }).click();
    await page.getByLabel('操作する値').fill('30');
    await page.getByRole('button', { name: '探索' }).click();
    await expect(page.getByRole('status')).toContainText('30 が見つかりました！');
  });

  test('探索で存在しない値が見つからない', async ({ page }) => {
    await page.getByRole('button', { name: '基本' }).click();
    await page.getByLabel('操作する値').fill('99');
    await page.getByRole('button', { name: '探索' }).click();
    await expect(page.getByRole('status')).toContainText('99 は見つかりませんでした。');
  });

  test('ノードを削除できる', async ({ page }) => {
    await page.getByRole('button', { name: '基本' }).click();
    await page.getByLabel('操作する値').fill('70');
    await page.getByRole('button', { name: '削除' }).click();
    await expect(page.getByRole('status')).toContainText('70 を削除しました。');
  });

  test('クリアボタンで木が消える', async ({ page }) => {
    await page.getByRole('button', { name: '基本' }).click();
    await page.getByRole('button', { name: 'クリア' }).click();
    await expect(page.getByText('値を入力して「挿入」ボタンを押すか、プリセットを選択してください。')).toBeVisible();
  });

  test('TipsCard の使い方が表示される', async ({ page }) => {
    await expect(page.getByRole('complementary').first()).toBeVisible();
  });

  test('ページタイトルが正しい', async ({ page }) => {
    await expect(page).toHaveTitle('二分探索木ビジュアライザー | Web ツール集');
  });
});
