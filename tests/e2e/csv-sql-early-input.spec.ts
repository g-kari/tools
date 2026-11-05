import { test, expect } from "../browser/csv-json/url-app-test";

/** Hold local scripts so the actual SSR textarea is edited before React installs handlers. */
for (const width of [1280, 390]) {
  for (const invalid of [false, true]) {
    test(`CSV SQL early ${invalid ? "invalid" : "valid"} input survives hydration at ${width}px`, async ({
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

      const input = page.getByLabel("CSV入力", { exact: true });
      const output = page.getByLabel("生成されたSQL INSERT文", { exact: true });
      const statistics = page.getByLabel("生成結果の統計", { exact: true });
      const copy = page.getByRole("button", { name: "SQLをコピー", exact: true });
      const clear = page.getByRole("button", { name: "入力をクリア", exact: true });
      const error = page.getByRole("alert", { name: "エラー", exact: true });
      const valid = 'id,name,note\n7,"早い入力😀,alpha","line1\n""line2"""\n8,beta,';
      const early = invalid ? 'id,name\n1,"alpha' : valid;
      try {
        try {
          await page.goto("/csv-sql", { waitUntil: "commit" });
          await expect(input).toBeVisible();
          await scriptRequested;
          expect(heldScripts).toBeGreaterThan(0);
          await input.fill(early);
          await expect(input).toHaveValue(early);
          // Native SSR edits cannot generate output or enable controlled buttons yet.
          await expect(output).toHaveCount(0);
          await expect(statistics).toHaveCount(0);
          await expect(copy).toBeDisabled();
          await expect(clear).toBeDisabled();
        } finally {
          releaseScripts();
        }

        // No click, second fill or readiness wait may repair the lost initial input.
        if (invalid) {
          await expect(error).toContainText("2番目のレコードの2列目");
          await expect(error).toContainText("引用符が閉じていません");
          await expect(input).toHaveValue(early);
          await expect(output).toHaveCount(0);
          await expect(statistics).toHaveCount(0);
          await expect(copy).toBeDisabled();
          await expect(clear).toBeEnabled();
          await input.fill(valid);
        }
        await expect(output).toHaveValue(
          "INSERT INTO `my_table` (`id`, `name`, `note`)\nVALUES (7, '早い入力😀,alpha', 'line1\n\"line2\"');\n\n" +
            "INSERT INTO `my_table` (`id`, `name`, `note`)\nVALUES (8, 'beta', NULL);",
        );
        await expect(input).toHaveValue(valid);
        await expect(error).toHaveCount(0);
        await expect(statistics).toContainText("2 行");
        await expect(statistics).toContainText("3 列");
        await expect(statistics).toContainText("2 文");
        await expect(copy).toBeEnabled();
        await expect(clear).toBeEnabled();

        await page.getByLabel("SQLダイアレクト", { exact: true }).selectOption("postgresql");
        await page.getByLabel("テーブル名", { exact: true }).fill("early_rows");
        await page.getByLabel("バッチサイズ", { exact: true }).fill("2");
        await page.getByLabel("空値・NULLをSQL NULLに変換", { exact: true }).uncheck();
        await expect(input).toHaveValue(valid);
        await expect(output).toHaveValue(
          'INSERT INTO "early_rows" ("id", "name", "note")\nVALUES\n' +
            "  (7, '早い入力😀,alpha', 'line1\n\"line2\"'),\n" +
            "  (8, 'beta', '');",
        );
        await expect(statistics).toContainText("1 文");

        await input.fill("id,name\n9,latest");
        await expect(output).toHaveValue(/\(9, 'latest'\)/);
        await clear.click();
        await expect(input).toHaveValue("");
        await expect(output).toHaveCount(0);
        await expect(statistics).toHaveCount(0);
        await expect(error).toHaveCount(0);
        await expect(copy).toBeDisabled();
        await expect(clear).toBeDisabled();
        await page.getByRole("button", { name: "サンプルデータを読み込む", exact: true }).click();
        await expect(input).toHaveValue(/田中 太郎/);
        await expect(output).toHaveValue(/田中 太郎/);
        await expect(statistics).toContainText("5 行");
        await clear.click();
        await page.getByLabel("テーブル名", { exact: true }).fill("after_clear");
        await expect(input).toHaveValue("");
        await expect(output).toHaveCount(0);
        await expect(clear).toBeDisabled();
      } finally {
        await testInfo.attach("early-input-state.json", {
          contentType: "application/json",
          body: Buffer.from(
            JSON.stringify({
              width,
              invalid,
              heldScripts,
              early,
              state: await page.evaluate(() => ({
                input: document.querySelector<HTMLTextAreaElement>("#csv-sql-input")?.value,
                output: document.querySelector<HTMLTextAreaElement>(".csv-sql-textarea-output")
                  ?.value,
                error: document.querySelector(".csv-sql-error")?.textContent,
                statistics: document.querySelector(".csv-sql-output-meta")?.textContent,
                clearDisabled: document.querySelector<HTMLButtonElement>(".btn-clear")?.disabled,
                copyDisabled: document.querySelector<HTMLButtonElement>(".btn-primary")?.disabled,
              })),
            }),
          ),
        });
      }
    });
  }
}
