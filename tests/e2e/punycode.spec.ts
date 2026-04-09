import { test, expect } from "@playwright/test";

test.describe("Punycode変換", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/punycode");
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Punycode変換/);
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("モード切替タブが表示される", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "自動" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "デコード" })).toBeVisible();
  });

  test("自動モードで日本語ドメインをエンコードする", async ({ page }) => {
    await page.getByRole("textbox").fill("日本語.jp");
    await expect(page.getByText("xn--wgv71a119e.jp")).toBeVisible();
  });

  test("自動モードでPunycodeドメインをデコードする", async ({ page }) => {
    await page.getByRole("textbox").fill("xn--wgv71a119e.jp");
    await expect(page.getByText("日本語.jp")).toBeVisible();
  });

  test("エンコードモードに切り替えられる", async ({ page }) => {
    await page.getByRole("tab", { name: "エンコード" }).click();
    await page.getByRole("textbox").fill("münchen.de");
    await expect(page.getByText("xn--mnchen-3ya.de")).toBeVisible();
  });

  test("デコードモードに切り替えられる", async ({ page }) => {
    await page.getByRole("tab", { name: "デコード" }).click();
    await page.getByRole("textbox").fill("xn--wgv71a119e.jp");
    await expect(page.getByText("日本語.jp")).toBeVisible();
  });

  test("サンプルボタンで入力がセットされる", async ({ page }) => {
    await page
      .getByRole("button", { name: /日本語/ })
      .first()
      .click();
    const input = page.getByRole("textbox");
    await expect(input).not.toHaveValue("");
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    const input = page.getByRole("textbox");
    await input.fill("日本語.jp");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(input).toHaveValue("");
  });

  test("ASCIIドメインは変換不要と表示される", async ({ page }) => {
    await page.getByRole("textbox").fill("example.com");
    await expect(page.getByText("変換なし・純粋 ASCII")).toBeVisible();
  });
});
