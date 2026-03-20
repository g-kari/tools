import { test, expect } from "@playwright/test";

test.describe("割り勘計算機", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/warikan");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/割り勘計算機/);
  });

  test("ページに「undefined」が含まれていない", async ({ page }) => {
    const content = await page.textContent("body");
    expect(content).not.toContain("undefined");
  });

  test("初期状態でエンプティステートが表示される", async ({ page }) => {
    await expect(
      page.getByText("合計金額と人数を入力すると割り勘が計算されます")
    ).toBeVisible();
  });

  test("合計金額・人数の入力欄が表示される", async ({ page }) => {
    await expect(page.getByLabel("合計金額を入力")).toBeVisible();
    await expect(page.getByLabel("人数を入力")).toBeVisible();
    await expect(page.getByLabel("チップ率を入力")).toBeVisible();
  });

  test("4人で15,000円の割り勘計算ができる", async ({ page }) => {
    await page.getByLabel("合計金額を入力").fill("15000");
    await page.getByLabel("人数を入力").fill("4");
    await expect(page.getByText("3,750")).toBeVisible();
  });

  test("3人で10,000円の割り勘（切り上げ・切り捨て）が表示される", async ({
    page,
  }) => {
    await page.getByLabel("合計金額を入力").fill("10000");
    await page.getByLabel("人数を入力").fill("3");
    await expect(page.getByText("3,334")).toBeVisible();
    await expect(page.getByText("3,333")).toBeVisible();
  });

  test("チップ10%込みの計算ができる", async ({ page }) => {
    await page.getByLabel("合計金額を入力").fill("10000");
    await page.getByLabel("人数を入力").fill("2");
    await page.getByLabel("チップ率を入力").fill("10");
    await expect(page.getByText("5,500")).toBeVisible();
    await expect(page.getByText("11,000")).toBeVisible();
    await expect(page.getByText("1,000")).toBeVisible();
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await page.getByLabel("合計金額を入力").fill("15000");
    await page.getByLabel("人数を入力").fill("4");
    const copyButtons = page.getByRole("button", { name: /コピー/ });
    await expect(copyButtons.first()).toBeVisible();
  });
});
