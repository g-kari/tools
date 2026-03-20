import { test, expect } from "@playwright/test";

test.describe("Haversine距離計算 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/haversine");
    await page.waitForLoadState("networkidle");
  });

  test('ページに"undefined"が含まれない', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Haversine/);
  });

  test("出発地・目的地の入力フィールドが存在する", async ({ page }) => {
    await expect(page.locator("#from-lat")).toBeVisible();
    await expect(page.locator("#from-lng")).toBeVisible();
    await expect(page.locator("#to-lat")).toBeVisible();
    await expect(page.locator("#to-lng")).toBeVisible();
  });

  test("入れ替えボタンが存在する", async ({ page }) => {
    const swapBtn = page.locator(".haversine-swap-btn");
    await expect(swapBtn).toBeVisible();
  });

  test("東京→大阪の距離が約400km前後で表示される", async ({ page }) => {
    await page.locator("#from-lat").fill("35.6895");
    await page.locator("#from-lng").fill("139.6917");
    await page.locator("#to-lat").fill("34.6873");
    await page.locator("#to-lng").fill("135.526");

    const results = page.locator(".haversine-results");
    await expect(results).toBeVisible();

    const distanceText = await page
      .locator(".haversine-result-distance-main")
      .textContent();
    expect(distanceText).toMatch(/4[0-9]{2}\.\d+ km/);
  });

  test("プリセットボタンで座標が入力される", async ({ page }) => {
    const presetBtns = page.locator(
      '[aria-label*="出発地を東京 (東京都庁)に設定"]'
    );
    await presetBtns.click();

    const latValue = await page.locator("#from-lat").inputValue();
    expect(latValue).toBe("35.6895");
  });

  test("入れ替えボタンで出発地と目的地が入れ替わる", async ({ page }) => {
    await page.locator("#from-lat").fill("35.6895");
    await page.locator("#from-lng").fill("139.6917");
    await page.locator("#to-lat").fill("34.6873");
    await page.locator("#to-lng").fill("135.526");

    await page.locator(".haversine-swap-btn").click();

    const fromLatValue = await page.locator("#from-lat").inputValue();
    const toLatValue = await page.locator("#to-lat").inputValue();

    expect(fromLatValue).toBe("34.6873");
    expect(toLatValue).toBe("35.6895");
  });

  test("入力なし時に空の状態メッセージが表示される", async ({ page }) => {
    const emptyState = page.locator(".haversine-empty-state");
    await expect(emptyState).toBeVisible();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#from-lat").fill("35.6895");
    await page.locator("#from-lng").fill("139.6917");
    await page.locator("#to-lat").fill("34.6873");
    await page.locator("#to-lng").fill("135.526");

    const clearBtn = page.locator('[aria-label="入力をクリア"]');
    await clearBtn.click();

    const fromLat = await page.locator("#from-lat").inputValue();
    expect(fromLat).toBe("");
  });

  test("方位角が結果に表示される", async ({ page }) => {
    await page.locator("#from-lat").fill("0");
    await page.locator("#from-lng").fill("0");
    await page.locator("#to-lat").fill("0");
    await page.locator("#to-lng").fill("10");

    const results = page.locator(".haversine-results");
    await expect(results).toBeVisible();

    const resultsText = await results.textContent();
    expect(resultsText).toContain("方位角");
    expect(resultsText).toMatch(/E|東/);
  });

  test("アクセシビリティ: ランドマークとラベルが設定されている", async ({
    page,
  }) => {
    const fromSection = page.locator('[aria-labelledby="from-heading"]');
    await expect(fromSection).toBeVisible();

    const toSection = page.locator('[aria-labelledby="to-heading"]');
    await expect(toSection).toBeVisible();
  });
});
