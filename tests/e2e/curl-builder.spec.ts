import { test, expect } from "@playwright/test";

test.describe("curlコマンドビルダー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/curl-builder");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page.locator("h1.tool-title")).toContainText(
      "curlコマンドビルダー"
    );
  });

  test("ページの説明が表示される", async ({ page }) => {
    await expect(page.locator("p.tool-description")).toBeVisible();
  });

  test("URL入力フィールドが存在する", async ({ page }) => {
    const urlInput = page.locator(".cb-url-input");
    await expect(urlInput).toBeVisible();
  });

  test("HTTPメソッド選択が存在する", async ({ page }) => {
    const methodSelect = page.locator(".cb-method-select");
    await expect(methodSelect).toBeVisible();
  });

  test("URLを入力するとcurlコマンドが生成される", async ({ page }) => {
    const urlInput = page.locator(".cb-url-input");
    await urlInput.fill("https://api.example.com/test");
    const output = page.locator(".cb-output-area");
    await expect(output).toContainText("curl");
    await expect(output).toContainText("https://api.example.com/test");
  });

  test("POSTメソッドに変更すると-X POSTが含まれる", async ({ page }) => {
    const urlInput = page.locator(".cb-url-input");
    await urlInput.fill("https://api.example.com/users");
    const methodSelect = page.locator(".cb-method-select");
    await methodSelect.selectOption("POST");
    const output = page.locator(".cb-output-area");
    await expect(output).toContainText("-X POST");
  });

  test("ヘッダーを追加できる", async ({ page }) => {
    const urlInput = page.locator(".cb-url-input");
    await urlInput.fill("https://api.example.com/test");
    const addHeaderBtn = page.locator(".cb-add-header-btn");
    await addHeaderBtn.click();
    const headerKeyInput = page.locator(".cb-header-key").first();
    await expect(headerKeyInput).toBeVisible();
  });

  test("コピーボタンが存在する", async ({ page }) => {
    const copyBtn = page.locator("button", { hasText: "コピー" });
    await expect(copyBtn).toBeVisible();
  });

  test("URLなしの場合コピーボタンが無効になる", async ({ page }) => {
    const copyBtn = page.locator("button", { hasText: "コピー" });
    await expect(copyBtn).toBeDisabled();
  });

  test("URLを入力するとコピーボタンが有効になる", async ({ page }) => {
    const urlInput = page.locator(".cb-url-input");
    await urlInput.fill("https://api.example.com/test");
    const copyBtn = page.locator("button", { hasText: "コピー" });
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンが機能する", async ({ page }) => {
    const urlInput = page.locator(".cb-url-input");
    await urlInput.fill("https://api.example.com/test");
    const clearBtn = page.locator("button", { hasText: "クリア" });
    await clearBtn.click();
    await expect(urlInput).toHaveValue("");
  });

  test("ボディタイプ選択ボタンが存在する", async ({ page }) => {
    await expect(page.locator(".cb-body-type-group")).toBeVisible();
  });

  test("JSONボディタイプを選択するとテキストエリアが表示される", async ({
    page,
  }) => {
    const jsonBtn = page.locator(".cb-body-type-btn", { hasText: "JSON" });
    await jsonBtn.click();
    const textarea = page.locator(".cb-body-textarea");
    await expect(textarea).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tips = page.locator(".tips-card, [class*='tips']");
    await expect(tips.first()).toBeVisible();
  });
});
