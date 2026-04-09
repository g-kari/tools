import { test, expect } from "@playwright/test";

test.describe("リダイレクトトレーサー (/redirect-tracer)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/redirect-tracer");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "リダイレクトトレーサー" }).first(),
    ).toBeVisible();
    await expect(page.getByLabel("URLを入力")).toBeVisible();
    await expect(page.getByRole("button", { name: "トレース" })).toBeVisible();
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/リダイレクトトレーサー/);
  });

  test("空のURLでトレースするとエラーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "トレース" }).click();
    // トースト通知またはステータスアナウンスが表示されることを確認
    await expect(page.getByText("URLを入力してください")).toBeVisible({
      timeout: 3000,
    });
  });

  test("URLが自動フォーカスされている", async ({ page }) => {
    const input = page.getByLabel("URLを入力");
    await expect(input).toBeFocused();
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.getByText("リダイレクトの種類")).toBeVisible();
    await expect(page.getByText("活用シーン")).toBeVisible();
  });

  test("ツールカタログからリダイレクトトレーサーへのリンクが存在する", async ({ page }) => {
    await page.goto("/top");
    const link = page.getByRole("link", { name: "リダイレクトトレーサー" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/redirect-tracer/);
  });
});
