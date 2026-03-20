import { test, expect } from "@playwright/test";

test.describe("Fraction Converter - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fraction");
    await page.waitForLoadState("networkidle");
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/分数変換/);
  });

  test("should display decimal input field", async ({ page }) => {
    const input = page.locator("#decimal-input");
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test("should display numerator and denominator input fields", async ({
    page,
  }) => {
    await expect(page.locator("#numerator-input")).toBeVisible();
    await expect(page.locator("#denominator-input")).toBeVisible();
  });

  test("should convert 0.5 to 1/2", async ({ page }) => {
    await page.locator("#decimal-input").fill("0.5");
    await page.locator('button[aria-label="小数を分数に変換"]').click();

    const result = page.locator(".fraction-result").first();
    await expect(result).toBeVisible();
    await expect(result).toContainText("1");
    await expect(result).toContainText("2");
  });

  test("should convert 0.75 to 3/4", async ({ page }) => {
    await page.locator("#decimal-input").fill("0.75");
    await page.locator('button[aria-label="小数を分数に変換"]').click();

    const result = page.locator(".fraction-result").first();
    await expect(result).toBeVisible();
    await expect(result).toContainText("3");
    await expect(result).toContainText("4");
  });

  test("should convert 1/2 to 0.5", async ({ page }) => {
    await page.locator("#numerator-input").fill("1");
    await page.locator("#denominator-input").fill("2");
    await page.locator('button[aria-label="分数を小数に変換"]').click();

    const result = page.locator(".fraction-result").last();
    await expect(result).toBeVisible();
    await expect(result).toContainText("0.5");
  });

  test("should convert 3/4 to 0.75", async ({ page }) => {
    await page.locator("#numerator-input").fill("3");
    await page.locator("#denominator-input").fill("4");
    await page.locator('button[aria-label="分数を小数に変換"]').click();

    const result = page.locator(".fraction-result").last();
    await expect(result).toBeVisible();
    await expect(result).toContainText("0.75");
  });

  test("should show error toast when decimal input is empty", async ({
    page,
  }) => {
    await page.locator('button[aria-label="小数を分数に変換"]').click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("数値を入力してください");
  });

  test("should show error toast when denominator is zero", async ({ page }) => {
    await page.locator("#numerator-input").fill("1");
    await page.locator("#denominator-input").fill("0");
    await page.locator('button[aria-label="分数を小数に変換"]').click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("分母は0にできません");
  });

  test("should show error when numerator is missing", async ({ page }) => {
    await page.locator("#denominator-input").fill("4");
    await page.locator('button[aria-label="分数を小数に変換"]').click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("分子を入力してください");
  });

  test("should clear decimal result when clear button is clicked", async ({
    page,
  }) => {
    await page.locator("#decimal-input").fill("0.75");
    await page.locator('button[aria-label="小数を分数に変換"]').click();
    await expect(page.locator(".fraction-result").first()).toBeVisible();

    await page
      .locator('button[aria-label="入力と結果をクリア"]')
      .first()
      .click();

    await expect(page.locator(".fraction-result").first()).not.toBeVisible();
    await expect(page.locator("#decimal-input")).toHaveValue("");
  });

  test("should display common fractions reference table", async ({ page }) => {
    await expect(page.locator(".fraction-reference-section")).toBeVisible();
    await expect(page.locator(".fraction-table")).toBeVisible();
  });

  test("should display 1/2 = 0.5 in reference table", async ({ page }) => {
    const firstRow = page.locator(".fraction-table tbody tr").first();
    await expect(firstRow).toContainText("1/2");
    await expect(firstRow).toContainText("0.5");
    await expect(firstRow).toContainText("50%");
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should have accessible section headings", async ({ page }) => {
    await expect(
      page.locator("#decimal-to-fraction-heading")
    ).toBeVisible();
    await expect(
      page.locator("#fraction-to-decimal-heading")
    ).toBeVisible();
  });
});

test.describe("Top page - Fraction tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test("should display 分数変換 in the tool list", async ({ page }) => {
    const link = page.locator('a[href="/fraction"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("分数変換");
  });

  test("should navigate to /fraction when clicking the tool card", async ({
    page,
  }) => {
    const link = page.locator('a[href="/fraction"]');
    await link.click();
    await expect(page).toHaveURL("/fraction");
  });
});
