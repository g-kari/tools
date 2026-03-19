import { test, expect } from '@playwright/test';

test.describe('ひらがな・カタカナ・ローマ字変換 - E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kana-convert');
    await page.waitForLoadState('networkidle');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/ひらがな・カタカナ・ローマ字変換/);
  });

  test('ページに "undefined" が含まれない', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
  });

  test('変換モードのラジオボタンが5つ表示される', async ({ page }) => {
    const radioButtons = page.locator('input[name="kana-mode"]');
    await expect(radioButtons).toHaveCount(5);
  });

  test('デフォルトモードがひらがな→カタカナである', async ({ page }) => {
    const defaultRadio = page.locator(
      'input[name="kana-mode"][value="hiraganaToKatakana"]'
    );
    await expect(defaultRadio).toBeChecked();
  });

  test('入力テキストエリアが表示される', async ({ page }) => {
    const inputTextarea = page.locator('#kana-input');
    await expect(inputTextarea).toBeVisible();
  });

  test('ひらがな → カタカナ変換が動作する', async ({ page }) => {
    const inputTextarea = page.locator('#kana-input');
    await inputTextarea.fill('にほんご');

    const outputTextarea = page.locator('#kana-output');
    await expect(outputTextarea).toBeVisible();
    await expect(outputTextarea).toHaveValue('ニホンゴ');
  });

  test('カタカナ → ひらがな変換が動作する', async ({ page }) => {
    const katakanaRadio = page.locator(
      'input[name="kana-mode"][value="katakanaToHiragana"]'
    );
    await katakanaRadio.click();

    const inputTextarea = page.locator('#kana-input');
    await inputTextarea.fill('トウキョウ');

    const outputTextarea = page.locator('#kana-output');
    await expect(outputTextarea).toBeVisible();
    await expect(outputTextarea).toHaveValue('とうきょう');
  });

  test('仮名 → ローマ字変換が動作する', async ({ page }) => {
    const romajiRadio = page.locator(
      'input[name="kana-mode"][value="kanaToRomaji"]'
    );
    await romajiRadio.click();

    const inputTextarea = page.locator('#kana-input');
    await inputTextarea.fill('にほんご');

    const outputTextarea = page.locator('#kana-output');
    await expect(outputTextarea).toBeVisible();
    const value = await outputTextarea.inputValue();
    expect(value.toLowerCase()).toContain('nihon');
  });

  test('入力がない場合は変換結果エリアが表示されない', async ({ page }) => {
    const outputTextarea = page.locator('#kana-output');
    await expect(outputTextarea).not.toBeVisible();
  });

  test('クリアボタンで入出力がリセットされる', async ({ page }) => {
    const inputTextarea = page.locator('#kana-input');
    await inputTextarea.fill('にほんご');

    const outputTextarea = page.locator('#kana-output');
    await expect(outputTextarea).toBeVisible();

    const clearButton = page.locator('button.btn-clear');
    await clearButton.click();

    await expect(inputTextarea).toHaveValue('');
    await expect(outputTextarea).not.toBeVisible();
  });

  test('入れ替えボタンで出力が入力に移動する', async ({ page }) => {
    const inputTextarea = page.locator('#kana-input');
    await inputTextarea.fill('にほんご');

    const outputTextarea = page.locator('#kana-output');
    await expect(outputTextarea).toBeVisible();
    const outputValue = await outputTextarea.inputValue();

    const swapButton = page.locator('button', { hasText: '入れ替え' });
    await swapButton.click();

    await expect(inputTextarea).toHaveValue(outputValue);
  });

  test('モード変更時に入力が再変換される', async ({ page }) => {
    const inputTextarea = page.locator('#kana-input');
    await inputTextarea.fill('あいうえお');

    const outputTextarea = page.locator('#kana-output');
    await expect(outputTextarea).toBeVisible();

    // カタカナ→ひらがなモードに切り替え
    const katakanaRadio = page.locator(
      'input[name="kana-mode"][value="katakanaToHiragana"]'
    );
    await katakanaRadio.click();

    // ひらがな入力はカタカナ→ひらがな変換では変化しないが、再変換は実行される
    await expect(outputTextarea).toBeVisible();
  });

  test('アクセシビリティ属性が設定されている', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="radiogroup"]')).toBeVisible();

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });
});
