import { test, expect } from "@playwright/test";

test.describe("Stopwatch - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stopwatch");
    await page.waitForSelector(".tool-layout");
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/ストップウォッチ/);
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display initial time as 00:00.000", async ({ page }) => {
    const timeDisplay = page.locator(".stopwatch-time");
    await expect(timeDisplay).toBeVisible();
    await expect(timeDisplay).toHaveText("00:00.000");
  });

  test("should display start button initially", async ({ page }) => {
    const startBtn = page.locator('[aria-label="計測開始"]');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toContainText("スタート");
  });

  test("should disable lap button when not running", async ({ page }) => {
    const lapBtn = page.locator('[aria-label="ラップタイム記録"]');
    await expect(lapBtn).toBeDisabled();
  });

  test("should disable reset button when not running with no elapsed time", async ({ page }) => {
    const resetBtn = page.locator('[aria-label="リセット"]');
    await expect(resetBtn).toBeDisabled();
  });

  test("should show pause button after clicking start", async ({ page }) => {
    await page.locator('[aria-label="計測開始"]').click();
    const pauseBtn = page.locator('[aria-label="一時停止"]');
    await expect(pauseBtn).toBeVisible();
  });

  test("should enable lap button after starting", async ({ page }) => {
    await page.locator('[aria-label="計測開始"]').click();
    const lapBtn = page.locator('[aria-label="ラップタイム記録"]');
    await expect(lapBtn).toBeEnabled();
  });

  test("should record a lap and display lap table", async ({ page }) => {
    await page.locator('[aria-label="計測開始"]').click();
    await page.waitForTimeout(100);
    await page.locator('[aria-label="ラップタイム記録"]').click();

    const lapSection = page.locator(".stopwatch-laps");
    await expect(lapSection).toBeVisible();

    const lapRows = page.locator(".stopwatch-lap-row");
    await expect(lapRows).toHaveCount(1);
  });

  test("should show resume button after pausing", async ({ page }) => {
    await page.locator('[aria-label="計測開始"]').click();
    await page.locator('[aria-label="一時停止"]').click();

    const resumeBtn = page.locator('[aria-label="計測開始"]');
    await expect(resumeBtn).toBeVisible();
    await expect(resumeBtn).toContainText("再開");
  });

  test("should enable reset button after pausing", async ({ page }) => {
    await page.locator('[aria-label="計測開始"]').click();
    await page.locator('[aria-label="一時停止"]').click();

    const resetBtn = page.locator('[aria-label="リセット"]');
    await expect(resetBtn).toBeEnabled();
  });

  test("should reset to initial state after reset", async ({ page }) => {
    await page.locator('[aria-label="計測開始"]').click();
    await page.waitForTimeout(100);
    await page.locator('[aria-label="ラップタイム記録"]').click();
    await page.locator('[aria-label="一時停止"]').click();
    await page.locator('[aria-label="リセット"]').click();

    await expect(page.locator(".stopwatch-time")).toHaveText("00:00.000");
    await expect(page.locator('[aria-label="計測開始"]')).toContainText("スタート");
    await expect(page.locator(".stopwatch-laps")).not.toBeVisible();
  });

  test("should display lap time headers", async ({ page }) => {
    await page.locator('[aria-label="計測開始"]').click();
    await page.waitForTimeout(100);
    await page.locator('[aria-label="ラップタイム記録"]').click();

    const header = page.locator(".stopwatch-laps-header");
    await expect(header).toBeVisible();
    await expect(header).toContainText("ラップ");
    await expect(header).toContainText("ラップタイム");
    await expect(header).toContainText("合計タイム");
  });

  test("should have game category active in navigation", async ({ page }) => {
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("ゲーム");
  });

  test("should show stopwatch link in game category dropdown", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", {
      hasText: "ゲーム",
    });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const stopwatchLink = dropdown.locator('a[href="/stopwatch"]');
    await expect(stopwatchLink).toBeVisible();
    await expect(stopwatchLink).toContainText("ストップウォッチ");
  });
});
