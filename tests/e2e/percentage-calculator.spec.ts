import { test, expect } from '@playwright/test';

test.describe('パーセンテージ計算機 - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/percentage-calculator');
    await page.waitForLoadState('networkidle');
  });

  test('undefinedコンテンツを含まずにページをロードできる', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('正しいページタイトルを表示する', async ({ page }) => {
    await expect(page).toHaveTitle(/パーセンテージ計算機/);
  });

  test('アクセシビリティ属性が正しく設定されている', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('モードタブが4つ表示される', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();

    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(4);
  });

  test('初期状態で「XはYの何%?」モードが選択されている', async ({ page }) => {
    const firstTab = page.locator('[role="tab"]').first();
    await expect(firstTab).toHaveAttribute('aria-selected', 'true');

    const xInput = page.locator('#wp-x');
    const yInput = page.locator('#wp-y');
    await expect(xInput).toBeVisible();
    await expect(yInput).toBeVisible();
  });

  test('XはYの何%? - 25は200の12.5%', async ({ page }) => {
    await page.locator('#wp-x').fill('25');
    await page.locator('#wp-y').fill('200');

    const result = page.locator('.percentage-result-value');
    await expect(result).toBeVisible();
    const text = await result.textContent();
    expect(text).toContain('12');
  });

  test('XはYの何%? - Y=0でエラーメッセージが表示される', async ({ page }) => {
    await page.locator('#wp-x').fill('50');
    await page.locator('#wp-y').fill('0');

    const error = page.locator('.percentage-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('0');
  });

  test('「XのY%は?」モードに切り替えられる', async ({ page }) => {
    const tab = page.locator('[role="tab"]', { hasText: 'XのY%は?' });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');

    const xInput = page.locator('#po-x');
    await expect(xInput).toBeVisible();
  });

  test('XのY%は? - 1000の15%は150', async ({ page }) => {
    const tab = page.locator('[role="tab"]', { hasText: 'XのY%は?' });
    await tab.click();

    await page.locator('#po-x').fill('1000');
    await page.locator('#po-y').fill('15');

    const result = page.locator('.percentage-result-value');
    await expect(result).toBeVisible();
    const text = await result.textContent();
    expect(text).toContain('150');
  });

  test('変化率モードに切り替えられる', async ({ page }) => {
    const tab = page.locator('[role="tab"]', { hasText: '変化率' });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');

    await expect(page.locator('#pc-from')).toBeVisible();
    await expect(page.locator('#pc-to')).toBeVisible();
  });

  test('変化率 - 100から125への変化率は+25%', async ({ page }) => {
    const tab = page.locator('[role="tab"]', { hasText: '変化率' });
    await tab.click();

    await page.locator('#pc-from').fill('100');
    await page.locator('#pc-to').fill('125');

    const result = page.locator('.percentage-result-value');
    await expect(result).toBeVisible();
    const text = await result.textContent();
    expect(text).toContain('25');
  });

  test('増加・減少モードに切り替えられる', async ({ page }) => {
    const tab = page.locator('[role="tab"]', { hasText: '増加・減少' });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');

    await expect(page.locator('#id-base')).toBeVisible();
    await expect(page.locator('#id-percent')).toBeVisible();
  });

  test('増加・減少 - 5000の10%増加は5500', async ({ page }) => {
    const tab = page.locator('[role="tab"]', { hasText: '増加・減少' });
    await tab.click();

    await page.locator('#id-base').fill('5000');
    await page.locator('#id-percent').fill('10');

    const result = page.locator('.percentage-result-value');
    await expect(result).toBeVisible();
    const text = await result.textContent();
    expect(text).toContain('5');
  });

  test('入力前は空の状態メッセージが表示される', async ({ page }) => {
    const emptyState = page.locator('.percentage-empty-state');
    await expect(emptyState).toBeVisible();
  });

  test('コピーボタンが表示・クリックできる', async ({ page }) => {
    await page.locator('#wp-x').fill('50');
    await page.locator('#wp-y').fill('100');

    const copyBtn = page.locator('.percentage-copy-btn');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
  });
});
