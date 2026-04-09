import { test, expect } from "@playwright/test";

test.describe("UUID インスペクター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/uuid-inspector");
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/UUID インスペクター/);
    await expect(page.getByLabel("UUID 入力")).toBeVisible();
  });

  test("サンプルボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /v4.*サンプルをセット/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /v1.*サンプルをセット/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /v7.*サンプルをセット/ })).toBeVisible();
  });

  test("v4 サンプルをセットして解析できる", async ({ page }) => {
    await page.getByRole("button", { name: /v4.*サンプルをセット/ }).click();
    await expect(page.getByText(/v4/)).toBeVisible();
    await expect(page.getByText("バージョン")).toBeVisible();
  });

  test("v1 サンプルにタイムスタンプが表示される", async ({ page }) => {
    await page.getByRole("button", { name: /v1.*サンプルをセット/ }).click();
    await expect(page.getByText("タイムスタンプ")).toBeVisible();
    await expect(page.getByText("MAC アドレス")).toBeVisible();
  });

  test("v7 サンプルに Unix ms が表示される", async ({ page }) => {
    await page.getByRole("button", { name: /v7.*サンプルをセット/ }).click();
    await expect(page.getByText("Unix ms")).toBeVisible();
  });

  test("NIL UUID サンプルに NIL バッジが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /NIL.*サンプルをセット/ })).toBeVisible();
    await page.getByRole("button", { name: /NIL.*サンプルをセット/ }).click();
    await expect(page.getByText("NIL UUID")).toBeVisible();
  });

  test("不正な UUID にエラーが表示される", async ({ page }) => {
    await page.getByLabel("UUID 入力").fill("not-a-valid-uuid");
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("クリアボタンで入力がクリアされる", async ({ page }) => {
    const input = page.getByLabel("UUID 入力");
    await input.fill("550e8400-e29b-41d4-a716-446655440000");
    await page.getByRole("button", { name: "入力をクリア" }).click();
    await expect(input).toHaveValue("");
  });

  test("フィールド分解セクションが表示される", async ({ page }) => {
    await page.getByRole("button", { name: /v4.*サンプルをセット/ }).click();
    await expect(page.getByText("フィールド分解")).toBeVisible();
  });

  test("バイナリ表示セクションが表示される", async ({ page }) => {
    await page.getByRole("button", { name: /v4.*サンプルをセット/ }).click();
    await expect(page.getByText("バイナリ (128 ビット)")).toBeVisible();
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.getByText("UUID バージョンについて")).toBeVisible();
  });
});
