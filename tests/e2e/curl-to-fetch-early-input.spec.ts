import { test, expect } from "../browser/csv-json/url-app-test";

/** Hold local scripts to edit the real SSR form before React installs handlers. */
for (const width of [1280, 390]) {
  for (const earlyOptions of [false, true]) {
    test(`cURL early input and ${earlyOptions ? "SSR options" : "first mode action"} survive hydration at ${width}px`, async ({
      page,
      baseURL,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const origin = new URL(baseURL!).origin;
      let releaseScripts!: () => void;
      let firstScript!: () => void;
      const released = new Promise<void>((resolve) => {
        releaseScripts = resolve;
      });
      const scriptRequested = new Promise<void>((resolve) => {
        firstScript = resolve;
      });
      let heldScripts = 0;
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (new URL(request.url()).origin === origin && request.resourceType() === "script") {
          heldScripts++;
          firstScript();
          await released;
        }
        await route.fallback();
      });

      const input = page.getByLabel("cURLコマンドを入力", { exact: true });
      const output = page.getByLabel("変換されたコード", { exact: true });
      const axios = page.getByLabel("axios", { exact: true });
      const typescript = page.getByLabel("TypeScript", { exact: true });
      const clear = page.getByRole("button", { name: "入力をクリア", exact: true });
      const early = "curl 'https://example.com/early-input?value=123'";
      try {
        try {
          await page.goto("/curl-to-fetch", { waitUntil: "commit" });
          await expect(input).toBeVisible();
          await scriptRequested;
          expect(heldScripts).toBeGreaterThan(0);
          await input.fill(early);
          if (earlyOptions) {
            await axios.check();
            await typescript.check();
          }
          await expect(input).toHaveValue(early);
          await expect(output).toHaveText("cURLコマンドを入力すると変換結果が表示されます");
          await expect(clear).toBeDisabled();
        } finally {
          releaseScripts();
        }

        // No second fill or readiness wait can repair a lost SSR value or option.
        if (!earlyOptions) await axios.check();
        await expect(output).toContainText("import axios from 'axios';");
        await expect(output).toContainText("https://example.com/early-input?value=123");
        await expect(output).toContainText(
          earlyOptions ? "await axios<unknown>({" : "await axios({",
        );
        await expect(input).toHaveValue(early);
        await expect(axios).toBeChecked();
        if (earlyOptions) await expect(typescript).toBeChecked();
        else await expect(typescript).not.toBeChecked();

        await typescript.setChecked(!earlyOptions);
        await expect(input).toHaveValue(early);
        await expect(output).toContainText(
          earlyOptions ? "await axios({" : "await axios<unknown>({",
        );
        await clear.click();
        await expect(input).toHaveValue("");
        await expect(output).toHaveText("cURLコマンドを入力すると変換結果が表示されます");
        await expect(clear).toBeDisabled();
        await typescript.setChecked(earlyOptions);
        await page.getByLabel("fetch", { exact: true }).check();
        await expect(input).toHaveValue("");
        await expect(output).toHaveText("cURLコマンドを入力すると変換結果が表示されます");
        await page
          .getByRole("button", { name: "GET リクエストのサンプルを読み込む", exact: true })
          .click();
        await expect(input).toHaveValue(/https:\/\/api\.example\.com\/users/);
        await expect(output).toContainText("https://api.example.com/users");
        await clear.click();
        await input.fill("curl 'https://example.com/latest-input'");
        await expect(input).toHaveValue("curl 'https://example.com/latest-input'");
        await expect(output).toContainText("https://example.com/latest-input");
        await expect(output).not.toContainText("early-input");
      } finally {
        await testInfo.attach("early-curl-state.json", {
          contentType: "application/json",
          body: Buffer.from(
            JSON.stringify({
              width,
              earlyOptions,
              heldScripts,
              early,
              state: await page.evaluate(() => ({
                input: document.querySelector<HTMLTextAreaElement>("#ctf-curl-input")?.value,
                mode: document.querySelector<HTMLInputElement>('input[name="ctf-mode"]:checked')
                  ?.value,
                typescript: document.querySelector<HTMLInputElement>(".ctf-checkbox")?.checked,
                output: document.querySelector('[aria-label="変換されたコード"]')?.textContent,
              })),
            }),
          ),
        });
      }
    });
  }
}
