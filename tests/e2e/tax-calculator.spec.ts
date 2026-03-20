import { test, expect } from "@playwright/test";

test.describe("消費税計算機", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tax-calculator");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/消費税計算機/);
  });

  test("ページに「undefined」が含まれていない", async ({ page }) => {
    const content = await page.textContent("body");
    expect(content).not.toContain("undefined");
  });

  test("タブが2つ表示される", async ({ page }) => {
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(0)).toHaveText("税抜 → 税込");
    await expect(tabs.nth(1)).toHaveText("税込 → 税抜");
  });

  test("初期状態で「税抜 → 税込」タブが選択されている", async ({ page }) => {
    const firstTab = page.getByRole("tab", { name: "税抜 → 税込" });
    await expect(firstTab).toHaveAttribute("aria-selected", "true");
  });

  test("初期状態でエンプティステートが表示される", async ({ page }) => {
    await expect(page.getByText("価格を入力すると消費税が計算されます")).toBeVisible();
  });

  test("税率ラジオボタンが2つ表示される", async ({ page }) => {
    const radios = page.getByRole("radio");
    await expect(radios).toHaveCount(2);
  });

  test("税抜1,000円・10%で税込1,100円が計算される", async ({ page }) => {
    const input = page.getByLabel("税抜価格を入力");
    await input.fill("1000");
    await expect(page.getByText("1,100")).toBeVisible();
  });

  test("税抜1,000円・8%で税込1,080円が計算される", async ({ page }) => {
    const input = page.getByLabel("税抜価格を入力");
    await input.fill("1000");
    const rate8 = page.getByRole("radio", { name: /軽減税率 8%/ });
    await rate8.click();
    await expect(page.getByText("1,080")).toBeVisible();
  });

  test("税込1,100円・10%で税抜1,000円が計算される", async ({ page }) => {
    const inclusiveTab = page.getByRole("tab", { name: "税込 → 税抜" });
    await inclusiveTab.click();
    const input = page.getByLabel("税込価格を入力");
    await input.fill("1100");
    await expect(page.getByText("1,000")).toBeVisible();
  });

  test("消費税額が表示される", async ({ page }) => {
    const input = page.getByLabel("税抜価格を入力");
    await input.fill("1000");
    await expect(page.getByText("100")).toBeVisible();
  });

  test("コピーボタンが表示される", async ({ page }) => {
    const input = page.getByLabel("税抜価格を入力");
    await input.fill("1000");
    const copyButtons = page.getByRole("button", { name: /コピー/ });
    await expect(copyButtons.first()).toBeVisible();
  });
});
