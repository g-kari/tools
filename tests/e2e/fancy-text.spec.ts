import { test, expect } from "@playwright/test";

test.describe("ファンシーテキスト変換", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fancy-text");
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/ファンシーテキスト変換/);
  });

  test("デフォルト入力で変換結果が表示される", async ({ page }) => {
    // デフォルト値 "Hello World" で変換結果が表示されること
    const cards = page.locator(".fancy-text-card");
    await expect(cards).toHaveCount(11);
  });

  test("テキスト入力で変換結果が更新される", async ({ page }) => {
    const input = page.locator("#fancy-text-input");
    await input.fill("ABC");

    const firstCard = page.locator(".fancy-text-card").first();
    const output = firstCard.locator(".fancy-text-card-output");
    await expect(output).toContainText("𝐀𝐁𝐂");
  });

  test("コピーボタンが各カードに存在する", async ({ page }) => {
    const copyButtons = page.locator(".fancy-text-copy-btn");
    await expect(copyButtons).toHaveCount(11);
  });

  test("サンプルボタンが動作する", async ({ page }) => {
    const sampleBtn = page.locator(".fancy-text-sample-btn").first();
    await sampleBtn.click();

    const input = page.locator("#fancy-text-input");
    await expect(input).not.toHaveValue("");
  });
});
