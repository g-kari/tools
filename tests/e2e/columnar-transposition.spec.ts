import { test, expect } from '@playwright/test';

test.describe('列転置暗号 - E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/columnar-transposition', { waitUntil: 'domcontentloaded' });
  });

  test('ページが正常に表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/列転置暗号/);
    await expect(page.getByRole('button', { name: 'エンコード' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'デコード' })).toBeVisible();
  });

  test('エンコードが正常に動作する', async ({ page }) => {
    // キーをKEYに設定（デフォルト）してエンコード
    const input = page.getByLabel('列転置暗号の入力テキスト');
    await input.fill('WEAREDISCOVERED');

    const output = page.locator('#ct-output');
    await expect(output).not.toHaveText('変換結果がここに表示されます');
    await expect(output).toHaveText('EESVEWRIORADCED');
  });

  test('デコードが正常に動作する', async ({ page }) => {
    await page.getByRole('button', { name: 'デコード' }).click();

    const input = page.getByLabel('列転置暗号の入力テキスト');
    await input.fill('EESVEWRIORADCED');

    const output = page.locator('#ct-output');
    await expect(output).toHaveText('WEAREDISCOVERED');
  });

  test('キーワードの変更が変換結果に反映される', async ({ page }) => {
    const input = page.getByLabel('列転置暗号の入力テキスト');
    await input.fill('HELLO');

    const output = page.locator('#ct-output');
    const result1 = await output.textContent();

    // キーを変更
    const keyInput = page.getByLabel('列転置暗号のキーワード（英字のみ有効）');
    await keyInput.fill('ZEBRA');

    const result2 = await output.textContent();
    expect(result1).not.toBe(result2);
  });

  test('コピーボタンが機能する', async ({ page }) => {
    const input = page.getByLabel('列転置暗号の入力テキスト');
    await input.fill('HELLO');

    const copyBtn = page.getByRole('button', { name: '変換結果をクリップボードにコピー' });
    await expect(copyBtn).toBeEnabled();
    await copyBtn.click();
  });

  test('クリアボタンで入力がリセットされる', async ({ page }) => {
    const input = page.getByLabel('列転置暗号の入力テキスト');
    await input.fill('HELLO');

    const clearBtn = page.getByRole('button', { name: '入力をクリア' });
    await clearBtn.click();

    await expect(input).toHaveValue('');
    const output = page.locator('#ct-output');
    await expect(output).toHaveText('変換結果がここに表示されます');
  });

  test('グリッド可視化が表示される', async ({ page }) => {
    const input = page.getByLabel('列転置暗号の入力テキスト');
    await input.fill('WEAREDISCOVERED');

    const vizBtn = page.getByRole('button', { name: 'グリッド可視化を表示' });
    await vizBtn.click();

    const grid = page.locator('.ct-grid');
    await expect(grid).toBeVisible();

    // テーブルが表示されていること
    await expect(grid.locator('th')).toHaveCount(3); // KEY = 3列
  });

  test('空入力では変換されない', async ({ page }) => {
    const output = page.locator('#ct-output');
    await expect(output).toHaveText('変換結果がここに表示されます');

    const copyBtn = page.getByRole('button', { name: '変換結果をクリップボードにコピー' });
    await expect(copyBtn).toBeDisabled();
  });

  test('アクセシビリティ: ARIAラベルが正しく設定されている', async ({ page }) => {
    await expect(page.getByLabel('列転置暗号のキーワード（英字のみ有効）')).toBeVisible();
    await expect(page.getByLabel('パディング文字（英字1文字）')).toBeVisible();
    await expect(page.getByLabel('列転置暗号の入力テキスト')).toBeVisible();
  });
});
