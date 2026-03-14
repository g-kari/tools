import { test, expect } from "@playwright/test";

test.describe("スラッグジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/slug");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/スラッグ生成ツール/);
  });

  test("入力欄が表示される", async ({ page }) => {
    await expect(page.locator("#slug-input")).toBeVisible();
  });

  test("空状態メッセージが表示される", async ({ page }) => {
    await expect(page.locator(".slug-empty-state")).toBeVisible();
  });

  test("テキストを入力するとスラッグが生成される", async ({ page }) => {
    await page.locator("#slug-input").fill("Hello World");
    await expect(page.locator(".slug-result-wrapper")).toBeVisible();
    await expect(page.locator(".slug-result-code")).toHaveText("hello-world");
  });

  test("入力をクリアすると空状態に戻る", async ({ page }) => {
    await page.locator("#slug-input").fill("Hello World");
    await expect(page.locator(".slug-result-wrapper")).toBeVisible();
    await page.locator("#slug-input").fill("");
    await expect(page.locator(".slug-empty-state")).toBeVisible();
  });

  test("アクセント文字が変換される", async ({ page }) => {
    await page.locator("#slug-input").fill("café");
    await expect(page.locator(".slug-result-code")).toHaveText("cafe");
  });

  test("日本語が除去される", async ({ page }) => {
    await page.locator("#slug-input").fill("こんにちは World");
    await expect(page.locator(".slug-result-code")).toHaveText("world");
  });

  test("アンダースコア区切りが選択できる", async ({ page }) => {
    await page.locator("#slug-input").fill("Hello World");
    await page.locator('input[name="separator"][value="underscore"]').check();
    await expect(page.locator(".slug-result-code")).toHaveText("hello_world");
  });

  test("大文字小文字を維持できる", async ({ page }) => {
    await page.locator("#slug-input").fill("Hello World");
    await page.locator('input[name="lowercase"][value="false"]').check();
    await expect(page.locator(".slug-result-code")).toHaveText("Hello-World");
  });

  test("最大文字数を設定できる", async ({ page }) => {
    await page.locator("#slug-input").fill("hello world foo bar");
    await page.locator("#slug-maxlength").fill("10");
    const text = await page.locator(".slug-result-code").textContent();
    expect((text ?? "").length).toBeLessThanOrEqual(10);
  });

  test("有効バッジが表示される", async ({ page }) => {
    await page.locator("#slug-input").fill("Hello World");
    await expect(page.locator(".slug-validity-badge.valid")).toBeVisible();
  });

  test("文字数カウントが表示される", async ({ page }) => {
    await page.locator("#slug-input").fill("Hello World");
    await expect(page.locator(".slug-char-count")).toBeVisible();
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await page.locator("#slug-input").fill("Hello World");
    await expect(page.locator(".slug-copy-btn")).toBeVisible();
  });

  test("ラベルと入力欄が関連付けられている", async ({ page }) => {
    const textarea = page.locator("#slug-input");
    await expect(textarea).toBeVisible();
    const label = page.locator('label[for="slug-input"]');
    await expect(label).toBeVisible();
  });

  test("結果エリアにaria-live属性がある", async ({ page }) => {
    await page.locator("#slug-input").fill("Hello World");
    const resultWrapper = page.locator(".slug-result-wrapper");
    await expect(resultWrapper).toHaveAttribute("aria-live", "polite");
  });
});
