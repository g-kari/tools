import { test, expect } from "@playwright/test";

test.describe("テキスト統計・分析ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/text-stats");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/テキスト統計・分析/);
    await expect(page.getByRole("heading", { name: "テキスト入力" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "基本統計" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "詳細分析" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "頻出単語" })).toBeVisible();
  });

  test("テキストエリアが表示される", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await expect(textarea).toBeVisible();
  });

  test("初期状態では統計が0表示", async ({ page }) => {
    await expect(page.getByTestId("char-count")).toHaveText("0");
    await expect(page.getByTestId("word-count")).toHaveText("0");
    await expect(page.getByTestId("sentence-count")).toHaveText("0");
    await expect(page.getByTestId("paragraph-count")).toHaveText("0");
    await expect(page.getByTestId("line-count")).toHaveText("0");
  });

  test("初期状態では空の頻出単語メッセージが表示される", async ({ page }) => {
    await expect(page.getByTestId("top-words-empty")).toBeVisible();
  });

  test("テキスト入力でリアルタイムに統計が更新される", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.fill("Hello world");

    await expect(page.getByTestId("char-count")).toHaveText("11");
    await expect(page.getByTestId("word-count")).toHaveText("2");
  });

  test("文字数（スペース除く）が正しく表示される", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.fill("hello world");

    await expect(page.getByTestId("char-count-no-spaces")).toHaveText("10");
  });

  test("文章数が正しく表示される", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.fill("Hello world. How are you?");

    await expect(page.getByTestId("sentence-count")).toHaveText("2");
  });

  test("段落数が正しく表示される", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.fill("Paragraph one.\n\nParagraph two.");

    await expect(page.getByTestId("paragraph-count")).toHaveText("2");
  });

  test("行数が正しく表示される", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.fill("line1\nline2\nline3");

    await expect(page.getByTestId("line-count")).toHaveText("3");
  });

  test("読書時間が表示される", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    // 200単語 = 60秒 = 1分
    const words = Array(200).fill("word").join(" ");
    await textarea.fill(words);

    await expect(page.getByTestId("reading-time")).toHaveText("1分");
  });

  test("ユニーク単語数が正しく表示される", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.fill("apple banana apple cherry");

    await expect(page.getByTestId("unique-word-count")).toHaveText("3");
  });

  test("頻出単語リストが表示される", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.fill("apple banana apple cherry apple");

    await expect(page.getByTestId("top-words-list")).toBeVisible();
    await expect(page.getByTestId("top-words-empty")).not.toBeVisible();
  });

  test("クリアボタンが機能する", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.fill("Hello world");

    const clearButton = page.getByRole("button", { name: "クリア" });
    await clearButton.click();

    await expect(textarea).toHaveValue("");
    await expect(page.getByTestId("char-count")).toHaveText("0");
  });

  test("クリアボタンは空テキスト時に無効", async ({ page }) => {
    const clearButton = page.getByRole("button", { name: "クリア" });
    await expect(clearButton).toBeDisabled();
  });

  test("クリアボタンはテキスト入力後に有効になる", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.fill("test");

    const clearButton = page.getByRole("button", { name: "クリア" });
    await expect(clearButton).toBeEnabled();
  });

  test("ナビゲーションにテキスト統計が表示される", async ({ page }) => {
    await expect(page.getByRole("link", { name: "テキスト統計" })).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText("テキスト統計・分析とは")).toBeVisible();
    await expect(page.getByText("使い方")).toBeVisible();
  });

  test("日本語テキストを正しく分析する", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.fill("こんにちは世界。テストです。");

    const charCount = page.getByTestId("char-count");
    await expect(charCount).not.toHaveText("0");
  });

  test("キーボードでテキストを入力できる", async ({ page }) => {
    const textarea = page.getByLabel("分析対象のテキスト");
    await textarea.focus();
    await page.keyboard.type("Hello world");

    await expect(page.getByTestId("word-count")).toHaveText("2");
  });

  test("aria-live領域でアクセシビリティ対応", async ({ page }) => {
    const liveRegion = page.locator('[aria-live="polite"]').first();
    await expect(liveRegion).toBeVisible();
  });
});
