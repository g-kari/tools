import type { Page } from "@playwright/test";
import { test, expect } from "../browser/csv-json/url-app-test";

const early = "[__proto__]\nconstructor = first\nconstructor = second";
const single = JSON.stringify(JSON.parse('{"__proto__":{"constructor":"second"}}'), null, 2);
const multiple = JSON.stringify(
  JSON.parse('{"__proto__":{"constructor":["first","second"]}}'),
  null,
  2,
);

/** Delay local scripts only; fallback preserves the existing external-origin guard. */
async function holdScripts(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  let release!: () => void;
  let requested!: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const firstRequest = new Promise<void>((resolve) => {
    requested = resolve;
  });
  let held = 0;
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (new URL(request.url()).origin === origin && request.resourceType() === "script") {
      held++;
      requested();
      await released;
    }
    await route.fallback();
  });
  return { release, firstRequest, held: () => held };
}

async function expectUnready(page: Page) {
  await expect(page.getByRole("status", { name: "INIツールの準備" })).toHaveText(
    "操作の準備中です。先に入力したINIテキストは保持します。",
  );
  for (const tab of await page.getByRole("tab").all()) await expect(tab).toBeDisabled();
  for (const sample of await page.getByRole("button", { name: /サンプルを読み込む/ }).all()) {
    await expect(sample).toBeDisabled();
  }
  await expect(page.getByLabel("重複キーを配列として扱う")).toBeDisabled();
  await expect(page.getByRole("button", { name: "出力をコピー", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "入力をクリア", exact: true })).toBeDisabled();
  await expect(page.getByLabel("INI入力テキストエリア")).toBeEditable();
}

test("INI adopts a pre-script value without another edit or action", async ({ page, baseURL }) => {
  const scripts = await holdScripts(page, baseURL!);
  const input = page.locator("#ini-input");
  try {
    await page.goto("/ini-parser", { waitUntil: "commit" });
    await expect(input).toBeVisible();
    await scripts.firstRequest;
    expect(scripts.held()).toBeGreaterThan(0);
    await input.fill(early);
    await expect(input).toHaveValue(early);
    await expect(page.getByLabel("JSON出力", { exact: true })).toHaveCount(0);
  } finally {
    scripts.release();
  }
  // This reproduces the state/DOM mismatch independently of the new readiness contract.
  await expect(page.getByLabel("JSON出力", { exact: true })).toHaveValue(single);
  await expect(input).toHaveValue(early);
});

for (const firstAction of ["checkbox", "mode"] as const) {
  test(`INI keeps early input through the first enabled ${firstAction} action`, async ({
    page,
    baseURL,
  }, testInfo) => {
    const scripts = await holdScripts(page, baseURL!);
    const input = page.locator("#ini-input");
    const duplicate = page.getByLabel("重複キーを配列として扱う");
    const toJson = page.getByRole("tab", { name: "INI → JSON", exact: true });
    const toIni = page.getByRole("tab", { name: "JSON → INI", exact: true });
    const clear = page.getByRole("button", { name: "入力をクリア", exact: true });
    try {
      try {
        await page.goto("/ini-parser", { waitUntil: "commit" });
        await expect(input).toBeVisible();
        await scripts.firstRequest;
        expect(scripts.held()).toBeGreaterThan(0);
        await input.fill(early);
        await expectUnready(page);
        await expect(input).toHaveValue(early);
        await expect(page.getByLabel("JSON出力", { exact: true })).toHaveCount(0);
      } finally {
        scripts.release();
      }

      // The first enabled action must work without a second INI fill.
      if (firstAction === "checkbox") {
        await duplicate.check();
        await expect(page.getByLabel("JSON出力", { exact: true })).toHaveValue(multiple);
        await expect(duplicate).toBeChecked();
        await duplicate.uncheck();
        await expect(page.getByLabel("JSON出力", { exact: true })).toHaveValue(single);
      } else {
        await toIni.click();
        await expect(toIni).toHaveAttribute("aria-selected", "true");
        await expect(page.getByLabel("JSON入力テキストエリア")).toHaveValue("");
        await input.fill('{"section":{"key":"json-value"}}');
        await expect(page.getByLabel("INI出力", { exact: true })).toHaveValue(
          "[section]\nkey = json-value",
        );
        await toJson.click();
        await expect(input).toHaveValue(early);
        await expect(page.getByLabel("JSON出力", { exact: true })).toHaveValue(single);
        await toIni.click();
        await expect(input).toHaveValue('{"section":{"key":"json-value"}}');
        await clear.click();
        await expect(input).toHaveValue("");
        await toJson.click();
        await expect(input).toHaveValue(early);
      }
      await expect(page.getByRole("status", { name: "INIツールの準備" })).toHaveText(
        "操作の準備ができました。",
      );
      await clear.click();
      await expect(input).toHaveValue("");
      await expect(page.getByLabel("JSON出力", { exact: true })).toHaveCount(0);
      await duplicate.check();
      await toIni.click();
      await toJson.click();
      await expect(input).toHaveValue("");
      await expect(clear).toBeDisabled();
      await input.fill("[latest]\nkey = fresh");
      await expect(page.getByLabel("JSON出力", { exact: true })).toHaveValue(
        JSON.stringify({ latest: { key: "fresh" } }, null, 2),
      );
      await page.getByRole("button", { name: "php.ini のサンプルを読み込む", exact: true }).click();
      await expect(input).toHaveValue(/memory_limit = 128M/);
      await clear.click();
      await toIni.click();
      await toJson.click();
      await expect(input).toHaveValue("");
    } finally {
      await testInfo.attach("early-ini-state.json", {
        contentType: "application/json",
        body: Buffer.from(
          JSON.stringify({
            firstAction,
            heldScripts: scripts.held(),
            viewport: page.viewportSize(),
            input: await input.inputValue(),
            selectedMode: await page.getByRole("tab", { selected: true }).textContent(),
          }),
        ),
      });
    }
  });
}

test("INI keyboard editing and the first enabled checkbox keep focus and input", async ({
  page,
  baseURL,
}) => {
  const scripts = await holdScripts(page, baseURL!);
  const input = page.locator("#ini-input");
  const duplicate = page.getByLabel("重複キーを配列として扱う");
  try {
    await page.goto("/ini-parser", { waitUntil: "commit" });
    await expect(input).toBeVisible();
    await scripts.firstRequest;
    expect(scripts.held()).toBeGreaterThan(0);
    await input.click();
    await page.keyboard.insertText(early);
    await expectUnready(page);
    await expect(input).toBeFocused();
    await expect(input).toHaveValue(early);
  } finally {
    scripts.release();
  }
  await expect(duplicate).toBeEnabled();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue(early);
  await page.keyboard.press("Tab");
  await expect(duplicate).toBeFocused();
  await page.keyboard.press("Space");
  await expect(duplicate).toBeChecked();
  await expect(page.getByLabel("JSON出力", { exact: true })).toHaveValue(multiple);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "出力をコピー", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  const clear = page.getByRole("button", { name: "入力をクリア", exact: true });
  await expect(clear).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("");
  await expect(page.getByLabel("JSON出力", { exact: true })).toHaveCount(0);
  await expect(clear).toBeDisabled();
});

test.describe("INI without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("keeps the input editable, actions unavailable and explanation visible", async ({ page }) => {
    await page.goto("/ini-parser");
    const input = page.locator("#ini-input");
    await expectUnready(page);
    await expect(page.locator("noscript p")).toBeVisible();
    await expect(page.locator("noscript p")).toHaveText(
      "変換と各操作にはJavaScriptが必要です。入力欄は編集できますが、変換は実行されません。",
    );
    await input.fill(early);
    await expect(input).toHaveValue(early);
    await expect(page.getByLabel("JSON出力", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "INI → JSON", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(input).toHaveValue(early);
  });
});
