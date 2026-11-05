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

/** Cover the complete SSR form snapshot without changing the four original RED cases above. */
for (const width of [1280, 390]) {
  test(`CSV SQL preserves all early options with input at ${width}px`, async ({
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
    const table = page.getByLabel("テーブル名", { exact: true });
    const dialect = page.getByLabel("SQLダイアレクト", { exact: true });
    const batch = page.getByLabel("バッチサイズ", { exact: true });
    const header = page.getByLabel("1行目をヘッダーとして使用", { exact: true });
    const convertNull = page.getByLabel("空値・NULLをSQL NULLに変換", { exact: true });
    const numbers = page.getByLabel("数値を自動検出", { exact: true });
    const booleans = page.getByLabel("ブーリアンを自動検出", { exact: true });
    const statistics = page.getByLabel("生成結果の統計", { exact: true });
    const copy = page.getByRole("button", { name: "SQLをコピー", exact: true });
    const clear = page.getByRole("button", { name: "入力をクリア", exact: true });
    const error = page.getByRole("alert", { name: "エラー", exact: true });
    const early = "true,,3\nfalse,tail,4";
    async function expectOptions(tableName = "  early_rows  ") {
      await expect(table).toHaveValue(tableName);
      await expect(dialect).toHaveValue("postgresql");
      await expect(batch).toHaveValue("2");
      await expect(header).not.toBeChecked();
      await expect(convertNull).not.toBeChecked();
      await expect(numbers).not.toBeChecked();
      await expect(booleans).toBeChecked();
    }
    try {
      try {
        await page.goto("/csv-sql", { waitUntil: "commit" });
        await expect(input).toBeVisible();
        await scriptRequested;
        expect(heldScripts).toBeGreaterThan(0);
        await input.fill(early);
        await table.fill("  early_rows  ");
        await dialect.selectOption("postgresql");
        await batch.fill("2");
        await header.uncheck();
        await convertNull.uncheck();
        await numbers.uncheck();
        await booleans.check();
        await expectOptions();
        await expect(input).toHaveValue(early);
        await expect(output).toHaveCount(0);
        await expect(statistics).toHaveCount(0);
        await expect(copy).toBeDisabled();
        await expect(clear).toBeDisabled();
      } finally {
        releaseScripts();
      }

      // No second edit is allowed to repair the initial CSV or options after script release.
      await expect(output).toHaveValue(
        'INSERT INTO "early_rows" ("col1", "col2", "col3")\nVALUES\n' +
          "  (TRUE, '', '3'),\n  (FALSE, 'tail', '4');",
      );
      await expectOptions();
      await expect(input).toHaveValue(early);
      await expect(error).toHaveCount(0);
      await expect(statistics).toContainText("2 行");
      await expect(statistics).toContainText("3 列");
      await expect(statistics).toContainText("1 文");
      await expect(copy).toBeEnabled();
      await expect(clear).toBeEnabled();

      await page.getByRole("button", { name: "サンプルデータを読み込む", exact: true }).click();
      await expectOptions();
      await expect(input).toHaveValue(
        "id,name,email,age,active,score\n" +
          "1,田中 太郎,taro@example.com,28,true,95.5\n" +
          "2,佐藤 花子,hanako@example.com,34,false,82.0\n" +
          "3,鈴木 一郎,ichiro@example.com,22,true,NULL\n" +
          "4,山田 美咲,misaki@example.com,41,true,77.3\n" +
          "5,中村 健太,,29,false,88.1",
      );
      const samplePrefix =
        'INSERT INTO "early_rows" ("col1", "col2", "col3", "col4", "col5", "col6")\nVALUES\n';
      await expect(output).toHaveValue(
        samplePrefix +
          "  ('id', 'name', 'email', 'age', 'active', 'score'),\n" +
          "  (TRUE, '田中 太郎', 'taro@example.com', '28', TRUE, '95.5');\n\n" +
          samplePrefix +
          "  ('2', '佐藤 花子', 'hanako@example.com', '34', FALSE, '82.0'),\n" +
          "  ('3', '鈴木 一郎', 'ichiro@example.com', '22', TRUE, 'NULL');\n\n" +
          samplePrefix +
          "  ('4', '山田 美咲', 'misaki@example.com', '41', TRUE, '77.3'),\n" +
          "  ('5', '中村 健太', '', '29', FALSE, '88.1');",
      );
      await expect(statistics).toContainText("6 行");
      await expect(statistics).toContainText("6 列");
      await expect(statistics).toContainText("3 文");
      await clear.click();
      await expect(input).toHaveValue("");
      await expect(output).toHaveCount(0);
      await expect(statistics).toHaveCount(0);
      await expect(error).toHaveCount(0);
      await expect(copy).toBeDisabled();
      await expect(clear).toBeDisabled();
      await expectOptions();

      await table.fill("after_clear");
      await expect(input).toHaveValue("");
      await expect(output).toHaveCount(0);
      await input.fill("false,later,5");
      await expectOptions("after_clear");
      await expect(input).toHaveValue("false,later,5");
      await expect(output).toHaveValue(
        'INSERT INTO "after_clear" ("col1", "col2", "col3")\nVALUES\n' + "  (FALSE, 'later', '5');",
      );
      await expect(statistics).toContainText("1 行");
      await expect(statistics).toContainText("3 列");
      await expect(statistics).toContainText("1 文");
      await expect(error).toHaveCount(0);
      await expect(copy).toBeEnabled();
      await expect(clear).toBeEnabled();
    } finally {
      await testInfo.attach("early-options-state.json", {
        contentType: "application/json",
        body: Buffer.from(
          JSON.stringify({
            width,
            heldScripts,
            early,
            state: await page.evaluate(() => ({
              input: document.querySelector<HTMLTextAreaElement>("#csv-sql-input")?.value,
              output: document.querySelector<HTMLTextAreaElement>(".csv-sql-textarea-output")
                ?.value,
              table: document.querySelector<HTMLInputElement>("#csv-sql-table")?.value,
              dialect: document.querySelector("select")?.value,
              batch: document.querySelector<HTMLInputElement>("#csv-sql-batch")?.value,
              hasHeader: document.querySelector<HTMLInputElement>("#csv-sql-header")?.checked,
              convertNull: document.querySelector<HTMLInputElement>("#csv-sql-null")?.checked,
              detectNumbers: document.querySelector<HTMLInputElement>("#csv-sql-numbers")?.checked,
              detectBooleans:
                document.querySelector<HTMLInputElement>("#csv-sql-booleans")?.checked,
              error: document.querySelector(".csv-sql-error")?.textContent,
              statistics: document.querySelector(".csv-sql-output-meta")?.textContent,
            })),
          }),
        ),
      });
    }
  });
}
