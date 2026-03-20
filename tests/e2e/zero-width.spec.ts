import { expect, test } from "@playwright/test";

test.describe("ゼロ幅文字検出・除去ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/zero-width");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /ゼロ幅文字|テキスト入力/i })).toBeVisible();
  });

  test("テキスト入力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#zw-input")).toBeVisible();
  });

  test("サンプルボタンと操作ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "サンプル" })).toBeVisible();
  });

  test("クリアボタンは初期状態で無効になっている", async ({ page }) => {
    const clearBtn = page.getByRole("button", { name: "クリア" });
    await expect(clearBtn).toBeDisabled();
  });

  test("ゼロ幅文字を含まない通常テキストで「クリーン」メッセージが表示される", async ({ page }) => {
    await page.locator("#zw-input").fill("Hello World");
    await expect(page.locator("[data-testid='zw-clean-message']")).toBeVisible();
    await expect(page.locator("[data-testid='zw-clean-message']")).toContainText(
      "ゼロ幅文字・不可視文字は見つかりませんでした"
    );
  });

  test("ゼロ幅文字を含むテキストで検出バッジが表示される", async ({ page }) => {
    // ゼロ幅スペース (U+200B) を含むテキスト
    await page.locator("#zw-input").fill("Hello\u200BWorld");
    await expect(page.locator(".zw-status-badge--found")).toBeVisible();
  });

  test("サンプルボタンでゼロ幅文字入りサンプルが読み込まれる", async ({ page }) => {
    await page.getByRole("button", { name: "サンプル" }).click();
    await expect(page.locator("#zw-input")).not.toHaveValue("");
    // サンプルにはゼロ幅文字が含まれているので検出バッジが表示される
    await expect(page.locator(".zw-status-badge--found")).toBeVisible();
  });

  test("サンプル読み込み後に検出結果テーブルが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "サンプル" }).click();
    await expect(
      page.locator("table[aria-label='検出されたゼロ幅文字の一覧']")
    ).toBeVisible();
  });

  test("サンプル読み込み後にクリーン済みテキストエリアが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "サンプル" }).click();
    await expect(page.locator("#zw-clean-output")).toBeVisible();
  });

  test("「除去して適用」ボタンでゼロ幅文字が除去される", async ({ page }) => {
    await page.getByRole("button", { name: "サンプル" }).click();
    await page.getByRole("button", { name: "除去して適用" }).click();
    // 除去後はクリーンになるのでfoundバッジが消える
    await expect(page.locator(".zw-status-badge--found")).not.toBeVisible();
    await expect(page.locator(".zw-status-badge--clean")).toBeVisible();
  });

  test("クリアボタンで入力がクリアされる", async ({ page }) => {
    await page.locator("#zw-input").fill("Hello World");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#zw-input")).toHaveValue("");
  });

  test("クリアボタンは入力がある場合に有効になる", async ({ page }) => {
    await page.locator("#zw-input").fill("Hello");
    const clearBtn = page.getByRole("button", { name: "クリア" });
    await expect(clearBtn).toBeEnabled();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("ゼロ幅文字・不可視文字とは")).toBeVisible();
    await expect(page.getByText("使い方")).toBeVisible();
  });

  test("テキスト未入力時は検出結果セクションが表示されない", async ({ page }) => {
    await expect(page.locator("#zw-clean-output")).not.toBeVisible();
    await expect(
      page.locator("table[aria-label='検出されたゼロ幅文字の一覧']")
    ).not.toBeVisible();
  });
});
