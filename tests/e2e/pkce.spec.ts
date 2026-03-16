import { test, expect } from "@playwright/test";

test.describe("PKCE ジェネレーター - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/pkce");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/PKCE/);
  });

  test("should have generate button", async ({ page }) => {
    const generateBtn = page.locator('button[aria-label="PKCE ペアを生成"]');
    await expect(generateBtn).toBeVisible();
  });

  test("should have byte length options", async ({ page }) => {
    const options = page.locator('input[name="byteLength"]');
    await expect(options).toHaveCount(4);
  });

  test("should have method options (S256 and plain)", async ({ page }) => {
    const methodOptions = page.locator('input[name="method"]');
    await expect(methodOptions).toHaveCount(2);

    const s256Option = page.locator('input[name="method"][value="S256"]');
    await expect(s256Option).toBeChecked();
  });

  test("should generate PKCE pair when generate button is clicked", async ({
    page,
  }) => {
    const generateBtn = page.locator('button[aria-label="PKCE ペアを生成"]');
    await generateBtn.click();

    // code_verifier と code_challenge が表示される
    const verifierRegion = page.locator('[aria-label="code_verifier の値"]');
    await expect(verifierRegion).toBeVisible();
    const verifierText = await verifierRegion.textContent();
    expect(verifierText).not.toBe("—");
    expect(verifierText?.length).toBeGreaterThan(40);

    const challengeRegion = page.locator('[aria-label="code_challenge の値"]');
    await expect(challengeRegion).toBeVisible();
    const challengeText = await challengeRegion.textContent();
    expect(challengeText).not.toBe("—");
    expect(challengeText?.length).toBeGreaterThan(40);
  });

  test("should show S256 method badge after generation", async ({ page }) => {
    const generateBtn = page.locator('button[aria-label="PKCE ペアを生成"]');
    await generateBtn.click();

    const badge = page.locator(".pkce-method-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("S256");
  });

  test("should show length info after generation", async ({ page }) => {
    const generateBtn = page.locator('button[aria-label="PKCE ペアを生成"]');
    await generateBtn.click();

    const lengthInfo = page.locator(".pkce-length-info");
    await expect(lengthInfo.first()).toBeVisible();
  });

  test("should have copy buttons for code_verifier and code_challenge", async ({
    page,
  }) => {
    const generateBtn = page.locator('button[aria-label="PKCE ペアを生成"]');
    await generateBtn.click();

    const verifierCopyBtn = page.locator(
      'button[aria-label="code_verifier をコピー"]'
    );
    await expect(verifierCopyBtn).toBeVisible();

    const challengeCopyBtn = page.locator(
      'button[aria-label="code_challenge をコピー"]'
    );
    await expect(challengeCopyBtn).toBeVisible();
  });

  test("should clear results when clear button is clicked", async ({
    page,
  }) => {
    const generateBtn = page.locator('button[aria-label="PKCE ペアを生成"]');
    await generateBtn.click();

    const clearBtn = page.locator('button[aria-label="すべてクリア"]');
    await clearBtn.click();

    // 結果が非表示になる
    const verifierRegion = page.locator('[aria-label="code_verifier の値"]');
    await expect(verifierRegion).not.toBeVisible();
  });

  test("should validate code_verifier in verify section", async ({ page }) => {
    const verifierInput = page.locator("#verifier-input");
    // 43 文字の有効な文字列を入力
    await verifierInput.fill("a".repeat(43));
    await page.waitForTimeout(300);

    const validResult = page.locator(".pkce-validation-result.valid");
    await expect(validResult).toBeVisible();
  });

  test("should show error for short code_verifier", async ({ page }) => {
    const verifierInput = page.locator("#verifier-input");
    await verifierInput.fill("tooshort");
    await page.waitForTimeout(300);

    const invalidResult = page.locator(".pkce-validation-result.invalid");
    await expect(invalidResult).toBeVisible();
  });

  test("should compute code_challenge from valid verifier input", async ({
    page,
  }) => {
    const verifierInput = page.locator("#verifier-input");
    // RFC 7636 Appendix B の既知のテストベクター
    await verifierInput.fill("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");
    await page.waitForTimeout(500);

    const challengeOutput = page.locator(
      '[aria-label="計算された code_challenge の値"]'
    );
    await expect(challengeOutput).toBeVisible();
    const text = await challengeOutput.textContent();
    expect(text).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  test("should have tips card", async ({ page }) => {
    const tips = page.locator(".tips-card, .info-box");
    await expect(tips.first()).toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("should have navigation link in category dropdown", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "検証" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/pkce"]');
    await expect(link).toBeVisible();
  });
});
