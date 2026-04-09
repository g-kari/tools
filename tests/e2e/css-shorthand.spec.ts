import { test, expect } from "@playwright/test";

test.describe("CSS ショートハンド展開 - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-shorthand");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/CSSショートハンド展開/);
  });

  test("should display expand section heading", async ({ page }) => {
    const heading = page.locator("#expand-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("ショートハンド");
  });

  test("should display collapse section heading", async ({ page }) => {
    const heading = page.locator("#collapse-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("ロングハンド");
  });

  test("should display expand property selector", async ({ page }) => {
    const select = page.locator("#expand-property");
    await expect(select).toBeVisible();
    await expect(select).toBeEnabled();
  });

  test("should display collapse property selector", async ({ page }) => {
    const select = page.locator("#collapse-property");
    await expect(select).toBeVisible();
    await expect(select).toBeEnabled();
  });

  test("should display expand input field", async ({ page }) => {
    const input = page.locator("#expand-input");
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test("should expand margin shorthand with 1 value", async ({ page }) => {
    const input = page.locator("#expand-input");
    const button = page.locator('button[aria-label="ショートハンドをロングハンドに展開"]');

    await input.fill("10px");
    await button.click();

    const result = page.locator(".css-shorthand-result").first();
    await expect(result).toBeVisible();
    await expect(result).toContainText("margin-top");
    await expect(result).toContainText("margin-right");
    await expect(result).toContainText("margin-bottom");
    await expect(result).toContainText("margin-left");
    await expect(result).toContainText("10px");
  });

  test("should expand margin shorthand with 2 values", async ({ page }) => {
    const input = page.locator("#expand-input");
    const button = page.locator('button[aria-label="ショートハンドをロングハンドに展開"]');

    await input.fill("16px 24px");
    await button.click();

    const result = page.locator(".css-shorthand-result").first();
    await expect(result).toBeVisible();
    await expect(result).toContainText("margin-top");
    await expect(result).toContainText("16px");
    await expect(result).toContainText("24px");
  });

  test("should expand on Enter key press", async ({ page }) => {
    const input = page.locator("#expand-input");

    await input.fill("0 auto");
    await input.press("Enter");

    const result = page.locator(".css-shorthand-result").first();
    await expect(result).toBeVisible();
    await expect(result).toContainText("auto");
  });

  test("should show error toast when expand input is empty", async ({ page }) => {
    const button = page.locator('button[aria-label="ショートハンドをロングハンドに展開"]');
    await button.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("値を入力してください");
  });

  test("should clear expand result when clear button is clicked", async ({ page }) => {
    const input = page.locator("#expand-input");
    const expandButton = page.locator('button[aria-label="ショートハンドをロングハンドに展開"]');
    const clearButton = page.locator('button[aria-label="入力と結果をクリア"]').first();

    await input.fill("10px");
    await expandButton.click();
    await expect(page.locator(".css-shorthand-result").first()).toBeVisible();

    await clearButton.click();
    await expect(page.locator(".css-shorthand-result").first()).not.toBeVisible();
    await expect(input).toHaveValue("");
  });

  test("should change property and expand padding", async ({ page }) => {
    const select = page.locator("#expand-property");
    const input = page.locator("#expand-input");
    const button = page.locator('button[aria-label="ショートハンドをロングハンドに展開"]');

    await select.selectOption("padding");
    await input.fill("8px 16px");
    await button.click();

    const result = page.locator(".css-shorthand-result").first();
    await expect(result).toBeVisible();
    await expect(result).toContainText("padding-top");
    await expect(result).toContainText("padding-right");
  });

  test("should expand flex shorthand: none", async ({ page }) => {
    const select = page.locator("#expand-property");
    const input = page.locator("#expand-input");
    const button = page.locator('button[aria-label="ショートハンドをロングハンドに展開"]');

    await select.selectOption("flex");
    await input.fill("none");
    await button.click();

    const result = page.locator(".css-shorthand-result").first();
    await expect(result).toBeVisible();
    await expect(result).toContainText("flex-grow");
    await expect(result).toContainText("flex-shrink");
    await expect(result).toContainText("flex-basis");
  });

  test("should collapse margin longhands", async ({ page }) => {
    const select = page.locator("#collapse-property");
    await select.selectOption("margin");

    const longhands = ["margin-top", "margin-right", "margin-bottom", "margin-left"];
    const values = ["10px", "10px", "10px", "10px"];

    for (let i = 0; i < longhands.length; i++) {
      const input = page.locator(`#collapse-${longhands[i]}`);
      await input.fill(values[i]);
    }

    const button = page.locator('button[aria-label="ロングハンドをショートハンドに圧縮"]');
    await button.click();

    const result = page.locator(".css-shorthand-result").last();
    await expect(result).toBeVisible();
    await expect(result).toContainText("margin");
    await expect(result).toContainText("10px");
  });

  test("should show error toast when collapse input is empty", async ({ page }) => {
    const button = page.locator('button[aria-label="ロングハンドをショートハンドに圧縮"]');
    await button.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("全てのプロパティ値を入力してください");
  });

  test("should clear collapse result when clear button is clicked", async ({ page }) => {
    const select = page.locator("#collapse-property");
    await select.selectOption("overflow");

    await page.locator("#collapse-overflow-x").fill("hidden");
    await page.locator("#collapse-overflow-y").fill("auto");

    const collapseButton = page.locator('button[aria-label="ロングハンドをショートハンドに圧縮"]');
    await collapseButton.click();

    await expect(page.locator(".css-shorthand-result").last()).toBeVisible();

    const clearButton = page.locator('button[aria-label="入力と結果をクリア"]').last();
    await clearButton.click();

    await expect(page.locator("#collapse-overflow-x")).toHaveValue("");
  });

  test("should display reference table", async ({ page }) => {
    const table = page.locator(".css-shorthand-table");
    await expect(table).toBeVisible();
  });

  test("should display margin in reference table", async ({ page }) => {
    const table = page.locator(".css-shorthand-table");
    await expect(table).toContainText("margin");
  });

  test("should display tips card", async ({ page }) => {
    const tipsCard = page.locator(".tips-card");
    await expect(tipsCard).toBeVisible();
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should show copy button after expansion", async ({ page }) => {
    const input = page.locator("#expand-input");
    const button = page.locator('button[aria-label="ショートハンドをロングハンドに展開"]');

    await input.fill("10px 20px");
    await button.click();

    const copyButton = page.locator('button[aria-label="展開結果をコピー"]');
    await expect(copyButton).toBeVisible();
  });
});

test.describe("Top page - CSS ショートハンド展開 tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test('should display "CSSショートハンド展開" in the tool list', async ({ page }) => {
    const link = page.locator('a[href="/css-shorthand"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("CSSショートハンド");
  });

  test("should navigate to /css-shorthand when clicking the tool card", async ({ page }) => {
    const link = page.locator('a[href="/css-shorthand"]');
    await link.click();

    await expect(page).toHaveURL("/css-shorthand");
  });
});
