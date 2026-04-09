import { test, expect } from "@playwright/test";

test.describe("幾何計算機 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/geometry");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    await expect(page).toHaveTitle(/幾何計算機/);
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("2D・3Dタブが表示されている", async ({ page }) => {
    const tab2d = page.getByRole("tab", { name: "2D図形（面積）" });
    const tab3d = page.getByRole("tab", { name: "3D図形（体積）" });
    await expect(tab2d).toBeVisible();
    await expect(tab3d).toBeVisible();
  });

  test("デフォルトで2Dタブがアクティブ", async ({ page }) => {
    const tab2d = page.getByRole("tab", { name: "2D図形（面積）" });
    await expect(tab2d).toHaveAttribute("aria-selected", "true");
  });

  test("図形選択ドロップダウンが表示されている", async ({ page }) => {
    await expect(page.locator("#shape-2d-select")).toBeVisible();
  });

  test("円の面積を計算できる", async ({ page }) => {
    // デフォルトで円が選択されているはず
    await page.selectOption("#shape-2d-select", "circle");
    await page.fill("input#geo-r", "5");

    const result = page.locator(".geometry-result-value").first();
    await expect(result).toBeVisible();
    const text = await result.textContent();
    // π × 5² ≈ 78.5398
    expect(text).toContain("78");
  });

  test("空の入力のときプレースホルダーメッセージが表示される", async ({ page }) => {
    const emptyState = page.locator(".geometry-empty-state");
    await expect(emptyState).toBeVisible();
  });

  test("3Dタブに切り替えられる", async ({ page }) => {
    const tab3d = page.getByRole("tab", { name: "3D図形（体積）" });
    await tab3d.click();

    await expect(tab3d).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#shape-3d-select")).toBeVisible();
  });

  test("3D: 球の体積と表面積を計算できる", async ({ page }) => {
    const tab3d = page.getByRole("tab", { name: "3D図形（体積）" });
    await tab3d.click();

    await page.selectOption("#shape-3d-select", "sphere");
    await page.fill("input#geo3-r", "5");

    const resultCards = page.locator(".geometry-result-card");
    await expect(resultCards).toHaveCount(2);

    const volumeText = await resultCards.first().textContent();
    // 体積: ≈ 523.5988
    expect(volumeText).toContain("523");
  });

  test("3D: 立方体の体積と表面積を計算できる", async ({ page }) => {
    const tab3d = page.getByRole("tab", { name: "3D図形（体積）" });
    await tab3d.click();

    await page.selectOption("#shape-3d-select", "cube");
    await page.fill("input#geo3-a", "4");

    const resultCards = page.locator(".geometry-result-card");
    await expect(resultCards).toHaveCount(2);

    const volumeText = await resultCards.first().textContent();
    // 体積: 4³ = 64
    expect(volumeText).toContain("64");
  });

  test("長方形の面積を計算できる", async ({ page }) => {
    await page.selectOption("#shape-2d-select", "rectangle");
    await page.fill("input#geo-w", "10");
    await page.fill("input#geo-h", "5");

    const result = page.locator(".geometry-result-value").first();
    await expect(result).toBeVisible();
    const text = await result.textContent();
    // 10 × 5 = 50
    expect(text).toContain("50");
  });

  test("ARIAラベルが設定されている", async ({ page }) => {
    const select = page.locator("#shape-2d-select");
    await expect(select).toHaveAttribute("aria-label", "2D図形を選択");
  });

  test("ナビゲーションに幾何計算機リンクが表示される", async ({ page }) => {
    const navLink = page.getByRole("link", { name: "幾何計算機" });
    await expect(navLink).toBeVisible();
  });
});
