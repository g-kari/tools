import { test, expect } from "@playwright/test";

test.describe("数値進数変換 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/number-base");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/数値進数変換/);
  });

  test("メイン見出しが表示される", async ({ page }) => {
    const heading = page.locator(".section-title").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("数値進数変換");
  });

  test("アクセシビリティ属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("4つの入力フィールドが表示される", async ({ page }) => {
    await expect(page.locator("#binary")).toBeVisible();
    await expect(page.locator("#octal")).toBeVisible();
    await expect(page.locator("#decimal")).toBeVisible();
    await expect(page.locator("#hexadecimal")).toBeVisible();
  });

  test("10進数に値を入力すると他のフィールドが更新される", async ({ page }) => {
    const decimalInput = page.locator("#decimal");
    await decimalInput.fill("10");

    await expect(page.locator("#binary")).toHaveValue("1010");
    await expect(page.locator("#octal")).toHaveValue("12");
    await expect(page.locator("#hexadecimal")).toHaveValue("A");
  });

  test("2進数に値を入力すると他のフィールドが更新される", async ({ page }) => {
    const binaryInput = page.locator("#binary");
    await binaryInput.fill("1111");

    await expect(page.locator("#decimal")).toHaveValue("15");
    await expect(page.locator("#octal")).toHaveValue("17");
    await expect(page.locator("#hexadecimal")).toHaveValue("F");
  });

  test("16進数に値を入力すると他のフィールドが更新される", async ({ page }) => {
    const hexInput = page.locator("#hexadecimal");
    await hexInput.fill("FF");

    await expect(page.locator("#decimal")).toHaveValue("255");
    await expect(page.locator("#binary")).toHaveValue("11111111");
    await expect(page.locator("#octal")).toHaveValue("377");
  });

  test("0を入力すると全フィールドに0が表示される", async ({ page }) => {
    const decimalInput = page.locator("#decimal");
    await decimalInput.fill("0");

    await expect(page.locator("#binary")).toHaveValue("0");
    await expect(page.locator("#octal")).toHaveValue("0");
    await expect(page.locator("#hexadecimal")).toHaveValue("0");
  });

  test("無効な2進数を入力するとエラーが表示される", async ({ page }) => {
    const binaryInput = page.locator("#binary");
    await binaryInput.fill("123");

    const errorMsg = page.locator("#binary-error");
    await expect(errorMsg).toBeVisible();
  });

  test("無効な8進数を入力するとエラーが表示される", async ({ page }) => {
    const octalInput = page.locator("#octal");
    await octalInput.fill("89");

    const errorMsg = page.locator("#octal-error");
    await expect(errorMsg).toBeVisible();
  });

  test("フィールドをクリアするとクリアボタンが消える", async ({ page }) => {
    const decimalInput = page.locator("#decimal");
    await decimalInput.fill("10");

    const clearBtn = page.locator("button[aria-label='すべてのフィールドをクリア']");
    await expect(clearBtn).toBeVisible();

    await clearBtn.click();
    await expect(clearBtn).not.toBeVisible();
    await expect(decimalInput).toHaveValue("");
  });

  test("コピーボタンが各フィールドに表示される", async ({ page }) => {
    const decimalInput = page.locator("#decimal");
    await decimalInput.fill("255");

    const copyBtns = page.locator(".number-base-copy-btn");
    const count = await copyBtns.count();
    expect(count).toBe(4);
  });

  test("使い方説明が表示される", async ({ page }) => {
    const tipsCard = page.locator(".info-box").first();
    await expect(tipsCard).toBeVisible();
    const tipsText = await tipsCard.textContent();
    expect(tipsText).toContain("使い方");
  });

  test("変換カテゴリにナビゲーションリンクが表示される", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/number-base"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("数値進数変換");
  });

  test("16進数フィールドは小文字入力を受け付ける", async ({ page }) => {
    const hexInput = page.locator("#hexadecimal");
    await hexInput.fill("ff");

    await expect(page.locator("#decimal")).toHaveValue("255");
  });
});
