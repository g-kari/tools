import { test, expect } from '@playwright/test';

test.describe('Apache .htaccess ビルダー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/htaccess-builder');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Apache .htaccess ビルダー' })
    ).toBeVisible();
    await expect(page.getByLabel('.htaccess 出力')).toBeVisible();
  });

  test('初期状態で .htaccess が生成されている', async ({ page }) => {
    const output = page.getByLabel('.htaccess 出力');
    await expect(output).not.toBeEmpty();
    await expect(output).toContainText('DirectoryIndex');
  });

  test('HTTPS リダイレクトのチェックボックスが動作する', async ({ page }) => {
    const output = page.getByLabel('.htaccess 出力');

    // 初期状態では HTTPS リダイレクトが有効
    await expect(output).toContainText('HTTPS');

    // チェックを外す
    await page
      .getByLabel('HTTP → HTTPS リダイレクト (301)')
      .uncheck();
    await expect(output).not.toContainText('RewriteCond %{HTTPS} off');
  });

  test('www リダイレクトの切り替えが動作する', async ({ page }) => {
    const output = page.getByLabel('.htaccess 出力');

    await page.getByLabel('HTTP → HTTPS リダイレクト (301)').uncheck();

    // www を追加
    await page.getByLabel('www を追加').check();
    await expect(output).toContainText('!^www\\.');

    // www を削除
    await page.getByLabel('www を削除').check();
    await expect(output).toContainText('^www\\.');

    // なし
    await page.getByLabel('なし').check();
  });

  test('DirectoryIndex の変更が反映される', async ({ page }) => {
    const input = page.getByLabel('DirectoryIndex');
    await input.fill('index.php');

    const output = page.getByLabel('.htaccess 出力');
    await expect(output).toContainText('DirectoryIndex index.php');
  });

  test('ディレクトリ一覧非表示チェックが動作する', async ({ page }) => {
    const output = page.getByLabel('.htaccess 出力');

    // 初期状態で -Indexes が含まれる
    await expect(output).toContainText('-Indexes');

    // チェックを外す
    await page.getByLabel('ディレクトリ一覧を非表示 (-Indexes)').uncheck();
    await expect(output).not.toContainText('-Indexes');
  });

  test('プリセット「静的サイト」が適用される', async ({ page }) => {
    await page.getByText('静的サイト (HTTPS + セキュリティ)').click();

    const output = page.getByLabel('.htaccess 出力');
    await expect(output).toContainText('HTTPS');
    await expect(output).toContainText('ErrorDocument 404');
  });

  test('プリセット「WordPress」が適用される', async ({ page }) => {
    await page.getByText('WordPress').click();

    const output = page.getByLabel('.htaccess 出力');
    await expect(output).toContainText('index.php');
  });

  test('プリセット「セキュリティのみ」が適用される', async ({ page }) => {
    await page.getByText('セキュリティのみ').click();

    const output = page.getByLabel('.htaccess 出力');
    await expect(output).toContainText('Require all denied');
    await expect(output).not.toContainText('mod_deflate.c');
  });

  test('カスタムリダイレクトを追加できる', async ({ page }) => {
    await page.getByText('+ リダイレクトを追加').click();

    await page.getByLabel('リダイレクト元 1').fill('/old-page');
    await page.getByLabel('リダイレクト先 1').fill('https://example.com/new');

    const output = page.getByLabel('.htaccess 出力');
    await expect(output).toContainText('/old-page');
    await expect(output).toContainText('https://example.com/new');
  });

  test('カスタムリダイレクトを削除できる', async ({ page }) => {
    await page.getByText('+ リダイレクトを追加').click();
    await page.getByLabel('リダイレクト元 1').fill('/test');
    await page.getByLabel('リダイレクト先 1').fill('https://example.com');

    await page.getByLabel('リダイレクト 1 を削除').click();

    const output = page.getByLabel('.htaccess 出力');
    await expect(output).not.toContainText('/test');
  });

  test('X-Frame-Options の変更が反映される', async ({ page }) => {
    await page.getByLabel('X-Frame-Options').selectOption('DENY');

    const output = page.getByLabel('.htaccess 出力');
    await expect(output).toContainText('X-Frame-Options "DENY"');
  });

  test('404 エラーページの入力が反映される', async ({ page }) => {
    await page.getByLabel('404 Not Found').fill('/error/404.html');

    const output = page.getByLabel('.htaccess 出力');
    await expect(output).toContainText('ErrorDocument 404 /error/404.html');
  });

  test('GZIP 圧縮を無効にできる', async ({ page }) => {
    await page
      .getByLabel('mod_deflate による GZIP 圧縮を有効にする')
      .uncheck();

    const output = page.getByLabel('.htaccess 出力');
    await expect(output).not.toContainText('mod_deflate.c');
  });

  test('コピーボタンが表示されている', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'コピー' })).toBeVisible();
  });

  test('ダウンロードボタンが表示されている', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'ダウンロード' })
    ).toBeVisible();
  });

  test('Tips セクションが表示される', async ({ page }) => {
    await expect(page.getByText('.htaccess とは')).toBeVisible();
    await expect(page.getByText('使い方')).toBeVisible();
  });
});
