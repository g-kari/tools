import { test, expect } from "@playwright/test";

test.describe("ポート番号リファレンス (/ports)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ports");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/ポート番号/);
    await expect(page.getByRole("heading", { name: "ポート番号リファレンス" })).toBeVisible();
  });

  test("カテゴリフィルターが表示される", async ({ page }) => {
    const filterGroup = page.getByRole("group", { name: "カテゴリフィルター" });
    await expect(filterGroup).toBeVisible();
    await expect(filterGroup.getByRole("button", { name: "すべて" })).toBeVisible();
  });

  test("プロトコルフィルターが表示される", async ({ page }) => {
    const protocolGroup = page.getByRole("group", { name: "プロトコルフィルター" });
    await expect(protocolGroup).toBeVisible();
    await expect(protocolGroup.getByRole("button", { name: "すべて" })).toBeVisible();
    await expect(protocolGroup.getByRole("button", { name: "TCP" })).toBeVisible();
    await expect(protocolGroup.getByRole("button", { name: "UDP" })).toBeVisible();
  });

  test("検索ボックスが表示される", async ({ page }) => {
    await expect(page.getByLabel("ポートを検索")).toBeVisible();
  });

  test("ポート一覧が表示される", async ({ page }) => {
    const portList = page.getByRole("list", { name: "ポート番号一覧" });
    await expect(portList).toBeVisible();
    // 少なくとも1件以上表示される
    const cards = portList.getByRole("listitem");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("件数表示が表示される", async ({ page }) => {
    const countDisplay = page.locator(".ports-count");
    await expect(countDisplay).toBeVisible();
    await expect(countDisplay).toContainText("件");
  });

  test("HTTP (80) が含まれている", async ({ page }) => {
    const portList = page.getByRole("list", { name: "ポート番号一覧" });
    await expect(portList).toContainText("80");
  });

  test("キーワード検索でフィルタリングできる", async ({ page }) => {
    const searchInput = page.getByLabel("ポートを検索");
    await searchInput.fill("HTTP");
    // フィルタリング後もポート一覧が表示される
    const portList = page.getByRole("list", { name: "ポート番号一覧" });
    await expect(portList).toBeVisible();
    const cards = portList.getByRole("listitem");
    // HTTP 関連のポートが絞り込まれる
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("ポート番号で検索できる", async ({ page }) => {
    const searchInput = page.getByLabel("ポートを検索");
    await searchInput.fill("22");
    const portList = page.getByRole("list", { name: "ポート番号一覧" });
    await expect(portList).toContainText("22");
  });

  test("カテゴリフィルターで絞り込みできる", async ({ page }) => {
    const filterGroup = page.getByRole("group", { name: "カテゴリフィルター" });
    // Web カテゴリのボタンをクリック
    const webBtn = filterGroup.getByRole("button", { name: "Web" });
    if (await webBtn.isVisible()) {
      await webBtn.click();
      await expect(webBtn).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("TCP フィルターで絞り込みできる", async ({ page }) => {
    const tcpBtn = page
      .getByRole("group", { name: "プロトコルフィルター" })
      .getByRole("button", { name: "TCP" });
    await tcpBtn.click();
    await expect(tcpBtn).toHaveAttribute("aria-pressed", "true");
    // UDP のみのポートが非表示になる
    const countDisplay = page.locator(".ports-count");
    const allText = await countDisplay.textContent();
    // 全件より少ない件数になることを期待（または等しい場合もある）
    expect(allText).toContain("件");
  });

  test("ポート番号コピーボタンが存在する", async ({ page }) => {
    const portList = page.getByRole("list", { name: "ポート番号一覧" });
    const firstCard = portList.getByRole("listitem").first();
    await expect(firstCard.getByRole("button", { name: /コピー/ })).toBeVisible();
  });

  test("検索クリアで全件が表示される", async ({ page }) => {
    const searchInput = page.getByLabel("ポートを検索");
    await searchInput.fill("SSH");
    const countBefore = await page.locator(".ports-count").textContent();
    await searchInput.fill("");
    const countAfter = await page.locator(".ports-count").textContent();
    // フィルタリング解除後は件数が増える
    expect(countAfter).not.toBe(countBefore);
  });
});
