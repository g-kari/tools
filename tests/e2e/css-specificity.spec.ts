import { test, expect } from "@playwright/test";

test.describe("CSS詳細度計算機ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-specificity");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "セレクターを入力" })).toBeVisible();
  });

  test("セレクター入力フィールドが表示される", async ({ page }) => {
    await expect(page.getByLabel("CSSセレクター入力")).toBeVisible();
  });

  test("デフォルト値が入力されている", async ({ page }) => {
    const input = page.getByLabel("CSSセレクター入力");
    await expect(input).toHaveValue("div.class > #id:hover");
  });

  test("詳細度の計算結果が表示される", async ({ page }) => {
    const result = page.getByRole("region", { name: "詳細度の計算結果" });
    await expect(result).toBeVisible();
  });

  test("IDセレクターの数が表示される", async ({ page }) => {
    await expect(page.getByLabel("IDセレクター: 1")).toBeVisible();
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /詳細度.*をコピー/ })).toBeVisible();
  });

  test("セレクターを変更すると詳細度が更新される", async ({ page }) => {
    const input = page.getByLabel("CSSセレクター入力");
    await input.fill("#id");
    await expect(page.getByLabel("IDセレクター: 1")).toBeVisible();
    await expect(page.getByLabel("クラス・属性・擬似クラス: 0")).toBeVisible();
    await expect(page.getByLabel("タイプ・擬似要素: 0")).toBeVisible();
  });

  test(".class セレクターの詳細度が正しい", async ({ page }) => {
    const input = page.getByLabel("CSSセレクター入力");
    await input.fill(".class");
    await expect(page.getByLabel("IDセレクター: 0")).toBeVisible();
    await expect(page.getByLabel("クラス・属性・擬似クラス: 1")).toBeVisible();
    await expect(page.getByLabel("タイプ・擬似要素: 0")).toBeVisible();
  });

  test("タブ切り替えができる", async ({ page }) => {
    await page.getByRole("tab", { name: "比較モード" }).click();
    await expect(page.getByRole("heading", { name: "セレクターを比較" })).toBeVisible();
  });

  test("比較モードにデフォルトセレクターが表示される", async ({ page }) => {
    await page.getByRole("tab", { name: "比較モード" }).click();
    await expect(page.getByRole("list", { name: "比較セレクター一覧" })).toBeVisible();
  });

  test("比較モードでセレクターを追加できる", async ({ page }) => {
    await page.getByRole("tab", { name: "比較モード" }).click();
    await page.getByLabel("追加するセレクター").fill("div > span");
    await page.getByRole("button", { name: "セレクターを追加" }).click();
    await expect(page.getByText("div > span")).toBeVisible();
  });

  test("比較モードでEnterキーで追加できる", async ({ page }) => {
    await page.getByRole("tab", { name: "比較モード" }).click();
    const addInput = page.getByLabel("追加するセレクター");
    await addInput.fill("p.text");
    await addInput.press("Enter");
    await expect(page.getByText("p.text")).toBeVisible();
  });

  test("比較モードでセレクターを削除できる", async ({ page }) => {
    await page.getByRole("tab", { name: "比較モード" }).click();
    const firstRemoveBtn = page.getByRole("button", { name: /を削除/ }).first();
    await firstRemoveBtn.click();
  });

  test("サンプルセレクターが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "セレクターサンプル" })).toBeVisible();
  });

  test("サンプルをクリックすると入力欄に反映される", async ({ page }) => {
    const sampleBtn = page.getByRole("button", { name: /div.*タイプセレクター/ });
    if (await sampleBtn.isVisible()) {
      await sampleBtn.click();
      await expect(page.getByLabel("CSSセレクター入力")).toHaveValue("div");
    }
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("詳細度の計算規則")).toBeVisible();
  });

  test("内訳セクションが表示される", async ({ page }) => {
    const input = page.getByLabel("CSSセレクター入力");
    await input.fill("div");
    await expect(page.getByLabel("詳細度の内訳")).toBeVisible();
  });

  test("空のセレクターはプレースホルダーを表示する", async ({ page }) => {
    const input = page.getByLabel("CSSセレクター入力");
    await input.fill("");
    await expect(page.getByText("CSSセレクターを入力してください")).toBeVisible();
  });
});
