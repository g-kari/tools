import { test, expect } from '@playwright/test';

test.describe('MessagePack変換', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/msgpack');
    await page.waitForLoadState('networkidle');
  });

  test('ページが "undefined" を含まずに読み込まれること', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('ページタイトルが正しいこと', async ({ page }) => {
    const title = await page.title();
    expect(title).toMatch(/MessagePack|Web Tools/);
  });

  test('入出力テキストエリアが存在すること', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');

    await expect(inputTextarea).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test('変換ボタングループが存在すること', async ({ page }) => {
    const encodeButton = page.locator('button.btn-primary').first();
    const decodeButton = page.locator('button.btn-secondary').first();
    const clearButton = page.locator('button.btn-clear');

    await expect(encodeButton).toBeVisible();
    await expect(decodeButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test('JSONをMessagePackにエンコードできること', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-primary').first();

    await inputTextarea.fill('{"hello":"world"}');
    await encodeButton.click();

    // 出力に何らかのHEX文字列が表示される
    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    // HEX文字列は16進数文字とスペースのみで構成される
    expect(output).toMatch(/^[0-9a-fA-F\s]+$/);
  });

  test('HEXをJSONにデコードできること', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const decodeButton = page.locator('button.btn-secondary').first();

    // {"hello":"world"} のMessagePackエンコード済みHEX
    // fixmap(1) + fixstr(5)"hello" + fixstr(5)"world"
    // 0x81 a5 68 65 6c 6c 6f a5 77 6f 72 6c 64
    await inputTextarea.fill('81 a5 68 65 6c 6c 6f a5 77 6f 72 6c 64');
    await decodeButton.click();

    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    // デコード結果にhelloとworldが含まれる
    expect(output).toContain('hello');
    expect(output).toContain('world');
  });

  test('空入力でエラートーストが表示されること', async ({ page }) => {
    const encodeButton = page.locator('button.btn-primary').first();

    await encodeButton.click();

    // トースト通知が表示される
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
  });

  test('クリアボタンで入出力が消えること', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-primary').first();
    const clearButton = page.locator('button.btn-clear');

    await inputTextarea.fill('{"test": 1}');
    await encodeButton.click();

    // 出力に何かが表示されるまで待つ
    await expect(outputTextarea).not.toHaveValue('');

    // クリアボタンをクリック
    await clearButton.click();

    // 両方空になる
    await expect(inputTextarea).toHaveValue('');
    await expect(outputTextarea).toHaveValue('');
  });

  test('TipsCardが表示されること', async ({ page }) => {
    // .tips-card または "使い方" テキストが存在する
    const tipsCard = page.locator('.tips-card, .info-box');
    const usageText = page.getByText('使い方');

    const tipsVisible = await tipsCard.isVisible().catch(() => false);
    const usageVisible = await usageText.isVisible().catch(() => false);

    expect(tipsVisible || usageVisible).toBe(true);
  });

  test('アクセシビリティ属性が適切であること', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test('メインヘッディングが表示されること', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });
});
