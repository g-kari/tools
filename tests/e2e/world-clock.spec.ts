import { test, expect } from "@playwright/test";

test.describe("ワールドクロック - E2E テスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/world-clock");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正常に表示される", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/ワールドクロック/);
  });

  test("クロックグリッドが表示される", async ({ page }) => {
    const grid = page.locator(".wc-grid");
    await expect(grid).toBeVisible();
  });

  test("デフォルトで複数の都市が表示される", async ({ page }) => {
    const cards = page.locator(".wc-card");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("時刻が表示される", async ({ page }) => {
    const times = page.locator(".wc-time");
    expect(await times.count()).toBeGreaterThan(0);
    // 時刻が数字を含むことを確認
    const firstTime = await times.first().textContent();
    expect(firstTime).toMatch(/\d/);
  });

  test("24h/12h切替ボタンが表示される", async ({ page }) => {
    const btn24h = page.locator(".wc-format-btn", { hasText: "24h" });
    const btn12h = page.locator(".wc-format-btn", { hasText: "12h" });
    await expect(btn24h).toBeVisible();
    await expect(btn12h).toBeVisible();
  });

  test("デフォルトで24h表示がアクティブ", async ({ page }) => {
    const btn24h = page.locator(".wc-format-btn", { hasText: "24h" });
    await expect(btn24h).toHaveClass(/active/);
  });

  test("12h表示に切り替えられる", async ({ page }) => {
    await page.locator(".wc-format-btn", { hasText: "12h" }).click();
    const btn12h = page.locator(".wc-format-btn", { hasText: "12h" });
    await expect(btn12h).toHaveClass(/active/);
  });

  test("都市を選択パネルを開ける", async ({ page }) => {
    await page.locator("button", { hasText: "都市を選択" }).click();
    const selector = page.locator("#wc-selector");
    await expect(selector).toBeVisible();
  });

  test("都市選択パネルを閉じられる", async ({ page }) => {
    await page.locator("button", { hasText: "都市を選択" }).click();
    await page.locator("button", { hasText: "都市を閉じる" }).click();
    const selector = page.locator("#wc-selector");
    await expect(selector).not.toBeVisible();
  });

  test("都市数カウントが表示される", async ({ page }) => {
    const count = page.locator(".wc-city-count");
    await expect(count).toBeVisible();
    const text = await count.textContent();
    expect(text).toMatch(/\d+\s*都市/);
  });

  test("アクセシビリティ: role属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="list"]')).toBeVisible();
  });

  test("ナビゲーションの変換カテゴリにワールドクロックリンクが表示される", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/world-clock"]');
    await expect(link).toBeVisible();
  });
});
