import { test, expect } from "@playwright/test";

test.describe("CIDR Calculator - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cidr");
    await page.waitForSelector(".tool-container", { state: "visible" });
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/CIDR/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("should have CIDR input field", async ({ page }) => {
    const cidrInput = page.locator("#cidrInput");
    await expect(cidrInput).toBeVisible();
  });

  test("should have calculate button", async ({ page }) => {
    const calculateButton = page.locator(
      'button[aria-label="CIDR計算を実行"]'
    );
    await expect(calculateButton).toBeVisible();
    await expect(calculateButton).toContainText("計算");
  });

  test("should show error when calculating empty input", async ({ page }) => {
    const calculateButton = page.locator(
      'button[aria-label="CIDR計算を実行"]'
    );

    await calculateButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("CIDR表記を入力してください");
  });

  test("should calculate CIDR /24 network correctly", async ({ page }) => {
    const cidrInput = page.locator("#cidrInput");
    const calculateButton = page.locator(
      'button[aria-label="CIDR計算を実行"]'
    );

    await cidrInput.fill("192.168.1.0/24");
    await calculateButton.click();

    // Wait for results to appear
    await page.waitForSelector(".result-card", { state: "visible" });

    // Check network information
    const networkAddress = page.locator(".result-value", {
      has: page.locator("text=192.168.1.0"),
    });
    await expect(networkAddress.first()).toBeVisible();

    const broadcastAddress = page.locator(".result-value", {
      has: page.locator("text=192.168.1.255"),
    });
    await expect(broadcastAddress.first()).toBeVisible();

    const subnetMask = page.locator(".result-value", {
      has: page.locator("text=255.255.255.0"),
    });
    await expect(subnetMask.first()).toBeVisible();

    // Check usable hosts
    const pageText = await page.textContent("body");
    expect(pageText).toContain("254");
  });

  test("should show error for invalid CIDR notation", async ({ page }) => {
    const cidrInput = page.locator("#cidrInput");
    const calculateButton = page.locator(
      'button[aria-label="CIDR計算を実行"]'
    );

    await cidrInput.fill("192.168.1.0/33");
    await calculateButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("Invalid CIDR notation");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should focus on CIDR input on page load", async ({ page }) => {
    const cidrInput = page.locator("#cidrInput");
    await expect(cidrInput).toBeFocused({ timeout: 2000 });
  });

  test("should have proper form structure", async ({ page }) => {
    const label = page.locator('label[for="cidrInput"]');
    await expect(label).toBeVisible();
    await expect(label).toContainText("CIDR");

    const cidrInput = page.locator("#cidrInput");
    await expect(cidrInput).toHaveAttribute("placeholder", "192.168.1.0/24");
  });

  test("should have sr-only help text", async ({ page }) => {
    const helpText = page.locator("#cidr-help");
    await expect(helpText).toBeAttached();
    await expect(helpText).toHaveClass(/sr-only/);
  });

  test("should display usage instructions", async ({ page }) => {
    const usageSection = page.locator(".info-box");
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain("CIDR表記");
    expect(usageText).toContain("計算");
  });

  test("should calculate with Enter key", async ({ page }) => {
    const cidrInput = page.locator("#cidrInput");

    await cidrInput.fill("10.0.0.0/8");
    await cidrInput.press("Enter");

    await page.waitForSelector(".result-card", { state: "visible" });

    const networkAddress = page.locator(".result-value", {
      has: page.locator("text=10.0.0.0"),
    });
    await expect(networkAddress.first()).toBeVisible();
  });

  test("should display all result sections", async ({ page }) => {
    const cidrInput = page.locator("#cidrInput");
    const calculateButton = page.locator(
      'button[aria-label="CIDR計算を実行"]'
    );

    await cidrInput.fill("172.16.0.0/12");
    await calculateButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    // Check for all three sections
    await expect(
      page.locator("#network-info-title", { hasText: "ネットワーク情報" })
    ).toBeVisible();
    await expect(
      page.locator("#ip-range-title", {
        hasText: "利用可能なIPアドレス範囲",
      })
    ).toBeVisible();
    await expect(
      page.locator("#additional-info-title", { hasText: "追加情報" })
    ).toBeVisible();
  });

  test("should show private IP status", async ({ page }) => {
    const cidrInput = page.locator("#cidrInput");
    const calculateButton = page.locator(
      'button[aria-label="CIDR計算を実行"]'
    );

    await cidrInput.fill("192.168.1.0/24");
    await calculateButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("プライベートIP範囲");
    expect(pageText).toContain("はい");
  });

  test("should handle /32 (single host) correctly", async ({ page }) => {
    const cidrInput = page.locator("#cidrInput");
    const calculateButton = page.locator(
      'button[aria-label="CIDR計算を実行"]'
    );

    await cidrInput.fill("192.168.1.1/32");
    await calculateButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("192.168.1.1");
    // For /32, usable hosts should be 1
    const resultCards = await page.locator(".result-card").all();
    const ipRangeCard = resultCards[1]; // Second card is IP range
    const ipRangeText = await ipRangeCard.textContent();
    expect(ipRangeText).toContain("1");
  });

  test("should have copy buttons for important values", async ({ page }) => {
    const cidrInput = page.locator("#cidrInput");
    const calculateButton = page.locator(
      'button[aria-label="CIDR計算を実行"]'
    );

    await cidrInput.fill("192.168.1.0/24");
    await calculateButton.click();

    await page.waitForSelector(".result-card", { state: "visible" });

    // Check for copy buttons
    const copyButtons = page.locator('button[class*="btn-copy"]');
    const count = await copyButtons.count();
    expect(count).toBeGreaterThan(0);
  });
});
