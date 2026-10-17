import { test, expect } from "@playwright/test";

const source = Array.from({ length: 30 }, (_, index) => `same-${index + 1}`);
const revised = [...source];
revised[14] = "changed-15";

test.describe("Diff context and original line numbers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/diff");
    await page.getByLabel("元のテキスト", { exact: true }).fill(source.join("\n"));
    await page.getByLabel("新しいテキスト", { exact: true }).fill(revised.join("\n"));
    await page.getByRole("button", { name: "差分を比較", exact: true }).click();
  });

  test("folds, expands with the keyboard, restores focus, and copies every line", async ({
    page,
  }) => {
    const rows = page.locator("tr.diff-line");
    await expect(rows).toHaveCount(31);
    await page.getByLabel("変更箇所の前後3行だけ表示", { exact: true }).check();
    await expect(rows).toHaveCount(8);
    const expand = page.getByRole("button", {
      name: "未変更の11行（元1〜11行、新1〜11行）を表示",
      exact: true,
    });
    await expand.focus();
    await page.keyboard.press("Enter");
    const collapse = page.getByRole("button", {
      name: "未変更の11行（元1〜11行、新1〜11行）を折りたたむ",
      exact: true,
    });
    await expect(collapse).toBeFocused();
    await expect(collapse).toHaveAttribute("aria-expanded", "true");
    await expect(rows).toHaveCount(19);
    await page.keyboard.press("Space");
    await expect(expand).toBeFocused();
    await expect(rows).toHaveCount(8);
    const removed = page.locator("tr.diff-line-removed");
    const added = page.locator("tr.diff-line-added");
    await expect(removed.locator("td").nth(0)).toHaveText("15");
    await expect(removed.locator("td").nth(1)).toBeEmpty();
    await expect(added.locator("td").nth(0)).toBeEmpty();
    await expect(added.locator("td").nth(1)).toHaveText("15");
    await page
      .getByRole("button", { name: "差分結果をクリップボードにコピー", exact: true })
      .click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    const expected = [
      ...source.slice(0, 14).map((line) => `  ${line}`),
      "- same-15",
      "+ changed-15",
      ...source.slice(15).map((line) => `  ${line}`),
    ].join("\n");
    expect(copied).toBe(expected);
    await expect(page.getByLabel("元のテキスト", { exact: true })).toHaveValue(source.join("\n"));
  });

  test("handles a mobile viewport, display changes, repeated comparisons and reset", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const mode = page.getByLabel("変更箇所の前後3行だけ表示", { exact: true });
    await mode.check();
    await page.locator(".diff-context-toggle").first().click();
    await page.getByRole("button", { name: "差分を比較", exact: true }).click();
    await expect(page.locator(".diff-context-toggle").first()).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await mode.uncheck();
    await expect(page.locator("tr.diff-line")).toHaveCount(31);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole("button", { name: "入力と結果をクリア", exact: true }).click();
    await expect(page.getByRole("table", { name: "元と新しい行番号付きの差分" })).toHaveCount(0);
    await expect(page.getByLabel("元のテキスト", { exact: true })).toBeFocused();
    await page.getByRole("button", { name: "サンプルデータを読み込む", exact: true }).click();
    await page.getByRole("button", { name: "差分を比較", exact: true }).click();
    await expect(page.getByRole("table", { name: "元と新しい行番号付きの差分" })).toBeVisible();
    await expect(page.locator(".diff-context-toggle")).toHaveCount(0);
  });

  test("supports a new-only blank/Unicode input and an identical result", async ({ page }) => {
    await page.getByLabel("元のテキスト", { exact: true }).fill("");
    await page.getByLabel("新しいテキスト", { exact: true }).fill("\n  日本語\t\n");
    await page.getByRole("button", { name: "差分を比較", exact: true }).click();
    await page.getByLabel("変更箇所の前後3行だけ表示", { exact: true }).check();
    await expect(page.locator("tr.diff-line-added")).toHaveCount(3);
    await expect(page.locator(".diff-context-toggle")).toHaveCount(0);
    await page.getByLabel("元のテキスト", { exact: true }).fill("same");
    await page.getByLabel("新しいテキスト", { exact: true }).fill("same");
    await page.getByRole("button", { name: "差分を比較", exact: true }).click();
    await expect(page.locator(".diff-no-changes")).toHaveText("差分はありません");
  });
});
