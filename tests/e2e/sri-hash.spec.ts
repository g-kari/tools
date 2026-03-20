import { test, expect } from "@playwright/test";

test.describe("SRI Hash Generator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sri-hash");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/SRI ハッシュ生成/);
    await expect(
      page.getByRole("button", { name: "テキスト" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "ファイル" }),
    ).toBeVisible();
  });

  test("テキスト入力でハッシュが生成される", async ({ page }) => {
    const textarea = page.getByLabel("リソースのコンテンツ");
    await textarea.fill("console.log('hello');");

    // SHA-256, SHA-384, SHA-512 の結果が表示される
    await expect(page.getByLabel("SHA-256 SRI ハッシュ")).toBeVisible();
    await expect(page.getByLabel("SHA-384 SRI ハッシュ")).toBeVisible();
    await expect(page.getByLabel("SHA-512 SRI ハッシュ")).toBeVisible();
  });

  test("integrity 値が正しいフォーマットで表示される", async ({ page }) => {
    const textarea = page.getByLabel("リソースのコンテンツ");
    await textarea.fill("test");

    await page.waitForTimeout(300);

    // SHA-384 integrity 値が sha384- で始まる
    const sha384Item = page.getByLabel("SHA-384 SRI ハッシュ");
    const codeEl = sha384Item.locator("code");
    const value = await codeEl.textContent();
    expect(value).toMatch(/^sha384-[A-Za-z0-9+/]+=*$/);
  });

  test("推奨バッジが SHA-384 に表示される", async ({ page }) => {
    await expect(page.getByText("推奨")).toBeVisible();
  });

  test("空の状態でメッセージが表示される", async ({ page }) => {
    await expect(
      page.getByText("JS/CSS のコンテンツを入力すると SRI ハッシュが生成されます"),
    ).toBeVisible();
  });

  test("ファイルタブに切り替えができる", async ({ page }) => {
    await page.getByRole("tab", { name: "ファイル" }).click();
    await expect(
      page.getByLabel("ファイルをドロップするか、クリックして選択"),
    ).toBeVisible();
  });

  test("テキスト入力後に HTML スニペットセクションが表示される", async ({
    page,
  }) => {
    const textarea = page.getByLabel("リソースのコンテンツ");
    await textarea.fill("body { color: red; }");

    await page.waitForTimeout(300);

    await expect(page.getByText("HTML スニペット生成")).toBeVisible();
    await expect(page.getByLabel("リソース URL（任意）")).toBeVisible();
  });

  test("script/stylesheet の種別を切り替えられる", async ({ page }) => {
    const textarea = page.getByLabel("リソースのコンテンツ");
    await textarea.fill("alert(1)");
    await page.waitForTimeout(300);

    // デフォルトは script
    const scriptRadio = page.getByLabel("JavaScript (script タグ)");
    await expect(scriptRadio).toBeChecked();

    // stylesheet に切り替え
    await page.getByLabel("CSS (link タグ)").click();
    const snippets = page.locator(".sri-snippet-code");
    const firstSnippet = await snippets.first().textContent();
    expect(firstSnippet).toContain("link rel");
  });

  test("crossorigin 属性の切り替えができる", async ({ page }) => {
    const textarea = page.getByLabel("リソースのコンテンツ");
    await textarea.fill("test");
    await page.waitForTimeout(300);

    // デフォルトは anonymous
    await expect(
      page.getByLabel("anonymous（認証情報なし）"),
    ).toBeChecked();

    // use-credentials に切り替え
    await page.getByLabel("use-credentials（認証情報あり）").click();
    const snippets = page.locator(".sri-snippet-code");
    const firstSnippet = await snippets.first().textContent();
    expect(firstSnippet).toContain("use-credentials");
  });

  test("URL 入力がスニペットに反映される", async ({ page }) => {
    const textarea = page.getByLabel("リソースのコンテンツ");
    await textarea.fill("test");
    await page.waitForTimeout(300);

    const urlInput = page.getByLabel("リソース URL（任意）");
    await urlInput.fill("https://cdn.example.com/app.js");

    const snippets = page.locator(".sri-snippet-code");
    const firstSnippet = await snippets.first().textContent();
    expect(firstSnippet).toContain("https://cdn.example.com/app.js");
  });

  test("Tips カードが表示される", async ({ page }) => {
    await expect(page.getByText("SRI とは")).toBeVisible();
    await expect(page.getByText("使い方")).toBeVisible();
  });

  test("アクセシビリティ: aria-label が設定されている", async ({ page }) => {
    // 入力モードタブに role="tablist" がある
    await expect(page.getByRole("tablist", { name: "入力モード" })).toBeVisible();
  });
});
