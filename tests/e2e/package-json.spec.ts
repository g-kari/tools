import { test, expect } from '@playwright/test';

test.describe('package.json ビルダー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/package-json');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'package.json ビルダー' })).toBeVisible();
    await expect(page.getByLabel('生成された package.json')).toBeVisible();
  });

  test('初期状態でプリセットボタンが表示される', async ({ page }) => {
    await expect(page.getByText('シンプル（最小構成）')).toBeVisible();
    await expect(page.getByText('Node.js CLI ツール')).toBeVisible();
    await expect(page.getByText('Webアプリ（React + Vite）')).toBeVisible();
    await expect(page.getByText('ライブラリ（TypeScript）')).toBeVisible();
  });

  test('name フィールドの入力が JSON に反映される', async ({ page }) => {
    await page.getByLabel('name').fill('my-test-package');
    const output = page.getByLabel('生成された package.json');
    await expect(output).toContainText('"name": "my-test-package"');
  });

  test('version フィールドの入力が JSON に反映される', async ({ page }) => {
    await page.getByLabel('version').fill('2.0.0');
    const output = page.getByLabel('生成された package.json');
    await expect(output).toContainText('"version": "2.0.0"');
  });

  test('private チェックボックスが JSON に反映される', async ({ page }) => {
    const output = page.getByLabel('生成された package.json');
    await expect(output).not.toContainText('"private"');

    await page.getByLabel('private（npm に公開しない）').check();
    await expect(output).toContainText('"private": true');
  });

  test('プリセット「Node.js CLI ツール」を適用できる', async ({ page }) => {
    await page.getByText('Node.js CLI ツール').click();
    const output = page.getByLabel('生成された package.json');
    await expect(output).toContainText('"build"');
    await expect(output).toContainText('"dev"');
  });

  test('スクリプトテンプレートを追加できる', async ({ page }) => {
    await page.getByLabel('build スクリプトを追加').click();
    const output = page.getByLabel('生成された package.json');
    await expect(output).toContainText('"build"');
  });

  test('スクリプトを手動で追加できる', async ({ page }) => {
    await page.getByText('+ スクリプトを追加').click();
    const keyInputs = page.locator('.pkgjson-script-key');
    await keyInputs.last().fill('custom');
    const valueInputs = page.locator('.pkgjson-script-value');
    await valueInputs.last().fill('echo hello');
    const output = page.getByLabel('生成された package.json');
    await expect(output).toContainText('"custom"');
    await expect(output).toContainText('"echo hello"');
  });

  test('キーワードを追加できる', async ({ page }) => {
    await page.getByLabel('追加するキーワード').fill('typescript');
    await page.getByRole('button', { name: '追加' }).last().click();
    const output = page.getByLabel('生成された package.json');
    await expect(output).toContainText('"typescript"');
  });

  test('キーワードを Enter キーで追加できる', async ({ page }) => {
    await page.getByLabel('追加するキーワード').fill('utility');
    await page.getByLabel('追加するキーワード').press('Enter');
    const output = page.getByLabel('生成された package.json');
    await expect(output).toContainText('"utility"');
  });

  test('キーワードタグの削除ボタンが動作する', async ({ page }) => {
    await page.getByLabel('追加するキーワード').fill('to-remove');
    await page.getByRole('button', { name: '追加' }).last().click();
    const output = page.getByLabel('生成された package.json');
    await expect(output).toContainText('"to-remove"');

    await page.getByLabel('キーワード "to-remove" を削除').click();
    await expect(output).not.toContainText('"to-remove"');
  });

  test('コピーボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'package.json をクリップボードにコピー' })).toBeVisible();
  });

  test('ダウンロードボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'package.json をファイルとしてダウンロード' })).toBeVisible();
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.getByText('package.json とは')).toBeVisible();
  });
});
