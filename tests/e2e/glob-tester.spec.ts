import { test, expect } from '@playwright/test';

test.describe('Glob パターンテスター', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/glob-tester');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Glob パターンテスター' })).toBeVisible();
    await expect(page.getByLabel('globパターン入力')).toBeVisible();
    await expect(page.getByLabel('テストパス入力')).toBeVisible();
  });

  test('初期状態でプリセットが読み込まれている', async ({ page }) => {
    const patternInput = page.getByLabel('globパターン入力');
    await expect(patternInput).not.toHaveValue('');

    const pathInput = page.getByLabel('テストパス入力');
    await expect(pathInput).not.toHaveValue('');
  });

  test('初期状態でマッチ結果が表示される', async ({ page }) => {
    const results = page.getByLabel('マッチ結果一覧');
    await expect(results).toBeVisible();
  });

  test('プリセットボタンで設定が切り替わる', async ({ page }) => {
    const patternBefore = await page.getByLabel('globパターン入力').inputValue();

    await page.getByRole('button', { name: 'node_modules 除外' }).click();

    const patternAfter = await page.getByLabel('globパターン入力').inputValue();
    expect(patternAfter).not.toBe(patternBefore);
    expect(patternAfter).toContain('node_modules');
  });

  test('パターンを手動入力するとマッチ結果が更新される', async ({ page }) => {
    const patternInput = page.getByLabel('globパターン入力');
    const pathInput = page.getByLabel('テストパス入力');

    await patternInput.fill('**/*.ts');
    await pathInput.fill('src/index.ts\nsrc/app.js\nlib/utils.ts');

    const results = page.getByLabel('マッチ結果一覧');
    await expect(results).toBeVisible();

    const items = results.locator('li');
    await expect(items).toHaveCount(3);
  });

  test('マッチしたパスと不一致のパスが区別して表示される', async ({ page }) => {
    const patternInput = page.getByLabel('globパターン入力');
    const pathInput = page.getByLabel('テストパス入力');

    await patternInput.fill('**/*.ts');
    await pathInput.fill('src/index.ts\nsrc/app.js');

    const matchedItems = page.locator('.glob-result-item.matched');
    const unmatchedItems = page.locator('.glob-result-item.unmatched');

    await expect(matchedItems).toHaveCount(1);
    await expect(unmatchedItems).toHaveCount(1);
  });

  test('否定パターンが正しく動作する', async ({ page }) => {
    const patternInput = page.getByLabel('globパターン入力');
    const pathInput = page.getByLabel('テストパス入力');

    await patternInput.fill('**/*.ts\n!**/*.test.ts');
    await pathInput.fill('src/index.ts\nsrc/index.test.ts');

    const negatedItems = page.locator('.glob-result-item.negated');
    await expect(negatedItems).toHaveCount(1);
  });

  test('パターンが空の場合は空状態メッセージが表示される', async ({ page }) => {
    await page.getByLabel('globパターン入力').fill('');
    await expect(page.getByText('パターンとパスを入力してください')).toBeVisible();
  });

  test('パスが空の場合は空状態メッセージが表示される', async ({ page }) => {
    await page.getByLabel('テストパス入力').fill('');
    await expect(page.getByText('パターンとパスを入力してください')).toBeVisible();
  });

  test('構文リファレンスが表示される', async ({ page }) => {
    const reference = page.getByLabel('構文リファレンス');
    await expect(reference).toBeVisible();
  });

  test('全プリセットが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'TypeScript ソース' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'node_modules 除外' })).toBeVisible();
    await expect(page.getByRole('button', { name: '画像ファイル' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'テストファイル' })).toBeVisible();
  });

  test('メタデータが正しく設定されている', async ({ page }) => {
    await expect(page).toHaveTitle(/Glob パターンテスター/);
  });
});
