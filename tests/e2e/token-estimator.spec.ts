import { test, expect } from '@playwright/test';

test.describe('LLMトークン推定ツール', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/token-estimator');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/LLMトークン推定/);
  });

  test('テキスト入力エリアが表示される', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'トークン推定対象テキスト' });
    await expect(textarea).toBeVisible();
  });

  test('空状態メッセージが表示される', async ({ page }) => {
    await expect(
      page.getByText('テキストを入力するとトークン数とコスト推定が表示されます')
    ).toBeVisible();
  });

  test('英語テキスト入力でトークン数が表示される', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'トークン推定対象テキスト' });
    await textarea.fill('Hello world this is a test');
    await expect(page.getByTestId('estimated-tokens')).toBeVisible();
    const tokens = await page.getByTestId('estimated-tokens').textContent();
    expect(Number(tokens?.replace(/,/g, ''))).toBeGreaterThan(0);
  });

  test('日本語テキスト入力でトークン数が表示される', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'トークン推定対象テキスト' });
    await textarea.fill('これはLLMトークン推定のテストです。');
    const tokens = page.getByTestId('estimated-tokens');
    await expect(tokens).toBeVisible();
    const tokenText = await tokens.textContent();
    expect(Number(tokenText?.replace(/,/g, ''))).toBeGreaterThan(0);
  });

  test('総文字数が正しく表示される', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'トークン推定対象テキスト' });
    await textarea.fill('Hello'); // 5文字
    const totalChars = page.getByTestId('total-chars');
    await expect(totalChars).toBeVisible();
    await expect(totalChars).toHaveText('5');
  });

  test('モデル比較テーブルが表示される', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'トークン推定対象テキスト' });
    await textarea.fill('Test text for comparison');
    await expect(page.getByRole('table')).toBeVisible();
    // OpenAIモデルが表示される
    await expect(page.getByText('GPT-4o')).toBeVisible();
    // Anthropicモデルが表示される
    await expect(page.getByText('Claude 3.5 Sonnet')).toBeVisible();
    // Googleモデルが表示される
    await expect(page.getByText('Gemini 1.5 Pro')).toBeVisible();
  });

  test('文字種内訳が表示される', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'トークン推定対象テキスト' });
    await textarea.fill('Hello 世界');
    await expect(page.getByText('文字種内訳')).toBeVisible();
    await expect(page.getByText('Latin/ASCII')).toBeVisible();
    await expect(page.getByText('CJK（日中韓）')).toBeVisible();
  });

  test('クリアボタンで入力がリセットされる', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'トークン推定対象テキスト' });
    await textarea.fill('Sample text');
    await page.getByRole('button', { name: 'クリア' }).click();
    await expect(textarea).toHaveValue('');
    await expect(
      page.getByText('テキストを入力するとトークン数とコスト推定が表示されます')
    ).toBeVisible();
  });

  test('結果をコピーボタンが表示される', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'トークン推定対象テキスト' });
    await textarea.fill('Test');
    await expect(page.getByRole('button', { name: '結果をコピー' })).toBeVisible();
  });

  test('文字カウントヒントがリアルタイム更新される', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'トークン推定対象テキスト' });
    await textarea.fill('Hello');
    await expect(page.getByText('5 文字')).toBeVisible();
    await textarea.fill('Hello World');
    await expect(page.getByText('11 文字')).toBeVisible();
  });

  test('注意書きが表示される', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'トークン推定対象テキスト' });
    await textarea.fill('Test');
    await expect(
      page.getByText(/ヒューリスティックによる推定値/)
    ).toBeVisible();
  });

  test('TipsCardが表示される', async ({ page }) => {
    await expect(page.getByText('LLMトークンとは')).toBeVisible();
  });
});
