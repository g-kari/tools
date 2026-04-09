import { expect, test } from "@playwright/test";
import path from "path";

test.describe("AI背景除去ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/background-removal");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "画像選択" })).toBeVisible();
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/AI背景除去/);
  });

  test("アップロードゾーンが表示される", async ({ page }) => {
    const dropzone = page.locator(".dropzone");
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText("クリックして画像を選択");
  });

  test("ファイルアップロード前は操作ボタンが表示されない", async ({ page }) => {
    await expect(page.getByRole("button", { name: "背景を除去" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "クリア" })).not.toBeVisible();
  });

  test("ファイルアップロード前はプレビューエリアが表示されない", async ({ page }) => {
    await expect(page.locator(".bg-removal-preview-area")).not.toBeVisible();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("AI背景除去とは")).toBeVisible();
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("Tips")).toBeVisible();
  });

  test("アクセシビリティ属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test.describe("画像アップロード後", () => {
    test.beforeEach(async ({ page }) => {
      // 1×1のPNG画像をFile APIで作成してアップロード
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64",
        ),
      });
    });

    test("背景を除去ボタンが表示される", async ({ page }) => {
      await expect(page.getByRole("button", { name: "背景を除去" })).toBeVisible();
    });

    test("クリアボタンが表示される", async ({ page }) => {
      await expect(page.getByRole("button", { name: "クリア" })).toBeVisible();
    });

    test("プレビューエリアが表示される", async ({ page }) => {
      await expect(page.locator(".bg-removal-preview-area")).toBeVisible();
    });

    test("元画像プレビューが表示される", async ({ page }) => {
      const originalPanel = page.locator(".bg-removal-panel").first();
      await expect(originalPanel).toContainText("元画像");
      await expect(originalPanel.locator("img")).toBeVisible();
    });

    test("ファイル名とサイズが表示される", async ({ page }) => {
      await expect(page.locator(".bg-removal-meta")).toContainText("test.png");
    });

    test("クリアボタンで状態がリセットされる", async ({ page }) => {
      await page.getByRole("button", { name: "クリア" }).click();
      await expect(page.getByRole("button", { name: "背景を除去" })).not.toBeVisible();
      await expect(page.locator(".bg-removal-preview-area")).not.toBeVisible();
    });
  });
});
