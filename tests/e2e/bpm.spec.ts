import { test, expect } from "@playwright/test";

test.describe("BPM / タップテンポ - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bpm");
    await page.waitForSelector(".bpm-display-section");
  });

  test("ページ本文にundefinedが含まれない", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/BPM/);
  });

  test("アクセシビリティ属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("初期状態でBPMがダッシュで表示される", async ({ page }) => {
    const bpmValue = page.locator(".bpm-value");
    await expect(bpmValue).toBeVisible();
    await expect(bpmValue).toHaveText("—");
  });

  test("タップボタンが表示されている", async ({ page }) => {
    const tapBtn = page.locator('[aria-label*="タップ"]');
    await expect(tapBtn).toBeVisible();
  });

  test("初期状態でリセットボタンが無効", async ({ page }) => {
    const resetBtn = page.locator('[aria-label="計測リセット"]');
    await expect(resetBtn).toBeDisabled();
  });

  test("タップ後にタップ数が増える", async ({ page }) => {
    const tapBtn = page.locator('[aria-label*="タップ"]');
    await tapBtn.click();
    const tapCount = page.locator(".bpm-tap-count-num");
    await expect(tapCount).toHaveText("1");
  });

  test("2回タップ後にBPMが表示される", async ({ page }) => {
    const tapBtn = page.locator('[aria-label*="タップ"]');
    await tapBtn.click();
    await page.waitForTimeout(300);
    await tapBtn.click();
    const bpmValue = page.locator(".bpm-value");
    await expect(bpmValue).not.toHaveText("—");
  });

  test("リセット後に初期状態に戻る", async ({ page }) => {
    const tapBtn = page.locator('[aria-label*="タップ"]');
    await tapBtn.click();
    await page.waitForTimeout(300);
    await tapBtn.click();

    const resetBtn = page.locator('[aria-label="計測リセット"]');
    await expect(resetBtn).toBeEnabled();
    await resetBtn.click();

    await expect(page.locator(".bpm-value")).toHaveText("—");
    await expect(page.locator(".bpm-tap-count-num")).toHaveText("0");
    await expect(resetBtn).toBeDisabled();
  });

  test("テンポ早見表が表示されている", async ({ page }) => {
    const tipsTable = page.locator(".bpm-tips-table");
    await expect(tipsTable).toBeVisible();
    await expect(tipsTable).toContainText("Allegro");
    await expect(tipsTable).toContainText("Adagio");
  });

  test("ゲームカテゴリのナビに表示される", async ({ page }) => {
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("ゲーム");
  });
});
