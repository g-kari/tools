import { test, expect } from "@playwright/test";

test.describe("ハングマンゲーム - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hangman");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しいタイトルで読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/ハングマン/);
  });

  test("エラーなく読み込まれる", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).not.toContain("undefined");
    expect(body).not.toContain("null");
  });

  test("ハングマン図が表示される", async ({ page }) => {
    const svg = page.locator(".hangman-svg");
    await expect(svg).toBeVisible();
  });

  test("キーボードが表示される", async ({ page }) => {
    const keyboard = page.locator(".hangman-keyboard");
    await expect(keyboard).toBeVisible();
    // 26個のキーが存在する
    const keys = page.locator(".keyboard-key");
    await expect(keys).toHaveCount(26);
  });

  test("単語のマス目が表示される", async ({ page }) => {
    const wordArea = page.locator(".hangman-word");
    await expect(wordArea).toBeVisible();
    const letterBoxes = page.locator(".hangman-letter-box");
    const count = await letterBoxes.count();
    expect(count).toBeGreaterThan(0);
  });

  test("カテゴリ選択が表示される", async ({ page }) => {
    const select = page.locator("#category-select");
    await expect(select).toBeVisible();
  });

  test("新しいゲームボタンが動作する", async ({ page }) => {
    // 初期の単語の長さを取得
    const initialBoxes = await page.locator(".hangman-letter-box").count();

    // 新しいゲームを開始
    await page.click("button:has-text('新しいゲーム')");

    // 何らかの単語が表示されていることを確認
    const newBoxes = await page.locator(".hangman-letter-box").count();
    expect(newBoxes).toBeGreaterThan(0);
    expect(initialBoxes).toBeGreaterThan(0);
  });

  test("文字をクリックしてゲームが進行する", async ({ page }) => {
    // 'A'キーをクリック
    const keyA = page.locator(".keyboard-key", { hasText: "A" });
    await keyA.click();

    // キーが無効化またはスタイル変更される
    await expect(keyA).toBeDisabled();
  });

  test("スコア表示がある", async ({ page }) => {
    const score = page.locator(".hangman-score");
    await expect(score).toBeVisible();
    await expect(page.locator(".score-win")).toBeVisible();
    await expect(page.locator(".score-lose")).toBeVisible();
  });

  test("カテゴリヒントが表示される", async ({ page }) => {
    const hint = page.locator(".hangman-hint");
    await expect(hint).toBeVisible();
  });

  test("アクセシビリティ: ランドマークが存在する", async ({ page }) => {
    await expect(page.locator('[role="main"], main')).toBeVisible();
  });

  test("カテゴリを変更すると新しいゲームが始まる", async ({ page }) => {
    // 最初の状態
    const initialBoxes = await page.locator(".hangman-letter-box").count();
    expect(initialBoxes).toBeGreaterThan(0);

    // カテゴリを変更
    const select = page.locator("#category-select");
    await select.selectOption("0");

    // 新しい単語が表示される
    const newBoxes = await page.locator(".hangman-letter-box").count();
    expect(newBoxes).toBeGreaterThan(0);
  });
});
