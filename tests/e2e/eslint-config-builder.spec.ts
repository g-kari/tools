import { test, expect } from '@playwright/test';

test.describe('ESLint Config ビルダー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/eslint-config-builder');
  });

  test('ページタイトルが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ESLint Config ビルダー', level: 1 })).toBeVisible();
  });

  test('プリセットボタンが表示される', async ({ page }) => {
    await expect(page.getByText('JavaScript')).toBeVisible();
    await expect(page.getByText('TypeScript')).toBeVisible();
    await expect(page.getByText('React + TypeScript')).toBeVisible();
    await expect(page.getByText('Node.js + TypeScript')).toBeVisible();
  });

  test('カテゴリタブが表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /設定形式/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /TypeScript/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /React/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /コード品質/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /スタイル/ })).toBeVisible();
  });

  test('出力エリアに eslint.config.js が表示される（デフォルト）', async ({ page }) => {
    const output = page.getByRole('textbox', { name: /生成された eslint.config.js/ });
    await expect(output).toBeVisible();
    const value = await output.inputValue();
    expect(value).toContain('import js from "@eslint/js"');
    expect(value).toContain('export default');
  });

  test('プリセット適用で設定が変わる', async ({ page }) => {
    await page.getByRole('button', { name: /React \+ TypeScript/ }).click();
    const output = page.getByRole('textbox', { name: /生成された eslint.config.js/ });
    const value = await output.inputValue();
    expect(value).toContain('eslint-plugin-react');
    expect(value).toContain('eslint-plugin-react-hooks');
  });

  test('レガシープリセット適用でファイル名が変わる', async ({ page }) => {
    await page.getByRole('button', { name: /.eslintrc（レガシー）/ }).click();
    await expect(page.getByRole('heading', { name: '.eslintrc.json' })).toBeVisible();
    const output = page.getByRole('textbox', { name: /生成された .eslintrc.json/ });
    const value = await output.inputValue();
    const parsed = JSON.parse(value);
    expect(parsed).toHaveProperty('env');
    expect(parsed).toHaveProperty('extends');
  });

  test('コピーボタンが存在する', async ({ page }) => {
    await expect(page.getByRole('button', { name: /eslint.config.js をクリップボードにコピー/ })).toBeVisible();
  });

  test('リセットボタンで設定が戻る', async ({ page }) => {
    await page.getByRole('button', { name: /React \+ TypeScript/ }).click();
    await page.getByRole('button', { name: 'リセット' }).click();
    const output = page.getByRole('textbox', { name: /生成された eslint.config.js/ });
    const value = await output.inputValue();
    expect(value).not.toContain('eslint-plugin-react');
  });

  test('インストールコマンドが表示される', async ({ page }) => {
    await expect(page.getByText('必要なパッケージ')).toBeVisible();
    const code = page.locator('.eslint-install-code');
    await expect(code).toBeVisible();
    const text = await code.textContent();
    expect(text).toContain('npm install --save-dev');
    expect(text).toContain('eslint');
  });

  test('カテゴリタブの切り替えが動作する', async ({ page }) => {
    await page.getByRole('tab', { name: /TypeScript/ }).click();
    await expect(page.getByText('enableTypeScript')).toBeVisible();

    await page.getByRole('tab', { name: /コード品質/ }).click();
    await expect(page.getByText('preferConst')).toBeVisible();
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.getByText(/ESLint 9 以降はフラット設定形式/)).toBeVisible();
  });

  test('アクセシビリティ: タブにrole="tab"がある', async ({ page }) => {
    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });
});
