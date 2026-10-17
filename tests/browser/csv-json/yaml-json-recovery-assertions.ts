import { expect, type Page, type TestInfo } from "@playwright/test";

export const yamlJsonFailures = [
  { mode: "yaml-to-json", value: "name: [", reason: "flow" },
  { mode: "json-to-yaml", value: '{"name":', reason: "無効なJSON形式です" },
  { mode: "yaml-to-json", value: "", reason: "テキストを入力してください" },
  { mode: "json-to-yaml", value: "", reason: "テキストを入力してください" },
  { mode: "yaml-to-json", value: " \n\t ", reason: "テキストを入力してください" },
  { mode: "json-to-yaml", value: " \n\t ", reason: "テキストを入力してください" },
  { mode: "yaml-to-json", value: "# comment only", reason: "YAMLデータが空です" },
  { mode: "yaml-to-json", value: "null", reason: "YAMLデータが空です" },
  { mode: "yaml-to-json", value: "~", reason: "YAMLデータが空です" },
  { mode: "yaml-to-json", value: "[&1 {self: *1}, *1]", reason: "circular" },
] as const;

/** Check the real route component's failure, retained input and successful repair. */
export async function assertYamlJsonRecovery(
  page: Page,
  failure: (typeof yamlJsonFailures)[number],
  testInfo: TestInfo,
  screenshotPrefix: string,
): Promise<void> {
  await page.goto("/yaml-json");
  await page.waitForLoadState("networkidle");
  await page.locator(`input[value="${failure.mode}"]`).check();
  const input = page.locator("#inputText");
  const output = page.locator("#outputText");
  const copy = page.getByRole("button", { name: "出力結果をクリップボードにコピー" });
  const convert = page.getByRole("button", {
    name: failure.mode === "yaml-to-json" ? "YAML → JSON 変換" : "JSON → YAML 変換",
  });
  const error = page.getByRole("alert", { name: "変換エラー", exact: true });
  const valid = failure.mode === "yaml-to-json" ? "name: 田中" : '{"name":"田中"}';
  const repaired = failure.mode === "yaml-to-json" ? "name: 修復済み" : '{"name":"修復済み"}';
  await input.fill(valid);
  await convert.click();
  await expect(output).toHaveValue(/田中/);
  await expect(copy).toBeEnabled();
  const previous = await output.inputValue();

  await input.fill(failure.value);
  await expect(output).toHaveValue(previous);
  await convert.click();
  await expect(output).toHaveValue("");
  await expect(copy).toBeDisabled();
  await expect(input).toHaveValue(failure.value);
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAttribute(
    "aria-describedby",
    "input-help input-error-summary input-error-detail",
  );
  await expect(error).toBeVisible();
  await expect(error).toContainText(failure.reason);
  await expect(error).toContainText("入力を確認して再度変換してください");
  await expect(page.getByRole("main").getByRole("status")).toContainText(failure.reason);
  // The reason remains available after the transient toast has disappeared.
  await expect(page.locator(".toast-error")).toHaveCount(0);
  await expect(error).toBeVisible();
  await expect(input).toHaveAccessibleDescription(new RegExp(failure.reason));
  await expect(input).toHaveAccessibleDescription(/入力を確認して再度変換してください/);
  if (failure.reason === "flow" || failure.reason === "無効なJSON形式です") {
    await error.scrollIntoViewIfNeeded();
    await expect(page.locator(".tool-container")).toHaveCSS("opacity", "1");
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflows).toBe(false);
    await testInfo.attach(`${screenshotPrefix}-${failure.mode}-${page.viewportSize()?.width}`, {
      body: await page.screenshot({
        path: `test-results/${screenshotPrefix}-${failure.mode}-${page.viewportSize()?.width}.png`,
        fullPage: true,
        animations: "disabled",
      }),
      contentType: "image/png",
    });
  }

  await input.fill(repaired);
  await convert.click();
  await expect(input).toHaveValue(repaired);
  await expect(output).toHaveValue(/修復済み/);
  await expect(output).toHaveAttribute("readonly", "");
  await expect(copy).toBeEnabled();
  await expect(error).toHaveCount(0);
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAttribute("aria-describedby", "input-help");
  await expect(input).toHaveAccessibleDescription(
    failure.mode === "yaml-to-json"
      ? "YAMLデータを入力して変換ボタンを押してください"
      : "JSONデータを入力して変換ボタンを押してください",
  );

  await page.getByRole("button", { name: "入力と出力をクリア", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(output).toHaveValue("");
  await expect(copy).toBeDisabled();
  await expect(input).toBeFocused();
}
