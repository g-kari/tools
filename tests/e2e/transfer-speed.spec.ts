import { test, expect } from "@playwright/test";

test.describe("転送速度・転送時間計算機 - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transfer-speed");
    await page.waitForLoadState("networkidle");
  });

  test("undefinedコンテンツを含まずにページをロードできる", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("正しいページタイトルを表示する", async ({ page }) => {
    await expect(page).toHaveTitle(/転送速度/);
  });

  test("アクセシビリティ属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("モード切り替えタブが表示される", async ({ page }) => {
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible();
    const tabButtons = page.locator('[role="tab"]');
    await expect(tabButtons).toHaveCount(2);
  });

  test("転送時間モードがデフォルトで選択されている", async ({ page }) => {
    const activeTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(activeTab).toContainText("転送時間を計算");
  });

  test("ファイルサイズ入力フィールドが表示される", async ({ page }) => {
    await expect(page.locator("#ts-size")).toBeVisible();
    await expect(page.locator('select[aria-label="ファイルサイズ単位"]')).toBeVisible();
  });

  test("転送速度入力フィールドが表示される", async ({ page }) => {
    await expect(page.locator("#ts-speed")).toBeVisible();
    await expect(page.locator('select[aria-label="転送速度単位"]')).toBeVisible();
  });

  test("転送時間を計算できる - 1GB / 100Mbps", async ({ page }) => {
    // ファイルサイズ: 1 GB
    await page.fill("#ts-size", "1");
    await page.selectOption('select[aria-label="ファイルサイズ単位"]', "GB");

    // 転送速度: 100 Mbps
    await page.fill("#ts-speed", "100");
    await page.selectOption('select[aria-label="転送速度単位"]', "Mbps");

    // 結果が表示される
    const result = page.locator(".ts-result-value");
    await expect(result).toBeVisible();
    // 1GB / 100Mbps ≈ 85秒
    await expect(result).toContainText("秒");
  });

  test("プリセット選択で速度が設定される", async ({ page }) => {
    const preset = page.locator("#ts-preset");
    await preset.selectOption({ label: "Gigabit Ethernet (1Gbps)" });

    const speedInput = page.locator("#ts-speed");
    const speedValue = await speedInput.inputValue();
    expect(parseFloat(speedValue)).toBeGreaterThan(0);
  });

  test("必要速度計算モードに切り替えられる", async ({ page }) => {
    const speedModeTab = page.locator('[role="tab"]').nth(1);
    await speedModeTab.click();

    await expect(speedModeTab).toHaveAttribute("aria-selected", "true");
    // 時間入力フィールドが表示される
    await expect(page.locator("#ts-hours")).toBeVisible();
    await expect(page.locator("#ts-minutes")).toBeVisible();
    await expect(page.locator("#ts-seconds")).toBeVisible();
  });

  test("必要速度を計算できる", async ({ page }) => {
    // 必要速度モードに切り替え
    await page.locator('[role="tab"]').nth(1).click();

    // ファイルサイズ: 1 GB
    await page.fill("#ts-size", "1");
    await page.selectOption('select[aria-label="ファイルサイズ単位"]', "GB");

    // 目標時間: 1分
    await page.fill("#ts-hours", "0");
    await page.fill("#ts-minutes", "1");
    await page.fill("#ts-seconds", "0");

    // 結果が表示される
    const result = page.locator(".ts-result-value");
    await expect(result).toBeVisible();
    await expect(result).toContainText("bps");
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tips = page.locator(".tips-card");
    await expect(tips).toBeVisible();
  });

  test("ナビゲーションに転送速度計算が含まれる", async ({ page }) => {
    const navLink = page.locator('a[href="/transfer-speed"]');
    await expect(navLink.first()).toBeAttached();
  });
});
