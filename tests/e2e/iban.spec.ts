import { test, expect } from '@playwright/test';

test.describe('IBAN バリデーター - E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iban');
    await page.waitForLoadState('networkidle');
  });

  test('ページが正常に表示される（undefinedコンテンツなし）', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('正しいページタイトルが表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/IBAN.*バリデーター/);
  });

  test('IBAN入力フィールドが表示される', async ({ page }) => {
    const input = page.locator('#iban-input');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('有効なドイツIBANをリアルタイム検証する', async ({ page }) => {
    const input = page.locator('#iban-input');
    await input.fill('DE89370400440532013000');

    const banner = page.locator('.iban-result-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/valid/);
    await expect(banner).toContainText('有効');
  });

  test('有効なイギリスIBANを検証する', async ({ page }) => {
    const input = page.locator('#iban-input');
    await input.fill('GB29NWBK60161331926819');

    const banner = page.locator('.iban-result-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/valid/);
    await expect(banner).toContainText('イギリス');
  });

  test('無効なIBANに対してエラーを表示する', async ({ page }) => {
    const input = page.locator('#iban-input');
    await input.fill('DE89370400440532013001');

    const banner = page.locator('.iban-result-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/invalid/);
    await expect(banner).toContainText('無効');
  });

  test('スペース区切りのIBANを正しく検証する', async ({ page }) => {
    const input = page.locator('#iban-input');
    await input.fill('DE89 3704 0044 0532 0130 00');

    const banner = page.locator('.iban-result-banner');
    await expect(banner).toHaveClass(/valid/);
  });

  test('詳細情報セクションが表示される', async ({ page }) => {
    const input = page.locator('#iban-input');
    await input.fill('DE89370400440532013000');

    const detailsSection = page.locator('.iban-details-section');
    await expect(detailsSection).toBeVisible();

    const grid = page.locator('.iban-details-grid');
    await expect(grid).toBeVisible();
  });

  test('フォーマット済みIBANが正しく表示される', async ({ page }) => {
    const input = page.locator('#iban-input');
    await input.fill('DE89370400440532013000');

    const formatted = page.locator('.iban-formatted-display');
    await expect(formatted).toBeVisible();
    await expect(formatted).toContainText('DE89');
  });

  test('国名が詳細情報に表示される', async ({ page }) => {
    const input = page.locator('#iban-input');
    await input.fill('DE89370400440532013000');

    const detailsSection = page.locator('.iban-details-section');
    await expect(detailsSection).toContainText('ドイツ');
  });

  test('クリアボタンで入力と結果をリセットする', async ({ page }) => {
    const input = page.locator('#iban-input');
    await input.fill('DE89370400440532013000');

    await expect(page.locator('.iban-result-banner')).toBeVisible();

    const clearBtn = page.locator('button[aria-label="入力をクリア"]');
    await clearBtn.click();

    await expect(input).toHaveValue('');
    await expect(page.locator('.iban-result-banner')).not.toBeVisible();
  });

  test('テスト用IBAN番号テーブルが表示される', async ({ page }) => {
    const testSection = page.locator('.iban-test-section');
    await expect(testSection).toBeVisible();

    const table = page.locator('.iban-test-table');
    await expect(table).toBeVisible();
  });

  test('「使用」ボタンでIBANが入力欄に設定される', async ({ page }) => {
    const firstUseBtn = page.locator('.iban-use-btn').first();
    await firstUseBtn.click();

    const input = page.locator('#iban-input');
    const value = await input.inputValue();
    expect(value.replace(/[\s\-]/g, '').length).toBeGreaterThan(10);
  });

  test('「使用」ボタンクリック後に検証結果が表示される', async ({ page }) => {
    const firstUseBtn = page.locator('.iban-use-btn').first();
    await firstUseBtn.click();

    const banner = page.locator('.iban-result-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/valid/);
  });

  test('コピーボタンが表示される', async ({ page }) => {
    const input = page.locator('#iban-input');
    await input.fill('DE89370400440532013000');

    const copyBtn = page.locator('button[aria-label="フォーマット済みIBANをコピー"]');
    await expect(copyBtn).toBeVisible();
  });

  test('TipsCardに使い方情報が表示される', async ({ page }) => {
    const tipsCard = page.locator('.tips-card, [class*="tips"]').first();
    await expect(tipsCard).toBeVisible();
  });

  test('アクセシビリティランドマークが正しく設定されている', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });
});

test.describe('トップページ - IBANツール一覧', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/top');
    await page.waitForLoadState('networkidle');
  });

  test('ツール一覧に「IBAN」が表示される', async ({ page }) => {
    const ibanLink = page.locator('a[href="/iban"]');
    await expect(ibanLink).toBeVisible();
    await expect(ibanLink).toContainText('IBAN');
  });

  test('IBANカードをクリックすると /iban に遷移する', async ({ page }) => {
    const ibanLink = page.locator('a[href="/iban"]').first();
    await ibanLink.click();

    await expect(page).toHaveURL('/iban');
  });
});
