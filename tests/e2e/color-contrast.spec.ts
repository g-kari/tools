import { test, expect } from "@playwright/test";

test.describe("カラーコントラストチェッカー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-contrast");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/カラーコントラストチェッカー/);
    await expect(
      page.getByRole("heading", { name: "前景色（テキスト色）" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "背景色" })).toBeVisible();
  });

  test("コントラスト比が表示される", async ({ page }) => {
    // デフォルト（黒と白）のコントラスト比が表示されることを確認
    const ratioDisplay = page.locator(".contrast-ratio-number");
    await expect(ratioDisplay).toBeVisible();
    const ratioText = await ratioDisplay.textContent();
    expect(ratioText).toMatch(/\d+\.\d+:1/);
  });

  test("デフォルト値で黒と白のコントラスト比が約21:1", async ({ page }) => {
    const ratioDisplay = page.locator(".contrast-ratio-number");
    await expect(ratioDisplay).toBeVisible();
    const ratioText = await ratioDisplay.textContent();
    expect(ratioText).toContain("21.00:1");
  });

  test("前景色のHEX入力が動作する", async ({ page }) => {
    const fgHexInput = page.getByLabel("前景色のHEX値");
    await fgHexInput.fill("#ff0000");
    // コントラスト比が更新されることを確認
    const ratioDisplay = page.locator(".contrast-ratio-number");
    await expect(ratioDisplay).toBeVisible();
    const ratioText = await ratioDisplay.textContent();
    expect(ratioText).toMatch(/\d+\.\d+:1/);
  });

  test("背景色のHEX入力が動作する", async ({ page }) => {
    const bgHexInput = page.getByLabel("背景色のHEX値");
    await bgHexInput.fill("#333333");
    const ratioDisplay = page.locator(".contrast-ratio-number");
    await expect(ratioDisplay).toBeVisible();
    const ratioText = await ratioDisplay.textContent();
    expect(ratioText).toMatch(/\d+\.\d+:1/);
  });

  test("スワップボタンで色が入れ替わる", async ({ page }) => {
    // デフォルト: 前景#000000, 背景#ffffff
    const fgHexInput = page.getByLabel("前景色のHEX値");
    const bgHexInput = page.getByLabel("背景色のHEX値");

    const initialFg = await fgHexInput.inputValue();
    const initialBg = await bgHexInput.inputValue();

    // スワップボタンをクリック
    await page.getByRole("button", { name: "前景色と背景色を入れ替える" }).click();

    const newFg = await fgHexInput.inputValue();
    const newBg = await bgHexInput.inputValue();

    expect(newFg).toBe(initialBg);
    expect(newBg).toBe(initialFg);
  });

  test("WCAG判定テーブルが表示される", async ({ page }) => {
    const table = page.getByRole("table", { name: "WCAG 2.1 適合性判定" });
    await expect(table).toBeVisible();

    // テーブルヘッダーの確認
    await expect(page.getByRole("columnheader", { name: "基準" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "判定" })).toBeVisible();
  });

  test("黒と白のデフォルトでWCAG AAとAAAがすべてPassになる", async ({
    page,
  }) => {
    const passElements = page.locator(".wcag-pass");
    const passCount = await passElements.count();
    expect(passCount).toBe(4); // すべての行がPass
  });

  test("コントラスト比のコピーボタンが動作する", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "コントラスト比をコピー" }).click();
    // トースト通知が表示されることを確認
    await expect(page.getByText(/コントラスト比.*をコピーしました/)).toBeVisible();
  });

  test("プレビューエリアが表示される", async ({ page }) => {
    const preview = page.locator(".contrast-preview");
    await expect(preview).toBeVisible();
    await expect(page.locator(".contrast-preview-text-large")).toBeVisible();
    await expect(page.locator(".contrast-preview-text").first()).toBeVisible();
  });

  test("低コントラストでFailが表示される", async ({ page }) => {
    // 低コントラストの組み合わせ（グレーonグレー）
    const fgHexInput = page.getByLabel("前景色のHEX値");
    const bgHexInput = page.getByLabel("背景色のHEX値");

    await fgHexInput.fill("#aaaaaa");
    await bgHexInput.fill("#cccccc");

    // Failが存在することを確認
    const failElements = page.locator(".wcag-fail");
    const failCount = await failElements.count();
    expect(failCount).toBeGreaterThan(0);
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(
      page.getByText("カラーコントラストチェッカーとは")
    ).toBeVisible();
    await expect(page.getByText("WCAG基準について")).toBeVisible();
  });
});
