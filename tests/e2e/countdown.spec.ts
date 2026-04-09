import { test, expect } from "@playwright/test";

test.describe("Countdown Timer - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/countdown");
    await page.waitForSelector(".tool-container");
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/カウントダウンタイマー/);
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display date input", async ({ page }) => {
    const dateInput = page.locator("input#countdown-date");
    await expect(dateInput).toBeVisible();
  });

  test("should display time input", async ({ page }) => {
    const timeInput = page.locator("input#countdown-time");
    await expect(timeInput).toBeVisible();
  });

  test("should display preset buttons", async ({ page }) => {
    const presets = page.locator(".countdown-preset-btn");
    await expect(presets).toHaveCount(6);
  });

  test("should show countdown display section", async ({ page }) => {
    const display = page.locator(".countdown-display");
    await expect(display).toBeVisible();
  });

  test("should show countdown units when a future date is set", async ({ page }) => {
    const dateInput = page.locator("input#countdown-date");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    await dateInput.fill(tomorrowStr);

    const units = page.locator(".countdown-units");
    await expect(units).toBeVisible();
  });

  test("should display 日・時間・分・秒 labels", async ({ page }) => {
    const dateInput = page.locator("input#countdown-date");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await dateInput.fill(tomorrow.toISOString().slice(0, 10));

    const labels = page.locator(".countdown-unit-label");
    const texts = await labels.allTextContents();
    expect(texts).toContain("日");
    expect(texts).toContain("時間");
    expect(texts).toContain("分");
    expect(texts).toContain("秒");
  });

  test("should apply preset and show active state", async ({ page }) => {
    const firstPreset = page.locator(".countdown-preset-btn").first();
    await firstPreset.click();
    await expect(firstPreset).toHaveClass(/active/);
  });

  test("should display tips card", async ({ page }) => {
    const tipsCard = page.locator(".info-box").first();
    await expect(tipsCard).toBeVisible();
  });

  test("should have game category active in navigation", async ({ page }) => {
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("ゲーム");
  });

  test("should show countdown link in game category dropdown", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", {
      hasText: "ゲーム",
    });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const countdownLink = dropdown.locator('a[href="/countdown"]');
    await expect(countdownLink).toBeVisible();
    await expect(countdownLink).toContainText("カウントダウンタイマー");
  });
});
