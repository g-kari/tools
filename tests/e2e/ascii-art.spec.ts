import { test, expect } from "@playwright/test";

test.describe("ASCIIアートジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ascii-art");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/ASCIIアート生成/);
  });

  test("テキスト入力フィールドが表示される", async ({ page }) => {
    await expect(page.locator("#ascii-input")).toBeVisible();
  });

  test("空状態メッセージが表示される", async ({ page }) => {
    await expect(page.locator(".aa-empty-state")).toBeVisible();
  });

  test("テキストを入力するとASCIIアートが表示される", async ({ page }) => {
    await page.locator("#ascii-input").fill("HI");
    await expect(page.locator(".aa-result-wrapper")).toBeVisible();
    await expect(page.locator(".aa-result-pre")).toBeVisible();
  });

  test("入力をクリアすると空状態に戻る", async ({ page }) => {
    await page.locator("#ascii-input").fill("HI");
    await expect(page.locator(".aa-result-wrapper")).toBeVisible();
    await page.locator("#ascii-input").fill("");
    await expect(page.locator(".aa-empty-state")).toBeVisible();
  });

  test("フォント選択セレクトが表示される", async ({ page }) => {
    await expect(page.locator("#aa-font-select")).toBeVisible();
  });

  test("フォントを変更するとASCIIアートが更新される", async ({ page }) => {
    await page.locator("#ascii-input").fill("HI");
    const before = await page.locator(".aa-result-pre").textContent();

    await page.locator("#aa-font-select").selectOption("block");
    const after = await page.locator(".aa-result-pre").textContent();

    // フォントを変えると出力が変わる（同じにはならない）
    expect(before).not.toEqual(after);
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await page.locator("#ascii-input").fill("HI");
    await expect(page.locator(".aa-copy-btn")).toBeVisible();
  });

  test("コピーボタンは入力なしの場合は表示されない", async ({ page }) => {
    await expect(page.locator(".aa-copy-btn")).not.toBeVisible();
  });

  test("文字数ヒントが表示される", async ({ page }) => {
    await expect(page.locator("#ascii-input-hint")).toBeVisible();
  });

  test("20文字以内の入力で文字数カウントが正しく表示される", async ({ page }) => {
    await page.locator("#ascii-input").fill("HELLO");
    const hintText = await page.locator("#ascii-input-hint").textContent();
    expect(hintText).toContain("5/20");
  });

  test("maxLength属性により20文字を超えた入力が切り捨てられる", async ({ page }) => {
    const input = page.locator("#ascii-input");
    await input.fill("ABCDEFGHIJKLMNOPQRSTUVWXYZ"); // 26文字
    const value = await input.inputValue();
    expect(value.length).toBeLessThanOrEqual(20);
  });

  test("ラベルと入力フィールドが関連付けられている", async ({ page }) => {
    const input = page.locator("#ascii-input");
    await expect(input).toBeVisible();
    const label = page.locator('label[for="ascii-input"]');
    await expect(label).toBeVisible();
  });

  test("フォントセレクトにaria-label属性がある", async ({ page }) => {
    const select = page.locator("#aa-font-select");
    await expect(select).toHaveAttribute("aria-label", "ASCIIアートのフォントスタイルを選択");
  });

  test("結果エリアにaria-live属性がある", async ({ page }) => {
    await page.locator("#ascii-input").fill("HI");
    const resultWrapper = page.locator(".aa-result-wrapper");
    await expect(resultWrapper).toHaveAttribute("aria-live", "polite");
  });

  test("結果エリアにaria-label属性がある", async ({ page }) => {
    await page.locator("#ascii-input").fill("HI");
    const resultWrapper = page.locator(".aa-result-wrapper");
    await expect(resultWrapper).toHaveAttribute("aria-label", "ASCIIアート変換結果");
  });

  test("ASCIIアート出力プレエリアにaria-label属性がある", async ({ page }) => {
    await page.locator("#ascii-input").fill("HI");
    const pre = page.locator(".aa-result-pre");
    await expect(pre).toHaveAttribute("aria-label", "ASCIIアート出力");
  });

  test("行数・文字数の情報が表示される", async ({ page }) => {
    await page.locator("#ascii-input").fill("HI");
    await expect(page.locator(".aa-char-info")).toBeVisible();
    const charInfo = await page.locator(".aa-char-info").textContent();
    expect(charInfo).toMatch(/\d+ 行 \/ \d+ 文字/);
  });

  test("入力のaria-describedby属性がヒント要素を参照している", async ({ page }) => {
    const input = page.locator("#ascii-input");
    await expect(input).toHaveAttribute("aria-describedby", "ascii-input-hint");
  });

  test("空状態エリアにaria-live属性がある", async ({ page }) => {
    const emptyState = page.locator(".aa-empty-state");
    await expect(emptyState).toHaveAttribute("aria-live", "polite");
  });

  test("複数のフォントオプションが選択可能である", async ({ page }) => {
    const options = page.locator("#aa-font-select option");
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });
});
