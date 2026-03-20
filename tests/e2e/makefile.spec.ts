import { test, expect } from "@playwright/test";

test.describe("Makefileジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/makefile");
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/Makefileジェネレーター/);
  });

  test("セクションタイトルが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "設定" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /生成された Makefile/ })
    ).toBeVisible();
  });

  test("プロジェクト種別のラジオボタンが表示される", async ({ page }) => {
    await expect(
      page.getByRole("radio", { name: /Node\.js/ })
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /Python/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Go/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Rust/ })).toBeVisible();
  });

  test("アプリケーション名入力フィールドが表示される", async ({ page }) => {
    await expect(
      page.getByRole("textbox", { name: "アプリケーション名" })
    ).toBeVisible();
  });

  test("オプションのチェックボックスが表示される", async ({ page }) => {
    await expect(
      page.getByRole("checkbox", { name: /リント・フォーマットターゲットを含む/ })
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: /Dockerターゲットを含む/ })
    ).toBeVisible();
  });

  test("初期状態でNode.jsが選択されている", async ({ page }) => {
    const nodejsRadio = page.getByRole("radio", { name: /Node\.js/ });
    await expect(nodejsRadio).toBeChecked();
  });

  test("Node.jsを選択するとMakefileが生成される", async ({ page }) => {
    const nodejsRadio = page.getByRole("radio", { name: /Node\.js/ });
    await nodejsRadio.check();
    const output = page.getByRole("textbox", {
      name: "生成されたMakefileの内容",
    });
    await expect(output).toContainText("npm install");
    await expect(output).toContainText("npm run build");
  });

  test("Pythonを選択するとMakefileが生成される", async ({ page }) => {
    const pythonRadio = page.getByRole("radio", { name: /Python/ });
    await pythonRadio.check();
    const output = page.getByRole("textbox", {
      name: "生成されたMakefileの内容",
    });
    await expect(output).toContainText("pytest");
    await expect(output).toContainText("venv");
  });

  test("Goを選択するとMakefileが生成される", async ({ page }) => {
    const goRadio = page.getByRole("radio", { name: /Go/ });
    await goRadio.check();
    const output = page.getByRole("textbox", {
      name: "生成されたMakefileの内容",
    });
    await expect(output).toContainText("go build");
    await expect(output).toContainText("go test");
  });

  test("アプリ名を変更するとMakefileに反映される", async ({ page }) => {
    const appNameInput = page.getByRole("textbox", {
      name: "アプリケーション名",
    });
    await appNameInput.clear();
    await appNameInput.fill("myapp");
    const output = page.getByRole("textbox", {
      name: "生成されたMakefileの内容",
    });
    await expect(output).toContainText("myapp");
  });

  test("Dockerオプションを有効にするとdocker-buildターゲットが追加される", async ({
    page,
  }) => {
    const dockerCheckbox = page.getByRole("checkbox", {
      name: /Dockerターゲットを含む/,
    });
    await dockerCheckbox.check();
    const output = page.getByRole("textbox", {
      name: "生成されたMakefileの内容",
    });
    await expect(output).toContainText("docker-build:");
    await expect(output).toContainText("docker run");
  });

  test("Dockerオプションを無効にするとdocker-buildターゲットが削除される", async ({
    page,
  }) => {
    const dockerCheckbox = page.getByRole("checkbox", {
      name: /Dockerターゲットを含む/,
    });
    await dockerCheckbox.check();
    await dockerCheckbox.uncheck();
    const output = page.getByRole("textbox", {
      name: "生成されたMakefileの内容",
    });
    await expect(output).not.toContainText("docker-build:");
  });

  test("helpターゲットが常に含まれる", async ({ page }) => {
    const output = page.getByRole("textbox", {
      name: "生成されたMakefileの内容",
    });
    await expect(output).toContainText("help:");
  });

  test(".PHONYが含まれる", async ({ page }) => {
    const output = page.getByRole("textbox", {
      name: "生成されたMakefileの内容",
    });
    await expect(output).toContainText(".PHONY:");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Makefileをクリップボードにコピー" })
    ).toBeVisible();
  });

  test("ダウンロードボタンが存在する", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Makefileをダウンロード" })
    ).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText("タブ文字必須")).toBeVisible();
  });
});
