import { expect, test } from "@playwright/test";

test.describe("文字列類似度計算ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/string-similarity");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /文字列類似度計算/ })).toBeVisible();
  });

  test("入力エリア A・B が表示される", async ({ page }) => {
    await expect(page.locator("#strsim-input-a")).toBeVisible();
    await expect(page.locator("#strsim-input-b")).toBeVisible();
  });

  test("初期状態では結果エリアに説明文が表示される", async ({ page }) => {
    await expect(
      page.getByText("文字列 A・B を入力すると各指標をリアルタイムで計算します"),
    ).toBeVisible();
  });

  test("同じ文字列を入力すると完全一致バナーが表示される", async ({ page }) => {
    await page.locator("#strsim-input-a").fill("hello");
    await page.locator("#strsim-input-b").fill("hello");
    await expect(page.getByText(/完全一致/)).toBeVisible();
  });

  test("異なる文字列で各指標カードが表示される", async ({ page }) => {
    await page.locator("#strsim-input-a").fill("kitten");
    await page.locator("#strsim-input-b").fill("sitting");
    await expect(page.getByText("Levenshtein 類似度")).toBeVisible();
    await expect(page.getByText("Jaro-Winkler 類似度")).toBeVisible();
    await expect(page.getByText(/コサイン類似度/)).toBeVisible();
    await expect(page.getByText("Hamming 距離")).toBeVisible();
  });

  test("Levenshtein 編集距離カードが表示される", async ({ page }) => {
    await page.locator("#strsim-input-a").fill("kitten");
    await page.locator("#strsim-input-b").fill("sitting");
    await expect(page.getByText("Levenshtein 編集距離")).toBeVisible();
    // kitten→sitting の距離は 3
    await expect(page.getByText("3")).toBeVisible();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#strsim-input-a").fill("hello");
    await page.locator("#strsim-input-b").fill("world");
    await page.getByRole("button", { name: /クリア/ }).click();
    await expect(page.locator("#strsim-input-a")).toHaveValue("");
    await expect(page.locator("#strsim-input-b")).toHaveValue("");
  });

  test("クリアボタンは入力なしのとき無効", async ({ page }) => {
    await expect(page.getByRole("button", { name: /クリア/ })).toBeDisabled();
  });

  test("入力があるとクリアボタンが有効になる", async ({ page }) => {
    await page.locator("#strsim-input-a").fill("test");
    await expect(page.getByRole("button", { name: /クリア/ })).toBeEnabled();
  });

  test("結果があると「結果をコピー」ボタンが表示される", async ({ page }) => {
    await page.locator("#strsim-input-a").fill("abc");
    await page.locator("#strsim-input-b").fill("xyz");
    await expect(page.getByRole("button", { name: /結果をコピー/ })).toBeVisible();
  });

  test("同長の文字列では Hamming 距離が表示される", async ({ page }) => {
    await page.locator("#strsim-input-a").fill("ABCDE");
    await page.locator("#strsim-input-b").fill("ABXYE");
    // Hamming 距離 = 2
    await expect(page.getByText("Hamming 距離")).toBeVisible();
    await expect(page.getByText("2")).toBeVisible();
  });

  test("長さの異なる文字列では Hamming が非対応と表示される", async ({ page }) => {
    await page.locator("#strsim-input-a").fill("abc");
    await page.locator("#strsim-input-b").fill("abcd");
    await expect(page.getByText(/文字列長が異なるため非対応/)).toBeVisible();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("Levenshtein距離")).toBeVisible();
    await expect(page.getByText("Jaro-Winkler類似度")).toBeVisible();
  });
});
