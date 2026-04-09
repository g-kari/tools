import { expect, test } from "@playwright/test";

test.describe("可読性スコア分析ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/readability");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /可読性スコア分析/ })).toBeVisible();
  });

  test("入力エリアが表示される", async ({ page }) => {
    await expect(page.locator("textarea")).toBeVisible();
  });

  test("初期状態では空状態メッセージが表示される", async ({ page }) => {
    await expect(page.getByText("テキストを入力すると可読性スコアが表示されます")).toBeVisible();
  });

  test("英語テキストを入力すると Flesch Reading Ease が表示される", async ({ page }) => {
    await page
      .locator("textarea")
      .fill(
        "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.",
      );
    await expect(page.getByText("Flesch Reading Ease")).toBeVisible();
    await expect(page.locator('[data-testid="flesch-score"]')).toBeVisible();
  });

  test("英語テキストで Flesch-Kincaid Grade が表示される", async ({ page }) => {
    await page
      .locator("textarea")
      .fill(
        "The quick brown fox jumps over the lazy dog. This is a simple sentence for testing purposes.",
      );
    await expect(page.getByText("Flesch-Kincaid Grade")).toBeVisible();
    await expect(page.locator('[data-testid="fk-grade"]')).toBeVisible();
  });

  test("英語テキストで Gunning Fog が表示される", async ({ page }) => {
    await page
      .locator("textarea")
      .fill(
        "The quick brown fox jumps over the lazy dog. Communication and collaboration are essential skills.",
      );
    await expect(page.getByText("Gunning Fog Index")).toBeVisible();
    await expect(page.locator('[data-testid="gunning-fog"]')).toBeVisible();
  });

  test("英語テキストで言語バッジが English を表示", async ({ page }) => {
    await page
      .locator("textarea")
      .fill("Hello world. This is a test sentence for the readability tool.");
    await expect(page.locator('[data-testid="language-badge"]')).toContainText("English");
  });

  test("日本語テキストを入力すると難易度スコアが表示される", async ({ page }) => {
    await page
      .locator("textarea")
      .fill("本日は晴天なり。日本語のテキスト解析を行うツールです。漢字の密度を計算します。");
    await expect(page.getByText("日本語難易度スコア")).toBeVisible();
    await expect(page.locator('[data-testid="jp-difficulty-score"]')).toBeVisible();
  });

  test("日本語テキストで言語バッジが日本語を表示", async ({ page }) => {
    await page
      .locator("textarea")
      .fill("これはテストです。日本語のテキストを解析します。漢字密度を測定します。");
    await expect(page.locator('[data-testid="language-badge"]')).toContainText("日本語");
  });

  test("日本語テキストで漢字密度が表示される", async ({ page }) => {
    await page.locator("textarea").fill("本日は晴天なり。日本語テキスト解析ツールです。");
    await expect(page.getByText("文字種密度")).toBeVisible();
    await expect(page.locator('[data-testid="kanji-density"]')).toBeVisible();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("textarea").fill("Hello world. This is a test.");
    await page.getByRole("button", { name: /クリア/ }).click();
    await expect(page.locator("textarea")).toHaveValue("");
  });

  test("クリアボタンは入力なしのとき無効", async ({ page }) => {
    await expect(page.getByRole("button", { name: /クリア/ })).toBeDisabled();
  });

  test("入力があるとクリアボタンが有効になる", async ({ page }) => {
    await page.locator("textarea").fill("test");
    await expect(page.getByRole("button", { name: /クリア/ })).toBeEnabled();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("可読性スコアとは")).toBeVisible();
    await expect(page.getByText("Flesch Reading Ease の目安")).toBeVisible();
    await expect(page.getByText("活用例")).toBeVisible();
  });
});
