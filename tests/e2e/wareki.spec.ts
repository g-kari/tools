import { test, expect } from "@playwright/test";

test.describe("和暦・西暦変換 (/wareki) - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/wareki", { waitUntil: "domcontentloaded" });
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/和暦・西暦変換/);
  });

  test("西暦から和暦への変換ができる", async ({ page }) => {
    const input = page.locator("#western-input");
    await input.fill("2024");

    const convertBtn = page.locator("button", { hasText: "→ 和暦に変換" });
    await convertBtn.click();

    const result = page.locator(".wareki-results");
    await expect(result).toBeVisible();
    await expect(result).toContainText("令和6年");
  });

  test("2019年（令和・平成の遷移年）は2つの結果を表示する", async ({
    page,
  }) => {
    await page.locator("#western-input").fill("2019");
    await page.locator("button", { hasText: "→ 和暦に変換" }).click();

    const results = page.locator(".wareki-result-item");
    await expect(results).toHaveCount(2);
    await expect(page.locator(".wareki-results")).toContainText("令和1年");
    await expect(page.locator(".wareki-results")).toContainText("平成31年");
  });

  test("和暦から西暦への変換ができる", async ({ page }) => {
    const eraSelect = page.locator("#era-select");
    await eraSelect.selectOption("令和");

    const yearInput = page.locator("#era-year-input");
    await yearInput.fill("6");

    const convertBtn = page.locator("button", { hasText: "→ 西暦に変換" });
    await convertBtn.click();

    const result = page.locator(".wareki-results");
    await expect(result).toBeVisible();
    await expect(result).toContainText("2024年");
  });

  test("元号選択ドロップダウンが全元号を含む", async ({ page }) => {
    const select = page.locator("#era-select");
    await expect(select.locator("option", { hasText: "令和" })).toBeAttached();
    await expect(select.locator("option", { hasText: "平成" })).toBeAttached();
    await expect(select.locator("option", { hasText: "昭和" })).toBeAttached();
    await expect(select.locator("option", { hasText: "大正" })).toBeAttached();
    await expect(select.locator("option", { hasText: "明治" })).toBeAttached();
  });

  test("クリアボタンで入力と結果がリセットされる", async ({ page }) => {
    await page.locator("#western-input").fill("2024");
    await page.locator("button", { hasText: "→ 和暦に変換" }).click();
    await expect(page.locator(".wareki-results")).toBeVisible();

    await page.locator("button", { hasText: "クリア" }).first().click();
    await expect(page.locator(".wareki-results")).not.toBeVisible();
  });

  test("無効な入力でエラーが表示される", async ({ page }) => {
    await page.locator("#western-input").fill("1800");
    await page.locator("button", { hasText: "→ 和暦に変換" }).click();
    await expect(page.locator(".wareki-results")).not.toBeVisible();
  });

  test("元号一覧表が表示される", async ({ page }) => {
    const table = page.locator(".wareki-table");
    await expect(table).toBeVisible();
    await expect(table).toContainText("令和");
    await expect(table).toContainText("平成");
    await expect(table).toContainText("昭和");
  });
});
