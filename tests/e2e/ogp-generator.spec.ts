import { expect, test } from "@playwright/test";

test.describe("OGPメタタグジェネレーターページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ogp-generator");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /基本情報/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Twitter Card/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /生成されたメタタグ/ })).toBeVisible();
  });

  test("入力フィールドが表示される", async ({ page }) => {
    await expect(page.locator("#ogp-title")).toBeVisible();
    await expect(page.locator("#ogp-description")).toBeVisible();
    await expect(page.locator("#ogp-url")).toBeVisible();
    await expect(page.locator("#ogp-image")).toBeVisible();
    await expect(page.locator("#ogp-type")).toBeVisible();
    await expect(page.locator("#ogp-locale")).toBeVisible();
    await expect(page.locator("#ogp-site-name")).toBeVisible();
  });

  test("出力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#ogp-output")).toBeVisible();
  });

  test("初期状態では出力エリアにプレースホルダーが表示される", async ({
    page,
  }) => {
    const output = await page.locator("#ogp-output").textContent();
    expect(output).toContain("OGP メタタグが生成されます");
  });

  test("タイトルを入力すると og:title タグが生成される", async ({ page }) => {
    await page.locator("#ogp-title").fill("テストページ");
    const output = await page.locator("#ogp-output").textContent();
    expect(output).toContain("og:title");
    expect(output).toContain("テストページ");
  });

  test("URL を入力すると og:url タグが生成される", async ({ page }) => {
    await page.locator("#ogp-url").fill("https://example.com");
    const output = await page.locator("#ogp-output").textContent();
    expect(output).toContain("og:url");
    expect(output).toContain("https://example.com");
  });

  test("説明文を入力すると og:description タグが生成される", async ({
    page,
  }) => {
    await page.locator("#ogp-description").fill("テストの説明です");
    const output = await page.locator("#ogp-output").textContent();
    expect(output).toContain("og:description");
    expect(output).toContain("テストの説明です");
  });

  test("デフォルトで og:type が website になる", async ({ page }) => {
    await page.locator("#ogp-title").fill("Test");
    const output = await page.locator("#ogp-output").textContent();
    expect(output).toContain("og:type");
    expect(output).toContain("website");
  });

  test("og:type を article に変更できる", async ({ page }) => {
    await page.locator("#ogp-type").selectOption("article");
    await page.locator("#ogp-title").fill("Test");
    const output = await page.locator("#ogp-output").textContent();
    expect(output).toContain('content="article"');
  });

  test("デフォルトで og:locale が ja_JP になる", async ({ page }) => {
    await page.locator("#ogp-title").fill("Test");
    const output = await page.locator("#ogp-output").textContent();
    expect(output).toContain("og:locale");
    expect(output).toContain("ja_JP");
  });

  test("Twitter Card が有効なとき twitter:card タグが生成される", async ({
    page,
  }) => {
    await page.locator("#ogp-title").fill("Test");
    const output = await page.locator("#ogp-output").textContent();
    expect(output).toContain("twitter:card");
  });

  test("Twitter Card を無効化すると twitter タグが生成されない", async ({
    page,
  }) => {
    await page.locator("#ogp-twitter-enable").uncheck();
    await page.locator("#ogp-title").fill("Test");
    const output = await page.locator("#ogp-output").textContent();
    expect(output).not.toContain("twitter:");
  });

  test("Twitter Card を無効化すると Twitter フィールドが非表示になる", async ({
    page,
  }) => {
    await page.locator("#ogp-twitter-enable").uncheck();
    await expect(page.locator("#ogp-twitter-card")).not.toBeVisible();
    await expect(page.locator("#ogp-twitter-site")).not.toBeVisible();
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /コピー/ })).toBeVisible();
  });

  test("クリアボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /クリア/ })).toBeVisible();
  });

  test("入力が空の場合コピーボタンが無効", async ({ page }) => {
    await expect(page.getByRole("button", { name: /コピー/ })).toBeDisabled();
  });

  test("入力後にクリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#ogp-title").fill("テスト");
    await page.getByRole("button", { name: /クリア/ }).click();
    await expect(page.locator("#ogp-title")).toHaveValue("");
    const output = await page.locator("#ogp-output").textContent();
    expect(output).toContain("OGP メタタグが生成されます");
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });
});
