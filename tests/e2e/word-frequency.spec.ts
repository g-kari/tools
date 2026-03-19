import { test, expect } from "@playwright/test";

test.describe("Word Frequency Analyzer - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/word-frequency");
    await page.waitForLoadState("networkidle");
  });

  test("should load the page without 'undefined' content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/単語頻度分析/);
  });

  test("should display textarea for text input", async ({ page }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();
  });

  test("should show empty message when textarea is empty", async ({ page }) => {
    const emptyMessage = page.locator('[data-testid="empty-message"]');
    await expect(emptyMessage).toBeVisible();
    await expect(emptyMessage).toContainText("テキストを入力すると");
  });

  test("should show total words and unique words of 0 initially", async ({
    page,
  }) => {
    await expect(page.locator('[data-testid="total-words"]')).toHaveText("0");
    await expect(page.locator('[data-testid="unique-words"]')).toHaveText("0");
  });

  test("should update stats when text is entered", async ({ page }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("apple banana apple");

    await expect(page.locator('[data-testid="total-words"]')).toHaveText("3");
    await expect(page.locator('[data-testid="unique-words"]')).toHaveText("2");
  });

  test("should display frequency table after text input", async ({ page }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("hello world");

    const table = page.locator(".wf-table");
    await expect(table).toBeVisible();
  });

  test("should clear text when clear button is clicked", async ({ page }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("some text here");

    const clearButton = page.locator('button[aria-label="入力テキストをクリア"]');
    await clearButton.click();

    await expect(textarea).toHaveValue("");
    await expect(page.locator('[data-testid="total-words"]')).toHaveText("0");
  });

  test("should toggle sort between frequency and word order", async ({
    page,
  }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("cat dog cat bird dog cat");

    const sortButton = page.locator('[data-testid="sort-toggle"]');
    await expect(sortButton).toContainText("頻度順");

    await sortButton.click();
    await expect(sortButton).toContainText("単語順");

    await sortButton.click();
    await expect(sortButton).toContainText("頻度順");
  });

  test("should disable CSV copy button when no results", async ({ page }) => {
    const csvButton = page.locator('[data-testid="copy-csv-button"]');
    await expect(csvButton).toBeDisabled();
  });

  test("should enable CSV copy button when results exist", async ({ page }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("hello world");

    const csvButton = page.locator('[data-testid="copy-csv-button"]');
    await expect(csvButton).toBeEnabled();
  });
});
