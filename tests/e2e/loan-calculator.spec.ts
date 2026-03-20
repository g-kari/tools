import { test, expect } from '@playwright/test';

test.describe('ローン計算機 - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/loan-calculator');
    await page.waitForLoadState('networkidle');
  });

  test('undefinedコンテンツを含まずにページをロードできる', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('正しいページタイトルを表示する', async ({ page }) => {
    await expect(page).toHaveTitle(/ローン計算機/);
  });

  test('アクセシビリティ属性が正しく設定されている', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('返済方式タブが2つ表示される', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(0)).toContainText('元利均等返済');
    await expect(tabs.nth(1)).toContainText('元金均等返済');
  });

  test('初期状態で元利均等返済タブが選択されている', async ({ page }) => {
    const firstTab = page.locator('[role="tab"]').first();
    await expect(firstTab).toHaveAttribute('aria-selected', 'true');
  });

  test('入力フォームが表示される', async ({ page }) => {
    await expect(page.locator('#loan-principal')).toBeVisible();
    await expect(page.locator('#loan-rate')).toBeVisible();
    await expect(page.locator('#loan-term')).toBeVisible();
  });

  test('デフォルト値で計算結果が表示される', async ({ page }) => {
    // デフォルト値（3000万円、1.5%、35年）で計算結果が表示される
    const summary = page.locator('.loan-summary');
    await expect(summary).toBeVisible();

    const cards = page.locator('.loan-summary-card');
    await expect(cards).toHaveCount(3);
  });

  test('月々の返済額カードが表示される', async ({ page }) => {
    const primaryCard = page.locator('.loan-summary-card.primary');
    await expect(primaryCard).toBeVisible();
    await expect(primaryCard).toContainText('月々の返済額');
  });

  test('総返済額・総利息カードが表示される', async ({ page }) => {
    const cards = page.locator('.loan-summary-card');
    await expect(cards.nth(1)).toContainText('総返済額');
    await expect(cards.nth(2)).toContainText('総利息');
  });

  test('借入金額を変更すると再計算される', async ({ page }) => {
    const input = page.locator('#loan-principal');
    await input.fill('1000');

    const primaryCard = page.locator('.loan-summary-card.primary');
    await expect(primaryCard).toBeVisible();
    const value = await primaryCard.locator('.loan-summary-value').textContent();
    expect(value).toBeTruthy();
  });

  test('元金均等返済タブに切り替えられる', async ({ page }) => {
    const secondTab = page.locator('[role="tab"]').nth(1);
    await secondTab.click();
    await expect(secondTab).toHaveAttribute('aria-selected', 'true');

    // 元金均等ではラベルが変わる
    const primaryCard = page.locator('.loan-summary-card.primary');
    await expect(primaryCard).toContainText('初回月々返済額');
  });

  test('元利均等と元金均等で結果が異なる', async ({ page }) => {
    // 元利均等の月額取得
    const equalPaymentValue = await page
      .locator('.loan-summary-card.primary .loan-summary-value')
      .textContent();

    // 元金均等に切り替え
    await page.locator('[role="tab"]').nth(1).click();
    const equalPrincipalValue = await page
      .locator('.loan-summary-card.primary .loan-summary-value')
      .textContent();

    // 月額が異なる
    expect(equalPaymentValue).not.toBe(equalPrincipalValue);
  });

  test('元金・利息比率バーが表示される', async ({ page }) => {
    const ratioBar = page.locator('.loan-ratio-bar');
    await expect(ratioBar).toBeVisible();
    await expect(ratioBar).toContainText('元金');
    await expect(ratioBar).toContainText('利息');
  });

  test('返済スケジュールのトグルボタンが表示される', async ({ page }) => {
    const toggleBtn = page.locator('.loan-schedule-toggle').first();
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toContainText('返済スケジュール');
  });

  test('返済スケジュールを展開・折りたたみできる', async ({ page }) => {
    // 初期状態は非表示
    const table = page.locator('#loan-schedule-table');
    await expect(table).not.toBeVisible();

    // ボタンクリックで表示
    await page.locator('[aria-expanded]').click();
    await expect(table).toBeVisible();

    // 再クリックで非表示
    await page.locator('[aria-expanded]').click();
    await expect(table).not.toBeVisible();
  });

  test('返済スケジュールテーブルに正しい列がある', async ({ page }) => {
    await page.locator('[aria-expanded]').click();
    const table = page.locator('.loan-schedule-table');
    await expect(table).toBeVisible();

    const headers = table.locator('th');
    await expect(headers.nth(0)).toContainText('月');
    await expect(headers.nth(1)).toContainText('返済額');
    await expect(headers.nth(2)).toContainText('元金');
    await expect(headers.nth(3)).toContainText('利息');
    await expect(headers.nth(4)).toContainText('残高');
  });

  test('結果コピーボタンが機能する', async ({ page }) => {
    const copyBtn = page.locator('button', { hasText: '結果をコピー' });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    // トースト通知が表示される
    await expect(page.locator('.toast, [role="status"], [aria-live="polite"]').first()).toBeVisible({ timeout: 3000 });
  });

  test('無効な入力でエラーが表示される', async ({ page }) => {
    await page.locator('#loan-principal').fill('-100');
    // バリデーションエラーが表示される
    await expect(page.locator('.loan-error')).toBeVisible();
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.locator('.tips-card, [class*="tips"]').first()).toBeVisible();
  });

  test('ページの説明テキストが表示される', async ({ page }) => {
    const desc = page.locator('.page-description');
    await expect(desc).toBeVisible();
    await expect(desc).toContainText('ローン');
  });
});
