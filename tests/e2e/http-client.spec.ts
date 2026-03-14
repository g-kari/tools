import { test, expect } from "@playwright/test";

test.describe("HTTP APIテスター - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/http-client");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルにHTTP APIテスターが含まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/HTTP APIテスター/);
  });

  test("ページ本文にundefinedが含まれない", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("URLの入力フィールドが存在する", async ({ page }) => {
    const urlInput = page.locator("#httpUrl");
    await expect(urlInput).toBeVisible();
  });

  test("メソッド選択セレクトボックスが存在する", async ({ page }) => {
    const methodSelect = page.locator("#httpMethod");
    await expect(methodSelect).toBeVisible();
  });

  test("全HTTPメソッドが選択できる", async ({ page }) => {
    const methodSelect = page.locator("#httpMethod");
    const options = await methodSelect.locator("option").allTextContents();
    expect(options).toContain("GET");
    expect(options).toContain("POST");
    expect(options).toContain("PUT");
    expect(options).toContain("PATCH");
    expect(options).toContain("DELETE");
    expect(options).toContain("HEAD");
    expect(options).toContain("OPTIONS");
  });

  test("送信ボタンが存在する", async ({ page }) => {
    const sendButtons = page.locator("button.btn-primary");
    const firstButton = sendButtons.first();
    await expect(firstButton).toBeVisible();
  });

  test("ヘッダー追加ボタンが存在する", async ({ page }) => {
    const addButton = page.locator("button", { hasText: "+ 追加" });
    await expect(addButton).toBeVisible();
  });

  test("ヘッダーの追加ボタンをクリックするとヘッダー行が増える", async ({
    page,
  }) => {
    const addButton = page.locator("button", { hasText: "+ 追加" });
    const initialRows = await page
      .locator(".http-client-header-row")
      .count();

    await addButton.click();

    const newRows = await page.locator(".http-client-header-row").count();
    expect(newRows).toBe(initialRows + 1);
  });

  test("URLを入力せずに送信するとエラーメッセージが表示される", async ({
    page,
  }) => {
    const urlInput = page.locator("#httpUrl");
    await urlInput.fill("");

    const sendButton = page.locator("button.btn-primary").first();
    await sendButton.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("URL");
  });

  test("GETメソッドではリクエストボディ入力が表示されない", async ({
    page,
  }) => {
    const methodSelect = page.locator("#httpMethod");
    await methodSelect.selectOption("GET");

    const bodyTextarea = page.locator("#httpBody");
    await expect(bodyTextarea).not.toBeVisible();
  });

  test("POSTメソッドではリクエストボディ入力が表示される", async ({
    page,
  }) => {
    const methodSelect = page.locator("#httpMethod");
    await methodSelect.selectOption("POST");

    const bodyTextarea = page.locator("#httpBody");
    await expect(bodyTextarea).toBeVisible();
  });

  test("HEADメソッドではリクエストボディ入力が表示されない", async ({
    page,
  }) => {
    const methodSelect = page.locator("#httpMethod");
    await methodSelect.selectOption("HEAD");

    const bodyTextarea = page.locator("#httpBody");
    await expect(bodyTextarea).not.toBeVisible();
  });

  test("GETリクエストを送信してレスポンスが表示される", async ({ page }) => {
    const methodSelect = page.locator("#httpMethod");
    const urlInput = page.locator("#httpUrl");
    const sendButton = page.locator("button.btn-primary").first();

    await methodSelect.selectOption("GET");
    await urlInput.fill("https://httpbin.org/get");
    await sendButton.click();

    // レスポンスの表示を待機（最大20秒）
    const responseSection = page.locator("#response-title");
    await expect(responseSection).toBeVisible({ timeout: 20000 });
    await expect(responseSection).toContainText("レスポンス");
  });

  test("httpbin.orgへのGETリクエストで200ステータスが返る", async ({
    page,
  }) => {
    const urlInput = page.locator("#httpUrl");
    const sendButton = page.locator("button.btn-primary").first();

    await urlInput.fill("https://httpbin.org/status/200");
    await sendButton.click();

    const statusBadge = page.locator(".http-client-status-badge");
    await expect(statusBadge).toBeVisible({ timeout: 20000 });
    await expect(statusBadge).toContainText("200");
  });

  test("レスポンスのボディタブとヘッダータブが切り替えられる", async ({
    page,
  }) => {
    const urlInput = page.locator("#httpUrl");
    const sendButton = page.locator("button.btn-primary").first();

    await urlInput.fill("https://httpbin.org/get");
    await sendButton.click();

    // レスポンス待機
    await expect(page.locator(".http-client-tabs")).toBeVisible({
      timeout: 20000,
    });

    // ヘッダータブをクリック
    const headersTab = page.locator(".http-client-tab", {
      hasText: "ヘッダー",
    });
    await headersTab.click();

    const headersPanel = page.locator("#response-headers-panel");
    await expect(headersPanel).not.toHaveAttribute("hidden");
  });

  test("アクセシビリティ: role=mainが存在する", async ({ page }) => {
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("アクセシビリティ: role=bannerが存在する", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
  });

  test("アクセシビリティ: スキップリンクが存在する", async ({ page }) => {
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("使い方のTipsCardが表示される", async ({ page }) => {
    const infoBox = page.locator(".info-box").first();
    await expect(infoBox).toBeVisible();
    const allInfoBoxes = page.locator(".info-box");
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(" ");
    expect(combinedText).toContain("使い方");
  });

  test("ナビゲーションのネットワークカテゴリにHTTP APIテスターが存在する", async ({
    page,
  }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", {
      hasText: "ネットワーク",
    });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const httpClientLink = dropdown.locator('a[href="/http-client"]');
    await expect(httpClientLink).toBeVisible();
    await expect(httpClientLink).toContainText("HTTP APIテスター");
  });

  test("ネットワークカテゴリからHTTP APIテスターに遷移できる", async ({
    page,
  }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", {
      hasText: "ネットワーク",
    });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const httpClientLink = dropdown.locator('a[href="/http-client"]');
    await httpClientLink.click();
    await expect(page).toHaveURL("/http-client");
  });
});
