import { test, expect } from "@playwright/test";

test.describe("Release Notes - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/release-notes");
    await page.waitForSelector(".release-notes-container");
  });

  test("should load without undefined content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/リリースノート/);
  });

  test("should render heading", async ({ page }) => {
    await expect(page.locator(".release-notes-title")).toHaveText("リリースノート");
  });

  test("should render at least one release entry", async ({ page }) => {
    const items = page.locator(".release-notes-item");
    await expect(items.first()).toBeVisible();
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should filter entries by type", async ({ page }) => {
    const featChip = page.getByRole("tab", { name: "新機能" });
    await featChip.click();
    await expect(featChip).toHaveAttribute("aria-selected", "true");

    const badges = page.locator(".release-notes-badge");
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toHaveText("新機能");
    }
  });

  test("should reset filter when clicking すべて", async ({ page }) => {
    await page.getByRole("tab", { name: "新機能" }).click();
    await page.getByRole("tab", { name: "すべて" }).click();
    await expect(page.getByRole("tab", { name: "すべて" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
