import { test, expect } from "@playwright/test";

test.describe("IP CIDR Range Check - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ip-cidr-check");
    await page.waitForSelector(".tool-container", { state: "visible" });
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/CIDR範囲チェック/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("should have IP address textarea", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await expect(ipTextarea).toBeVisible();
  });

  test("should have CIDR list textarea", async ({ page }) => {
    const cidrTextarea = page.locator("#cidrListInput");
    await expect(cidrTextarea).toBeVisible();
  });

  test("should have check and clear buttons", async ({ page }) => {
    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await expect(checkButton).toBeVisible();
    await expect(checkButton).toContainText("チェック");

    const clearButton = page.locator('button[aria-label="入力内容をクリア"]');
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toContainText("クリア");
  });

  test("should show error when IP list is empty", async ({ page }) => {
    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await checkButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("IPアドレスを1つ以上入力してください");
  });

  test("should show error when CIDR list is empty", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await ipTextarea.fill("192.168.1.1");

    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await checkButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("CIDRブロックを1つ以上入力してください");
  });

  test("should show error for invalid CIDR notation", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await ipTextarea.fill("192.168.1.1");

    const cidrTextarea = page.locator("#cidrListInput");
    await cidrTextarea.fill("192.168.1.0/33");

    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await checkButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("無効なCIDR表記があります");
  });

  test("should display matched result when IP is in CIDR", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await ipTextarea.fill("192.168.1.100");

    const cidrTextarea = page.locator("#cidrListInput");
    await cidrTextarea.fill("192.168.1.0/24");

    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await checkButton.click();

    await page.waitForSelector(".cidr-check-results", { state: "visible" });

    const matchedItem = page.locator(".cidr-check-item.matched");
    await expect(matchedItem).toBeVisible();

    const pageText = await page.textContent("body");
    expect(pageText).toContain("192.168.1.100");
    expect(pageText).toContain("192.168.1.0/24");
    expect(pageText).toContain("マッチ");
  });

  test("should display unmatched result when IP is not in CIDR", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await ipTextarea.fill("10.0.0.1");

    const cidrTextarea = page.locator("#cidrListInput");
    await cidrTextarea.fill("192.168.1.0/24");

    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await checkButton.click();

    await page.waitForSelector(".cidr-check-results", { state: "visible" });

    const unmatchedItem = page.locator(".cidr-check-item.unmatched");
    await expect(unmatchedItem).toBeVisible();

    const pageText = await page.textContent("body");
    expect(pageText).toContain("非マッチ");
  });

  test("should display summary statistics", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await ipTextarea.fill("192.168.1.1\n10.0.0.1\n172.16.5.5");

    const cidrTextarea = page.locator("#cidrListInput");
    await cidrTextarea.fill("192.168.1.0/24\n172.16.0.0/12");

    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await checkButton.click();

    await page.waitForSelector(".cidr-check-summary", { state: "visible" });

    const summaryText = await page.locator(".cidr-check-summary").textContent();
    expect(summaryText).toContain("総IP数");
    expect(summaryText).toContain("マッチ");
    expect(summaryText).toContain("非マッチ");
  });

  test("should handle multiple IPs and CIDRs correctly", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await ipTextarea.fill("192.168.1.1\n10.0.0.1");

    const cidrTextarea = page.locator("#cidrListInput");
    await cidrTextarea.fill("192.168.1.0/24\n10.0.0.0/8");

    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await checkButton.click();

    await page.waitForSelector(".cidr-check-results", { state: "visible" });

    const matchedItems = page.locator(".cidr-check-item.matched");
    const matchedCount = await matchedItems.count();
    expect(matchedCount).toBe(2);
  });

  test("should show network address range in matched results", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await ipTextarea.fill("192.168.1.50");

    const cidrTextarea = page.locator("#cidrListInput");
    await cidrTextarea.fill("192.168.1.0/24");

    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await checkButton.click();

    await page.waitForSelector(".cidr-check-results", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("192.168.1.0");
    expect(pageText).toContain("192.168.1.255");
  });

  test("should clear inputs and results when clear button is clicked", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await ipTextarea.fill("192.168.1.1");

    const cidrTextarea = page.locator("#cidrListInput");
    await cidrTextarea.fill("192.168.1.0/24");

    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await checkButton.click();

    await page.waitForSelector(".cidr-check-results", { state: "visible" });

    const clearButton = page.locator('button[aria-label="入力内容をクリア"]');
    await clearButton.click();

    await expect(ipTextarea).toHaveValue("");
    await expect(cidrTextarea).toHaveValue("");

    const results = page.locator(".cidr-check-results");
    await expect(results).not.toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should focus on IP textarea on page load", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await expect(ipTextarea).toBeFocused({ timeout: 2000 });
  });

  test("should have sr-only help text for inputs", async ({ page }) => {
    const ipHelp = page.locator("#ip-list-help");
    await expect(ipHelp).toBeAttached();
    await expect(ipHelp).toHaveClass(/sr-only/);

    const cidrHelp = page.locator("#cidr-list-help");
    await expect(cidrHelp).toBeAttached();
    await expect(cidrHelp).toHaveClass(/sr-only/);
  });

  test("should display usage instructions in tips card", async ({ page }) => {
    const usageSection = page.locator(".info-box").first();
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain("CIDR");
  });

  test("should execute check with Ctrl+Enter", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await ipTextarea.fill("192.168.1.100");

    const cidrTextarea = page.locator("#cidrListInput");
    await cidrTextarea.fill("192.168.1.0/24");

    await page.keyboard.press("Control+Enter");

    await page.waitForSelector(".cidr-check-results", { state: "visible" });

    const matchedItem = page.locator(".cidr-check-item.matched");
    await expect(matchedItem).toBeVisible();
  });

  test("should show invalid IP badge for invalid IP addresses", async ({ page }) => {
    const ipTextarea = page.locator("#ipListInput");
    await ipTextarea.fill("256.1.1.1");

    const cidrTextarea = page.locator("#cidrListInput");
    await cidrTextarea.fill("192.168.1.0/24");

    const checkButton = page.locator('button[aria-label="CIDR範囲チェックを実行"]');
    await checkButton.click();

    await page.waitForSelector(".cidr-check-results", { state: "visible" });

    const pageText = await page.textContent("body");
    expect(pageText).toContain("無効なIP");
  });
});
