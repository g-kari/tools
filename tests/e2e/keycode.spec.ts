import { test, expect } from "@playwright/test";

test.describe("キーコードチェッカー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/keycode");
  });

  test("ページが正しく表示される", async ({ page }) => {
    // タイトルの確認
    await expect(page).toHaveTitle(/キーコードチェック/);

    // キャプチャエリアが表示される
    const captureArea = page.getByRole("region", {
      name: "キーボードキャプチャエリア。キーを押してください。",
    });
    await expect(captureArea).toBeVisible();

    // 初期メッセージが表示される
    await expect(page.getByText("キーボードのキーを押してください")).toBeVisible();

    // 履歴セクションが表示される
    await expect(page.getByRole("heading", { name: /キー履歴/ })).toBeVisible();
  });

  test("キーを押すとイベント情報が表示される", async ({ page }) => {
    // 'a' キーを押す
    await page.keyboard.press("a");

    // キーイベント情報セクションが表示される
    await expect(page.getByRole("heading", { name: "キーイベント情報" })).toBeVisible();

    // テーブルに key が表示される
    const table = page.getByRole("table", {
      name: "キーイベントプロパティ一覧",
    });
    await expect(table).toBeVisible();

    // key 行が表示される
    await expect(table.getByRole("rowheader", { name: "key" })).toBeVisible();
    await expect(table.getByRole("rowheader", { name: "code" })).toBeVisible();
  });

  test("Enter キーのイベント情報が正しく表示される", async ({ page }) => {
    // Enter キーを押す
    await page.keyboard.press("Enter");

    // キャプチャエリアに Enter が表示される
    const captureArea = page.getByRole("region", {
      name: "キーボードキャプチャエリア。キーを押してください。",
    });
    await expect(captureArea).toContainText("Enter");
  });

  test("修飾キーの状態バッジが表示される", async ({ page }) => {
    // Shift + A を押す
    await page.keyboard.press("Shift+a");

    // 修飾キー状態グループが表示される
    const modifierGroup = page.getByRole("group", {
      name: "修飾キーの状態",
    });
    await expect(modifierGroup).toBeVisible();
  });

  test("履歴に複数のキーが記録される", async ({ page }) => {
    // 複数のキーを押す
    await page.keyboard.press("a");
    await page.keyboard.press("b");
    await page.keyboard.press("c");

    // 履歴リストが表示される
    const historyList = page.getByRole("list", { name: "キー押下履歴リスト" });
    await expect(historyList).toBeVisible();

    // 少なくとも1件以上の履歴がある
    const items = historyList.getByRole("listitem");
    await expect(items).toHaveCount(3);
  });

  test("クリアボタンで履歴がリセットされる", async ({ page }) => {
    // キーを押して履歴を作成
    await page.keyboard.press("a");
    await page.keyboard.press("b");

    // クリアボタンをクリック
    const clearButton = page.getByRole("button", { name: "履歴をすべてクリア" });
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // 履歴が空になる
    await expect(page.getByText("キーを押すと履歴が表示されます")).toBeVisible();

    // キーイベント情報セクションが消える
    await expect(page.getByRole("heading", { name: "キーイベント情報" })).not.toBeVisible();
  });

  test("10件を超える履歴は最新10件のみ保持される", async ({ page }) => {
    // 12回キーを押す
    const keys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    for (const key of keys) {
      await page.keyboard.press(key);
    }

    // 履歴リストのアイテム数が最大10件
    const historyList = page.getByRole("list", { name: "キー押下履歴リスト" });
    const items = historyList.getByRole("listitem");
    await expect(items).toHaveCount(10);
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("key と code の違い")).toBeVisible();
  });
});
