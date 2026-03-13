import { test, expect } from '@playwright/test';

test.describe('Terminal Design - E2E Tests', () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test.describe('ダークテーマの確認', () => {
    /**
     * body要素の背景色がターミナルダーク（#0d1117）であることを確認する
     */
    test('body の背景色が dark (#0d1117) であること', async ({ page }) => {
      const backgroundColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      // rgb(13, 17, 23) = #0d1117
      expect(backgroundColor).toBe('rgb(13, 17, 23)');
    });
  });

  test.describe('フォントの確認', () => {
    /**
     * body要素のfont-familyにmonoが含まれることを確認する
     */
    test('body の font-family に monospace が含まれること', async ({ page }) => {
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      expect(fontFamily.toLowerCase()).toContain('mono');
    });
  });

  test.describe('h1プレフィックスの確認', () => {
    /**
     * h1要素の::before疑似要素に「$ 」が設定されていることをCSSで確認する
     */
    test('h1要素の ::before に "$ " が設定されていること（CSS content）', async ({ page }) => {
      const beforeContent = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (!h1) return null;
        return window.getComputedStyle(h1, '::before').content;
      });
      // CSS content プロパティの値は引用符付きで返される: '"$ "'
      expect(beforeContent).toBe('"$ "');
    });
  });

  test.describe('ナビゲーションスタイルの確認', () => {
    /**
     * navボタン（.nav-category-btn）のborder-radiusが0であることを確認する
     */
    test('nav ボタンの border-radius が 0 であること', async ({ page }) => {
      const borderRadius = await page.evaluate(() => {
        const btn = document.querySelector('.nav-category-btn');
        if (!btn) return null;
        return window.getComputedStyle(btn).borderRadius;
      });
      expect(borderRadius).toBe('0px');
    });
  });

  test.describe('ボタンスタイルの確認', () => {
    /**
     * button要素のborder-radiusが0であることを確認する
     */
    test('ボタンの border-radius が 0 であること', async ({ page }) => {
      const borderRadius = await page.evaluate(() => {
        const btn = document.querySelector('button');
        if (!btn) return null;
        return window.getComputedStyle(btn).borderRadius;
      });
      expect(borderRadius).toBe('0px');
    });
  });

  test.describe('グローバルなborder-radiusの確認', () => {
    /**
     * .tool-containerのborder-radiusが0であることを確認する
     */
    test('.tool-container の border-radius が 0 であること', async ({ page }) => {
      const borderRadius = await page.evaluate(() => {
        const container = document.querySelector('.tool-container');
        if (!container) return null;
        return window.getComputedStyle(container).borderRadius;
      });
      expect(borderRadius).toBe('0px');
    });
  });
});
