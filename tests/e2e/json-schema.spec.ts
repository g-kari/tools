import { test, expect } from "@playwright/test";
import { validateJsonAgainstSchema } from "../../app/utils/json-schema-validator";

test.describe("JSON Schema Generator - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/json-schema");
    await page.waitForLoadState("networkidle");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/JSONスキーマ生成/);
  });

  test("should load the page without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should have JSON input textarea", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await expect(inputTextarea).toBeVisible();
  });

  test("should have schema output area", async ({ page }) => {
    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toBeVisible();
  });

  test("should load sample JSON when clicking sample button", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "サンプル読込" });
    await sampleButton.click();

    const inputTextarea = page.locator("#jsonInput");
    const value = await inputTextarea.inputValue();
    expect(value.trim()).not.toBe("");
    expect(() => JSON.parse(value)).not.toThrow();
  });

  test("should clear input and output when clicking clear button", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const clearButton = page.locator("button", { hasText: "クリア" });
    await clearButton.click();

    await expect(inputTextarea).toHaveValue("");
  });

  test("should have copy schema button disabled when no output", async ({ page }) => {
    const copyButton = page.locator("button", { hasText: "スキーマをコピー" });
    await expect(copyButton).toBeDisabled();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();

    const inputTextarea = page.locator("#jsonInput");
    await expect(inputTextarea).toHaveAttribute("aria-label");

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toHaveAttribute("aria-label");
  });

  test("should generate schema from valid JSON input", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"Alice","age":30}');

    const generateButton = page.locator("button", { hasText: "スキーマ生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText('"type": "object"');
    await expect(outputArea).toContainText('"$schema"');
  });

  test("should have navigation link to JSON Schema generator in category dropdown", async ({
    page,
  }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const schemaLink = dropdown.locator('a[href="/json-schema"]');
    await expect(schemaLink).toBeVisible();
    await expect(schemaLink).toContainText("JSONスキーマ生成");
  });

  test("accepts overlapping numeric and nested array samples", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "JSON入力欄" });
    const output = page.getByRole("region", { name: "生成されたJSONスキーマ" });
    const generate = page.getByRole("button", { name: "JSONスキーマを生成する", exact: true });
    for (const value of ["[1,1.5]", "[[],[1]]", '[{"score":1},{"score":1.5}]']) {
      await input.fill(value);
      await generate.click();
      await expect(output).toContainText('"anyOf"');
      const schema = (await output.textContent()) ?? "";
      expect(JSON.parse(schema).items.oneOf).toBeUndefined();
      expect(validateJsonAgainstSchema(value, schema).valid).toBe(true);
      await expect(input).toHaveValue(value);
    }
    await expect(
      page.getByText("異なる要素スキーマの配列は anyOf", { exact: false }),
    ).toBeVisible();
  });

  test("clears stale mixed schema on error and recovers via repeated generate/clear", async ({
    page,
  }) => {
    const input = page.getByRole("textbox", { name: "JSON入力欄" });
    const output = page.getByRole("region", { name: "生成されたJSONスキーマ" });
    const generate = page.getByRole("button", { name: "JSONスキーマを生成する", exact: true });
    const copy = page.getByRole("button", {
      name: "生成されたスキーマをクリップボードにコピーする",
    });
    await input.fill("[1,1.5]");
    await generate.click();
    await expect(copy).toBeEnabled();
    await input.fill("[");
    await generate.click();
    await expect(input).toHaveValue("[");
    await expect(output).not.toContainText('"anyOf"');
    await expect(copy).toBeDisabled();
    await input.fill("[[],[1]]");
    await input.press("Control+Enter");
    await expect(output).toContainText('"anyOf"');
    await generate.click();
    const schema = (await output.textContent()) ?? "";
    expect(validateJsonAgainstSchema("[[],[1]]", schema).valid).toBe(true);
    await page.getByRole("button", { name: "入力と結果をクリアする" }).click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await expect(copy).toBeDisabled();
    await expect(output).not.toContainText('"anyOf"');
  });

  test("preserves __proto__ keys in nested and mixed array samples", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "JSON入力欄" });
    const output = page.getByRole("region", { name: "生成されたJSONスキーマ" });
    const generate = page.getByRole("button", { name: "JSONスキーマを生成する", exact: true });
    for (const value of [
      '{"__proto__":1}',
      '{"outer":{"__proto__":{"nested":true}}}',
      '[{"__proto__":1},{"__proto__":1.5}]',
    ]) {
      await input.fill(value);
      await generate.click();
      const schema = (await output.textContent()) ?? "";
      const parsed = JSON.parse(schema);
      const properties = parsed.properties ?? parsed.items.anyOf[0].properties;
      expect(
        Object.hasOwn(properties, "__proto__") ||
          Object.hasOwn(properties.outer.properties, "__proto__"),
      ).toBe(true);
      expect(validateJsonAgainstSchema(value, schema).valid).toBe(true);
      await expect(input).toHaveValue(value);
    }
    await input.fill('{"__proto__":');
    await generate.click();
    await expect(
      page.getByRole("button", { name: "生成されたスキーマをクリップボードにコピーする" }),
    ).toBeDisabled();
    await input.fill('{"__proto__":true}');
    await input.press("Control+Enter");
    expect(
      validateJsonAgainstSchema(await input.inputValue(), (await output.textContent()) ?? "").valid,
    ).toBe(true);
  });
});
