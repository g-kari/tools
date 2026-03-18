import { test, expect } from '@playwright/test';

test.describe('CSV → SQL INSERT文ジェネレーター', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/csv-sql');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/CSV.*SQL.*ジェネレーター/);
  });

  test('サンプルボタンで CSV データが読み込まれる', async ({ page }) => {
    await page.getByRole('button', { name: 'サンプル' }).click();
    const textarea = page.getByLabel('CSV入力');
    await expect(textarea).not.toBeEmpty();
  });

  test('CSV 入力後に SQL が生成される', async ({ page }) => {
    const textarea = page.getByLabel('CSV入力');
    await textarea.fill('id,name\n1,Alice\n2,Bob');
    const output = page.getByLabel('生成されたSQL INSERT文');
    await expect(output).toContainText('INSERT INTO');
    await expect(output).toContainText('Alice');
  });

  test('テーブル名を変更すると SQL に反映される', async ({ page }) => {
    const textarea = page.getByLabel('CSV入力');
    await textarea.fill('id,name\n1,Alice');
    const tableInput = page.getByLabel('テーブル名');
    await tableInput.fill('users');
    const output = page.getByLabel('生成されたSQL INSERT文');
    await expect(output).toContainText('users');
  });

  test('SQLダイアレクトを PostgreSQL に変更できる', async ({ page }) => {
    const textarea = page.getByLabel('CSV入力');
    await textarea.fill('id,name\n1,Alice');
    await page.getByLabel('SQLダイアレクト').selectOption('postgresql');
    const output = page.getByLabel('生成されたSQL INSERT文');
    await expect(output).toContainText('"my_table"');
  });

  test('SQLダイアレクトを SQL Server に変更できる', async ({ page }) => {
    const textarea = page.getByLabel('CSV入力');
    await textarea.fill('id,name\n1,Alice');
    await page.getByLabel('SQLダイアレクト').selectOption('sqlserver');
    const output = page.getByLabel('生成されたSQL INSERT文');
    await expect(output).toContainText('[my_table]');
  });

  test('クリアボタンで入力が消える', async ({ page }) => {
    const textarea = page.getByLabel('CSV入力');
    await textarea.fill('id,name\n1,Alice');
    await page.getByRole('button', { name: 'クリア' }).click();
    await expect(textarea).toBeEmpty();
  });

  test('SQL をコピーボタンが表示される', async ({ page }) => {
    const textarea = page.getByLabel('CSV入力');
    await textarea.fill('id,name\n1,Alice');
    await expect(page.getByRole('button', { name: 'SQL をコピー' })).toBeEnabled();
  });

  test('統計バッジが表示される', async ({ page }) => {
    const textarea = page.getByLabel('CSV入力');
    await textarea.fill('id,name\n1,Alice\n2,Bob\n3,Carol');
    const meta = page.getByLabel('生成結果の統計');
    await expect(meta).toContainText('3 行');
    await expect(meta).toContainText('2 列');
  });

  test('空テーブル名でエラーが表示される', async ({ page }) => {
    const textarea = page.getByLabel('CSV入力');
    await textarea.fill('id,name\n1,Alice');
    const tableInput = page.getByLabel('テーブル名');
    await tableInput.fill('');
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('バッチサイズを変更できる', async ({ page }) => {
    const textarea = page.getByLabel('CSV入力');
    await textarea.fill('id,name\n1,Alice\n2,Bob\n3,Carol');
    const batchInput = page.getByLabel('バッチサイズ');
    await batchInput.fill('10');
    const output = page.getByLabel('生成されたSQL INSERT文');
    await expect(output).toContainText('VALUES');
  });
});
