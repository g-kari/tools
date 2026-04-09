import { test, expect } from "@playwright/test";

test.describe("Timestamp Converter - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timestamp");
    // Wait for React hydration
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/タイムスタンプ変換/);
  });

  test("should display timestamp input form", async ({ page }) => {
    const tsInput = page.locator("#ts-input");
    await expect(tsInput).toBeVisible();
    await expect(tsInput).toBeEnabled();
  });

  test('should display the "現在時刻" button', async ({ page }) => {
    const currentTimeButton = page.locator("button", { hasText: "現在時刻" });
    await expect(currentTimeButton).toBeVisible();
  });

  test('should set current timestamp when clicking "現在時刻" button', async ({ page }) => {
    const tsInput = page.locator("#ts-input");
    const currentTimeButton = page.locator("button", { hasText: "現在時刻" });

    // Input should be empty initially
    await expect(tsInput).toHaveValue("");

    await currentTimeButton.click();

    // Input should now contain a numeric Unix timestamp (10 digits for seconds)
    const value = await tsInput.inputValue();
    expect(value).toMatch(/^\d{10}$/);
  });

  test("should convert timestamp to UTC and JST when clicking convert button", async ({ page }) => {
    const tsInput = page.locator("#ts-input");
    const convertButton = page.locator('button[aria-label="タイムスタンプを日時形式に変換"]');

    await tsInput.fill("1700000000");
    await convertButton.click();

    // Wait for result to appear
    const result = page.locator(".timestamp-result").first();
    await expect(result).toBeVisible();

    // UTC result should be displayed
    const resultText = await result.textContent();
    expect(resultText).toContain("UTC");
    expect(resultText).toContain("JST");
  });

  test("should display UTC time in result after conversion", async ({ page }) => {
    const tsInput = page.locator("#ts-input");
    const convertButton = page.locator('button[aria-label="タイムスタンプを日時形式に変換"]');

    await tsInput.fill("1700000000");
    await convertButton.click();

    const utcResultRow = page.locator(".timestamp-result-row", { hasText: "UTC" });
    await expect(utcResultRow).toBeVisible();

    const utcValue = utcResultRow.locator(".timestamp-result-value");
    const text = await utcValue.textContent();
    expect(text).toContain("UTC");
    expect(text).toMatch(/\d{4}/); // contains year
  });

  test("should display JST time in result after conversion", async ({ page }) => {
    const tsInput = page.locator("#ts-input");
    const convertButton = page.locator('button[aria-label="タイムスタンプを日時形式に変換"]');

    await tsInput.fill("1700000000");
    await convertButton.click();

    const jstResultRow = page.locator(".timestamp-result-row", { hasText: "JST" });
    await expect(jstResultRow).toBeVisible();

    const jstValue = jstResultRow.locator(".timestamp-result-value");
    const text = await jstValue.textContent();
    expect(text).toContain("JST");
  });

  test("should display relative time in result after conversion", async ({ page }) => {
    const tsInput = page.locator("#ts-input");
    const convertButton = page.locator('button[aria-label="タイムスタンプを日時形式に変換"]');

    await tsInput.fill("1700000000");
    await convertButton.click();

    const relativeResultRow = page.locator(".timestamp-result-row", { hasText: "相対" });
    await expect(relativeResultRow).toBeVisible();

    const relativeValue = relativeResultRow.locator(".timestamp-result-value");
    const text = await relativeValue.textContent();
    // Should contain "前" or "後" for relative time
    expect(text).toMatch(/[前後]/);
  });

  test("should display datetime-local input field", async ({ page }) => {
    const dateInput = page.locator("#date-input");
    await expect(dateInput).toBeVisible();
    await expect(dateInput).toBeEnabled();

    // Should be of type datetime-local
    const inputType = await dateInput.getAttribute("type");
    expect(inputType).toBe("datetime-local");
  });

  test("should convert date to timestamp when clicking date convert button", async ({ page }) => {
    const dateInput = page.locator("#date-input");
    const convertButton = page.locator('button[aria-label="日時をUnixタイムスタンプに変換"]');

    await dateInput.fill("2023-11-14T22:13");
    await convertButton.click();

    // Wait for result to appear
    const result = page.locator(".timestamp-result").last();
    await expect(result).toBeVisible();

    const resultText = await result.textContent();
    expect(resultText).toContain("秒");
    expect(resultText).toContain("ミリ秒");
  });

  test("should show toast error when converting empty timestamp", async ({ page }) => {
    const convertButton = page.locator('button[aria-label="タイムスタンプを日時形式に変換"]');

    await convertButton.click();

    // Check for toast notification
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("タイムスタンプを入力してください");
  });

  test("should show toast error when converting invalid timestamp", async ({ page }) => {
    const tsInput = page.locator("#ts-input");
    const convertButton = page.locator('button[aria-label="タイムスタンプを日時形式に変換"]');

    await tsInput.fill("not-a-number");
    await convertButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("有効な数値を入力してください");
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Check for skip link
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should have accessible form label for timestamp input", async ({ page }) => {
    const tsInput = page.locator("#ts-input");
    const ariaLabel = await tsInput.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain("タイムスタンプ");
  });

  test("should show copy buttons after conversion", async ({ page }) => {
    const tsInput = page.locator("#ts-input");
    const convertButton = page.locator('button[aria-label="タイムスタンプを日時形式に変換"]');

    await tsInput.fill("1700000000");
    await convertButton.click();

    // Copy buttons should appear in results
    const copyButtons = page.locator(".timestamp-copy-button");
    await expect(copyButtons.first()).toBeVisible();
    await expect(copyButtons.first()).toContainText("コピー");
  });

  test("should handle millisecond timestamps (13 digits)", async ({ page }) => {
    const tsInput = page.locator("#ts-input");
    const convertButton = page.locator('button[aria-label="タイムスタンプを日時形式に変換"]');

    await tsInput.fill("1700000000000");
    await convertButton.click();

    const result = page.locator(".timestamp-result").first();
    await expect(result).toBeVisible();

    const resultText = await result.textContent();
    expect(resultText).toContain("UTC");
  });

  test("should display section headings", async ({ page }) => {
    const tsToDateHeading = page.locator("#ts-to-date-heading");
    await expect(tsToDateHeading).toBeVisible();
    await expect(tsToDateHeading).toContainText("タイムスタンプ → 日時");

    const dateToTsHeading = page.locator("#date-to-ts-heading");
    await expect(dateToTsHeading).toBeVisible();
    await expect(dateToTsHeading).toContainText("日時 → タイムスタンプ");
  });
});

test.describe("Top page - Timestamp tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test('should display "タイムスタンプ変換" in the tool list', async ({ page }) => {
    const timestampLink = page.locator('a[href="/timestamp"]');
    await expect(timestampLink).toBeVisible();
    await expect(timestampLink).toContainText("タイムスタンプ変換");
  });

  test("should navigate to /timestamp when clicking the tool card", async ({ page }) => {
    const timestampLink = page.locator('a[href="/timestamp"]');
    await timestampLink.click();

    await expect(page).toHaveURL("/timestamp");
  });

  test("should display timestamp tool description", async ({ page }) => {
    const timestampLink = page.locator('a[href="/timestamp"]');
    await expect(timestampLink).toContainText("Unixタイムスタンプ");
  });
});
