import { test, expect } from "@playwright/test";

test.describe("シャノンエントロピー計算機", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/entropy");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/シャノンエントロピー計算機/);
  });

  test("テキストエリアが存在しフォーカスできる", async ({ page }) => {
    const textarea = page.locator("#entropy-input");
    await expect(textarea).toBeVisible();
    await textarea.focus();
    await expect(textarea).toBeFocused();
  });

  test("テキストを入力すると結果が表示される", async ({ page }) => {
    await page.locator("#entropy-input").fill("abab");
    await expect(page.getByText("bits/文字")).toBeVisible();
  });

  test("同じ文字ばかりのテキストはエントロピー 0 になる", async ({ page }) => {
    await page.locator("#entropy-input").fill("aaaa");
    const value = page.locator(".entropy-stat-value").first();
    await expect(value).toHaveText("0.0000");
  });

  test("サンプルボタンが存在する", async ({ page }) => {
    await expect(page.getByRole("button", { name: /サンプル/ })).toHaveCount(0);
    await expect(page.locator(".entropy-sample-btn").first()).toBeVisible();
  });

  test("サンプルボタンをクリックするとテキストエリアに値が入る", async ({
    page,
  }) => {
    await page.locator(".entropy-sample-btn").first().click();
    const textarea = page.locator("#entropy-input");
    await expect(textarea).not.toHaveValue("");
  });

  test("文字頻度テーブルが表示される", async ({ page }) => {
    await page.locator("#entropy-input").fill("hello world");
    const table = page.locator(".entropy-table");
    await expect(table).toBeVisible();
  });

  test("エントロピーレベルゲージが表示される", async ({ page }) => {
    await page.locator("#entropy-input").fill("the quick brown fox");
    const gauge = page.locator(".entropy-gauge");
    await expect(gauge).toBeVisible();
  });

  test("結果をコピーボタンが存在する", async ({ page }) => {
    await page.locator("#entropy-input").fill("test");
    const copyBtn = page.locator(".entropy-copy-btn");
    await expect(copyBtn).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText("シャノンエントロピーとは")).toBeVisible();
  });
});
