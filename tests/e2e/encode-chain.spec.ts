import { test, expect } from "@playwright/test";

test.describe("エンコードチェーン E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/encode-chain", { waitUntil: "domcontentloaded" });
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/エンコードチェーン/);
    await expect(page.locator("h1")).toContainText("エンコードチェーン");
  });

  test("入力テキストエリアにデフォルト値がある", async ({ page }) => {
    const textarea = page.locator(".ec-textarea");
    await expect(textarea).toBeVisible();
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("デフォルトのステップが表示される", async ({ page }) => {
    const steps = page.locator(".ec-step");
    await expect(steps).toHaveCount(2);
  });

  test("最終出力セクションが表示される", async ({ page }) => {
    await expect(page.locator(".ec-output")).toBeVisible();
  });

  test("ステップを追加できる", async ({ page }) => {
    const initialStepCount = await page.locator(".ec-step").count();

    const select = page.locator(".ec-add-row .ec-select");
    await select.selectOption("url-encode");

    const addBtn = page.locator(".ec-add-row .btn-primary");
    await addBtn.click();

    const steps = page.locator(".ec-step");
    await expect(steps).toHaveCount(initialStepCount + 1);
  });

  test("ステップを削除できる", async ({ page }) => {
    const initialCount = await page.locator(".ec-step").count();
    expect(initialCount).toBeGreaterThan(0);

    const removeBtn = page.locator(".ec-remove-btn").first();
    await removeBtn.click();

    const steps = page.locator(".ec-step");
    await expect(steps).toHaveCount(initialCount - 1);
  });

  test("全クリアボタンが機能する", async ({ page }) => {
    const clearBtn = page.locator(".ec-clear-btn");
    await clearBtn.click();

    await expect(page.locator(".ec-empty")).toBeVisible();
    await expect(page.locator(".ec-step")).toHaveCount(0);
  });

  test("入力テキストを変更すると出力が更新される", async ({ page }) => {
    // まずステップをすべてクリア
    const clearBtn = page.locator(".ec-clear-btn");
    await clearBtn.click();

    // uppercase ステップを追加
    const select = page.locator(".ec-add-row .ec-select");
    await select.selectOption("uppercase");
    await page.locator(".ec-add-row .btn-primary").click();

    // 入力テキストを変更
    const textarea = page.locator(".ec-textarea");
    await textarea.fill("hello");

    // 最終出力が HELLO になることを確認
    const output = page.locator(".ec-output");
    await expect(output).toContainText("HELLO");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    const copyBtn = page.locator(".ec-output-section .btn-primary");
    await expect(copyBtn).toBeVisible();
  });

  test("チェーン全体が入力→ステップ→出力の流れで表示される", async ({ page }) => {
    // 入力バッジ
    await expect(page.locator(".ec-step-io-input")).toBeVisible();
    // ステップ
    await expect(page.locator(".ec-step").first()).toBeVisible();
    // 出力バッジ
    await expect(page.locator(".ec-step-io-output").first()).toBeVisible();
  });

  test("ステップの変換タイプを変更できる", async ({ page }) => {
    const stepSelect = page.locator(".ec-step-select").first();
    await stepSelect.selectOption("rot13");
    // エラーが出ないことを確認
    await expect(page.locator(".ec-step-error")).toHaveCount(0);
  });

  test("ナビゲーションから到達できる", async ({ page }) => {
    await page.goto("/unicode", { waitUntil: "domcontentloaded" });
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/encode-chain"]');
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL("/encode-chain");
  });
});
