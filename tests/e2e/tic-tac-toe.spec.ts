import { test, expect } from "@playwright/test";

test.describe("三目並べ - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tic-tac-toe");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しいタイトルで読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/三目並べ/);
  });

  test("エラーなく読み込まれる", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).not.toContain("undefined");
    expect(body).not.toContain("Error");
  });

  test("ゲームボードが3×3の9マスで表示される", async ({ page }) => {
    const cells = page.locator(".ttt-cell");
    await expect(cells).toHaveCount(9);
  });

  test("スコアボードが表示される", async ({ page }) => {
    const scoreboard = page.locator(".ttt-scoreboard");
    await expect(scoreboard).toBeVisible();
  });

  test("モード切り替えボタンが表示される", async ({ page }) => {
    const cpuBtn = page.locator(".ttt-mode-btn", { hasText: "CPU対戦" });
    const pvpBtn = page.locator(".ttt-mode-btn", { hasText: "2人対戦" });
    await expect(cpuBtn).toBeVisible();
    await expect(pvpBtn).toBeVisible();
  });

  test("難易度選択ボタンが表示される（CPU対戦時）", async ({ page }) => {
    const easyBtn = page.locator(".ttt-mode-btn", { hasText: "かんたん" });
    const hardBtn = page.locator(".ttt-mode-btn", { hasText: "強い" });
    await expect(easyBtn).toBeVisible();
    await expect(hardBtn).toBeVisible();
  });

  test("2人対戦モードに切り替えると難易度ボタンが消える", async ({ page }) => {
    await page.click(".ttt-mode-btn:has-text('2人対戦')");
    const easyBtn = page.locator(".ttt-mode-btn", { hasText: "かんたん" });
    await expect(easyBtn).not.toBeVisible();
  });

  test("セルをクリックするとXが表示される", async ({ page }) => {
    // CPU対戦でXが先手なので最初のクリックでXが表示される
    const firstCell = page.locator(".ttt-cell").first();
    await firstCell.click();
    // X または CPUが動いてセルが埋まっていることを確認
    const filledCells = page.locator(".ttt-cell--x, .ttt-cell--o");
    const count = await filledCells.count();
    expect(count).toBeGreaterThan(0);
  });

  test("リセットボタンでボードがクリアされる", async ({ page }) => {
    // 1マスクリック
    await page.locator(".ttt-cell").first().click();
    await page.waitForTimeout(600); // CPUの思考を待つ

    // リセット
    await page.click("button:has-text('もう一度')");
    const filledCells = page.locator(".ttt-cell--x, .ttt-cell--o");
    await expect(filledCells).toHaveCount(0);
  });

  test("スコアリセットボタンでスコアが0になる", async ({ page }) => {
    await page.click("button:has-text('スコアリセット')");
    const scoreValues = page.locator(".ttt-score-value");
    const count = await scoreValues.count();
    for (let i = 0; i < count; i++) {
      await expect(scoreValues.nth(i)).toHaveText("0");
    }
  });

  test("ゲームステータスが表示される", async ({ page }) => {
    const status = page.locator(".ttt-status");
    await expect(status).toBeVisible();
    const text = await status.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });

  test("2人対戦で交互に打てる", async ({ page }) => {
    await page.click(".ttt-mode-btn:has-text('2人対戦')");

    const cells = page.locator(".ttt-cell");
    // 1マス目 (X)
    await cells.nth(0).click();
    // 2マス目 (O)
    await cells.nth(1).click();

    const xCells = page.locator(".ttt-cell--x");
    const oCells = page.locator(".ttt-cell--o");
    await expect(xCells).toHaveCount(1);
    await expect(oCells).toHaveCount(1);
  });

  test("アクセシビリティ: ボードにrole=gridが設定されている", async ({ page }) => {
    const board = page.locator("[role='grid']");
    await expect(board).toBeVisible();
  });

  test("アクセシビリティ: セルにaria-labelが設定されている", async ({ page }) => {
    const firstCell = page.locator(".ttt-cell").first();
    const ariaLabel = await firstCell.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain("行");
    expect(ariaLabel).toContain("列");
  });
});
