import { expect, test } from "@playwright/test";

test.describe("GitHubバッジジェネレーターページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/github-badge");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /GitHub/ })).toBeVisible();
  });

  test("ラベル入力フィールドが表示される", async ({ page }) => {
    await expect(page.locator("#badge-label")).toBeVisible();
  });

  test("メッセージ入力フィールドが表示される", async ({ page }) => {
    await expect(page.locator("#badge-message")).toBeVisible();
  });

  test("スタイルセレクトが表示される", async ({ page }) => {
    await expect(page.locator("#badge-style")).toBeVisible();
  });

  test("プレビューエリアが表示される", async ({ page }) => {
    await expect(page.locator(".github-badge-preview")).toBeVisible();
  });

  test("プリセットボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "MIT License" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Build Passing" })).toBeVisible();
  });

  test("プリセットを適用するとフィールドが更新される", async ({ page }) => {
    await page.getByRole("button", { name: "MIT License" }).click();
    await expect(page.locator("#badge-label")).toHaveValue("license");
    await expect(page.locator("#badge-message")).toHaveValue("MIT");
  });

  test("出力タブが切り替えられる", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Markdown" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "HTML" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "URL" })).toBeVisible();
  });

  test("Markdownタブにコード出力が表示される", async ({ page }) => {
    await page.locator("#badge-message").fill("passing");
    await page.getByRole("tab", { name: "Markdown" }).click();
    const code = page.locator(".github-badge-output-code");
    await expect(code).toContainText("![");
  });

  test("URLタブに shields.io URL が表示される", async ({ page }) => {
    await page.locator("#badge-message").fill("passing");
    await page.getByRole("tab", { name: "URL" }).click();
    const code = page.locator(".github-badge-output-code");
    await expect(code).toContainText("https://img.shields.io/badge/");
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /コピー/ })).toBeVisible();
  });
});
