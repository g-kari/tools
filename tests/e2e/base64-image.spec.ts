import { test, expect } from "@playwright/test";

test.describe("Base64画像デコード - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/base64-image");
    await page.waitForLoadState("networkidle");
  });

  test("ページロード時にundefinedコンテンツが表示されない", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Base64/);
  });

  test("アクセシビリティ属性が適切に設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("テキストエリアが表示されている", async ({ page }) => {
    const textarea = page.locator("#decodeInput");
    await expect(textarea).toBeVisible();
  });

  test("MIMEタイプ選択セレクトが表示されている", async ({ page }) => {
    const select = page.locator("#decodeMimeType");
    await expect(select).toBeVisible();
  });

  test("デコードボタンとクリアボタンが表示されている", async ({ page }) => {
    const decodeBtn = page.locator("button", { hasText: "デコード" });
    const clearBtn = page.locator("button", { hasText: "クリア" });
    await expect(decodeBtn).toBeVisible();
    await expect(clearBtn).toBeVisible();
  });

  test("空入力でデコードするとエラートーストが表示される", async ({ page }) => {
    const decodeBtn = page.locator("button", { hasText: "デコード" });
    await decodeBtn.click();

    const toast = page.locator(".toast").first();
    await expect(toast).toBeVisible({ timeout: 3000 });
  });

  test("無効なBase64入力でエラーが表示される", async ({ page }) => {
    const textarea = page.locator("#decodeInput");
    await textarea.fill("これは無効なBase64!!!@#$");

    const decodeBtn = page.locator("button", { hasText: "デコード" });
    await decodeBtn.click();

    const errorMsg = page.locator('[role="alert"]');
    await expect(errorMsg).toBeVisible({ timeout: 3000 });
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    const textarea = page.locator("#decodeInput");
    await textarea.fill("テスト入力");

    const clearBtn = page.locator("button", { hasText: "クリア" });
    await clearBtn.click();

    await expect(textarea).toHaveValue("");
  });

  test("TipsCardの使い方セクションが表示される", async ({ page }) => {
    const tipsSection = page.locator(".info-box").first();
    await expect(tipsSection).toBeVisible();
    const tipsText = await tipsSection.textContent();
    expect(tipsText).not.toContain("undefined");
  });

  test("変換カテゴリのナビゲーションからアクセスできる", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 変換カテゴリのボタンをホバー
    const convertBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await convertBtn.hover();

    // Base64画像デコードリンクが表示される
    const base64ImageLink = page
      .locator(".nav-dropdown a")
      .filter({ hasText: "Base64画像デコード" });
    await expect(base64ImageLink).toBeVisible({ timeout: 3000 });

    await base64ImageLink.click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/base64-image");
  });

  test("MIMEタイプ選択が変更できる", async ({ page }) => {
    const select = page.locator("#decodeMimeType");
    await select.selectOption("image/jpeg");
    await expect(select).toHaveValue("image/jpeg");

    await select.selectOption("image/gif");
    await expect(select).toHaveValue("image/gif");
  });
});
