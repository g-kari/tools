import { test, expect } from '@playwright/test';

test.describe('Hex Viewer ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hex-viewer');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/Hex Viewer/);
  });

  test('テキストタブとファイルタブが表示される', async ({ page }) => {
    const textTab = page.getByRole('tab', { name: 'テキスト' });
    const fileTab = page.getByRole('tab', { name: 'ファイル' });
    await expect(textTab).toBeVisible();
    await expect(fileTab).toBeVisible();
  });

  test('初期状態でテキストタブが選択されている', async ({ page }) => {
    const textTab = page.getByRole('tab', { name: 'テキスト' });
    await expect(textTab).toHaveAttribute('aria-selected', 'true');
  });

  test('テキスト入力でhexダンプが表示される', async ({ page }) => {
    const textarea = page.locator('textarea#hex-input');
    await textarea.fill('Hello');

    // hexダンプテーブルが表示される
    const table = page.locator('table.hex-dump-table');
    await expect(table).toBeVisible();

    // "Hello" の先頭バイト 48 (H) が表示される
    await expect(page.locator('table.hex-dump-table')).toContainText('48');
    // ASCII 列に "Hello" が含まれる
    await expect(page.locator('table.hex-dump-table')).toContainText('Hello');
  });

  test('空入力時に空状態メッセージが表示される', async ({ page }) => {
    await expect(
      page.getByText('テキストを入力すると16進数ダンプが表示されます')
    ).toBeVisible();
  });

  test('ファイルタブに切り替えができる', async ({ page }) => {
    await page.getByRole('tab', { name: 'ファイル' }).click();
    await expect(
      page.getByText('ファイルを選択すると16進数ダンプが表示されます')
    ).toBeVisible();
  });

  test('データがある場合にオプションバーが表示される', async ({ page }) => {
    const textarea = page.locator('textarea#hex-input');
    await textarea.fill('Test');

    const optionsBar = page.getByRole('group', { name: '表示オプション' });
    await expect(optionsBar).toBeVisible();
  });

  test('1行のバイト数を変更できる', async ({ page }) => {
    await page.locator('textarea#hex-input').fill('AAAA'.repeat(10));

    const select = page.getByRole('combobox', { name: '1行のバイト数' });
    await select.selectOption('8');
    // 8バイト列に変わることを確認（ヘッダーに "07" が表示される）
    await expect(page.locator('table.hex-dump-table')).toContainText('07');
  });

  test('大文字表示チェックボックスが機能する', async ({ page }) => {
    await page.locator('textarea#hex-input').fill('Hello');

    // デフォルトは小文字
    await expect(page.locator('table.hex-dump-table')).toContainText('48');

    // 大文字表示をオン
    await page.getByLabel('大文字表示').check();
    await expect(page.locator('table.hex-dump-table')).toContainText('48');
    // オフセットも大文字になる
    await expect(page.locator('.hex-offset').first()).toContainText('00000000');
  });

  test('Hexダンプをコピーボタンが表示される', async ({ page }) => {
    await page.locator('textarea#hex-input').fill('Hello');

    const copyBtn = page.getByRole('button', {
      name: 'Hexダンプをテキストとしてコピー',
    });
    await expect(copyBtn).toBeVisible();
  });

  test('データ情報バーにサイズと行数が表示される', async ({ page }) => {
    await page.locator('textarea#hex-input').fill('Hello');

    const infoBar = page.getByLabel('データ情報');
    await expect(infoBar).toContainText('5');
  });

  test('TipsCard が表示される', async ({ page }) => {
    await page.locator('textarea#hex-input').fill('A');
    await expect(page.getByText('使い方')).toBeVisible();
    await expect(page.getByText('活用例')).toBeVisible();
  });
});
