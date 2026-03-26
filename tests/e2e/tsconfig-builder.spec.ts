import { test, expect } from '@playwright/test';

test.describe('tsconfig.json ビルダー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tsconfig-builder');
  });

  test('ページタイトルが正しい', async ({ page }) => {
    await expect(page).toHaveTitle(/tsconfig\.json ビルダー/);
  });

  test('セクション見出しが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'プリセット' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'コンパイラオプション' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'tsconfig.json' })).toBeVisible();
  });

  test('デフォルトで出力に compilerOptions が含まれる', async ({ page }) => {
    const output = page.getByRole('textbox', { name: '生成された tsconfig.json' });
    await expect(output).toContainText('"compilerOptions"');
    await expect(output).toContainText('"include"');
    await expect(output).toContainText('"exclude"');
  });

  test('プリセットボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Node\.js/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Vite \+ React/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Next\.js/ })).toBeVisible();
  });

  test('カテゴリタブが表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /言語・環境/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /型チェック/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /出力・ビルド/ })).toBeVisible();
  });

  test('Vite + React プリセットを適用すると jsx が react-jsx になる', async ({ page }) => {
    await page.getByRole('button', { name: /Vite \+ React/ }).click();
    const output = page.getByRole('textbox', { name: '生成された tsconfig.json' });
    await expect(output).toContainText('"jsx": "react-jsx"');
  });

  test('Node.js プリセットを適用すると target が ES2022 になる', async ({ page }) => {
    await page.getByRole('button', { name: /Node\.js/ }).click();
    const output = page.getByRole('textbox', { name: '生成された tsconfig.json' });
    await expect(output).toContainText('"target": "ES2022"');
  });

  test('リセットボタンで設定がリセットされる', async ({ page }) => {
    // プリセット適用
    await page.getByRole('button', { name: /Vite \+ React/ }).click();
    // リセット
    await page.getByRole('button', { name: 'リセット' }).click();
    // jsx が消える（デフォルトは preserve）
    const output = page.getByRole('textbox', { name: '生成された tsconfig.json' });
    await expect(output).not.toContainText('"jsx": "react-jsx"');
  });

  test('コピーボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: /コピー/ })).toBeVisible();
  });

  test('カテゴリタブを切り替えると対応するオプションが表示される', async ({ page }) => {
    await page.getByRole('tab', { name: /出力・ビルド/ }).click();
    // 出力カテゴリにある noEmit オプションが表示される
    await expect(page.getByText('noEmit')).toBeVisible();
  });
});
