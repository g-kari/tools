import { test, expect } from '@playwright/test';

test.describe('.prettierrc ビルダー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prettier-config-builder');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '.prettierrc ビルダー' })).toBeVisible();
    await expect(page.getByText('Prettier のオプションを選択して .prettierrc を生成します')).toBeVisible();
  });

  test('プリセットボタンが表示される', async ({ page }) => {
    await expect(page.getByText('Prettier デフォルト')).toBeVisible();
    await expect(page.getByText('TypeScript')).toBeVisible();
    await expect(page.getByText('React')).toBeVisible();
    await expect(page.getByText('Vue')).toBeVisible();
    await expect(page.getByText('セミコロンなし')).toBeVisible();
  });

  test('カテゴリタブが表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /基本設定/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /引用符/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /カンマ・ブラケット/ })).toBeVisible();
  });

  test('デフォルト状態では出力が空（{}）', async ({ page }) => {
    await expect(page.getByText('すべてデフォルト値のため .prettierrc は空です')).toBeVisible();
  });

  test('プリセットを適用するとオプションが変わる', async ({ page }) => {
    await page.getByText('セミコロンなし').click();
    // 出力エリアが表示される
    const output = page.getByLabel('生成された .prettierrc');
    await expect(output).toBeVisible();
    const text = await output.inputValue();
    const parsed = JSON.parse(text) as Record<string, unknown>;
    expect(parsed.semi).toBe(false);
    expect(parsed.singleQuote).toBe(true);
  });

  test('プリセット適用後にリセットできる', async ({ page }) => {
    await page.getByText('TypeScript').click();
    await page.getByRole('button', { name: 'リセット' }).click();
    await expect(page.getByText('すべてデフォルト値のため .prettierrc は空です')).toBeVisible();
  });

  test('タブ切り替えでカテゴリが変わる', async ({ page }) => {
    await page.getByRole('tab', { name: /引用符/ }).click();
    await expect(page.getByText('singleQuote')).toBeVisible();
    await expect(page.getByText('jsxSingleQuote')).toBeVisible();
  });

  test('数値オプションの + / - ボタンが動作する', async ({ page }) => {
    // 基本設定タブ（デフォルト表示）に printWidth がある
    const increaseBtn = page.getByRole('button', { name: 'printWidth を増やす' });
    await increaseBtn.click();
    // 出力が変わること（90になる）
    const output = page.getByLabel('生成された .prettierrc');
    await expect(output).toBeVisible();
    const text = await output.inputValue();
    const parsed = JSON.parse(text) as Record<string, unknown>;
    expect(parsed.printWidth).toBe(90);
  });

  test('コピーボタンが表示される', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '.prettierrc をクリップボードにコピー' })
    ).toBeVisible();
  });

  test('title タグが正しい', async ({ page }) => {
    await expect(page).toHaveTitle(/.prettierrc ビルダー/);
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.getByText('デフォルト値と同じオプションは出力に含まれません')).toBeVisible();
  });
});
