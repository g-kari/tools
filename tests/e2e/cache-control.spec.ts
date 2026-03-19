import { test, expect } from '@playwright/test';

test.describe('Cache-Control ヘッダービルダー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cache-control');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/Cache-Control/);
  });

  test('ページ見出しと説明が表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Cache-Control ヘッダービルダー' })).toBeVisible();
    await expect(page.getByText('HTTP キャッシュ制御ヘッダー')).toBeVisible();
  });

  test('モードタブが表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'ビルド' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'パース' })).toBeVisible();
  });

  test('デフォルトでビルドモードが選択されている', async ({ page }) => {
    const buildTab = page.getByRole('tab', { name: 'ビルド' });
    await expect(buildTab).toHaveAttribute('aria-selected', 'true');
  });

  test('ターゲット種別が表示される', async ({ page }) => {
    await expect(page.getByText('レスポンスヘッダー')).toBeVisible();
    await expect(page.getByText('リクエストヘッダー')).toBeVisible();
  });

  test('初期状態でプリセットが表示される', async ({ page }) => {
    await expect(page.getByText('プリセット:')).toBeVisible();
    await expect(page.getByText('キャッシュなし（機密情報）')).toBeVisible();
    await expect(page.getByText('長期キャッシュ（コンテンツハッシュ付き）')).toBeVisible();
  });

  test('初期状態でディレクティブが表示される', async ({ page }) => {
    await expect(page.getByText('public')).toBeVisible();
    await expect(page.getByText('max-age')).toBeVisible();
  });

  test('生成された Cache-Control 出力が表示される', async ({ page }) => {
    await expect(page.getByRole('region', { name: '生成された Cache-Control 値' })).toBeVisible();
    await expect(page.getByText('Cache-Control:')).toBeVisible();
  });

  test('プリセット「キャッシュなし」を適用するとno-storeが設定される', async ({ page }) => {
    await page.getByText('キャッシュなし（機密情報）').click();
    const output = page.getByRole('region', { name: '生成された Cache-Control 値' });
    await expect(output).toContainText('no-store');
  });

  test('プリセット「長期キャッシュ」を適用するとimmutableが設定される', async ({ page }) => {
    await page.getByText('長期キャッシュ（コンテンツハッシュ付き）').click();
    const output = page.getByRole('region', { name: '生成された Cache-Control 値' });
    await expect(output).toContainText('immutable');
    await expect(output).toContainText('31536000');
  });

  test('クリアボタンでディレクティブが消去される', async ({ page }) => {
    await page.getByText('設定をすべてリセット').click();
    await expect(page.getByText('有効なディレクティブが設定されていません')).toBeVisible();
  });

  test('ディレクティブを追加できる', async ({ page }) => {
    await page.getByText('設定をすべてリセット').click();
    const select = page.getByLabel('追加するディレクティブを選択');
    await select.selectOption('no-store');
    await page.getByRole('button', { name: '選択したディレクティブを追加' }).click();
    await expect(page.getByText('no-store')).toBeVisible();
  });

  test('ディレクティブを削除できる', async ({ page }) => {
    await page.getByLabel('public を削除').click();
    const output = page.getByRole('region', { name: '生成された Cache-Control 値' });
    await expect(output).not.toContainText('public');
  });

  test('ディレクティブのチェックボックスで無効化できる', async ({ page }) => {
    const checkbox = page.getByLabel('public を無効化');
    await expect(checkbox).toBeChecked();
    await checkbox.click();
    const checkbox2 = page.getByLabel('public を有効化');
    await expect(checkbox2).not.toBeChecked();
  });

  test('max-age の値をクイックチップで設定できる', async ({ page }) => {
    await page.getByRole('button', { name: /1時間.*を設定/ }).first().click();
    const output = page.getByRole('region', { name: '生成された Cache-Control 値' });
    await expect(output).toContainText('3600');
  });

  test('コピーボタンが表示される', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Cache-Control ヘッダー値をクリップボードにコピー' }),
    ).toBeVisible();
  });

  test('パースモードに切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: 'パース' }).click();
    await expect(page.getByLabel('パースする Cache-Control ヘッダー値')).toBeVisible();
    await expect(page.getByRole('button', { name: 'パースしてビルダーに反映' })).toBeVisible();
  });

  test('既存 Cache-Control をパースしてビルドモードに反映できる', async ({ page }) => {
    await page.getByRole('tab', { name: 'パース' }).click();
    const textarea = page.getByLabel('パースする Cache-Control ヘッダー値');
    await textarea.fill('no-store');
    await page.getByRole('button', { name: 'パースしてビルダーに反映' }).click();
    await expect(page.getByRole('tab', { name: 'ビルド' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('no-store')).toBeVisible();
  });

  test('警告が表示される（no-store + max-age の組み合わせ）', async ({ page }) => {
    await page.getByRole('tab', { name: 'パース' }).click();
    await page.getByLabel('パースする Cache-Control ヘッダー値').fill('no-store, max-age=3600');
    await page.getByRole('button', { name: 'パースしてビルダーに反映' }).click();
    await expect(page.getByText(/警告/)).toBeVisible();
    await expect(page.getByText(/no-store/)).toBeVisible();
  });

  test('リクエストモードに切り替えると別のディレクティブが表示される', async ({ page }) => {
    await page.getByLabel('リクエストヘッダー').check();
    const select = page.getByLabel('追加するディレクティブを選択');
    // only-if-cached はリクエスト専用
    const options = await select.locator('option').allTextContents();
    expect(options.some((o) => o.includes('only-if-cached'))).toBe(true);
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.getByText('Cache-Control とは')).toBeVisible();
  });

  test('HTTP レスポンスヘッダー例が表示される', async ({ page }) => {
    await expect(page.getByText('HTTP レスポンスヘッダー例:')).toBeVisible();
  });
});
