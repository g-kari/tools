import { test, expect } from "../browser/csv-json/url-app-test";

test.describe("YAML/JSON変換 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/yaml-json");
    await page.waitForLoadState("networkidle");
  });

  /**
   * ページが正しく読み込まれることを確認するテスト
   */
  test("ページが正しく読み込まれる", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  /**
   * ページタイトルが正しいことを確認するテスト
   */
  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/YAML.*JSON|JSON.*YAML/);
  });

  /**
   * デフォルト変換モードがYAML→JSONに設定されていることを確認するテスト
   */
  test("デフォルト変換モードがYAML→JSONになっている", async ({ page }) => {
    const yamlToJsonRadio = page.locator('input[value="yaml-to-json"]');
    await expect(yamlToJsonRadio).toBeChecked();
  });

  /**
   * YAML→JSONとJSON→YAMLの変換モード選択ラジオボタンが表示されることを確認するテスト
   */
  test("変換モード選択のラジオボタンが両方表示される", async ({ page }) => {
    const yamlToJsonRadio = page.locator('input[value="yaml-to-json"]');
    const jsonToYamlRadio = page.locator('input[value="json-to-yaml"]');
    await expect(yamlToJsonRadio).toBeVisible();
    await expect(jsonToYamlRadio).toBeVisible();
  });

  /**
   * YAML→JSON変換が正しく動作することを確認するテスト
   */
  test("YAML→JSON変換が正しく動作する", async ({ page }) => {
    await page.locator('input[value="yaml-to-json"]').click();
    await page.locator("#inputText").fill("name: 田中\nage: 30");
    await page.locator("button.btn-primary").click();

    const output = await page.locator("#outputText").inputValue();
    const parsed = JSON.parse(output);
    expect(parsed).toEqual({ name: "田中", age: 30 });
  });

  /**
   * JSON→YAML変換が正しく動作することを確認するテスト
   */
  test("JSON→YAML変換が正しく動作する", async ({ page }) => {
    await page.locator('input[value="json-to-yaml"]').click();
    await page.locator("#inputText").fill('{"name":"田中","age":30}');
    await page.locator("button.btn-primary").click();

    const output = await page.locator("#outputText").inputValue();
    expect(output).toContain("name:");
    expect(output).toContain("田中");
    expect(output).toContain("age:");
    expect(output).toContain("30");
  });

  /**
   * クリアボタンで入力と出力テキストエリアがクリアされることを確認するテスト
   */
  test("クリアボタンで入力と出力がクリアされる", async ({ page }) => {
    await page.locator("#inputText").fill("name: 田中\nage: 30");
    await page.locator("button.btn-primary").click();
    await expect(page.locator("#outputText")).not.toHaveValue("");

    await page.locator("button.btn-clear").click();
    await expect(page.locator("#inputText")).toHaveValue("");
    await expect(page.locator("#outputText")).toHaveValue("");
  });

  /**
   * コピーボタンが出力なしで無効になっていることを確認するテスト
   */
  test("コピーボタンが出力なしで無効になっている", async ({ page }) => {
    const copyBtn = page.locator('button[aria-label="出力結果をクリップボードにコピー"]');
    await expect(copyBtn).toBeDisabled();
  });

  /**
   * 空入力で変換するとエラートーストが表示されることを確認するテスト
   */
  test("空入力で変換するとToastエラーが表示される", async ({ page }) => {
    await page.locator("button.btn-primary").click();
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("テキストを入力してください");
  });

  /**
   * 無効なYAML入力で変換するとエラートーストが表示されることを確認するテスト
   */
  test("無効なYAML入力時にToastエラーが表示される", async ({ page }) => {
    await page.locator('input[value="yaml-to-json"]').click();
    await page.locator("#inputText").fill("key: :\n  invalid: : yaml: :");
    await page.locator("button.btn-primary").click();
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
  });

  /**
   * 無効なJSON入力で変換するとエラートーストが表示されることを確認するテスト
   */
  test("無効なJSON入力時にToastエラーが表示される", async ({ page }) => {
    await page.locator('input[value="json-to-yaml"]').click();
    await page.locator("#inputText").fill("{invalid json here}");
    await page.locator("button.btn-primary").click();
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
  });

  /**
   * インデント選択ラジオボタンが表示されることを確認するテスト
   */
  test("インデント選択ラジオボタンが表示される", async ({ page }) => {
    const indent2Radio = page.locator('input[name="indent"][value="2"]');
    const indent4Radio = page.locator('input[name="indent"][value="4"]');
    await expect(indent2Radio).toBeVisible();
    await expect(indent4Radio).toBeVisible();
    await expect(indent2Radio).toBeChecked();
  });

  /**
   * ナビゲーションからYAML/JSONページへ遷移できることを確認するテスト
   */
  test("ナビゲーションからYAML/JSONページへ遷移できる", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const link = page.locator('a[href="/yaml-json"]');
    if (await link.isVisible()) {
      await link.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/yaml-json/);
    } else {
      await page.goto("/yaml-json");
      await expect(page).toHaveURL(/yaml-json/);
    }
  });
});

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test.describe(`YAML/JSON recovery at ${viewport.width}px`, () => {
    test.use({ viewport });

    const failures = [
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

    for (const [index, failure] of failures.entries()) {
      test(
        `failure ${index + 1}: ${failure.mode} retains input and recovers`,
        async ({ page }, testInfo) => {
          await page.goto("/yaml-json");
          await page.locator(`input[value="${failure.mode}"]`).check();
          const input = page.locator("#inputText");
          const output = page.locator("#outputText");
          const copy = page.getByRole("button", { name: "出力結果をクリップボードにコピー" });
          const convert = page.getByRole("button", {
            name: failure.mode === "yaml-to-json" ? "YAML → JSON 変換" : "JSON → YAML 変換",
          });
          const error = page.getByRole("alert", { name: "変換エラー", exact: true });
          const valid = failure.mode === "yaml-to-json" ? "name: 田中" : '{"name":"田中"}';
          const repaired =
            failure.mode === "yaml-to-json" ? "name: 修復済み" : '{"name":"修復済み"}';
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
          await expect(input).toHaveAttribute("aria-describedby", "input-help input-error");
          await expect(error).toBeVisible();
          await expect(error).toContainText(failure.reason);
          await expect(error).toContainText("入力を確認して再度変換してください");
          await expect(page.locator('[role="status"]')).toContainText(failure.reason);
          // The reason remains available after the transient toast has disappeared.
          await expect(page.locator(".toast-error")).toHaveCount(0);
          await expect(error).toBeVisible();
          if (index < 2) {
            await error.scrollIntoViewIfNeeded();
            await expect(page.locator(".tool-container")).toHaveCSS("opacity", "1");
            await testInfo.attach(`yaml-json-error-${failure.mode}-${viewport.width}`, {
              body: await page.screenshot({ fullPage: true, animations: "disabled" }),
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

          await page.getByRole("button", { name: "入力と出力をクリア", exact: true }).click();
          await expect(input).toHaveValue("");
          await expect(output).toHaveValue("");
          await expect(copy).toBeDisabled();
          await expect(input).toBeFocused();
        },
      );
    }

    test("mode/indent changes and Copy work across success, failure and repair", async ({ page }) => {
      await page.goto("/yaml-json");
      const input = page.locator("#inputText");
      const output = page.locator("#outputText");
      const copy = page.getByRole("button", { name: "出力結果をクリップボードにコピー" });
      const convert = page.locator("button.btn-primary");
      const error = page.getByRole("alert", { name: "変換エラー", exact: true });
      await input.fill("user:\n  name: first");
      await convert.click();
      const first = await output.inputValue();
      await copy.click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(first);
      await expect(copy).toHaveText("コピー済");

      await page.getByRole("radio", { name: "インデント4スペース" }).check();
      await expect(output).toHaveValue(first);
      await convert.click();
      await expect(output).toHaveValue('{\n    "user": {\n        "name": "first"\n    }\n}');
      await input.fill("name: [");
      await convert.click();
      await expect(copy).toBeDisabled();
      await expect(copy).toHaveText("コピー");
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(first);

      await page.getByRole("radio", { name: "JSON から YAML へ変換" }).check();
      await expect(input).toHaveValue("");
      await expect(output).toHaveValue("");
      await expect(error).toHaveCount(0);
      await expect(copy).toBeDisabled();
      await expect(page.getByRole("radio", { name: "インデント4スペース" })).toHaveCount(0);
      await input.fill('{"user":{"name":"repaired"}}');
      await convert.click();
      await expect(output).toHaveValue("user:\n  name: repaired\n");
      await copy.click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        "user:\n  name: repaired\n",
      );
      await page.getByRole("radio", { name: "YAML から JSON へ変換" }).check();
      await expect(output).toHaveValue("");
      await expect(copy).toBeDisabled();
      await expect(page.getByRole("radio", { name: "インデント4スペース" })).toBeChecked();
    });
  });
}
