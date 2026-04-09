import { test, expect } from "@playwright/test";

test.describe("cURL → fetch 変換ツール", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/curl-to-fetch");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /cURL.*fetch/ })).toBeVisible();
    await expect(page.getByLabel("cURLコマンドを入力")).toBeVisible();
  });

  test("cURLコマンドを入力するとfetchコードが生成される", async ({ page }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    await input.fill("curl 'https://api.example.com/users' -H 'Accept: application/json'");

    const output = page.getByLabel("変換されたコード");
    await expect(output).toContainText("fetch");
    await expect(output).toContainText("https://api.example.com/users");
    await expect(output).toContainText("'Accept': 'application/json'");
  });

  test("axiosモードに切り替えるとaxiosコードが生成される", async ({ page }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    await input.fill("curl 'https://api.example.com'");

    await page.getByLabel("axios", { exact: true }).check();

    const output = page.getByLabel("変換されたコード");
    await expect(output).toContainText("axios");
    await expect(output).toContainText("import axios from 'axios'");
  });

  test("TypeScriptオプションで型注釈が追加される", async ({ page }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    await input.fill("curl 'https://api.example.com'");

    await page.getByLabel("TypeScript").check();

    const output = page.getByLabel("変換されたコード");
    await expect(output).toContainText(": Response");
  });

  test("サンプルボタンをクリックするとサンプルが読み込まれる", async ({ page }) => {
    await page.getByLabel("POST JSONのサンプルを読み込む").click();

    const input = page.getByLabel("cURLコマンドを入力");
    await expect(input).not.toHaveValue("");

    const output = page.getByLabel("変換されたコード");
    await expect(output).toContainText("POST");
    await expect(output).toContainText("JSON.stringify");
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    await input.fill("curl 'https://api.example.com'");

    await page.getByRole("button", { name: "クリア" }).click();

    await expect(input).toHaveValue("");
  });

  test("コピーボタンをクリックするとトーストが表示される", async ({ page }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    await input.fill("curl 'https://api.example.com'");

    await page.getByRole("button", { name: "コピー" }).click();

    await expect(page.getByText("コードをコピーしました")).toBeVisible();
  });

  test("ページタイトルが正しく設定されている", async ({ page }) => {
    await expect(page).toHaveTitle(/cURL.*fetch/);
  });
});
