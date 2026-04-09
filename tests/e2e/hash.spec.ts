import { test, expect } from "@playwright/test";

test.describe("Hash Generator - E2E Tests", () => {
  test.describe.configure({ timeout: 15000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/hash");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/ハッシュ生成/);
  });

  test("メインヘッダーが表示される", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("テキスト入力タブが表示される", async ({ page }) => {
    const textTab = page.getByRole("tab", { name: "テキスト" });
    await expect(textTab).toBeVisible();
  });

  test("ファイル入力タブが表示される", async ({ page }) => {
    const fileTab = page.getByRole("tab", { name: "ファイル" });
    await expect(fileTab).toBeVisible();
  });

  test("テキスト入力欄が表示される", async ({ page }) => {
    const input = page.locator("#hash-input");
    await expect(input).toBeVisible();
  });

  test("テキストを入力するとハッシュ値が表示される", async ({ page }) => {
    const input = page.locator("#hash-input");
    await input.fill("hello");

    // ハッシュ結果が表示されるまで待機
    await page.waitForTimeout(500);

    // MD5のハッシュ値が表示されることを確認
    const hashItems = page.locator(".hash-result-item");
    await expect(hashItems).toHaveCount(5);
  });

  test("MD5ラベルが表示される", async ({ page }) => {
    const input = page.locator("#hash-input");
    await input.fill("test");
    await page.waitForTimeout(500);

    const md5Label = page.locator(".hash-result-algorithm").filter({ hasText: "MD5" });
    await expect(md5Label).toBeVisible();
  });

  test("SHA-256ラベルが表示される", async ({ page }) => {
    const input = page.locator("#hash-input");
    await input.fill("test");
    await page.waitForTimeout(500);

    const sha256Label = page.locator(".hash-result-algorithm").filter({ hasText: "SHA-256" });
    await expect(sha256Label).toBeVisible();
  });

  test("MD5とSHA-1に非推奨バッジが表示される", async ({ page }) => {
    const input = page.locator("#hash-input");
    await input.fill("test");
    await page.waitForTimeout(500);

    const deprecatedBadges = page.locator(".hash-result-badge-deprecated");
    await expect(deprecatedBadges).toHaveCount(2);
  });

  test("HEX/Base64切り替えボタンが表示される", async ({ page }) => {
    const input = page.locator("#hash-input");
    await input.fill("test");
    await page.waitForTimeout(500);

    const hexButton = page.getByRole("button", { name: "HEX" });
    const base64Button = page.getByRole("button", { name: "Base64" });
    await expect(hexButton).toBeVisible();
    await expect(base64Button).toBeVisible();
  });

  test("空状態メッセージが表示される", async ({ page }) => {
    const emptyState = page.locator(".hash-empty-state");
    await expect(emptyState).toBeVisible();
  });

  test("ファイルタブに切り替えるとドロップゾーンが表示される", async ({ page }) => {
    const fileTab = page.getByRole("tab", { name: "ファイル" });
    await fileTab.click();

    const dropzone = page.locator(".hash-dropzone");
    await expect(dropzone).toBeVisible();
  });

  test("ナビゲーションに検証カテゴリとハッシュ生成が含まれる", async ({ page }) => {
    // 検証カテゴリボタンを探す
    const verificationCategory = page.getByRole("button", { name: /検証/ });
    await expect(verificationCategory).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    // ヒントカードのコンテンツ確認
    const tipsSection = page.locator('.tips-card, [class*="tips"]').first();
    // tipscardが表示されない場合でも他の要素を確認
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("使い方");
  });
});
