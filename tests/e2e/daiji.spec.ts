import { test, expect } from "@playwright/test";

test.describe("大字変換 - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/daiji");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/大字変換/);
  });

  test("should display arabic input field", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    await expect(arabicInput).toBeVisible();
    await expect(arabicInput).toBeEnabled();
  });

  test("should display daiji input field", async ({ page }) => {
    const daijiInput = page.locator("#daiji-input");
    await expect(daijiInput).toBeVisible();
    await expect(daijiInput).toBeEnabled();
  });

  test("should convert arabic to daiji", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字を大字に変換"]');

    await arabicInput.fill("12345");
    await convertButton.click();

    const result = page.locator(".daiji-result").first();
    await expect(result).toBeVisible();

    const resultText = await result.textContent();
    expect(resultText).toContain("壱萬弐仟参佰肆拾伍");
  });

  test("should convert 1234 to 壱仟弐佰参拾肆", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字を大字に変換"]');

    await arabicInput.fill("1234");
    await convertButton.click();

    const result = page.locator(".daiji-result-value").first();
    await expect(result).toHaveText("壱仟弐佰参拾肆");
  });

  test("should convert 0 to 零", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字を大字に変換"]');

    await arabicInput.fill("0");
    await convertButton.click();

    const result = page.locator(".daiji-result-value").first();
    await expect(result).toHaveText("零");
  });

  test("should convert daiji to arabic", async ({ page }) => {
    const daijiInput = page.locator("#daiji-input");
    const convertButton = page.locator('button[aria-label="大字をアラビア数字に変換"]');

    await daijiInput.fill("壱萬弐仟参佰肆拾伍");
    await convertButton.click();

    const result = page.locator(".daiji-result").last();
    await expect(result).toBeVisible();

    const resultText = await result.textContent();
    expect(resultText).toContain("12345");
  });

  test("should show error toast when arabic input is empty", async ({ page }) => {
    const convertButton = page.locator('button[aria-label="アラビア数字を大字に変換"]');

    await convertButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("数値を入力してください");
  });

  test("should show error toast when daiji input is empty", async ({ page }) => {
    const convertButton = page.locator('button[aria-label="大字をアラビア数字に変換"]');

    await convertButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("大字を入力してください");
  });

  test("should show error toast for invalid arabic input", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字を大字に変換"]');

    await arabicInput.fill("abc");
    await convertButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("有効な整数を入力してください");
  });

  test("should clear arabic result when clear button is clicked", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字を大字に変換"]');
    const clearButton = page.locator('button[aria-label="入力と結果をクリア"]').first();

    await arabicInput.fill("1234");
    await convertButton.click();

    await expect(page.locator(".daiji-result").first()).toBeVisible();

    await clearButton.click();

    await expect(page.locator(".daiji-result").first()).not.toBeVisible();
    await expect(arabicInput).toHaveValue("");
  });

  test("should display reference table", async ({ page }) => {
    const referenceSection = page.locator(".daiji-reference-section");
    await expect(referenceSection).toBeVisible();

    const table = page.locator(".daiji-table");
    await expect(table).toBeVisible();
  });

  test("should display 壱 in reference table", async ({ page }) => {
    const tableBody = page.locator(".daiji-table tbody");
    const rows = tableBody.locator("tr");

    // Should have 17 rows (0〜9 + 拾・佰・仟・萬・億・兆・京)
    await expect(rows).toHaveCount(17);
  });

  test("should display 壱=1 in reference table", async ({ page }) => {
    const secondRow = page.locator(".daiji-table tbody tr").nth(1);
    await expect(secondRow).toContainText("壱");
    await expect(secondRow).toContainText("1");
  });

  test("should have accessible section headings", async ({ page }) => {
    const arabicHeading = page.locator("#arabic-to-daiji-heading");
    await expect(arabicHeading).toBeVisible();
    await expect(arabicHeading).toContainText("アラビア数字 → 大字");

    const daijiHeading = page.locator("#daiji-to-arabic-heading");
    await expect(daijiHeading).toBeVisible();
    await expect(daijiHeading).toContainText("大字 → アラビア数字");
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should show copy button after arabic to daiji conversion", async ({ page }) => {
    const arabicInput = page.locator("#arabic-input");
    const convertButton = page.locator('button[aria-label="アラビア数字を大字に変換"]');

    await arabicInput.fill("42");
    await convertButton.click();

    const copyButton = page.locator(".daiji-copy-button").first();
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toContainText("コピー");
  });
});

test.describe("Top page - 大字変換 tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test('should display "大字変換" in the tool list', async ({ page }) => {
    const daijiLink = page.locator('a[href="/daiji"]');
    await expect(daijiLink).toBeVisible();
    await expect(daijiLink).toContainText("大字変換");
  });

  test("should navigate to /daiji when clicking the tool card", async ({ page }) => {
    const daijiLink = page.locator('a[href="/daiji"]');
    await daijiLink.click();

    await expect(page).toHaveURL("/daiji");
  });
});
