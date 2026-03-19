import { test, expect } from '@playwright/test';

test.describe('CORS ヘッダービルダー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cors-builder');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/CORS/);
  });

  test('ページ見出しと説明が表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'CORS ヘッダービルダー' })).toBeVisible();
    await expect(page.getByText('Cross-Origin Resource Sharing')).toBeVisible();
  });

  test('プリセットが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '公開API' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'プライベートAPI' })).toBeVisible();
    await expect(page.getByRole('button', { name: '開発環境' })).toBeVisible();
  });

  test('デフォルトでワイルドカードが選択されている', async ({ page }) => {
    const wildcardRadio = page.getByRole('radio', { name: 'ワイルドカード (*)' });
    await expect(wildcardRadio).toBeChecked();
  });

  test('HTTPメソッドのチェックボックスが表示される', async ({ page }) => {
    for (const method of ['GET', 'POST', 'OPTIONS']) {
      await expect(page.getByRole('checkbox', { name: `${method} を許可` })).toBeVisible();
    }
  });

  test('初期状態でGET・POST・OPTIONSが選択されている', async ({ page }) => {
    await expect(page.getByRole('checkbox', { name: 'GET を許可' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'POST を許可' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'OPTIONS を許可' })).toBeChecked();
  });

  test('出力タブが表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'HTTPヘッダー' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Express.js' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'nginx' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'CF Workers' })).toBeVisible();
  });

  test('初期状態でAccess-Control-Allow-Originが表示される', async ({ page }) => {
    await expect(page.getByText('Access-Control-Allow-Origin:')).toBeVisible();
    await expect(page.getByText('*')).toBeVisible();
  });

  test('公開APIプリセットを適用するとヘッダーが生成される', async ({ page }) => {
    await page.getByRole('button', { name: '公開API' }).click();
    await expect(page.getByText('Access-Control-Allow-Origin:')).toBeVisible();
    await expect(page.getByText('Access-Control-Allow-Methods:')).toBeVisible();
  });

  test('プライベートAPIプリセットを適用するとcredentialsが有効になる', async ({ page }) => {
    await page.getByRole('button', { name: 'プライベートAPI' }).click();
    await expect(page.getByText('Access-Control-Allow-Credentials:')).toBeVisible();
    await expect(page.getByText('true')).toBeVisible();
  });

  test('特定オリジンモードに切り替えると入力フィールドが表示される', async ({ page }) => {
    await page.getByRole('radio', { name: '特定オリジン' }).click();
    await expect(page.getByPlaceholder('https://example.com')).toBeVisible();
  });

  test('オリジンリストモードに切り替えるとテキストエリアが表示される', async ({ page }) => {
    await page.getByRole('radio', { name: 'オリジンリスト' }).click();
    await expect(page.getByRole('textbox', { name: '許可するオリジンリスト（1行1オリジン）' })).toBeVisible();
  });

  test('Express.jsタブに切り替えるとコードが表示される', async ({ page }) => {
    await page.getByRole('tab', { name: 'Express.js' }).click();
    await expect(page.getByText("import cors from 'cors'")).toBeVisible();
  });

  test('nginxタブに切り替えるとnginx設定が表示される', async ({ page }) => {
    await page.getByRole('tab', { name: 'nginx' }).click();
    await expect(page.getByText('nginx CORS 設定')).toBeVisible();
    await expect(page.getByText('Access-Control-Allow-Origin')).toBeVisible();
  });

  test('Cloudflare Workersタブに切り替えるとコードが表示される', async ({ page }) => {
    await page.getByRole('tab', { name: 'CF Workers' }).click();
    await expect(page.getByText('export default')).toBeVisible();
  });

  test('credentialsとワイルドカードの組み合わせで警告が表示される', async ({ page }) => {
    const credentialsCheckbox = page.getByRole('checkbox', {
      name: 'Cookie・Authorization ヘッダーなどのクレデンシャルを含むリクエストを許可する',
    });
    await credentialsCheckbox.click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('警告')).toBeVisible();
  });

  test('コピーボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '生成結果をコピー' })).toBeVisible();
  });

  test('カスタムヘッダーを追加できる', async ({ page }) => {
    const input = page.getByRole('textbox', { name: 'カスタムリクエストヘッダーを追加' });
    await input.fill('X-Custom-Header');
    await page.getByRole('button', { name: '追加' }).first().click();
    await expect(page.getByText('X-Custom-Header')).toBeVisible();
  });

  test('Max-Ageプリセットボタンが動作する', async ({ page }) => {
    await page.getByRole('button', { name: '1時間' }).click();
    const maxAgeInput = page.getByRole('spinbutton', { name: 'Max-Age（秒）' });
    await expect(maxAgeInput).toHaveValue('3600');
  });

  test('TipsCardが表示される', async ({ page }) => {
    await expect(
      page.getByText('CORSプリフライトリクエスト（OPTIONS）は必ずメソッドに含めてください。')
    ).toBeVisible();
  });
});
