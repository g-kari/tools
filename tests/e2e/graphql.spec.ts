import { test, expect } from "@playwright/test";

test.describe("GraphQL フォーマッター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/graphql");
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/GraphQL フォーマッター/);
  });

  test("フォームが表示される", async ({ page }) => {
    await expect(page.locator("#inputText")).toBeVisible();
    await expect(page.locator("#outputText")).toBeVisible();
  });

  test("操作モードのラジオボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("radio", { name: "GraphQL を整形する" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "GraphQL を圧縮する" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "GraphQL を検証する" })).toBeVisible();
  });

  test("整形モードで GraphQL クエリを整形できる", async ({ page }) => {
    await page.locator("#inputText").fill("query{user{id name email}}");
    await page.getByRole("button", { name: "GraphQL 整形" }).click();
    const output = await page.locator("#outputText").inputValue();
    expect(output).toContain("query {");
    expect(output).toContain("  user {");
    expect(output.split("\n").length).toBeGreaterThan(1);
  });

  test("圧縮モードで GraphQL を圧縮できる", async ({ page }) => {
    await page.getByRole("radio", { name: "GraphQL を圧縮する" }).click();
    await page.locator("#inputText").fill("query {\n  user {\n    id\n    name\n  }\n}");
    await page.getByRole("button", { name: "GraphQL 圧縮" }).click();
    const output = await page.locator("#outputText").inputValue();
    expect(output.split("\n").length).toBe(1);
    expect(output).toContain("query");
  });

  test("検証モードで有効な GraphQL を検証できる", async ({ page }) => {
    await page.getByRole("radio", { name: "GraphQL を検証する" }).click();
    await page.locator("#inputText").fill("query { user { id } }");
    await page.getByRole("button", { name: "GraphQL 検証" }).click();
    const output = await page.locator("#outputText").inputValue();
    expect(output).toContain("✓");
  });

  test("検証モードで無効な GraphQL を検出できる", async ({ page }) => {
    await page.getByRole("radio", { name: "GraphQL を検証する" }).click();
    await page.locator("#inputText").fill("query { user { id }");
    await page.getByRole("button", { name: "GraphQL 検証" }).click();
    const output = await page.locator("#outputText").inputValue();
    expect(output).toContain("✗");
  });

  test("空入力でエラートーストが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "GraphQL 整形" }).click();
    await expect(page.locator(".toast")).toBeVisible();
  });

  test("クリアボタンで入力と出力がクリアされる", async ({ page }) => {
    await page.locator("#inputText").fill("query { user { id } }");
    await page.getByRole("button", { name: "GraphQL 整形" }).click();
    await page.getByRole("button", { name: "入力と出力をクリア" }).click();
    expect(await page.locator("#inputText").inputValue()).toBe("");
    expect(await page.locator("#outputText").inputValue()).toBe("");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "出力結果をクリップボードにコピー" }),
    ).toBeVisible();
  });

  test("モード切り替えで入力と出力がリセットされる", async ({ page }) => {
    await page.locator("#inputText").fill("query { user { id } }");
    await page.getByRole("button", { name: "GraphQL 整形" }).click();
    await page.getByRole("radio", { name: "GraphQL を圧縮する" }).click();
    expect(await page.locator("#inputText").inputValue()).toBe("");
    expect(await page.locator("#outputText").inputValue()).toBe("");
  });

  test("インデント幅オプションが表示される（整形モード）", async ({ page }) => {
    await expect(page.getByRole("radio", { name: "インデント2スペース" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "インデント4スペース" })).toBeVisible();
  });

  test("ヒントカードが表示される", async ({ page }) => {
    await expect(page.locator(".info-box").first()).toBeVisible();
  });
});
