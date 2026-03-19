import { test, expect } from "@playwright/test";

test.describe("Char Frequency Analyzer - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/char-frequency");
    await page.waitForLoadState("networkidle");
  });

  test("should load the page without 'undefined' content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/文字頻度分析/);
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

  test("should show total chars and unique chars of 0 initially", async ({
    page,
  }) => {
    await expect(page.locator('[data-testid="total-chars"]')).toHaveText("0");
    await expect(page.locator('[data-testid="unique-chars"]')).toHaveText("0");
  });

  test("should update stats when text is entered", async ({ page }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("aabb");

    await expect(page.locator('[data-testid="total-chars"]')).toHaveText("4");
    await expect(page.locator('[data-testid="unique-chars"]')).toHaveText("2");
  });

  test("should display frequency table after text input", async ({ page }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("hello");

    const table = page.locator(".cf-table");
    await expect(table).toBeVisible();
  });

  test("should display correct frequency for repeated character", async ({
    page,
  }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("aab");

    const rows = page.locator(".cf-table tbody tr");
    await expect(rows).toHaveCount(2);
  });

  test("should toggle sort order between frequency and character", async ({
    page,
  }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("cab");

    const sortButton = page.locator('[data-testid="sort-toggle"]');
    await expect(sortButton).toContainText("頻度順");

    await sortButton.click();
    await expect(sortButton).toContainText("文字順");

    await sortButton.click();
    await expect(sortButton).toContainText("頻度順");
  });

  test("should filter spaces when ignoreSpaces is checked", async ({
    page,
  }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("a b");

    await expect(page.locator('[data-testid="unique-chars"]')).toHaveText("3");

    const ignoreSpaces = page.locator(
      'input[aria-label="スペース・改行を除外"]'
    );
    await ignoreSpaces.check();

    await expect(page.locator('[data-testid="unique-chars"]')).toHaveText("2");
    await expect(page.locator('[data-testid="total-chars"]')).toHaveText("2");
  });

  test("should combine upper and lower case when ignoreCase is checked", async ({
    page,
  }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("Aa");

    await expect(page.locator('[data-testid="unique-chars"]')).toHaveText("2");

    const ignoreCase = page.locator(
      'input[aria-label="大文字・小文字を区別しない"]'
    );
    await ignoreCase.check();

    await expect(page.locator('[data-testid="unique-chars"]')).toHaveText("1");
  });

  test("should clear text when clear button is clicked", async ({ page }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("hello");

    await expect(
      page.locator('[data-testid="total-chars"]')
    ).not.toHaveText("0");

    const clearButton = page.locator(
      'button[aria-label="入力テキストをクリア"]'
    );
    await clearButton.click();

    await expect(textarea).toHaveValue("");
    await expect(page.locator('[data-testid="total-chars"]')).toHaveText("0");
  });

  test("should disable clear button when input is empty", async ({ page }) => {
    const clearButton = page.locator(
      'button[aria-label="入力テキストをクリア"]'
    );
    await expect(clearButton).toBeDisabled();
  });

  test("should disable CSV copy button when there are no results", async ({
    page,
  }) => {
    const csvButton = page.locator('[data-testid="copy-csv-button"]');
    await expect(csvButton).toBeDisabled();
  });

  test("should enable CSV copy button when results exist", async ({ page }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("abc");

    const csvButton = page.locator('[data-testid="copy-csv-button"]');
    await expect(csvButton).toBeEnabled();
  });

  test("should display frequency bar for each row", async ({ page }) => {
    const textarea = page.locator('textarea[aria-label="分析対象のテキスト"]');
    await textarea.fill("aab");

    const bars = page.locator(".cf-bar");
    const count = await bars.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should have accessible section headings", async ({ page }) => {
    const inputHeading = page.locator("#cf-input-heading");
    await expect(inputHeading).toBeVisible();
    await expect(inputHeading).toContainText("テキスト入力");

    const summaryHeading = page.locator("#cf-summary-heading");
    await expect(summaryHeading).toBeVisible();

    const resultsHeading = page.locator("#cf-results-heading");
    await expect(resultsHeading).toBeVisible();
  });

  test("should display TipsCard with usage instructions", async ({ page }) => {
    await page.waitForSelector(".tips-card, [class*='tips']", {
      timeout: 5000,
    });
    const tipsCard = page.locator(".tips-card, [class*='tips']").first();
    await expect(tipsCard).toBeVisible();
  });
});

test.describe("Top page - Char Frequency tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test("should display '文字頻度分析' in the tool list", async ({ page }) => {
    const link = page.locator('a[href="/char-frequency"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("文字頻度分析");
  });

  test("should navigate to /char-frequency when clicking the tool card", async ({
    page,
  }) => {
    const link = page.locator('a[href="/char-frequency"]').first();
    await link.click();

    await expect(page).toHaveURL("/char-frequency");
  });
});
