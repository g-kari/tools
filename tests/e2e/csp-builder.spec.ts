import { test, expect } from '@playwright/test';

test.describe('CSP ビルダー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/csp-builder');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/CSP ビルダー/);
  });

  test('ページ見出しと説明が表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'CSP ビルダー' })).toBeVisible();
    await expect(page.getByText('Content-Security-Policy')).toBeVisible();
  });

  test('モードタブが表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'ビルド' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'パース' })).toBeVisible();
  });

  test('デフォルトでビルドモードが選択されている', async ({ page }) => {
    const buildTab = page.getByRole('tab', { name: 'ビルド' });
    await expect(buildTab).toHaveAttribute('aria-selected', 'true');
  });

  test('テンプレートボタンが表示される', async ({ page }) => {
    await expect(page.getByText('テンプレート:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'デフォルト' })).toBeVisible();
    await expect(page.getByRole('button', { name: '厳格（nonce ベース）' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'クリア' })).toBeVisible();
  });

  test('初期状態でディレクティブが表示される（デフォルトポリシー）', async ({ page }) => {
    await expect(page.getByText('default-src')).toBeVisible();
    await expect(page.getByText('script-src')).toBeVisible();
    await expect(page.getByText('img-src')).toBeVisible();
  });

  test('生成された CSP 出力が表示される', async ({ page }) => {
    await expect(page.getByText("default-src 'self'")).toBeVisible();
  });

  test('クリアボタンでディレクティブが消去される', async ({ page }) => {
    await page.getByRole('button', { name: 'クリア' }).click();
    await expect(page.getByText('有効なディレクティブが設定されていません')).toBeVisible();
  });

  test('厳格テンプレートを適用するとディレクティブが変更される', async ({ page }) => {
    await page.getByRole('button', { name: '厳格（nonce ベース）' }).click();
    await expect(page.getByText("'strict-dynamic'")).toBeVisible();
  });

  test('ディレクティブを追加できる', async ({ page }) => {
    // まずクリアしてから追加
    await page.getByRole('button', { name: 'クリア' }).click();
    const select = page.getByLabel('追加するディレクティブを選択');
    await select.selectOption('script-src');
    await page.getByRole('button', { name: '選択したディレクティブを追加' }).click();
    await expect(page.getByText('script-src')).toBeVisible();
  });

  test('ディレクティブのチェックボックスで無効化できる', async ({ page }) => {
    const checkbox = page.getByLabel('default-src を無効化');
    await expect(checkbox).toBeChecked();
    await checkbox.click();
    const checkbox2 = page.getByLabel('default-src を有効化');
    await expect(checkbox2).not.toBeChecked();
  });

  test('ディレクティブを削除できる', async ({ page }) => {
    await page.getByLabel('object-src を削除').click();
    // object-src が削除されたことを確認（CSP 出力から消える）
    const output = page.getByRole('region', { name: '生成された CSP' });
    await expect(output).not.toContainText('object-src');
  });

  test('ソース入力フィールドで値を変更できる', async ({ page }) => {
    const inputs = page.getByLabel('default-src のソース値');
    await inputs.fill("'self' https://example.com");
    await expect(page.getByRole('region', { name: '生成された CSP' })).toContainText('https://example.com');
  });

  test('ソースチップをクリックするとソースが追加される', async ({ page }) => {
    // default-src 行のソースチップからデータ: を追加
    const chip = page.getByRole('button', { name: "data: を追加: data: URI を許可" }).first();
    await chip.click();
    const output = page.getByRole('region', { name: '生成された CSP' });
    await expect(output).toContainText('data:');
  });

  test('コピーボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'CSP ヘッダー値をクリップボードにコピー' })).toBeVisible();
  });

  test('複数行表示に切り替えられる', async ({ page }) => {
    const toggle = page.getByLabel('複数行表示に切り替え');
    await toggle.check();
    await expect(toggle).toBeChecked();
  });

  test('HTTP レスポンスヘッダー例が表示される', async ({ page }) => {
    await expect(page.getByText('Content-Security-Policy:')).toBeVisible();
  });

  test('パースモードに切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: 'パース' }).click();
    await expect(page.getByLabel('パースする CSP ヘッダー値')).toBeVisible();
    await expect(page.getByRole('button', { name: 'パースしてビルダーに反映' })).toBeVisible();
  });

  test('既存 CSP をパースしてビルドモードに反映できる', async ({ page }) => {
    await page.getByRole('tab', { name: 'パース' }).click();
    const textarea = page.getByLabel('パースする CSP ヘッダー値');
    await textarea.fill("default-src 'none'; script-src 'self'; upgrade-insecure-requests");
    await page.getByRole('button', { name: 'パースしてビルダーに反映' }).click();
    // ビルドモードに戻る
    await expect(page.getByRole('tab', { name: 'ビルド' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('upgrade-insecure-requests')).toBeVisible();
  });

  test('セキュリティ警告が表示される（unsafe-inline 使用時）', async ({ page }) => {
    // ソース入力に unsafe-inline を追加
    const input = page.getByLabel('script-src のソース値');
    await input.fill("'self' 'unsafe-inline'");
    await expect(page.getByText(/セキュリティ警告/)).toBeVisible();
    await expect(page.getByText(/unsafe-inline/)).toBeVisible();
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.getByText('CSP とは')).toBeVisible();
  });

  test('アクセシビリティ: モードタブに role="tab" が設定されている', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'ビルド' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'パース' })).toBeVisible();
  });

  test('アクセシビリティ: カテゴリセクションにランドマークラベルが設定されている', async ({ page }) => {
    await expect(page.getByRole('region', { name: '生成された CSP' })).toBeVisible();
  });
});
