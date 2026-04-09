import { test, expect } from "@playwright/test";

test.describe("JSON比較ツール (/json-compare)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/json-compare");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/JSON比較/);
  });

  test("左側のJSON入力エリアが存在する", async ({ page }) => {
    const leftTextarea = page.locator("#leftJson");
    await expect(leftTextarea).toBeVisible();
  });

  test("右側のJSON入力エリアが存在する", async ({ page }) => {
    const rightTextarea = page.locator("#rightJson");
    await expect(rightTextarea).toBeVisible();
  });

  test("サンプル読込ボタンが存在する", async ({ page }) => {
    const sampleBtn = page.getByRole("button", { name: "サンプルJSONを読み込む" });
    await expect(sampleBtn).toBeVisible();
  });

  test("比較するボタンが存在する", async ({ page }) => {
    const compareBtn = page.getByRole("button", { name: /JSONを比較する/ });
    await expect(compareBtn).toBeVisible();
  });

  test("クリアボタンが存在する", async ({ page }) => {
    const clearBtn = page.getByRole("button", { name: "入力と結果をクリアする" });
    await expect(clearBtn).toBeVisible();
  });

  test("サンプル読込で両方のテキストエリアにJSONが入力される", async ({ page }) => {
    await page.getByRole("button", { name: "サンプルJSONを読み込む" }).click();
    const leftValue = await page.locator("#leftJson").inputValue();
    const rightValue = await page.locator("#rightJson").inputValue();
    expect(leftValue.length).toBeGreaterThan(0);
    expect(rightValue.length).toBeGreaterThan(0);
  });

  test("比較ボタンクリックで差分テーブルが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "サンプルJSONを読み込む" }).click();
    await page.getByRole("button", { name: /JSONを比較する/ }).click();
    const resultRegion = page.getByRole("region", { name: "JSON比較結果" });
    await expect(resultRegion).toBeVisible();
  });

  test("比較後にサマリーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "サンプルJSONを読み込む" }).click();
    await page.getByRole("button", { name: /JSONを比較する/ }).click();
    const summary = page.getByRole("status", { name: "差分サマリー" });
    await expect(summary).toBeVisible();
  });

  test("クリアボタンで入力が消える", async ({ page }) => {
    await page.locator("#leftJson").fill('{"a": 1}');
    await page.locator("#rightJson").fill('{"b": 2}');
    await page.getByRole("button", { name: "入力と結果をクリアする" }).click();
    const leftValue = await page.locator("#leftJson").inputValue();
    expect(leftValue).toBe("");
  });

  test("不正なJSONでエラーメッセージが表示される", async ({ page }) => {
    await page.locator("#leftJson").fill("{invalid}");
    await page.locator("#rightJson").fill('{"b": 2}');
    await page.getByRole("button", { name: /JSONを比較する/ }).click();
    // エラーメッセージが表示される
    const errorEl = page.locator(".error-message, [role='alert']").first();
    await expect(errorEl).toBeVisible();
  });
});
