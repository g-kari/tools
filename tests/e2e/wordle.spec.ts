import { test, expect } from "@playwright/test";

test.describe("Wordleゲーム - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/wordle");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しいタイトルで読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/Wordle/);
  });

  test("エラーなく読み込まれる", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).not.toContain("undefined");
    expect(body).not.toContain("Error:");
  });

  test("Wordleグリッドが6行×5列で表示される", async ({ page }) => {
    const rows = page.locator(".wordle-row");
    await expect(rows).toHaveCount(6);

    const firstRow = rows.first();
    const cells = firstRow.locator(".wordle-cell");
    await expect(cells).toHaveCount(5);
  });

  test("オンスクリーンキーボードが表示される", async ({ page }) => {
    const keyboard = page.locator(".wordle-keyboard");
    await expect(keyboard).toBeVisible();

    // Q, W, E, R, T, Y... のキーが存在する
    await expect(page.locator(".wordle-key:has-text('Q')")).toBeVisible();
    await expect(page.locator(".wordle-key:has-text('A')")).toBeVisible();
    await expect(page.locator(".wordle-key:has-text('Z')")).toBeVisible();
  });

  test("ENTERキーと削除キーが存在する", async ({ page }) => {
    await expect(page.locator(".wordle-key:has-text('ENTER')")).toBeVisible();
    await expect(page.locator(".wordle-key:has-text('⌫')")).toBeVisible();
  });

  test("スコア表示が初期状態で0-0", async ({ page }) => {
    const score = page.locator(".wordle-score");
    await expect(score).toBeVisible();
    await expect(score).toContainText("0勝");
    await expect(score).toContainText("0敗");
  });

  test("オンスクリーンキーボードで文字を入力できる", async ({ page }) => {
    // C を押す
    await page.click(".wordle-key:has-text('C')");
    // 最初の行の最初のセルに C が表示される
    const firstCell = page.locator(".wordle-row").first().locator(".wordle-cell").first();
    await expect(firstCell).toHaveText("C");
  });

  test("削除ボタンで文字を削除できる", async ({ page }) => {
    // C を押してから削除
    await page.click(".wordle-key:has-text('C')");
    await page.click(".wordle-key:has-text('⌫')");
    const firstCell = page.locator(".wordle-row").first().locator(".wordle-cell").first();
    await expect(firstCell).toHaveText("");
  });

  test("フィジカルキーボードで文字を入力できる", async ({ page }) => {
    await page.keyboard.press("c");
    await page.keyboard.press("r");
    const cells = page.locator(".wordle-row").first().locator(".wordle-cell");
    await expect(cells.nth(0)).toHaveText("C");
    await expect(cells.nth(1)).toHaveText("R");
  });

  test("フィジカルキーボードのBackspaceで削除できる", async ({ page }) => {
    await page.keyboard.press("c");
    await page.keyboard.press("Backspace");
    const firstCell = page.locator(".wordle-row").first().locator(".wordle-cell").first();
    await expect(firstCell).toHaveText("");
  });

  test("新しいゲームボタンでリセットできる", async ({ page }) => {
    // 文字を入力
    await page.keyboard.press("c");
    await page.keyboard.press("r");

    // 新しいゲームを開始
    await page.click("button:has-text('新しいゲーム')");

    // グリッドがリセットされる
    const firstCell = page.locator(".wordle-row").first().locator(".wordle-cell").first();
    await expect(firstCell).toHaveText("");
  });

  test("5文字未満でEnterを押すとシェイクアニメーションが発生する", async ({ page }) => {
    // 3文字だけ入力してEnter
    await page.keyboard.press("c");
    await page.keyboard.press("r");
    await page.keyboard.press("a");
    await page.keyboard.press("Enter");

    // シェイクアニメーションのクラスが適用される
    const shakeRow = page.locator(".wordle-row-shake");
    await expect(shakeRow).toBeVisible();
  });

  test("ナビゲーションメニューにWordleが含まれる", async ({ page }) => {
    // ナビゲーションを確認（メニューを開く）
    const nav = page.locator("nav");
    const wordleLink = nav.locator("a[href='/wordle']");
    await expect(wordleLink).toHaveCount(1);
  });
});
