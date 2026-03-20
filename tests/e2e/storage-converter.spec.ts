import { test, expect } from "@playwright/test";

test.describe("ストレージ単位変換 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/storage-converter");
    await page.waitForLoadState("networkidle");
  });

  test('ページに"undefined"が含まれない', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/ストレージ単位変換/);
  });

  test("数値入力フィールドと単位セレクトが存在する", async ({ page }) => {
    await expect(page.locator("#sc-value")).toBeVisible();
    await expect(page.locator("#sc-unit")).toBeVisible();
  });

  test("1GBを入力すると全変換結果が表示される", async ({ page }) => {
    await page.locator("#sc-unit").selectOption("GB");
    await page.locator("#sc-value").fill("1");

    const results = page.locator(".sc-results");
    await expect(results).toBeVisible();

    // バイト値が表示されること
    const resultsText = await results.textContent();
    expect(resultsText).toContain("1000000000");
  });

  test("単位グループのヘッダーが表示される", async ({ page }) => {
    await page.locator("#sc-value").fill("1");

    const groupHeaders = page.locator(".sc-group-header");
    await expect(groupHeaders).toHaveCount(3);
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#sc-value").fill("100");

    const clearBtn = page.locator('[aria-label="入力をクリア"]');
    await clearBtn.click();

    const value = await page.locator("#sc-value").inputValue();
    expect(value).toBe("");
  });

  test("入力なし時に空の状態メッセージが表示される", async ({ page }) => {
    const emptyState = page.locator(".sc-empty-state");
    await expect(emptyState).toBeVisible();
  });

  test("IEC単位(GiB)でも変換できる", async ({ page }) => {
    await page.locator("#sc-unit").selectOption("GiB");
    await page.locator("#sc-value").fill("1");

    const results = page.locator(".sc-results");
    await expect(results).toBeVisible();

    const resultsText = await results.textContent();
    expect(resultsText).toContain("1073741824");
  });

  test("アクセシビリティ: セクションのラベルが設定されている", async ({
    page,
  }) => {
    const inputSection = page.locator('[aria-labelledby="sc-input-heading"]');
    await expect(inputSection).toBeVisible();
  });
});
