import { test, expect } from '@playwright/test';

test.describe('ショートコードジェネレーター - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/short-code');
    await page.waitForLoadState('networkidle');
  });

  test('undefined コンテンツを含まずにページをロードできる', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('正しいページタイトルを表示する', async ({ page }) => {
    await expect(page).toHaveTitle(/ショートコードジェネレーター/);
  });

  test('フォーマット選択セクションが表示される', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('フォーマット選択');
  });

  test('アクセシビリティ属性が正しく設定されている', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('初回ロード時にコードが生成される', async ({ page }) => {
    const codeList = page.locator('.nanoid-list');
    await expect(codeList).toBeVisible();
    const items = codeList.locator('.nanoid-item');
    await expect(items).toHaveCount(1);
  });

  test('コードを生成ボタンで新しいコードが生成される', async ({ page }) => {
    const generateBtn = page.locator('button[type="submit"]');
    await expect(generateBtn).toBeVisible();

    await generateBtn.click();
    const codeList = page.locator('.nanoid-list');
    await expect(codeList).toBeVisible();
    const items = codeList.locator('.nanoid-item');
    await expect(items.first()).toBeVisible();
  });

  test('プリセット選択でセグメント設定が変わる', async ({ page }) => {
    const presetSelect = page.locator('#format-preset');
    await presetSelect.selectOption('license');

    const segmentCount = page.locator('#segment-count');
    await expect(segmentCount).toHaveValue('4');
  });

  test('生成数を変更して複数コードを生成できる', async ({ page }) => {
    const countInput = page.locator('#gen-count');
    await countInput.fill('5');

    const generateBtn = page.locator('button[type="submit"]');
    await generateBtn.click();

    const items = page.locator('.nanoid-item');
    await expect(items).toHaveCount(5);
  });

  test('コピーボタンが各コードに存在する', async ({ page }) => {
    const codeList = page.locator('.nanoid-list');
    await expect(codeList).toBeVisible();
    const copyBtn = codeList.locator('.btn-copy').first();
    await expect(copyBtn).toBeVisible();
  });

  test('クリアボタンで生成結果が消える', async ({ page }) => {
    await expect(page.locator('.nanoid-list')).toBeVisible();

    const clearBtn = page.locator('.btn-clear');
    await clearBtn.click();

    await expect(page.locator('.nanoid-list')).not.toBeVisible();
  });

  test('複数コード生成時に「すべてコピー」ボタンが表示される', async ({ page }) => {
    const countInput = page.locator('#gen-count');
    await countInput.fill('3');

    const generateBtn = page.locator('button[type="submit"]');
    await generateBtn.click();

    const copyAllBtn = page.locator('.btn-secondary');
    await expect(copyAllBtn).toBeVisible();
    await expect(copyAllBtn).toContainText('すべてコピー');
  });

  test('TipsCard が表示される', async ({ page }) => {
    const tipsSection = page.locator('.info-box').first();
    await expect(tipsSection).toBeVisible();
  });

  test('エントロピー情報が表示される', async ({ page }) => {
    const entropyInfo = page.locator('text=エントロピー');
    await expect(entropyInfo).toBeVisible();
  });
});
