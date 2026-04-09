import { test, expect } from "@playwright/test";

test.describe("Gitignoreジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gitignore");
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/Gitignoreジェネレーター/);
  });

  test("セクションタイトルが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "テンプレート選択" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /生成された .gitignore/ })).toBeVisible();
  });

  test("検索入力フィールドが表示される", async ({ page }) => {
    await expect(page.getByPlaceholder("テンプレートを検索...")).toBeVisible();
  });

  test("Node.jsチェックボックスが存在する", async ({ page }) => {
    await expect(page.getByLabel("Node.jsを選択")).toBeVisible();
  });

  test("VSCodeチェックボックスが存在する", async ({ page }) => {
    await expect(page.getByLabel("VSCodeを選択")).toBeVisible();
  });

  test("テンプレートを選択すると出力が更新される", async ({ page }) => {
    const nodeCheckbox = page.getByLabel("Node.jsを選択");
    await nodeCheckbox.check();
    const output = page.getByRole("textbox", {
      name: "生成された.gitignoreの内容",
    });
    await expect(output).toContainText("node_modules/");
  });

  test("セクションヘッダーが出力に含まれる", async ({ page }) => {
    const nodeCheckbox = page.getByLabel("Node.jsを選択");
    await nodeCheckbox.check();
    const output = page.getByRole("textbox", {
      name: "生成された.gitignoreの内容",
    });
    await expect(output).toContainText("# === Node.js ===");
  });

  test("複数選択すると全内容が出力に含まれる", async ({ page }) => {
    await page.getByLabel("Node.jsを選択").check();
    await page.getByLabel("Pythonを選択").check();
    const output = page.getByRole("textbox", {
      name: "生成された.gitignoreの内容",
    });
    await expect(output).toContainText("node_modules/");
    await expect(output).toContainText("__pycache__/");
  });

  test("クリアボタンで選択が解除される", async ({ page }) => {
    await page.getByLabel("Node.jsを選択").check();
    await page.getByRole("button", { name: /クリア/ }).click();
    const output = page.getByRole("textbox", {
      name: "生成された.gitignoreの内容",
    });
    await expect(output).toHaveValue("");
  });

  test("コピーボタンが未選択時は無効", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: /コピー/ });
    await expect(copyBtn).toBeDisabled();
  });

  test("ダウンロードボタンが未選択時は無効", async ({ page }) => {
    const downloadBtn = page.getByRole("button", { name: /ダウンロード/ });
    await expect(downloadBtn).toBeDisabled();
  });

  test("テンプレート選択後にコピーボタンが有効になる", async ({ page }) => {
    await page.getByLabel("Node.jsを選択").check();
    const copyBtn = page.getByRole("button", { name: /コピー/ });
    await expect(copyBtn).toBeEnabled();
  });

  test("テンプレート選択後にダウンロードボタンが有効になる", async ({ page }) => {
    await page.getByLabel("Node.jsを選択").check();
    const downloadBtn = page.getByRole("button", { name: /ダウンロード/ });
    await expect(downloadBtn).toBeEnabled();
  });

  test("検索フィルターでテンプレートが絞り込まれる", async ({ page }) => {
    await page.getByPlaceholder("テンプレートを検索...").fill("Python");
    await expect(page.getByLabel("Pythonを選択")).toBeVisible();
    await expect(page.getByLabel("Node.jsを選択")).not.toBeVisible();
  });

  test("存在しない検索語で「見つかりませんでした」が表示される", async ({ page }) => {
    await page.getByPlaceholder("テンプレートを検索...").fill("existnothing12345");
    await expect(page.getByRole("status")).toContainText(
      "一致するテンプレートが見つかりませんでした",
    );
  });

  test("ナビゲーションからGitignoreページにアクセスできる", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Gitignore生成" }).first().click();
    await expect(page).toHaveURL(/\/gitignore/);
  });
});
