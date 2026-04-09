import { test, expect } from "@playwright/test";

test.describe(".gitattributes ジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gitattributes");
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/.gitattributes/);
  });

  test("出力セクションタイトルが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /生成された .gitattributes/ })).toBeVisible();
  });

  test("検索入力フィールドが表示される", async ({ page }) => {
    await expect(page.getByPlaceholder("テンプレートを検索...")).toBeVisible();
  });

  test("改行コード自動正規化チップが存在する", async ({ page }) => {
    await expect(page.getByRole("button", { name: /改行コード自動正規化/ })).toBeVisible();
  });

  test("チップを選択すると出力が更新される", async ({ page }) => {
    await page.getByRole("button", { name: /改行コード自動正規化/ }).click();
    const output = page.getByLabel("生成された .gitattributes の内容");
    await expect(output).toContainText("text=auto");
  });

  test("LFSチップを選択するとfilter=lfsが出力に含まれる", async ({ page }) => {
    await page.getByRole("button", { name: /画像ファイル（LFS）/ }).click();
    const output = page.getByLabel("生成された .gitattributes の内容");
    await expect(output).toContainText("filter=lfs");
  });

  test("複数選択すると全内容が出力に含まれる", async ({ page }) => {
    await page.getByRole("button", { name: /改行コード自動正規化/ }).click();
    await page.getByRole("button", { name: /Node.js \/ TypeScript/ }).click();
    const output = page.getByLabel("生成された .gitattributes の内容");
    await expect(output).toContainText("text=auto");
    await expect(output).toContainText("*.ts");
  });

  test("クリアボタンで選択が解除される", async ({ page }) => {
    await page.getByRole("button", { name: /改行コード自動正規化/ }).click();
    await page.getByRole("button", { name: "クリア" }).click();
    const output = page.getByLabel("生成された .gitattributes の内容");
    await expect(output).not.toContainText("text=auto");
  });

  test("コピーボタンが未選択時は無効", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: /コピー/ });
    await expect(copyBtn).toBeDisabled();
  });

  test("ダウンロードボタンが未選択時は無効", async ({ page }) => {
    const downloadBtn = page.getByRole("button", { name: /ダウンロード/ });
    await expect(downloadBtn).toBeDisabled();
  });

  test("チップ選択後にコピーボタンが有効になる", async ({ page }) => {
    await page.getByRole("button", { name: /改行コード自動正規化/ }).click();
    const copyBtn = page.getByRole("button", { name: /コピー/ });
    await expect(copyBtn).toBeEnabled();
  });

  test("チップ選択後にダウンロードボタンが有効になる", async ({ page }) => {
    await page.getByRole("button", { name: /改行コード自動正規化/ }).click();
    const downloadBtn = page.getByRole("button", { name: /ダウンロード/ });
    await expect(downloadBtn).toBeEnabled();
  });

  test("検索フィルターでテンプレートが絞り込まれる", async ({ page }) => {
    await page.getByPlaceholder("テンプレートを検索...").fill("Python");
    await expect(page.getByRole("button", { name: /Python/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Node.js/ })).not.toBeVisible();
  });

  test("存在しない検索語で「見つかりませんでした」が表示される", async ({ page }) => {
    await page.getByPlaceholder("テンプレートを検索...").fill("existnothing12345");
    await expect(page.getByRole("status")).toContainText(
      "一致するテンプレートが見つかりませんでした",
    );
  });

  test("ナビゲーションから .gitattributes ページにアクセスできる", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: ".gitattributes生成" }).first().click();
    await expect(page).toHaveURL(/\/gitattributes/);
  });
});
