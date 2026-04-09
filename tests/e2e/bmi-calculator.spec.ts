import { test, expect } from "@playwright/test";

test.describe("BMI計算機 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bmi-calculator");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/BMI計算機/);
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("入力フォームが表示されている", async ({ page }) => {
    await expect(page.locator("input#bmi-height")).toBeVisible();
    await expect(page.locator("input#bmi-weight")).toBeVisible();
  });

  test("身長と体重を入力するとBMIが計算される", async ({ page }) => {
    await page.fill("input#bmi-height", "170");
    await page.fill("input#bmi-weight", "65");

    const bmiValue = await page.locator(".bmi-result-value").first().textContent();
    expect(bmiValue).toContain("22");
  });

  test("普通体重のカテゴリバッジが表示される", async ({ page }) => {
    await page.fill("input#bmi-height", "170");
    await page.fill("input#bmi-weight", "65");

    const badge = page.locator(".bmi-category-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("普通体重");
  });

  test("低体重のカテゴリバッジが表示される", async ({ page }) => {
    await page.fill("input#bmi-height", "170");
    await page.fill("input#bmi-weight", "45");

    const badge = page.locator(".bmi-category-badge");
    await expect(badge).toContainText("低体重");
  });

  test("肥満カテゴリのバッジが表示される", async ({ page }) => {
    await page.fill("input#bmi-height", "170");
    await page.fill("input#bmi-weight", "100");

    const badge = page.locator(".bmi-category-badge");
    await expect(badge).toBeVisible();
  });

  test("空の入力のときプレースホルダーメッセージが表示される", async ({ page }) => {
    const emptyState = page.locator(".percentage-empty-state");
    await expect(emptyState).toBeVisible();
  });

  test("標準体重が表示される", async ({ page }) => {
    await page.fill("input#bmi-height", "170");
    await page.fill("input#bmi-weight", "65");

    const resultCards = page.locator(".bmi-result-card");
    await expect(resultCards).toHaveCount(3);
  });

  test("ARIAラベルが設定されている", async ({ page }) => {
    const heightInput = page.locator("input#bmi-height");
    const weightInput = page.locator("input#bmi-weight");

    await expect(heightInput).toHaveAttribute("aria-label", "身長をcm単位で入力");
    await expect(weightInput).toHaveAttribute("aria-label", "体重をkg単位で入力");
  });

  test("ナビゲーションにBMI計算機リンクが表示される", async ({ page }) => {
    const navLink = page.getByRole("link", { name: "BMI計算機" });
    await expect(navLink).toBeVisible();
  });
});
