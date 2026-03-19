import { test, expect } from '@playwright/test';

test.describe('Nginx 設定ジェネレーター', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nginx-config');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'サーバータイプ' })).toBeVisible();
    await expect(page.getByLabel('ドメイン名（スペース区切り）')).toBeVisible();
    await expect(page.getByLabel('生成された Nginx 設定')).toBeVisible();
  });

  test('初期状態で Nginx 設定が生成されている', async ({ page }) => {
    const output = page.getByLabel('生成された Nginx 設定');
    await expect(output).not.toBeEmpty();
    await expect(output).toContainText('server {');
  });

  test('サーバータイプを切り替えるとフォームが変わる', async ({ page }) => {
    // 静的サイト → ドキュメントルートが表示
    await page.getByLabel('静的サイト').check();
    await expect(page.getByLabel('ドキュメントルートのパス')).toBeVisible();

    // リバースプロキシ → プロキシ先URLが表示
    await page.getByLabel('リバースプロキシ').check();
    await expect(page.getByLabel('プロキシ先の URL')).toBeVisible();

    // HTTPSリダイレクト → リダイレクト先URLが表示
    await page.getByLabel('HTTPSリダイレクト').check();
    await expect(page.getByLabel('リダイレクト先の URL')).toBeVisible();
  });

  test('ドメイン名を入力すると設定に反映される', async ({ page }) => {
    const domainsInput = page.getByLabel('ドメイン名（スペース区切り）');
    await domainsInput.fill('test.example.com');

    const output = page.getByLabel('生成された Nginx 設定');
    await expect(output).toContainText('test.example.com');
  });

  test('プリセット「静的サイト (HTTPS)」が適用される', async ({ page }) => {
    await page.getByLabel('静的サイト (HTTPS)のプリセットを読み込む').click();

    const output = page.getByLabel('生成された Nginx 設定');
    await expect(output).toContainText('ssl_certificate');
    await expect(output).toContainText('example.com');
  });

  test('プリセット「Node.js プロキシ」が適用される', async ({ page }) => {
    await page.getByLabel('Node.js プロキシのプリセットを読み込む').click();

    const output = page.getByLabel('生成された Nginx 設定');
    await expect(output).toContainText('proxy_pass');
    await expect(output).toContainText('localhost:3000');
  });

  test('プリセット「HTTPSリダイレクト」が適用される', async ({ page }) => {
    await page.getByLabel('HTTPSリダイレクトのプリセットを読み込む').click();

    const output = page.getByLabel('生成された Nginx 設定');
    await expect(output).toContainText('return 301');
  });

  test('SSL チェックボックスを有効にすると SSL 設定フィールドが表示される', async ({ page }) => {
    await page.getByLabel('静的サイト').check();
    await page.getByLabel('SSL を有効にする').check();

    await expect(page.getByLabel('SSL 証明書のファイルパス')).toBeVisible();
    await expect(page.getByLabel('SSL 秘密鍵のファイルパス')).toBeVisible();
  });

  test('リセットボタンで設定が初期化される', async ({ page }) => {
    const domainsInput = page.getByLabel('ドメイン名（スペース区切り）');
    await domainsInput.fill('custom.example.com');

    await page.getByLabel('設定をリセット').click();

    const output = page.getByLabel('生成された Nginx 設定');
    await expect(output).not.toContainText('custom.example.com');
  });

  test('コピーボタンが表示されている', async ({ page }) => {
    await expect(page.getByLabel('設定をコピー')).toBeVisible();
  });

  test('メタデータが正しく設定されている', async ({ page }) => {
    await expect(page).toHaveTitle(/Nginx 設定ジェネレーター/);
  });
});
