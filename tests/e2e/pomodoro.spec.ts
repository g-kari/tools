import { test, expect } from "@playwright/test";

test.describe("Pomodoro Timer - E2E Tests", () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(
    page: import("@playwright/test").Page,
    categoryName: string,
    linkHref: string,
  ) {
    const categoryBtn = page.locator(".nav-category-btn", {
      hasText: categoryName,
    });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/pomodoro");
    // React hydration を待つ
    await page.waitForSelector(".tool-container");
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/ポモドーロタイマー/);
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display the timer showing 25:00 by default", async ({ page }) => {
    const timerDisplay = page.locator(".pomodoro-time");
    await expect(timerDisplay).toBeVisible();
    await expect(timerDisplay).toContainText("25:00");
  });

  test("should display the work phase indicator by default", async ({ page }) => {
    const phaseIndicator = page.locator(".pomodoro-phase-indicator");
    await expect(phaseIndicator).toBeVisible();
    await expect(phaseIndicator).toHaveClass(/phase-work/);
    await expect(phaseIndicator).toContainText("作業");
  });

  test("should display session dots", async ({ page }) => {
    const dots = page.locator(".pomodoro-session-dot");
    await expect(dots).toHaveCount(4);
  });

  test("should display start button", async ({ page }) => {
    const startButton = page.getByRole("button", { name: "開始" });
    await expect(startButton).toBeVisible();
  });

  test("should display reset button", async ({ page }) => {
    const resetButton = page.getByRole("button", { name: "リセット" });
    await expect(resetButton).toBeVisible();
  });

  test("should display full reset button", async ({ page }) => {
    const fullResetButton = page.getByRole("button", { name: "全リセット" });
    await expect(fullResetButton).toBeVisible();
  });

  test("should show pause button after clicking start", async ({ page }) => {
    const startButton = page.getByRole("button", { name: "開始" });
    await startButton.click();

    const pauseButton = page.getByRole("button", { name: "一時停止" });
    await expect(pauseButton).toBeVisible();
  });

  test("should show start button again after pausing", async ({ page }) => {
    const startButton = page.getByRole("button", { name: "開始" });
    await startButton.click();

    const pauseButton = page.getByRole("button", { name: "一時停止" });
    await pauseButton.click();

    const startButtonAgain = page.getByRole("button", { name: "開始" });
    await expect(startButtonAgain).toBeVisible();
  });

  test("should display progress bar", async ({ page }) => {
    const progressBar = page.locator(".pomodoro-progress-bar");
    await expect(progressBar).toBeVisible();
    await expect(progressBar).toHaveAttribute("role", "progressbar");
  });

  test("should display settings section", async ({ page }) => {
    const settings = page.locator(".pomodoro-settings");
    await expect(settings).toBeVisible();
  });

  test("should have work minutes input defaulting to 25", async ({ page }) => {
    const workInput = page.locator("input#work-minutes");
    await expect(workInput).toHaveValue("25");
  });

  test("should have short break input defaulting to 5", async ({ page }) => {
    const shortBreakInput = page.locator("input#short-break-minutes");
    await expect(shortBreakInput).toHaveValue("5");
  });

  test("should have long break input defaulting to 15", async ({ page }) => {
    const longBreakInput = page.locator("input#long-break-minutes");
    await expect(longBreakInput).toHaveValue("15");
  });

  test("should update timer display when work minutes is changed", async ({ page }) => {
    const workInput = page.locator("input#work-minutes");
    await workInput.fill("10");
    await workInput.blur();

    const timerDisplay = page.locator(".pomodoro-time");
    await expect(timerDisplay).toContainText("10:00");
  });

  test("should display tips card with usage information", async ({ page }) => {
    const infoBox = page.locator(".info-box").first();
    await expect(infoBox).toBeVisible();

    const infoText = await infoBox.textContent();
    expect(infoText).toContain("ポモドーロ");
    expect(infoText).not.toContain("undefined");
  });

  test("should have category navigation with game category active", async ({ page }) => {
    const navCategories = page.locator(".nav-categories");
    await expect(navCategories).toBeVisible();

    // ゲームカテゴリがアクティブであることを確認
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("ゲーム");
  });

  test("should show ポモドーロタイマー link in game category dropdown", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", {
      hasText: "ゲーム",
    });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const pomodoroLink = dropdown.locator('a[href="/pomodoro"]');
    await expect(pomodoroLink).toBeVisible();
    await expect(pomodoroLink).toContainText("ポモドーロタイマー");
  });

  test("should navigate to dice-roll page via category dropdown", async ({ page }) => {
    await navigateViaCategory(page, "ゲーム", "/dice-roll");
    await expect(page).toHaveURL("/dice-roll");
  });
});
