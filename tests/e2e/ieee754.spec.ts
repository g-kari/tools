import { test, expect } from '@playwright/test';

test.describe('IEEE 754 浮動小数点数ビジュアライザー - E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ieee754');
    await page.waitForLoadState('networkidle');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/IEEE 754/);
  });

  test('ページに "undefined" が含まれない', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
  });

  test('精度選択タブが2つ表示される', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(2);
  });

  test('デフォルトがfloat32（単精度）である', async ({ page }) => {
    const float32Tab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(float32Tab).toContainText('float32');
  });

  test('数値入力フィールドが表示される', async ({ page }) => {
    const inputField = page.locator('#f754-input');
    await expect(inputField).toBeVisible();
  });

  test('10進数入力でビット表現が更新される', async ({ page }) => {
    const inputField = page.locator('#f754-input');
    await inputField.fill('1.0');

    // 1.0 のfloat32 HEXは 3F800000
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('3F800000');
  });

  test('プリセットボタンが複数表示される', async ({ page }) => {
    const presets = page.locator('.f754-preset-btn');
    const count = await presets.count();
    expect(count).toBeGreaterThan(0);
  });

  test('プリセット1.0を適用すると値が更新される', async ({ page }) => {
    const presetButton = page.locator('.f754-preset-btn', { hasText: '1.0' });
    if ((await presetButton.count()) > 0) {
      await presetButton.first().click();
      const inputField = page.locator('#f754-input');
      await expect(inputField).toHaveValue('1');
    }
  });

  test('float64タブに切り替えられる', async ({ page }) => {
    const float64Tab = page.locator('[role="tab"]', {
      hasText: 'float64',
    });
    await float64Tab.click();

    await expect(float64Tab).toHaveAttribute('aria-selected', 'true');
  });

  test('16進数入力モードに切り替えられる', async ({ page }) => {
    const modeSelect = page.locator('.f754-input-mode-select');
    await modeSelect.selectOption('hex');

    const inputField = page.locator('#f754-input');
    const placeholder = await inputField.getAttribute('placeholder');
    expect(placeholder).toContain('3F800000');
  });

  test('無効な10進数入力でエラーメッセージが表示される', async ({ page }) => {
    const inputField = page.locator('#f754-input');
    await inputField.fill('不正な値');

    const errorMessage = page.locator('#f754-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('有効な数値を入力してください');
  });

  test('ビット表示エリアが表示される', async ({ page }) => {
    const bitsRow = page.locator('.f754-bits-row');
    await expect(bitsRow).toBeVisible();
  });

  test('32個のビットボタンが表示される（float32）', async ({ page }) => {
    const bitButtons = page.locator('.f754-bit');
    await expect(bitButtons).toHaveCount(32);
  });

  test('ビットをクリックするとトグルする', async ({ page }) => {
    // 最初のビット（符号ビット）をクリック
    const firstBit = page.locator('.f754-bit').first();
    const initialValue = await firstBit.textContent();

    await firstBit.click();

    const newValue = await firstBit.textContent();
    expect(newValue).not.toBe(initialValue);
  });

  test('HEXコピーボタンが表示される', async ({ page }) => {
    const copyHexButton = page.locator('button', { hasText: 'HEX をコピー' });
    await expect(copyHexButton).toBeVisible();
  });

  test('2進数コピーボタンが表示される', async ({ page }) => {
    const copyBinButton = page.locator('button', { hasText: '2進数をコピー' });
    await expect(copyBinButton).toBeVisible();
  });

  test('結果情報グリッドが表示される', async ({ page }) => {
    const infoGrid = page.locator('.f754-info-grid');
    await expect(infoGrid).toBeVisible();
  });

  test('アクセシビリティ属性が設定されている', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });
});
