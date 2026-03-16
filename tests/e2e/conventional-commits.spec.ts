import { test, expect } from "@playwright/test";

test.describe("Conventional Commits バリデーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/conventional-commits");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Conventional Commits バリデーター/);
  });

  test("入力前は空状態が表示される", async ({ page }) => {
    await expect(
      page.getByText("コミットメッセージを入力してください")
    ).toBeVisible();
  });

  test("有効なコミットメッセージを入力すると ✓ 有効 が表示される", async ({
    page,
  }) => {
    await page
      .getByLabel("コミットメッセージ入力")
      .fill("feat: add new feature");
    await expect(page.getByText("✓ 有効")).toBeVisible();
  });

  test("type が正しくパースされて表示される", async ({ page }) => {
    await page
      .getByLabel("コミットメッセージ入力")
      .fill("fix(api): handle error");
    await expect(page.getByText("✓ 有効")).toBeVisible();
    await expect(page.getByText("fix")).toBeVisible();
    await expect(page.getByText("api")).toBeVisible();
  });

  test("BREAKING CHANGE マークが検出される", async ({ page }) => {
    await page
      .getByLabel("コミットメッセージ入力")
      .fill("feat!: remove endpoint");
    await expect(page.getByText(/BREAKING CHANGE/)).toBeVisible();
  });

  test("無効なメッセージは ✕ 無効 が表示される", async ({ page }) => {
    await page.getByLabel("コミットメッセージ入力").fill("invalid message");
    await expect(page.getByText("✕ 無効")).toBeVisible();
  });

  test("サンプル例ボタンでメッセージが挿入される", async ({ page }) => {
    await page.getByRole("button", { name: /新機能.*サンプル/ }).click();
    const textarea = page.getByLabel("コミットメッセージ入力");
    await expect(textarea).not.toBeEmpty();
  });

  test("クリアボタンで入力が消える", async ({ page }) => {
    const textarea = page.getByLabel("コミットメッセージ入力");
    await textarea.fill("feat: add something");
    await page.getByRole("button", { name: "入力をクリア" }).click();
    await expect(textarea).toBeEmpty();
    await expect(
      page.getByText("コミットメッセージを入力してください")
    ).toBeVisible();
  });

  test("警告が表示される（大文字始まりの説明）", async ({ page }) => {
    await page
      .getByLabel("コミットメッセージ入力")
      .fill("feat: Add new feature");
    await expect(page.getByText("⚠ 警告")).toBeVisible();
  });

  test("コミットタイプリファレンスが表示される", async ({ page }) => {
    await expect(
      page.getByText("コミットタイプ リファレンス")
    ).toBeVisible();
    await expect(page.getByText("feat")).toBeVisible();
    await expect(page.getByText("fix")).toBeVisible();
    await expect(page.getByText("docs")).toBeVisible();
  });
});
