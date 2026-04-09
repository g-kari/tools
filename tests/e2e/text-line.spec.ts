import { test, expect } from "@playwright/test";

test.describe("テキスト行操作", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/text-line");
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/テキスト行操作/);
    await expect(page.getByRole("heading", { name: "テキスト行操作" })).toBeVisible();
  });

  test("入力エリアと出力エリアが表示される", async ({ page }) => {
    await expect(page.getByLabel(/操作対象のテキスト入力欄/)).toBeVisible();
    await expect(page.getByLabel(/テキスト行操作の結果出力欄/)).toBeVisible();
  });

  test("操作グループが表示される", async ({ page }) => {
    await expect(page.getByText("整形")).toBeVisible();
    await expect(page.getByText("追加")).toBeVisible();
    await expect(page.getByText("並び替え")).toBeVisible();
    await expect(page.getByText("フィルタ")).toBeVisible();
  });

  test("各行をトリムが動作する", async ({ page }) => {
    const input = page.getByLabel(/操作対象のテキスト入力欄/);
    await input.fill("  hello  \n  world  ");
    await page.getByRole("button", { name: "各行をトリム" }).click();
    const output = page.getByLabel(/テキスト行操作の結果出力欄/);
    await expect(output).toHaveValue("hello\nworld");
  });

  test("空行を削除が動作する", async ({ page }) => {
    const input = page.getByLabel(/操作対象のテキスト入力欄/);
    await input.fill("a\n\nb\n\nc");
    await page.getByRole("button", { name: "空行を削除" }).click();
    const output = page.getByLabel(/テキスト行操作の結果出力欄/);
    await expect(output).toHaveValue("a\nb\nc");
  });

  test("行番号を追加が動作する", async ({ page }) => {
    const input = page.getByLabel(/操作対象のテキスト入力欄/);
    await input.fill("foo\nbar");
    await page.getByRole("button", { name: "行番号を追加" }).click();
    const output = page.getByLabel(/テキスト行操作の結果出力欄/);
    const value = await output.inputValue();
    expect(value).toContain("1. foo");
    expect(value).toContain("2. bar");
  });

  test("行を逆順にするが動作する", async ({ page }) => {
    const input = page.getByLabel(/操作対象のテキスト入力欄/);
    await input.fill("a\nb\nc");
    await page.getByRole("button", { name: "行を逆順にする" }).click();
    const output = page.getByLabel(/テキスト行操作の結果出力欄/);
    await expect(output).toHaveValue("c\nb\na");
  });

  test("行をシャッフルが動作する", async ({ page }) => {
    const input = page.getByLabel(/操作対象のテキスト入力欄/);
    await input.fill("apple\nbanana\ncherry");
    await page.getByRole("button", { name: "行をシャッフル" }).click();
    const output = page.getByLabel(/テキスト行操作の結果出力欄/);
    const value = await output.inputValue();
    expect(value).toContain("apple");
    expect(value).toContain("banana");
    expect(value).toContain("cherry");
  });

  test("空入力でエラートーストが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "各行をトリム" }).click();
    await expect(page.getByText("テキストを入力してください")).toBeVisible();
  });

  test("クリアボタンが動作する", async ({ page }) => {
    const input = page.getByLabel(/操作対象のテキスト入力欄/);
    await input.fill("hello\nworld");
    await page.getByRole("button", { name: "入力と出力をクリア" }).click();
    await expect(input).toHaveValue("");
  });

  test("行数が表示される（操作後）", async ({ page }) => {
    const input = page.getByLabel(/操作対象のテキスト入力欄/);
    await input.fill("a\n\nb\n\nc");
    await page.getByRole("button", { name: "空行を削除" }).click();
    await expect(page.getByText(/→.*行/)).toBeVisible();
  });

  test("コピーボタンが動作する（結果あり）", async ({ page }) => {
    const input = page.getByLabel(/操作対象のテキスト入力欄/);
    await input.fill("hello\nworld");
    await page.getByRole("button", { name: "各行をトリム" }).click();
    const copyBtn = page.getByRole("button", { name: "結果をコピー" });
    await expect(copyBtn).toBeEnabled();
    await copyBtn.click();
    await expect(page.getByText("コピーしました")).toBeVisible();
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });
});
