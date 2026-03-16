import { test, expect } from "@playwright/test";

test.describe("Unicodeコードポイント検査 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/unicode-inspector");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Unicode/);
  });

  test("should have a text input area", async ({ page }) => {
    await expect(page.locator("#uchi-text-input")).toBeVisible();
  });

  test("should show empty state initially", async ({ page }) => {
    const emptyState = page.locator(".uchi-empty-state");
    await expect(emptyState).toBeVisible();
  });

  test("should display character table after input", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("ABC");
    const table = page.locator(".uchi-table");
    await expect(table).toBeVisible();
  });

  test("should display correct number of rows for ASCII text", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("Hi");
    const rows = page.locator(".uchi-table-row");
    await expect(rows).toHaveCount(2);
  });

  test("should display code point in U+XXXX format", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("A");
    const codePoint = page.locator(".uchi-codepoint").first();
    await expect(codePoint).toContainText("U+0041");
  });

  test("should display statistics bar", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("Hello");
    const statsBar = page.locator(".uchi-stats-bar");
    await expect(statsBar).toBeVisible();
    await expect(statsBar).toContainText("合計");
  });

  test("should have a filter input when text is entered", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("ABC");
    const filter = page.locator(".uchi-filter-input");
    await expect(filter).toBeVisible();
  });

  test("should filter rows by character", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("ABC");
    await page.locator(".uchi-filter-input").fill("A");
    const rows = page.locator(".uchi-table-row");
    await expect(rows).toHaveCount(1);
  });

  test("should have clear button when text is entered", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("Hello");
    const clearBtn = page.locator(".btn-clear");
    await expect(clearBtn).toBeVisible();
  });

  test("should clear input when clear button is clicked", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("Hello");
    await page.locator(".btn-clear").click();
    await expect(page.locator(".uchi-empty-state")).toBeVisible();
  });

  test("should handle emoji correctly (surrogate pair)", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("😀");
    // 絵文字は1コードポイントとして1行表示
    const rows = page.locator(".uchi-table-row");
    await expect(rows).toHaveCount(1);
  });

  test("should have copy buttons in rows", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("A");
    const copyBtns = page.locator(".uchi-copy-btn");
    const count = await copyBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display category badge", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("A");
    const badge = page.locator(".uchi-category-badge").first();
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("文字");
  });

  test("should display HTML entity for special characters", async ({ page }) => {
    await page.locator("#uchi-text-input").fill("&");
    const entity = page.locator(".uchi-entity-named").first();
    await expect(entity).toContainText("&amp;");
  });
});
