import { test, expect } from '@playwright/test';

test.describe('YAML↔TOML変換ツール', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/yaml-toml');
  });

  test('ページが正常に表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/YAML.*TOML/);
  });

  test('変換モード選択が表示される', async ({ page }) => {
    await expect(page.getByRole('radio', { name: 'YAML から TOML へ変換' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'TOML から YAML へ変換' })).toBeVisible();
  });

  test('YAML → TOML 変換が動作する', async ({ page }) => {
    const input = page.getByLabel(/変換元の YAML/);
    await input.fill('name: my-app\nversion: "1.0.0"');
    await page.getByRole('button', { name: /YAML → TOML 変換/ }).click();
    const output = page.getByLabel(/TOML 変換結果/);
    const value = await output.inputValue();
    expect(value).toContain('name');
    expect(value).toContain('my-app');
  });

  test('TOML → YAML モードに切り替えられる', async ({ page }) => {
    await page.getByRole('radio', { name: 'TOML から YAML へ変換' }).click();
    await expect(page.getByLabel(/変換元の TOML/)).toBeVisible();
  });

  test('TOML → YAML 変換が動作する', async ({ page }) => {
    await page.getByRole('radio', { name: 'TOML から YAML へ変換' }).click();
    const input = page.getByLabel(/変換元の TOML/);
    await input.fill('[package]\nname = "my-crate"\nversion = "0.1.0"');
    await page.getByRole('button', { name: /TOML → YAML 変換/ }).click();
    const output = page.getByLabel(/YAML 変換結果/);
    const value = await output.inputValue();
    expect(value).toContain('package:');
    expect(value).toContain('my-crate');
  });

  test('空入力でエラートーストが表示される', async ({ page }) => {
    await page.getByRole('button', { name: /YAML → TOML 変換/ }).click();
    await expect(page.getByText('テキストを入力してください')).toBeVisible();
  });

  test('クリアボタンが動作する', async ({ page }) => {
    const input = page.getByLabel(/変換元の YAML/);
    await input.fill('name: test');
    await page.getByRole('button', { name: '入力と出力をクリア' }).click();
    await expect(input).toHaveValue('');
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.getByText('使い方')).toBeVisible();
    await expect(page.getByText('YAML → TOML の制限')).toBeVisible();
  });
});
