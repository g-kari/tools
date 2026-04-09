import { test, expect } from "@playwright/test";

test.describe("Chmod Calculator - E2E Tests", () => {
  test.describe.configure({ timeout: 15000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/chmod");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Chmod/);
  });

  test("メインヘッダーが表示される", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("8進数入力フィールドが表示される", async ({ page }) => {
    const input = page.locator("#chmod-octal-input");
    await expect(input).toBeVisible();
  });

  test("シンボリック入力フィールドが表示される", async ({ page }) => {
    const input = page.locator("#chmod-symbolic-input");
    await expect(input).toBeVisible();
  });

  test("初期値として755が設定されている", async ({ page }) => {
    const octalInput = page.locator("#chmod-octal-input");
    await expect(octalInput).toHaveValue("755");
  });

  test("初期シンボリック表記がrwxr-xr-xである", async ({ page }) => {
    const symbolicInput = page.locator("#chmod-symbolic-input");
    await expect(symbolicInput).toHaveValue("rwxr-xr-x");
  });

  test("チェックボックスグリッドが表示される", async ({ page }) => {
    const grid = page.locator(".chmod-grid");
    await expect(grid).toBeVisible();
  });

  test("結果表示エリアが表示される", async ({ page }) => {
    const result = page.locator(".chmod-result");
    await expect(result).toBeVisible();
  });

  test("8進数表示が表示される", async ({ page }) => {
    const octal = page.locator(".chmod-octal");
    await expect(octal).toBeVisible();
    await expect(octal).toContainText("755");
  });

  test("シンボリック表記が表示される", async ({ page }) => {
    const symbolic = page.locator(".chmod-symbolic");
    await expect(symbolic).toBeVisible();
    await expect(symbolic).toContainText("rwxr-xr-x");
  });

  test("chmodコマンドが表示される", async ({ page }) => {
    const command = page.locator(".chmod-command");
    await expect(command).toBeVisible();
    await expect(command).toContainText("chmod 755 filename");
  });

  test("プリセットボタンが表示される", async ({ page }) => {
    const presets = page.locator(".chmod-preset-btn");
    await expect(presets.first()).toBeVisible();
  });

  test("644プリセットをクリックすると644が設定される", async ({ page }) => {
    const preset644 = page.locator(".chmod-preset-btn", { hasText: "644" });
    await preset644.click();
    const octalInput = page.locator("#chmod-octal-input");
    await expect(octalInput).toHaveValue("644");
  });

  test("8進数入力を変更するとシンボリック表記も更新される", async ({ page }) => {
    const octalInput = page.locator("#chmod-octal-input");
    await octalInput.fill("644");
    const symbolicInput = page.locator("#chmod-symbolic-input");
    await expect(symbolicInput).toHaveValue("rw-r--r--");
  });

  test("特殊ビットセクションが表示される", async ({ page }) => {
    const special = page.locator(".chmod-special");
    await expect(special).toBeVisible();
  });

  test("ナビゲーションにネットワークカテゴリが表示される", async ({ page }) => {
    const networkCategory = page.getByRole("button", { name: /ネットワーク/ });
    await expect(networkCategory).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("Chmod計算ツールとは");
  });
});
