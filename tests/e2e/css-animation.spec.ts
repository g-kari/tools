import { test, expect } from "@playwright/test";

test.describe("CSSアニメーション生成ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-animation");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("アニメーション種類ボタンが表示される", async ({ page }) => {
    const fadeButton = page.getByRole("button", { name: /フェードアニメーション/ });
    await expect(fadeButton).toBeVisible();
  });

  test("生成CSSコードが表示される", async ({ page }) => {
    const codeBlock = page.locator(".ca-code-block");
    await expect(codeBlock).toBeVisible();
    await expect(codeBlock).toContainText("@keyframes");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    const copyButton = page.getByRole("button", { name: /コピー/ });
    await expect(copyButton).toBeVisible();
  });

  test("再生ボタンが存在する", async ({ page }) => {
    const playButton = page.getByRole("button", { name: /再生/ });
    await expect(playButton).toBeVisible();
  });

  test("プレビューエリアが存在する", async ({ page }) => {
    const previewArea = page.locator(".ca-preview-area");
    await expect(previewArea).toBeVisible();
  });

  test("別のアニメーション種類を選択できる", async ({ page }) => {
    const bounceButton = page.getByRole("button", {
      name: /バウンスアニメーション/,
    });
    await bounceButton.click();
    await expect(bounceButton).toHaveAttribute("aria-pressed", "true");
  });

  test("durationスライダーが存在する", async ({ page }) => {
    const rangeInput = page.locator('input[type="range"]').first();
    await expect(rangeInput).toBeVisible();
  });
});
