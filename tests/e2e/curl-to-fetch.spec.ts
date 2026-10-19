import { test, expect } from "@playwright/test";
import ts from "typescript";

test.describe("cURL → fetch 変換ツール", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/curl-to-fetch");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /cURL.*fetch/ })).toBeVisible();
    await expect(page.getByLabel("cURLコマンドを入力")).toBeVisible();
  });

  test("cURLコマンドを入力するとfetchコードが生成される", async ({ page }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    await input.fill("curl 'https://api.example.com/users' -H 'Accept: application/json'");

    const output = page.getByLabel("変換されたコード");
    await expect(output).toContainText("fetch");
    await expect(output).toContainText("https://api.example.com/users");
    await expect(output).toContainText("'Accept': 'application/json'");
  });

  test("axiosモードに切り替えるとaxiosコードが生成される", async ({ page }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    await input.fill("curl 'https://api.example.com'");

    await page.getByLabel("axios", { exact: true }).check();

    const output = page.getByLabel("変換されたコード");
    await expect(output).toContainText("axios");
    await expect(output).toContainText("import axios from 'axios'");
  });

  test("TypeScriptオプションで型注釈が追加される", async ({ page }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    await input.fill("curl 'https://api.example.com'");

    await page.getByLabel("TypeScript").check();

    const output = page.getByLabel("変換されたコード");
    await expect(output).toContainText(": Response");
  });

  for (const mode of ["fetch", "axios"] as const) {
    for (const typescript of [false, true]) {
      test(`${mode} TS=${typescript}: 引用符・複数行を含むコードを実行して元の値を保持する`, async ({
        page,
      }) => {
        const command =
          `curl "https://example.com/O'Reilly" -X "X'PATCH" -H "X'O: safe" ` +
          String.raw`--data-raw $'line1\nline2\rline3\tvalue'`;
        await page.getByLabel("cURLコマンドを入力").fill(command);
        await page.getByLabel(mode, { exact: true }).check();
        await page.getByLabel("TypeScript").setChecked(typescript);

        const output = page.getByLabel("変換されたコード");
        await expect(output).toContainText("O\\'Reilly");
        await expect(output).toContainText(mode === "axios" ? "await axios" : "await fetch");
        if (typescript) {
          await expect(output).toContainText(mode === "axios" ? "axios<unknown>" : ": Response");
        }
        await expect(page.getByLabel("cURLコマンドを入力")).toHaveValue(command);
        await expect(
          page.getByRole("button", { name: "コードをコピー", exact: true }),
        ).toBeEnabled();

        const source = (await output.textContent()) ?? "";
        const compiled = ts.transpileModule(source, {
          compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
          reportDiagnostics: true,
        });
        expect(compiled.diagnostics).toEqual([]);
        // Only this fixed synthetic output is executed, with local stubs instead of real requests.
        const executable = (typescript ? compiled.outputText : source).replace(
          "import axios from 'axios';",
          "",
        );
        const calls = await page.evaluate(async (code) => {
          interface CapturedRequest {
            url: string;
            method: string;
            headers: Record<string, string>;
            body: unknown;
          }
          const calls: CapturedRequest[] = [];
          const fetchStub = async (url: string, init: RequestInit = {}) => {
            calls.push({
              url,
              method: init.method ?? "GET",
              headers: (init.headers ?? {}) as Record<string, string>,
              body: init.body ?? null,
            });
            return { ok: true, json: async () => ({}) };
          };
          const axiosStub = async (config: {
            url: string;
            method: string;
            headers: Record<string, string>;
            data: unknown;
          }) => {
            calls.push({
              url: config.url,
              method: config.method,
              headers: config.headers,
              body: config.data,
            });
            return { data: {} };
          };
          const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
            ...args: string[]
          ) => (...args: unknown[]) => Promise<void>;
          await new AsyncFunction("fetch", "axios", "console", code)(fetchStub, axiosStub, {
            log: () => {},
          });
          return calls;
        }, executable);
        expect(calls).toEqual([
          {
            url: "https://example.com/O'Reilly",
            method: mode === "axios" ? "x'patch" : "X'PATCH",
            headers: { "X'O": "safe" },
            body: "line1\nline2\rline3\tvalue",
          },
        ]);
      });
    }
  }

  test("切替・クリア・再入力の後も引用符付きの生成コードをそのままコピーできる", async ({
    page,
  }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    const output = page.getByLabel("変換されたコード");
    const copyButton = page.getByRole("button", { name: "コードをコピー", exact: true });
    const unusual =
      `curl "https://example.com/O'Reilly" -H "X'O: safe" ` +
      String.raw`--data-raw $'line1\nline2'`;

    await input.fill(unusual);
    await expect(output).toContainText("O\\'Reilly");
    await page.getByLabel("axios", { exact: true }).check();
    await page.getByLabel("TypeScript").check();
    await expect(output).toContainText("axios<unknown>");

    await page.getByRole("button", { name: "入力をクリア", exact: true }).click();
    await expect(input).toHaveValue("");
    await expect(output).toContainText("cURLコマンドを入力すると変換結果が表示されます");
    await expect(copyButton).toHaveCount(0);

    await input.fill("curl 'https://example.com/ordinary'");
    await expect(output).toContainText("url: 'https://example.com/ordinary'");
    await expect(output).not.toContainText("O\\'Reilly");
    await expect(output).not.toContainText("line1");

    await input.fill(unusual);
    await expect(output).toContainText("axios<unknown>");
    await expect(output).toContainText("O\\'Reilly");
    await expect(output).toContainText("data: 'line1\\nline2'");
    await expect(input).toHaveValue(unusual);
    const source = (await output.textContent()) ?? "";
    expect(source).not.toBe("");
    await copyButton.click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(source);
    await expect(page.getByRole("region", { name: "通知" }).getByRole("alert")).toContainText(
      "コードをコピーしました",
    );
  });

  test("サンプルボタンをクリックするとサンプルが読み込まれる", async ({ page }) => {
    await page.getByLabel("POST JSONのサンプルを読み込む").click();

    const input = page.getByLabel("cURLコマンドを入力");
    await expect(input).not.toHaveValue("");

    const output = page.getByLabel("変換されたコード");
    await expect(output).toContainText("POST");
    await expect(output).toContainText("JSON.stringify");
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    await input.fill("curl 'https://api.example.com'");

    await page.getByRole("button", { name: "入力をクリア", exact: true }).click();

    await expect(input).toHaveValue("");
  });

  test("コピーボタンをクリックするとトーストが表示される", async ({ page }) => {
    const input = page.getByLabel("cURLコマンドを入力");
    await input.fill("curl 'https://api.example.com'");

    await page.getByRole("button", { name: "コードをコピー", exact: true }).click();

    await expect(page.getByRole("region", { name: "通知" }).getByRole("alert")).toContainText(
      "コードをコピーしました",
    );
  });

  test("ページタイトルが正しく設定されている", async ({ page }) => {
    await expect(page).toHaveTitle(/cURL.*fetch/);
  });
});
