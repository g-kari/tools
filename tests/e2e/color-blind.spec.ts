import { test, expect } from "@playwright/test";

test.describe("色覚シミュレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-blind");
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/色覚シミュレーター/);
  });

  test("画像アップロードゾーンが表示される", async ({ page }) => {
    await expect(
      page.getByRole("button", {
        name: /色覚シミュレーション用の画像をアップロード/,
      })
    ).toBeVisible();
  });

  test("アップロード前はシミュレーション結果が表示されない", async ({
    page,
  }) => {
    await expect(
      page.getByText("色覚シミュレーション")
    ).not.toBeVisible();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(
      page.getByText("色覚シミュレーターとは")
    ).toBeVisible();
  });

  test("色覚異常の種類の説明が表示される", async ({ page }) => {
    await expect(page.getByText("色覚異常の種類")).toBeVisible();
  });

  test("アクセシビリティ改善ヒントが表示される", async ({ page }) => {
    await expect(
      page.getByText("アクセシビリティ改善のヒント")
    ).toBeVisible();
  });

  test("ページにメタデータが設定されている", async ({ page }) => {
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute(
      "content",
      /色覚異常シミュレーター/
    );
  });
});
