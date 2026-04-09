import { test, expect } from "@playwright/test";

test.describe("WebSocket テスター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/websocket");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/WebSocket テスター/);
  });

  test("URL入力フィールドが表示される", async ({ page }) => {
    const input = page.getByLabel("WebSocket接続先URL");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("wss://echo.websocket.org");
  });

  test("初期状態で接続状態が「切断」になっている", async ({ page }) => {
    await expect(page.getByText("切断")).toBeVisible();
  });

  test("接続ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "接続" })).toBeVisible();
  });

  test("メッセージタイプ選択タブが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "テキスト" })).toBeVisible();
    await expect(page.getByRole("button", { name: "JSON" })).toBeVisible();
  });

  test("メッセージログエリアが表示される", async ({ page }) => {
    await expect(page.getByRole("log")).toBeVisible();
  });

  test("自動スクロールチェックボックスが表示される", async ({ page }) => {
    await expect(page.getByLabel("自動スクロールを有効にする")).toBeVisible();
  });

  test("統計情報が表示される", async ({ page }) => {
    await expect(page.getByText("送信: 0")).toBeVisible();
    await expect(page.getByText("受信: 0")).toBeVisible();
    await expect(page.getByText("合計: 0")).toBeVisible();
  });

  test("無効なURLで接続ボタンがdisabledになる", async ({ page }) => {
    const input = page.getByLabel("WebSocket接続先URL");
    await input.fill("");
    const connectBtn = page.getByRole("button", { name: "接続" });
    await expect(connectBtn).toBeDisabled();
  });

  test("JSONタブを選択するとプレースホルダーが変わる", async ({ page }) => {
    await page.getByRole("button", { name: "JSON" }).click();
    const textarea = page.getByLabel("送信するメッセージ");
    await expect(textarea).toHaveAttribute("placeholder", '{"key": "value"}');
  });

  test("ログクリアボタンが初期状態でdisabledになっている", async ({ page }) => {
    await expect(page.getByRole("button", { name: "ログをクリア" })).toBeDisabled();
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("テスト用エコーサーバー")).toBeVisible();
  });

  test("h1見出しが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "WebSocket テスター" })).toBeVisible();
  });
});
