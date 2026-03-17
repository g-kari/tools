import { test, expect } from '@playwright/test';

test.describe('Base32エンコード・デコード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/base32');
  });

  test('ページが正常に表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/Base32/);
    await expect(page.getByRole('tab', { name: 'エンコード' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'デコード' })).toBeVisible();
  });

  test('入力テキストエリアが表示される', async ({ page }) => {
    await expect(page.getByLabel('エンコード入力テキスト')).toBeVisible();
  });

  test('テキストをエンコードできる', async ({ page }) => {
    await page.getByLabel('エンコード入力テキスト').fill('foo');
    const output = page.getByLabel('Base32エンコード出力');
    await expect(output).toBeVisible();
    const value = await output.inputValue();
    expect(value).toBe('MZXW6===');
  });

  test('デコードモードに切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: 'デコード' }).click();
    await expect(page.getByLabel('デコード入力Base32文字列')).toBeVisible();
  });

  test('Base32文字列をデコードできる', async ({ page }) => {
    await page.getByRole('tab', { name: 'デコード' }).click();
    await page.getByLabel('デコード入力Base32文字列').fill('MZXW6===');
    const output = page.getByLabel('デコード結果');
    await expect(output).toBeVisible();
    const value = await output.inputValue();
    expect(value).toBe('foo');
  });

  test('無効なBase32文字列にエラーが表示される', async ({ page }) => {
    await page.getByRole('tab', { name: 'デコード' }).click();
    await page.getByLabel('デコード入力Base32文字列').fill('INVALID!@#');
    await expect(page.getByRole('alert', { name: 'デコードエラー' })).toBeVisible();
  });

  test('クリアボタンが動作する', async ({ page }) => {
    await page.getByLabel('エンコード入力テキスト').fill('test');
    await page.getByRole('button', { name: '入力をクリア' }).click();
    await expect(page.getByLabel('エンコード入力テキスト')).toHaveValue('');
  });

  test('Standard と Base32hex を切り替えられる', async ({ page }) => {
    await page.getByLabel('エンコード入力テキスト').fill('foo');

    // Standard の結果確認
    const outputStandard = await page.getByLabel('Base32エンコード出力').inputValue();
    expect(outputStandard).toBe('MZXW6===');

    // Base32hex に切り替え
    await page.getByRole('radio', { name: /Base32hex/ }).click();
    const outputHex = await page.getByLabel('Base32エンコード出力').inputValue();
    expect(outputHex).toBe('CPNMU===');
  });

  test('パディングなしに切り替えられる', async ({ page }) => {
    await page.getByLabel('エンコード入力テキスト').fill('foo');

    // パディングあり（デフォルト）
    const withPadding = await page.getByLabel('Base32エンコード出力').inputValue();
    expect(withPadding).toContain('=');

    // パディングなしに切り替え
    await page.getByLabel("パディング文字 '=' を付加する").click();
    const withoutPadding = await page.getByLabel('Base32エンコード出力').inputValue();
    expect(withoutPadding).not.toContain('=');
    expect(withoutPadding).toBe('MZXW6');
  });

  test('入れ替えボタンでエンコード→デコードに切り替わる', async ({ page }) => {
    await page.getByLabel('エンコード入力テキスト').fill('hello');
    await page.getByRole('button', { name: '入出力を入れ替える' }).click();

    // デコードモードになり、入力にエンコード済みテキストが入る
    const input = page.getByLabel('デコード入力Base32文字列');
    await expect(input).toBeVisible();
    const value = await input.inputValue();
    expect(value).toBeTruthy();
    expect(value).not.toBe('hello');
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.getByText('Base32 について')).toBeVisible();
    await expect(page.getByText('主な用途')).toBeVisible();
  });
});
