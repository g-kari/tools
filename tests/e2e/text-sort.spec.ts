import { test, expect } from '@playwright/test';

test.describe('Text Sort Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/text-sort');
    await expect(page.locator('h1')).toContainText('Web ツール集');
  });

  test('should have correct page title and heading', async ({ page }) => {
    await expect(page).toHaveTitle(/テキストソート\/重複削除 ツール/);
    await expect(page.locator('label[for="inputText"]')).toContainText('入力テキスト');
  });

  test('should sort text in ascending order', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const sortAscButton = page.getByRole('button', { name: '入力テキストを昇順ソート' });

    await inputTextarea.fill('cherry\napple\nbanana');
    await sortAscButton.click();

    await expect(outputTextarea).toHaveValue('apple\nbanana\ncherry');
  });

  test('should sort text in descending order', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const sortDescButton = page.getByRole('button', { name: /降順ソート/ });

    await inputTextarea.fill('apple\nbanana\ncherry');
    await sortDescButton.click();

    await expect(outputTextarea).toHaveValue('cherry\nbanana\napple');
  });

  test('should sort Japanese text in ascending order', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const sortAscButton = page.getByRole('button', { name: '入力テキストを昇順ソート' });

    await inputTextarea.fill('りんご\nみかん\nバナナ');
    await sortAscButton.click();

    await expect(outputTextarea).toHaveValue('バナナ\nみかん\nりんご');
  });

  test('should remove duplicate lines', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const removeDupButton = page.getByRole('button', { name: '重複行を削除' });

    await inputTextarea.fill('apple\nbanana\napple\ncherry\nbanana');
    await removeDupButton.click();

    const output = await outputTextarea.inputValue();
    const lines = output.split('\n');

    expect(lines).toHaveLength(3);
    expect(lines).toContain('apple');
    expect(lines).toContain('banana');
    expect(lines).toContain('cherry');
  });

  test('should sort and remove duplicates', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const sortAndRemoveButton = page.getByRole('button', { name: '昇順ソートと重複削除を同時実行' });

    await inputTextarea.fill('cherry\napple\nbanana\napple\ncherry');
    await sortAndRemoveButton.click();

    await expect(outputTextarea).toHaveValue('apple\nbanana\ncherry');
  });

  test('should clear input and output', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const sortAscButton = page.getByRole('button', { name: '入力テキストを昇順ソート' });
    const clearButton = page.getByRole('button', { name: /クリア/ });

    await inputTextarea.fill('test\ndata');
    await sortAscButton.click();

    await expect(outputTextarea).toHaveValue('data\ntest');

    await clearButton.click();

    await expect(inputTextarea).toHaveValue('');
    await expect(outputTextarea).toHaveValue('');
  });

  test('should show toast when trying to sort empty input', async ({ page }) => {
    const sortAscButton = page.getByRole('button', { name: '入力テキストを昇順ソート' });

    await sortAscButton.click();

    // Check for toast notification
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('テキストを入力してください');
  });

  test('should have accessible form elements', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');

    await expect(inputTextarea).toHaveAttribute('aria-label');
    await expect(outputTextarea).toHaveAttribute('aria-label');
    await expect(outputTextarea).toHaveAttribute('aria-live', 'polite');
  });

  test('should have usage instructions', async ({ page }) => {
    const infoBox = page.locator('.info-box');

    await expect(infoBox).toContainText('使い方');
    await expect(infoBox).toContainText('昇順ソート');
    await expect(infoBox).toContainText('降順ソート');
    await expect(infoBox).toContainText('重複削除');
  });

  test('should handle multiline Japanese text with duplicates', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const sortAndRemoveButton = page.getByRole('button', { name: '昇順ソートと重複削除を同時実行' });

    await inputTextarea.fill('りんご\nバナナ\nりんご\nみかん\nバナナ');
    await sortAndRemoveButton.click();

    await expect(outputTextarea).toHaveValue('バナナ\nみかん\nりんご');
  });

  test('should preserve empty lines during sort', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const sortAscButton = page.getByRole('button', { name: '入力テキストを昇順ソート' });

    await inputTextarea.fill('cherry\n\napple\nbanana');
    await sortAscButton.click();

    const output = await outputTextarea.inputValue();
    const lines = output.split('\n');
    // Empty line should be sorted to the beginning
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe('');
    expect(lines).toContain('apple');
    expect(lines).toContain('banana');
    expect(lines).toContain('cherry');
  });
});
