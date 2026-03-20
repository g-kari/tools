import { expect, test } from '@playwright/test';

test.describe('テキスト ↔ バイナリ変換ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/text-binary');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /テキスト.*バイナリ変換/ }),
    ).toBeVisible();
  });

  test('モード切替ボタンが表示される', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /テキスト → バイナリ/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /バイナリ → テキスト/ }),
    ).toBeVisible();
  });

  test('入力エリアが表示される', async ({ page }) => {
    await expect(page.locator('#text-binary-input')).toBeVisible();
  });

  test('"A" をバイナリに変換できる', async ({ page }) => {
    await page.locator('#text-binary-input').fill('A');
    await expect(page.locator('#text-binary-output')).toHaveValue('01000001');
  });

  test('"Hello" をスペース区切りバイナリに変換できる', async ({ page }) => {
    await page.locator('#text-binary-input').fill('Hello');
    await expect(page.locator('#text-binary-output')).toHaveValue(
      '01001000 01100101 01101100 01101100 01101111',
    );
  });

  test('バイト内訳テーブルが表示される', async ({ page }) => {
    await page.locator('#text-binary-input').fill('A');
    await expect(page.getByText('バイト内訳')).toBeVisible();
    await expect(page.getByText('U+0041')).toBeVisible();
  });

  test('統計情報（バイト数）が表示される', async ({ page }) => {
    await page.locator('#text-binary-input').fill('AB');
    await expect(page.getByText(/バイト数: 2/)).toBeVisible();
  });

  test('バイナリ → テキストモードに切り替えられる', async ({ page }) => {
    await page.getByRole('button', { name: /バイナリ → テキスト/ }).click();
    await page
      .locator('#text-binary-input')
      .fill('01000001');
    await expect(page.locator('#text-binary-output')).toHaveValue('A');
  });

  test('クリアボタンで入力がクリアされる', async ({ page }) => {
    await page.locator('#text-binary-input').fill('Hello');
    await page.getByRole('button', { name: /クリア/ }).click();
    await expect(page.locator('#text-binary-input')).toHaveValue('');
  });

  test('結果をコピーボタンが出力がある場合に表示される', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /結果をコピー/ }),
    ).not.toBeVisible();
    await page.locator('#text-binary-input').fill('A');
    await expect(
      page.getByRole('button', { name: /結果をコピー/ }),
    ).toBeVisible();
  });

  test('モード切り替え時に入力がクリアされる', async ({ page }) => {
    await page.locator('#text-binary-input').fill('Hello');
    await page.getByRole('button', { name: /バイナリ → テキスト/ }).click();
    await expect(page.locator('#text-binary-input')).toHaveValue('');
  });

  test('Tipsカードが表示される', async ({ page }) => {
    await expect(page.getByText('使い方')).toBeVisible();
    await expect(page.getByText('バイナリ表現とは')).toBeVisible();
    await expect(page.getByText('UTF-8 エンコーディング')).toBeVisible();
  });

  test('区切り文字をコンマに切り替えられる', async ({ page }) => {
    await page.locator('#text-binary-input').fill('AB');
    await page.selectOption('select[aria-label="バイト間の区切り文字"]', 'comma');
    await expect(page.locator('#text-binary-output')).toHaveValue(
      '01000001,01000010',
    );
  });
});
