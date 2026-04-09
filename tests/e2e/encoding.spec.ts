import { test, expect } from "@playwright/test";

test.describe("文字コード変換ツール (/encoding)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/encoding");
  });

  test("ページが正しくロードされる", async ({ page }) => {
    await expect(page).toHaveTitle(/文字コード変換/);
    await expect(page.getByRole("tab", { name: "テキスト → Hex" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Hex → テキスト" })).toBeVisible();
  });

  test.describe("エンコードモード（テキスト→Hex）", () => {
    test("テキストを入力するとエンコード結果が表示される", async ({ page }) => {
      const textarea = page.getByLabel("変換するテキスト");
      await textarea.fill("あ");

      // UTF-8 の結果が表示される (あ = E3 81 82)
      await expect(page.getByText("E3 81 82")).toBeVisible();
    });

    test("複数の文字コードの結果が表示される", async ({ page }) => {
      await page.getByLabel("変換するテキスト").fill("テスト");

      await expect(page.getByText("UTF-8")).toBeVisible();
      await expect(page.getByText("Shift_JIS")).toBeVisible();
      await expect(page.getByText("EUC-JP")).toBeVisible();
      await expect(page.getByText("ISO-2022-JP")).toBeVisible();
    });

    test("文字数が表示される", async ({ page }) => {
      await page.getByLabel("変換するテキスト").fill("ABC");
      await expect(page.getByText("3 文字")).toBeVisible();
    });

    test("バイト数バッジが表示される", async ({ page }) => {
      await page.getByLabel("変換するテキスト").fill("あ");
      // UTF-8 でのバイト数バッジ
      const badges = page.locator(".encoding-result-bytes-badge");
      await expect(badges.first()).toBeVisible();
    });

    test("コピーボタンが表示される", async ({ page }) => {
      await page.getByLabel("変換するテキスト").fill("テスト");
      const copyBtns = page.locator(".encoding-copy-btn");
      await expect(copyBtns.first()).toBeVisible();
    });
  });

  test.describe("デコードモード（Hex→テキスト）", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("tab", { name: "Hex → テキスト" }).click();
    });

    test("16進数を入力するとデコード結果が表示される", async ({ page }) => {
      const textarea = page.getByLabel("16進数バイト列");
      await textarea.fill("E3 81 82");

      // あ = E3 81 82 (UTF-8)
      await expect(page.getByText("あ")).toBeVisible();
    });

    test("文字コード選択セレクタが表示される", async ({ page }) => {
      await expect(page.getByLabel("デコードする文字コードを選択")).toBeVisible();
    });

    test("Shift_JIS バイト列をデコードできる", async ({ page }) => {
      await page.getByLabel("デコードする文字コードを選択").selectOption("SJIS");
      const textarea = page.getByLabel("16進数バイト列");
      await textarea.fill("82 A0"); // Shift_JIS: あ
      await expect(page.getByText("あ")).toBeVisible();
    });

    test("無効な16進数はエラーメッセージを表示する", async ({ page }) => {
      await page.getByLabel("16進数バイト列").fill("GG");
      await expect(page.getByText(/無効な16進数/)).toBeVisible();
    });
  });

  test.describe("アクセシビリティ", () => {
    test("タブキーボードナビゲーションが機能する", async ({ page }) => {
      const encodeTab = page.getByRole("tab", { name: "テキスト → Hex" });
      const decodeTab = page.getByRole("tab", { name: "Hex → テキスト" });
      await expect(encodeTab).toHaveAttribute("aria-selected", "true");
      await decodeTab.click();
      await expect(decodeTab).toHaveAttribute("aria-selected", "true");
    });

    test("テキストエリアにラベルが設定されている", async ({ page }) => {
      await expect(page.getByLabel("変換するテキスト")).toBeVisible();
    });
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("対応文字コード")).toBeVisible();
  });
});
