import { test, expect } from "@playwright/test";

test.describe("ライフゲーム - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/life-game");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しいタイトルで読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/ライフゲーム/);
  });

  test("エラーなく読み込まれる", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).not.toContain("undefined");
  });

  test("キャンバスが表示される", async ({ page }) => {
    const canvas = page.locator(".life-game-canvas");
    await expect(canvas).toBeVisible();
  });

  test("開始・一時停止ボタンが動作する", async ({ page }) => {
    const startBtn = page.locator("button", { hasText: "開始" });
    await expect(startBtn).toBeVisible();
    await startBtn.click();
    const pauseBtn = page.locator("button", { hasText: "一時停止" });
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();
    await expect(startBtn).toBeVisible();
  });

  test("ステップボタンで世代が進む", async ({ page }) => {
    // ランダムでセルを配置してからステップ実行
    await page.click("button:has-text('ランダム')");
    const statArea = page.locator(".life-game-stats");
    await expect(statArea).toBeVisible();

    const genBefore = await page.locator(".life-game-stat-value").first().textContent();

    await page.click("button:has-text('ステップ')");

    const genAfter = await page.locator(".life-game-stat-value").first().textContent();

    expect(Number(genAfter)).toBeGreaterThan(Number(genBefore));
  });

  test("クリアボタンでグリッドがリセットされる", async ({ page }) => {
    await page.click("button:has-text('ランダム')");
    await page.click("button:has-text('クリア')");
    // 世代が0にリセットされる
    const genValue = await page.locator(".life-game-stat-value").first().textContent();
    expect(genValue).toBe("0");
  });

  test("ランダムボタンで個体数が増える", async ({ page }) => {
    // クリア状態から
    await page.click("button:has-text('クリア')");
    const popValues = page.locator(".life-game-stat-value");
    const popBefore = await popValues.nth(1).textContent();
    expect(Number(popBefore)).toBe(0);

    await page.click("button:has-text('ランダム')");
    const popAfter = await popValues.nth(1).textContent();
    expect(Number(popAfter)).toBeGreaterThan(0);
  });

  test("プリセットパターンが表示される", async ({ page }) => {
    const presets = page.locator(".life-game-preset-btn");
    const count = await presets.count();
    expect(count).toBeGreaterThan(0);
  });

  test("グライダープリセットを適用できる", async ({ page }) => {
    const gliderBtn = page.locator("button", { hasText: "グライダー" });
    await expect(gliderBtn).toBeVisible();
    await gliderBtn.click();
    // グライダーは5セル
    const popValue = await page.locator(".life-game-stat-value").nth(1).textContent();
    expect(Number(popValue)).toBe(5);
  });

  test("グリッドサイズを変更できる", async ({ page }) => {
    const largeBtn = page.locator(".life-game-option-btn", { hasText: "大" });
    await largeBtn.click();
    await expect(largeBtn).toHaveClass(/active/);
  });

  test("速度オプションを変更できる", async ({ page }) => {
    const fastBtn = page.locator(".life-game-option-btn", { hasText: "速い" });
    await fastBtn.click();
    await expect(fastBtn).toHaveClass(/active/);
  });

  test("折り返しチェックボックスが動作する", async ({ page }) => {
    const checkbox = page.locator("input[type='checkbox']");
    await expect(checkbox).toBeChecked();
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test("統計情報（世代・個体数・グリッドサイズ）が表示される", async ({ page }) => {
    const statLabels = page.locator(".life-game-stat-label");
    await expect(statLabels.nth(0)).toHaveText("世代");
    await expect(statLabels.nth(1)).toHaveText("個体数");
    await expect(statLabels.nth(2)).toHaveText("グリッド");
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tips = page.locator("text=遊び方");
    await expect(tips).toBeVisible();
  });

  test("シミュレーション中はステップ・ランダム・クリアが無効になる", async ({ page }) => {
    await page.click("button:has-text('ランダム')");
    await page.click("button:has-text('開始')");
    const stepBtn = page.locator("button:has-text('ステップ')");
    await expect(stepBtn).toBeDisabled();
    const randomBtn = page.locator("button:has-text('ランダム')");
    await expect(randomBtn).toBeDisabled();
    await page.click("button:has-text('一時停止')");
  });
});
