import { test, expect } from "@playwright/test";

test.describe("Roman Numerals Converter - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/roman-numerals");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/ローマ数字変換/);
  });

  test("should display arabic input field", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    await expect(arabicInput).toBeVisible();
    await expect(arabicInput).toBeEnabled();
  });

  test("should display roman input field", async ({ page }) => {
    const romanInput = page.locator("#roman-input");
    await expect(romanInput).toBeVisible();
    await expect(romanInput).toBeEnabled();
  });

  test("should convert arabic to roman numeral", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字をローマ数字に変換"]');

    await arabicInput.fill("2024");
    await convertButton.click();

    const result = page.locator(".roman-result").first();
    await expect(result).toBeVisible();

    const resultText = await result.textContent();
    expect(resultText).toContain("MMXXIV");
  });

  test("should convert 1999 to MCMXCIX", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字をローマ数字に変換"]');

    await arabicInput.fill("1999");
    await convertButton.click();

    const result = page.locator(".roman-result-value").first();
    await expect(result).toHaveText("MCMXCIX");
  });

  test("should convert roman numeral to arabic", async ({ page }) => {
    const romanInput = page.locator("#roman-input");
    const convertButton = page.locator('button[aria-label="ローマ数字をアラビア数字に変換"]');

    await romanInput.fill("MMXXIV");
    await convertButton.click();

    const result = page.locator(".roman-result").last();
    await expect(result).toBeVisible();

    const resultText = await result.textContent();
    expect(resultText).toContain("2024");
  });

  test("should auto-uppercase roman input", async ({ page }) => {
    const romanInput = page.locator("#roman-input");

    await romanInput.fill("mmxxiv");

    const value = await romanInput.inputValue();
    expect(value).toBe("MMXXIV");
  });

  test("should show error toast when arabic input is empty", async ({ page }) => {
    const convertButton = page.locator('button[aria-label="アラビア数字をローマ数字に変換"]');

    await convertButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("数値を入力してください");
  });

  test("should show error toast when number is out of range", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字をローマ数字に変換"]');

    await arabicInput.fill("4000");
    await convertButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("1〜3999");
  });

  test("should show error toast for invalid roman numeral", async ({ page }) => {
    const romanInput = page.locator("#roman-input");
    const convertButton = page.locator('button[aria-label="ローマ数字をアラビア数字に変換"]');

    await romanInput.fill("IIII");
    await convertButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("有効なローマ数字を入力してください");
  });

  test("should clear arabic result when clear button is clicked", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字をローマ数字に変換"]');
    const clearButton = page.locator('button[aria-label="入力と結果をクリア"]').first();

    await arabicInput.fill("2024");
    await convertButton.click();

    await expect(page.locator(".roman-result").first()).toBeVisible();

    await clearButton.click();

    await expect(page.locator(".roman-result").first()).not.toBeVisible();
    await expect(arabicInput).toHaveValue("");
  });

  test("should display reference table", async ({ page }) => {
    const referenceSection = page.locator(".roman-reference-section");
    await expect(referenceSection).toBeVisible();

    const table = page.locator(".roman-table");
    await expect(table).toBeVisible();
  });

  test("should display reference table with basic symbols", async ({ page }) => {
    const tableBody = page.locator(".roman-table tbody");
    const rows = tableBody.locator("tr");

    // Should have 13 rows (I, IV, V, IX, X, XL, L, XC, C, CD, D, CM, M)
    await expect(rows).toHaveCount(13);
  });

  test("should display I=1 in reference table", async ({ page }) => {
    const firstRow = page.locator(".roman-table tbody tr").first();
    await expect(firstRow).toContainText("I");
    await expect(firstRow).toContainText("1");
  });

  test("should have accessible section headings", async ({ page }) => {
    const arabicHeading = page.locator("#arabic-to-roman-heading");
    await expect(arabicHeading).toBeVisible();
    await expect(arabicHeading).toContainText("アラビア数字 → ローマ数字");

    const romanHeading = page.locator("#roman-to-arabic-heading");
    await expect(romanHeading).toBeVisible();
    await expect(romanHeading).toContainText("ローマ数字 → アラビア数字");
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should show copy button after arabic to roman conversion", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字をローマ数字に変換"]');

    await arabicInput.fill("42");
    await convertButton.click();

    const copyButton = page.locator(".roman-copy-button").first();
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toContainText("コピー");
  });

  test("should convert minimum value (1 = I)", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字をローマ数字に変換"]');

    await arabicInput.fill("1");
    await convertButton.click();

    const result = page.locator(".roman-result-value").first();
    await expect(result).toHaveText("I");
  });

  test("should convert maximum value (3999 = MMMCMXCIX)", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字をローマ数字に変換"]');

    await arabicInput.fill("3999");
    await convertButton.click();

    const result = page.locator(".roman-result-value").first();
    await expect(result).toHaveText("MMMCMXCIX");
  });
});

test.describe("Top page - Roman Numerals tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test('should display "ローマ数字変換" in the tool list', async ({ page }) => {
    const romanLink = page.locator('a[href="/roman-numerals"]');
    await expect(romanLink).toBeVisible();
    await expect(romanLink).toContainText("ローマ数字変換");
  });

  test("should navigate to /roman-numerals when clicking the tool card", async ({ page }) => {
    const romanLink = page.locator('a[href="/roman-numerals"]');
    await romanLink.click();

    await expect(page).toHaveURL("/roman-numerals");
  });
});
