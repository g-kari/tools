import { test, expect } from '@playwright/test';

test.describe('CSS Custom Properties エクストラクター', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/css-variables');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'CSS Custom Properties エクストラクター' })).toBeVisible();
  });

  test('サンプルボタンでCSSを読み込める', async ({ page }) => {
    await page.getByRole('button', { name: 'Material Design' }).click();
    const textarea = page.getByRole('textbox', { name: 'CSS入力' });
    await expect(textarea).toHaveValue(/.+--md-sys-color-primary.+/s);
  });

  test('CSSを入力すると変数が抽出される', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'CSS入力' });
    await textarea.fill(`:root { --color: #ff0000; --size: 16px; }`);
    await expect(page.getByRole('list', { name: '抽出された変数一覧' })).toBeVisible();
    await expect(page.getByText('--color')).toBeVisible();
    await expect(page.getByText('--size')).toBeVisible();
  });

  test('統計が表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'Material Design' }).click();
    await expect(page.getByRole('status')).toContainText('変数:');
    await expect(page.getByRole('status')).toContainText('カラー:');
  });

  test('検索フィルターが動作する', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'CSS入力' });
    await textarea.fill(`:root { --color-primary: red; --spacing-md: 16px; }`);
    const search = page.getByPlaceholder('変数名・値で検索');
    await search.fill('color');
    await expect(page.getByText('--color-primary')).toBeVisible();
    await expect(page.getByText('--spacing-md')).not.toBeVisible();
  });

  test('カラーのみフィルターが動作する', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'CSS入力' });
    await textarea.fill(`:root { --color: #ff0000; --size: 16px; }`);
    await page.getByRole('button', { name: '🎨 カラーのみ' }).click();
    await expect(page.getByText('--color')).toBeVisible();
    await expect(page.getByText('--size')).not.toBeVisible();
  });

  test('エクスポートタブが切り替わる', async ({ page }) => {
    await page.getByRole('button', { name: 'Material Design' }).click();
    const output = page.getByRole('textbox', { name: 'エクスポート出力' });
    await expect(output).toHaveValue(/^:root \{/);
    await page.getByRole('tab', { name: 'JSON' }).click();
    await expect(output).toHaveValue(/^\{/);
    await page.getByRole('tab', { name: 'TypeScript' }).click();
    await expect(output).toHaveValue(/^export const cssVariables/);
  });

  test('クリアボタンで入力をリセットできる', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'CSS入力' });
    await textarea.fill(':root { --x: 1; }');
    await page.getByRole('button', { name: 'クリア' }).click();
    await expect(textarea).toHaveValue('');
  });

  test('空入力時に案内メッセージが表示される', async ({ page }) => {
    await expect(page.getByText('CSSを左に貼り付けると')).toBeVisible();
  });
});
