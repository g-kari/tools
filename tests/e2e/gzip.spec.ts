import { test, expect } from "@playwright/test";

test.describe("GZip/Deflate 圧縮・解凍 - E2E テスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gzip");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正常に表示される", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/GZip/);
  });

  test("モード切替タブが表示される", async ({ page }) => {
    const compressTab = page.locator(".gz-tab-btn", { hasText: "圧縮" });
    const decompressTab = page.locator(".gz-tab-btn", { hasText: "解凍" });
    await expect(compressTab).toBeVisible();
    await expect(decompressTab).toBeVisible();
  });

  test("デフォルトで圧縮タブがアクティブになっている", async ({ page }) => {
    const compressTab = page.locator(".gz-tab-btn", { hasText: "圧縮" });
    await expect(compressTab).toHaveClass(/active/);
  });

  test("圧縮形式のラジオボタンが表示される", async ({ page }) => {
    const gzipRadio = page.locator('input[value="gzip"]');
    const deflateRadio = page.locator('input[value="deflate"]');
    const deflateRawRadio = page.locator('input[value="deflate-raw"]');
    await expect(gzipRadio).toBeVisible();
    await expect(deflateRadio).toBeVisible();
    await expect(deflateRawRadio).toBeVisible();
  });

  test("テキストを圧縮できる", async ({ page }) => {
    const input = page.locator("#gz-compress-input");
    await input.fill("Hello, Compression World! This is a test of the gzip compression tool.");
    await page.locator("button.btn-primary", { hasText: "圧縮する" }).click();

    // 出力エリアに Base64 が表示される
    const output = page.locator(".gz-textarea-output").first();
    await expect(output).toBeVisible();
    const outputValue = await output.inputValue();
    expect(outputValue.length).toBeGreaterThan(0);
    // Base64 文字列であることを確認
    expect(outputValue).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  test("圧縮統計が表示される", async ({ page }) => {
    const input = page.locator("#gz-compress-input");
    await input.fill("Test compression statistics display here");
    await page.locator("button.btn-primary", { hasText: "圧縮する" }).click();

    const stats = page.locator(".gz-stats");
    await expect(stats).toBeVisible();

    // 元サイズ・圧縮後・圧縮率が表示される
    const statsText = await stats.textContent();
    expect(statsText).toContain("元サイズ");
    expect(statsText).toContain("圧縮後");
    expect(statsText).toContain("圧縮率");
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    const input = page.locator("#gz-compress-input");
    await input.fill("Clear this text");
    await page.locator("button.btn-secondary", { hasText: "クリア" }).click();

    await expect(input).toHaveValue("");
  });

  test("解凍タブに切り替えられる", async ({ page }) => {
    const decompressTab = page.locator(".gz-tab-btn", { hasText: "解凍" });
    await decompressTab.click();
    await expect(decompressTab).toHaveClass(/active/);

    const decompressInput = page.locator("#gz-decompress-input");
    await expect(decompressInput).toBeVisible();
  });

  test("圧縮したデータを解凍できる", async ({ page }) => {
    // まず圧縮
    const compressInput = page.locator("#gz-compress-input");
    const originalText = "Round-trip compression test";
    await compressInput.fill(originalText);
    await page.locator("button.btn-primary", { hasText: "圧縮する" }).click();

    // Base64 出力を取得
    const output = page.locator(".gz-textarea-output").first();
    await expect(output).toBeVisible();
    const base64 = await output.inputValue();

    // 解凍タブに切り替え
    await page.locator(".gz-tab-btn", { hasText: "解凍" }).click();

    // Base64 を入力して解凍
    const decompressInput = page.locator("#gz-decompress-input");
    await decompressInput.fill(base64);
    await page.locator("button.btn-primary", { hasText: "解凍する" }).click();

    // 元のテキストが復元される
    const decompressOutput = page.locator(".gz-textarea-output").first();
    await expect(decompressOutput).toBeVisible();
    await expect(decompressOutput).toHaveValue(originalText);
  });

  test("空のテキストを圧縮しようとするとエラーが表示される", async ({ page }) => {
    await page.locator("button.btn-primary", { hasText: "圧縮する" }).click();
    const error = page.locator(".gz-error");
    await expect(error).toBeVisible();
  });

  test("アクセシビリティ: role 属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });

  test("ナビゲーションの変換カテゴリに GZip リンクが表示される", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const gzipLink = dropdown.locator('a[href="/gzip"]');
    await expect(gzipLink).toBeVisible();
  });
});
