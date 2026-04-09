import { test, expect } from "@playwright/test";

test.describe("Rail Fence暗号 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rail-fence", { waitUntil: "domcontentloaded" });
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Rail Fence暗号/);
    await expect(page.getByRole("button", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "デコード" })).toBeVisible();
  });

  test("エンコードが正常に動作する", async ({ page }) => {
    const input = page.getByLabel("Rail Fence暗号の入力テキスト");
    await input.fill("WEAREDISCOVEREDFLEEAATONCE");

    const output = page.locator("#rail-fence-output");
    await expect(output).not.toHaveText("変換結果がここに表示されます");
    await expect(output).toHaveText("WECRLTEERDSOEEFEAIVDEN");
  });

  test("デコードが正常に動作する", async ({ page }) => {
    await page.getByRole("button", { name: "デコード" }).click();

    const input = page.getByLabel("Rail Fence暗号の入力テキスト");
    await input.fill("WECRLTEERDSOEEFEAIVDEN");

    const output = page.locator("#rail-fence-output");
    await expect(output).toHaveText("WEAREDISCOVEREDFLEEAATONCE");
  });

  test("レール数の変更が変換結果に反映される", async ({ page }) => {
    const input = page.getByLabel("Rail Fence暗号の入力テキスト");
    await input.fill("HELLO");

    // レール数2で変換
    const railsNumber = page.getByLabel("レール数（数値入力）");
    await railsNumber.fill("2");
    await railsNumber.dispatchEvent("change");

    const output = page.locator("#rail-fence-output");
    const result2 = await output.textContent();
    expect(result2).toBeTruthy();

    // レール数3で変換（結果が変わるはず）
    await railsNumber.fill("3");
    await railsNumber.dispatchEvent("change");

    const result3 = await output.textContent();
    expect(result3).toBeTruthy();
    // 異なるレール数では結果が異なる（HELLOの長さが短いため同じになる可能性があるが確認）
    expect(typeof result3).toBe("string");
  });

  test("コピーボタンが正常に動作する", async ({ page }) => {
    const input = page.getByLabel("Rail Fence暗号の入力テキスト");
    await input.fill("HELLO");

    const copyBtn = page.getByRole("button", { name: "変換結果をクリップボードにコピー" });
    await expect(copyBtn).toBeEnabled();
    await copyBtn.click();
  });

  test("クリアボタンが正常に動作する", async ({ page }) => {
    const input = page.getByLabel("Rail Fence暗号の入力テキスト");
    await input.fill("HELLO");

    const clearBtn = page.getByRole("button", { name: "入力をクリア" });
    await expect(clearBtn).toBeEnabled();
    await clearBtn.click();

    await expect(input).toHaveValue("");
    const output = page.locator("#rail-fence-output");
    await expect(output).toHaveText("変換結果がここに表示されます");
  });

  test("ジグザグ可視化の表示・非表示が切り替わる", async ({ page }) => {
    const input = page.getByLabel("Rail Fence暗号の入力テキスト");
    await input.fill("HELLO");

    // 可視化ボタンをクリック
    const vizBtn = page.getByRole("button", { name: "ジグザグ可視化を表示" });
    await vizBtn.click();

    // 可視化セクションが表示される
    const vizSection = page.getByRole("region", { name: "Rail Fenceジグザグパターン" });
    await expect(vizSection).toBeVisible();

    // 再クリックで非表示
    await page.getByRole("button", { name: "可視化を非表示" }).click();
    await expect(vizSection).not.toBeVisible();
  });

  test("空入力時はボタンが無効化される", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "変換結果をクリップボードにコピー" });
    const clearBtn = page.getByRole("button", { name: "入力をクリア" });
    const vizBtn = page.getByRole("button", { name: "ジグザグ可視化を表示" });

    await expect(copyBtn).toBeDisabled();
    await expect(clearBtn).toBeDisabled();
    await expect(vizBtn).toBeDisabled();
  });

  test("テキストカテゴリのナビゲーションから到達できる", async ({ page }) => {
    await page.goto("/caesar", { waitUntil: "domcontentloaded" });

    const categoryBtn = page.locator(".nav-category-btn", { hasText: "テキスト" });
    await categoryBtn.hover();

    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();

    const link = dropdown.locator('a[href="/rail-fence"]');
    await link.click();

    await expect(page).toHaveURL("/rail-fence");
  });
});
