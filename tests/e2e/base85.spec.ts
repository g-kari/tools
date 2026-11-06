import { test, expect } from "@playwright/test";

test.describe("Base85 エンコード・デコードツール (/base85)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/base85");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Base85/);
  });

  test("エンコード・デコードのタブが表示される", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "デコード" })).toBeVisible();
  });

  test("デフォルトはエンコードモード", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "エンコード" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("バリアント選択（ASCII85 / Z85）が表示される", async ({ page }) => {
    const fieldset = page.locator("fieldset").filter({ hasText: "バリアント" });
    await expect(fieldset).toBeVisible();
  });

  test("テキストを入力するとエンコード結果が表示される", async ({ page }) => {
    const inputArea = page.locator("textarea").first();
    await inputArea.fill("Hello");
    // 出力テキストエリアに値が表示される
    const outputArea = page.locator("textarea").last();
    await expect(outputArea).not.toHaveValue("");
  });

  test("デコードモードに切り替えられる", async ({ page }) => {
    await page.getByRole("tab", { name: "デコード" }).click();
    await expect(page.getByRole("tab", { name: "デコード" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("Z85 バリアントに切り替えられる", async ({ page }) => {
    const z85Radio = page.getByRole("radio", { name: "Z85" });
    await expect(z85Radio).toBeVisible();
    await z85Radio.click();
    await expect(z85Radio).toBeChecked();
  });

  test("入れ替えボタンが存在する", async ({ page }) => {
    const inputArea = page.locator("textarea").first();
    await inputArea.fill("Hello");
    // 入れ替えボタンをクリック（出力が入力にセットされる）
    const swapBtn = page.getByRole("button", { name: /入れ替え|swap/i });
    await expect(swapBtn).toBeVisible();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    const inputArea = page.locator("textarea").first();
    await inputArea.fill("Hello");
    const clearBtn = page.getByRole("button", { name: /クリア/i });
    await clearBtn.click();
    await expect(inputArea).toHaveValue("");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    const inputArea = page.locator("textarea").first();
    await inputArea.fill("Hello");
    await expect(page.getByRole("button", { name: /コピー/i })).toBeVisible();
  });

  test("不正なBase85入力でデコードエラーが表示される", async ({ page }) => {
    await page.getByRole("tab", { name: "デコード" }).click();
    const inputArea = page.locator("textarea").first();
    await inputArea.fill("!!!!invalid!!!~");
    // エラーメッセージが表示される
    await expect(page.getByRole("alert")).toBeVisible();
  });

  for (const { variant, valid, invalid, expected } of [
    { variant: "ASCII85", valid: "9jqo^", invalid: "9jqo^!", expected: "Man " },
    { variant: "ASCII85", valid: "9jqo^", invalid: 's8W-"', expected: "Man " },
    { variant: "Z85", valid: "Hello", invalid: "%nSc1", expected: "86 4f d2 6f" },
  ]) {
    test(`${variant}: ${invalid} の拒否後に入力を直して回復できる`, async ({ page }) => {
      await page.getByRole("tab", { name: "デコード" }).click();
      const variantName = variant === "ASCII85" ? /^ASCII85（/ : /^Z85（/;
      await page.getByRole("radio", { name: variantName }).check();
      const input = page.locator("textarea").first();
      const output = page.getByRole("textbox", { name: "デコード結果", exact: true });
      const copy = page.getByRole("button", { name: /コピー/i });
      const swap = page.getByRole("button", { name: /入れ替え|swap/i });
      await input.fill(valid);
      await expect(output).toHaveValue(expected);
      await expect(copy).toBeEnabled();
      await input.fill(invalid);
      await expect(input).toHaveValue(invalid);
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(output).toHaveCount(0);
      await expect(copy).toBeDisabled();
      await expect(swap).toBeDisabled();
      await input.fill(valid);
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(output).toHaveValue(expected);
      await expect(copy).toBeEnabled();
      await expect(swap).toBeEnabled();
    });
  }
});
