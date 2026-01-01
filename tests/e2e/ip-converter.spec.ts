import { test, expect } from "@playwright/test";

test.describe("IP Converter - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ip-converter");
    await page.waitForSelector(".tool-container", { state: "visible" });
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/IP変換/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("should have IP input field", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    await expect(ipInput).toBeVisible();
  });

  test("should have convert button", async ({ page }) => {
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');
    await expect(convertButton).toBeVisible();
    await expect(convertButton).toContainText("変換");
  });

  test("should show error when converting empty input", async ({ page }) => {
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    await convertButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(
      "IPアドレスまたは数値を入力してください"
    );
  });

  test("should convert decimal IP address correctly", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    await ipInput.fill("192.168.1.1");
    await convertButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("192.168.1.1"); // Decimal
    expect(pageText).toContain("C0.A8.01.01"); // Hex dotted
    expect(pageText).toContain("0xC0A80101"); // Hex solid
    expect(pageText).toContain("3,232,235,777"); // Integer with locale formatting
  });

  test("should convert hexadecimal dotted notation", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    await ipInput.fill("C0.A8.01.01");
    await convertButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("192.168.1.1");
  });

  test("should convert hexadecimal solid notation", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    await ipInput.fill("0xC0A80101");
    await convertButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("192.168.1.1");
  });

  test("should convert binary dotted notation", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    await ipInput.fill("11000000.10101000.00000001.00000001");
    await convertButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("192.168.1.1");
    expect(pageText).toContain("C0.A8.01.01");
  });

  test("should convert integer notation", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    await ipInput.fill("3232235777");
    await convertButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("192.168.1.1");
  });

  test("should show error for invalid IP address", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    await ipInput.fill("256.1.1.1");
    await convertButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("無効なIPアドレスです");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should focus on IP input on page load", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    await expect(ipInput).toBeFocused({ timeout: 2000 });
  });

  test("should have proper form structure", async ({ page }) => {
    const label = page.locator('label[for="ipInput"]');
    await expect(label).toBeVisible();
    await expect(label).toContainText("IPアドレス");

    const ipInput = page.locator("#ipInput");
    await expect(ipInput).toHaveAttribute(
      "placeholder",
      /192\.168\.1\.1|C0\.A8\.01\.01|3232235777/
    );
  });

  test("should have sr-only help text", async ({ page }) => {
    const helpText = page.locator("#ip-help");
    await expect(helpText).toBeAttached();
    await expect(helpText).toHaveClass(/sr-only/);
  });

  test("should display usage instructions", async ({ page }) => {
    const usageSection = page.locator(".info-box");
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain("10進数");
    expect(usageText).toContain("16進数");
    expect(usageText).toContain("2進数");
  });

  test("should convert with Enter key", async ({ page }) => {
    const ipInput = page.locator("#ipInput");

    await ipInput.fill("10.0.0.1");
    await ipInput.press("Enter");

    await page.waitForSelector(".result-card", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("10.0.0.1");
    expect(pageText).toContain("0A.00.00.01");
  });

  test("should display all result sections", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    await ipInput.fill("172.16.0.1");
    await convertButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    // Check for all three sections
    await expect(
      page.locator("#decimal-title", { hasText: "10進数表記" })
    ).toBeVisible();
    await expect(
      page.locator("#hex-title", { hasText: "16進数表記" })
    ).toBeVisible();
    await expect(
      page.locator("#binary-title", { hasText: "2進数表記" })
    ).toBeVisible();
  });

  test("should have copy buttons for values", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    await ipInput.fill("192.168.1.1");
    await convertButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    const copyButtons = page.locator('button[class*="btn-copy"]');
    const count = await copyButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should handle edge cases", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    // Test 0.0.0.0
    await ipInput.fill("0.0.0.0");
    await convertButton.click();
    await page.waitForSelector(".result-card", { state: "visible" });

    let pageText = await page.textContent("body");
    expect(pageText).toContain("0.0.0.0");
    expect(pageText).toContain("00.00.00.00");

    // Test 255.255.255.255
    await ipInput.fill("255.255.255.255");
    await convertButton.click();
    await page.waitForSelector(".result-card", { state: "visible" });

    pageText = await page.textContent("body");
    expect(pageText).toContain("255.255.255.255");
    expect(pageText).toContain("FF.FF.FF.FF");
  });

  test("should handle lowercase hexadecimal input", async ({ page }) => {
    const ipInput = page.locator("#ipInput");
    const convertButton = page.locator('button[aria-label="IP変換を実行"]');

    await ipInput.fill("c0.a8.01.01");
    await convertButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("192.168.1.1");
  });
});
