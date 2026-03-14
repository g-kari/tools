import { test, expect } from "@playwright/test";

test.describe("OpenSSLコマンドジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/openssl-builder");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "OpenSSLコマンドジェネレーター" })
    ).toBeVisible();
  });

  test("ページ説明が表示される", async ({ page }) => {
    await expect(page.locator(".tool-description")).toBeVisible();
  });

  test("操作選択ドロップダウンが存在する", async ({ page }) => {
    const operationSelect = page.getByLabel("OpenSSL操作の種類を選択");
    await expect(operationSelect).toBeVisible();
  });

  test("デフォルトでgenrsaが選択されている", async ({ page }) => {
    const operationSelect = page.getByLabel("OpenSSL操作の種類を選択");
    await expect(operationSelect).toHaveValue("genrsa");
  });

  test("コマンドプレビューエリアが存在する", async ({ page }) => {
    const outputArea = page.getByRole("region", {
      name: "生成されたOpenSSLコマンド",
    });
    await expect(outputArea).toBeVisible();
  });

  test("RSA鍵生成コマンドが生成される", async ({ page }) => {
    const operationSelect = page.getByLabel("OpenSSL操作の種類を選択");
    await operationSelect.selectOption("genrsa");
    const outputArea = page.getByRole("region", {
      name: "生成されたOpenSSLコマンド",
    });
    await expect(outputArea).toContainText("openssl genrsa");
  });

  test("EC鍵生成コマンドが生成される", async ({ page }) => {
    const operationSelect = page.getByLabel("OpenSSL操作の種類を選択");
    await operationSelect.selectOption("ecparam");
    const outputArea = page.getByRole("region", {
      name: "生成されたOpenSSLコマンド",
    });
    await expect(outputArea).toContainText("openssl genpkey");
  });

  test("自己署名証明書生成コマンドが生成される", async ({ page }) => {
    const operationSelect = page.getByLabel("OpenSSL操作の種類を選択");
    await operationSelect.selectOption("req-x509");
    const outputArea = page.getByRole("region", {
      name: "生成されたOpenSSLコマンド",
    });
    await expect(outputArea).toContainText("openssl req");
    await expect(outputArea).toContainText("-x509");
  });

  test("CSR生成コマンドが生成される", async ({ page }) => {
    const operationSelect = page.getByLabel("OpenSSL操作の種類を選択");
    await operationSelect.selectOption("req-csr");
    const outputArea = page.getByRole("region", {
      name: "生成されたOpenSSLコマンド",
    });
    await expect(outputArea).toContainText("openssl req");
    await expect(outputArea).not.toContainText("-x509");
  });

  test("証明書確認コマンドが生成される", async ({ page }) => {
    const operationSelect = page.getByLabel("OpenSSL操作の種類を選択");
    await operationSelect.selectOption("x509-view");
    const outputArea = page.getByRole("region", {
      name: "生成されたOpenSSLコマンド",
    });
    await expect(outputArea).toContainText("openssl x509");
    await expect(outputArea).toContainText("-text");
  });

  test("PKCS12変換コマンドが生成される", async ({ page }) => {
    const operationSelect = page.getByLabel("OpenSSL操作の種類を選択");
    await operationSelect.selectOption("pkcs12");
    const outputArea = page.getByRole("region", {
      name: "生成されたOpenSSLコマンド",
    });
    await expect(outputArea).toContainText("openssl pkcs12");
    await expect(outputArea).toContainText("-export");
  });

  test("サブジェクト情報入力時にコマンドが更新される", async ({ page }) => {
    const operationSelect = page.getByLabel("OpenSSL操作の種類を選択");
    await operationSelect.selectOption("req-x509");

    const cnInput = page.getByLabel("コモンネーム（CN）");
    await cnInput.fill("example.com");

    const outputArea = page.getByRole("region", {
      name: "生成されたOpenSSLコマンド",
    });
    await expect(outputArea).toContainText("CN=example.com");
  });

  test("サンプルを読み込める", async ({ page }) => {
    const sampleSelect = page.getByLabel("サンプルを選択して読み込む");
    await sampleSelect.selectOption("RSA鍵生成");

    const outputArea = page.getByRole("region", {
      name: "生成されたOpenSSLコマンド",
    });
    await expect(outputArea).toContainText("openssl genrsa");
  });

  test("クリアボタンで設定がリセットされる", async ({ page }) => {
    const operationSelect = page.getByLabel("OpenSSL操作の種類を選択");
    await operationSelect.selectOption("ecparam");

    const clearBtn = page.getByRole("button", { name: "設定をクリアする" });
    await clearBtn.click();

    await expect(operationSelect).toHaveValue("genrsa");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    const copyBtn = page.getByRole("button", {
      name: "OpenSSLコマンドをクリップボードにコピーする",
    });
    await expect(copyBtn).toBeVisible();
  });

  test("出力フォーマット切り替えができる", async ({ page }) => {
    const singleLineRadio = page.getByRole("radio", { name: "" }).nth(1);
    await singleLineRadio.check();

    const outputArea = page.getByRole("region", {
      name: "生成されたOpenSSLコマンド",
    });
    const content = await outputArea.textContent();
    expect(content).not.toContain("\\\n");
  });
});
