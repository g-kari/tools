import { expect, type Page } from "@playwright/test";

export const malformedCsvSqlInputs = [
  { name: "unclosed", input: 'id,name\n1,"alpha', reason: "引用符が閉じていません" },
  { name: "bare-quote", input: 'id,name\n1,al"pha', reason: "値は全体を引用符で囲み" },
  { name: "after-quote", input: 'id,name\n1,"alpha"x', reason: "閉じた引用符の後には" },
] as const;

/** Exercise the real route's live output, accessible error and correction without network data. */
export async function assertCsvSqlRecovery(
  page: Page,
  malformed: (typeof malformedCsvSqlInputs)[number],
  screenshotPrefix: string,
): Promise<void> {
  await page.goto("/csv-sql");
  const input = page.getByLabel("CSV入力", { exact: true });
  const output = page.getByLabel("生成されたSQL INSERT文", { exact: true });
  const statistics = page.getByLabel("生成結果の統計", { exact: true });
  const copy = page.getByRole("button", { name: "SQLをコピー", exact: true });
  const error = page.getByRole("alert", { name: "エラー", exact: true });
  await input.fill("id,name\n1,alpha");
  await expect(output).toHaveValue(/\(1, 'alpha'\)/);
  await expect(statistics).toContainText("1 行");
  await expect(copy).toBeEnabled();

  await input.fill(malformed.input);
  await expect(error).toBeVisible();
  await expect(error).toContainText("2番目のレコードの2列目");
  await expect(error).toContainText(malformed.reason);
  await expect(input).toHaveValue(malformed.input);
  await expect(input).toBeFocused();
  await expect(output).toHaveCount(0);
  await expect(statistics).toHaveCount(0);
  await expect(copy).toBeDisabled();
  await error.scrollIntoViewIfNeeded();
  await expect(page.locator(".tool-container")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: `test-results/${screenshotPrefix}-${malformed.name}-${page.viewportSize()?.width}.png`,
    fullPage: true,
    animations: "disabled",
  });

  const corrected = 'id,name,note\n1,"alpha,beta","line1\n""line2"""\n2,gamma,';
  await input.fill(corrected);
  await expect(input).toHaveValue(corrected);
  await expect(input).toBeFocused();
  await expect(error).toHaveCount(0);
  await expect(output).toHaveValue(/\(1, 'alpha,beta', 'line1\n"line2"'\)/);
  await expect(output).toHaveValue(/\(2, 'gamma', NULL\)/);
  await expect(statistics).toContainText("2 行");
  await expect(statistics).toContainText("3 列");
  await expect(copy).toBeEnabled();

  await page.getByRole("button", { name: "入力をクリア", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(output).toHaveCount(0);
  await expect(statistics).toHaveCount(0);
  await expect(error).toHaveCount(0);
  await expect(copy).toBeDisabled();
}
