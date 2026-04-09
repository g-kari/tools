import { test, expect } from "@playwright/test";

test.describe("User-Agent Parser - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/user-agent");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/User-Agent/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("should automatically load current UA on page load", async ({ page }) => {
    // テキストエリアにUA文字列が自動入力されていることを確認
    const textarea = page.locator("#uaInput");
    await expect(textarea).toBeVisible();
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("should display parse result cards on load", async ({ page }) => {
    // ページロード時にUA解析結果が表示されることを確認
    const resultSection = page.locator("#ua-result-title");
    await expect(resultSection).toBeVisible();
    await expect(resultSection).toContainText("解析結果");

    // 結果グリッドが表示されている
    const resultGrid = page.locator(".ua-result-grid");
    await expect(resultGrid).toBeVisible();
  });

  test("should display browser, OS, and device cards", async ({ page }) => {
    const resultGrid = page.locator(".ua-result-grid");
    await expect(resultGrid).toBeVisible();

    // 3つのカードが表示されている
    const cards = page.locator(".ua-result-card");
    await expect(cards).toHaveCount(3);

    // カードタイトルを確認
    await expect(cards.nth(0).locator(".ua-result-card-title")).toContainText("ブラウザ");
    await expect(cards.nth(1).locator(".ua-result-card-title")).toContainText("OS");
    await expect(cards.nth(2).locator(".ua-result-card-title")).toContainText("デバイス");
  });

  test("should have input textarea and buttons", async ({ page }) => {
    const inputTextarea = page.locator("#uaInput");
    const parseButton = page.locator("button.btn-primary");
    const copyButton = page.locator('button.btn-secondary:has-text("コピー")');
    const clearButton = page.locator("button.btn-clear");

    await expect(inputTextarea).toBeVisible();
    await expect(parseButton).toBeVisible();
    await expect(copyButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test("should parse a custom UA string", async ({ page }) => {
    const textarea = page.locator("#uaInput");
    const parseButton = page.locator("button.btn-primary");

    await textarea.fill(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    await parseButton.click();

    // 結果を確認
    const resultGrid = page.locator(".ua-result-grid");
    await expect(resultGrid).toBeVisible();

    // ブラウザカードにChromeが表示される
    const browserCard = page.locator(".ua-result-card").nth(0);
    const browserValues = await browserCard.locator(".ua-result-item-value").allTextContents();
    expect(browserValues.some((v) => v.includes("Chrome"))).toBe(true);

    // OSカードにWindowsが表示される
    const osCard = page.locator(".ua-result-card").nth(1);
    const osValues = await osCard.locator(".ua-result-item-value").allTextContents();
    expect(osValues.some((v) => v.includes("Windows"))).toBe(true);
  });

  test("should clear input and results", async ({ page }) => {
    const clearButton = page.locator("button.btn-clear");
    await clearButton.click();

    const textarea = page.locator("#uaInput");
    await expect(textarea).toHaveValue("");

    const resultSection = page.locator("#ua-result-title");
    await expect(resultSection).not.toBeVisible();
  });

  test("should show error when parsing empty input", async ({ page }) => {
    const clearButton = page.locator("button.btn-clear");
    await clearButton.click();

    const parseButton = page.locator("button.btn-primary");
    await parseButton.click();

    // トースト通知が表示される（Toastはテストしにくいので、resultが表示されないことを確認）
    const resultSection = page.locator("#ua-result-title");
    await expect(resultSection).not.toBeVisible();
  });

  test("should have UA fetch button", async ({ page }) => {
    const fetchButton = page.locator('button:has-text("現在のUA文字列を取得")');
    await expect(fetchButton).toBeVisible();
  });

  test("should display device type badge", async ({ page }) => {
    const deviceBadge = page.locator(".ua-device-type-badge");
    await expect(deviceBadge).toBeVisible();
    const text = await deviceBadge.textContent();
    expect(["Desktop", "Mobile", "Tablet", "Bot", "Unknown"]).toContain(text);
  });

  test("should display mobile, tablet, bot flags", async ({ page }) => {
    const flags = page.locator(".ua-flag-badge");
    const count = await flags.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const text = await flags.nth(i).textContent();
      expect(["YES", "NO"]).toContain(text);
    }
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    // ARIA roles
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Skip link
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display usage instructions (TipsCard)", async ({ page }) => {
    const infoBox = page.locator(".info-box").first();
    await expect(infoBox).toBeVisible();

    const text = await infoBox.textContent();
    expect(text).toContain("使い方");
    expect(text).not.toContain("undefined");
  });

  test("should display about section (TipsCard)", async ({ page }) => {
    const infoBoxes = page.locator(".info-box");
    await expect(infoBoxes).toHaveCount(2);

    const secondBox = infoBoxes.nth(1);
    const text = await secondBox.textContent();
    expect(text).toContain("User-Agent");
  });
});
