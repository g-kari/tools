import { createHash } from "node:crypto";
import { test as base, expect, type Page } from "@playwright/test";

const test = base.extend<{ offlinePage: Page }>({
  offlinePage: async ({ page }, use) => {
    const external: string[] = [];
    const errors: string[] = [];
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (
        url.origin === "http://127.0.0.1:4196" &&
        ["/", "/fixture.js", "/fixture.css"].includes(url.pathname)
      ) {
        await route.continue();
      } else {
        external.push(url.origin);
        await route.abort();
      }
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await use(page);
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  },
});

const algorithms = ["md5", "sha1", "sha256", "sha384", "sha512"];
function expected(data: string | Buffer, format: "hex" | "base64" = "hex") {
  return algorithms.map((algorithm) => createHash(algorithm).update(data).digest(format));
}
async function assertValues(page: Page, values: string[]) {
  await expect(page.locator(".hash-result-value")).toHaveText(values);
  for (const button of await page.locator(".hash-copy-btn").all())
    await expect(button).toBeEnabled();
}
async function assertBusy(page: Page) {
  await expect(page.locator(".hash-result-value")).toHaveText(Array(5).fill("計算中..."));
  for (const button of await page.locator(".hash-copy-btn").all())
    await expect(button).toBeDisabled();
}

test("native text WebCrypto matches all five hashes in HEX and Base64", async ({
  offlinePage: page,
}) => {
  await page.goto("/");
  const text = "こんにちは 🌸\nlatest input";
  await page.getByLabel("入力テキスト").fill(text);
  await assertValues(page, expected(text));
  await page.getByRole("button", { name: "Base64", exact: true }).click();
  await assertValues(page, expected(text, "base64"));
  await page.getByRole("button", { name: "HEX", exact: true }).click();
  await assertValues(page, expected(text));
  await page.getByLabel("入力テキスト").fill("");
  await expect(page.locator(".hash-result-value")).toHaveCount(0);
});

test("native FileReader accepts empty bytes and reselects the same file after completion", async ({
  offlinePage: page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "ファイル", exact: true }).click();
  const file = { name: "same.txt", mimeType: "text/plain", buffer: Buffer.from("same bytes") };
  await page.getByLabel("ファイルを選択", { exact: true }).setInputFiles(file);
  await assertValues(page, expected(file.buffer));
  await expect(page.getByLabel("ファイルを選択", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Base64", exact: true }).click();
  await page.getByLabel("ファイルを選択", { exact: true }).setInputFiles(file);
  await assertValues(page, expected(file.buffer, "base64"));
  await page
    .getByLabel("ファイルを選択", { exact: true })
    .setInputFiles({ ...file, name: "empty.txt", buffer: Buffer.alloc(0) });
  await assertValues(page, expected(Buffer.alloc(0), "base64"));
  await expect(page.locator(".hash-file-name")).toHaveText("empty.txt");
  await expect(page.locator('.sr-only[role="status"]')).toHaveText(
    "ファイルのハッシュ計算が完了しました",
  );
  await page.getByRole("button", { name: "ファイルをクリア" }).click();
  await expect(page.locator(".hash-result-value")).toHaveCount(0);
  await expect(page.locator('.sr-only[role="status"]')).toBeEmpty();
});

test("keyboard picker and dropped binary files use the native reader", async ({
  offlinePage: page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "ファイル", exact: true }).click();
  const zone = page.getByRole("button", { name: "ファイルをドロップするか、クリックして選択" });
  const chooserPromise = page.waitForEvent("filechooser");
  await zone.focus();
  await zone.press("Enter");
  await (
    await chooserPromise
  ).setFiles({ name: "keyboard.txt", mimeType: "text/plain", buffer: Buffer.from("keyboard") });
  await assertValues(page, expected("keyboard"));
  const bytes = [0, 1, 127, 128, 255];
  const transfer = await page.evaluateHandle((data) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([new Uint8Array(data)], "binary.bin", { type: "application/octet-stream" }),
    );
    return transfer;
  }, bytes);
  await zone.dispatchEvent("drop", { dataTransfer: transfer });
  await assertValues(page, expected(Buffer.from(bytes)));
  await expect(page.locator(".hash-file-name")).toHaveText("binary.bin");
});

interface DeferredDigest {
  operation: number;
  algorithm: string;
  data: Uint8Array<ArrayBuffer>;
  resolve: (result: ArrayBuffer) => void;
  settled: boolean;
}
declare global {
  interface Window {
    hashDeferred: { requests: DeferredDigest[]; nativeDigest: SubtleCrypto["digest"] };
  }
}
async function controlDigests(page: Page) {
  await page.addInitScript(() => {
    const nativeDigest = crypto.subtle.digest.bind(crypto.subtle);
    const requests: DeferredDigest[] = [];
    const operations = new WeakMap<object, number>();
    let nextOperation = 0;
    window.hashDeferred = { requests, nativeDigest };
    crypto.subtle.digest = (algorithm, data) => {
      let operation = operations.get(data);
      if (operation === undefined) {
        operation = ++nextOperation;
        operations.set(data, operation);
      }
      const bytes = ArrayBuffer.isView(data)
        ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
        : new Uint8Array(data);
      return new Promise((resolve) => {
        requests.push({
          operation,
          algorithm: typeof algorithm === "string" ? algorithm : algorithm.name,
          data: new Uint8Array(bytes),
          resolve,
          settled: false,
        });
      });
    };
  });
}
async function started(page: Page, operation: number) {
  await expect
    .poll(() =>
      page.evaluate(
        (op) => window.hashDeferred.requests.some((r) => r.operation === op),
        operation,
      ),
    )
    .toBe(true);
}
async function finish(page: Page, operation: number) {
  for (let stage = 0; stage < 4; stage++) {
    await expect
      .poll(() =>
        page.evaluate(
          (op) => window.hashDeferred.requests.some((r) => r.operation === op && !r.settled),
          operation,
        ),
      )
      .toBe(true);
    await page.evaluate(async (op) => {
      const { requests, nativeDigest } = window.hashDeferred;
      const request = requests.find((r) => r.operation === op && !r.settled)!;
      request.settled = true;
      request.resolve(await nativeDigest(request.algorithm, request.data));
    }, operation);
  }
}

test("controlled promises cannot replace newer text results or clear its loading", async ({
  offlinePage: page,
}) => {
  await controlDigests(page);
  await page.goto("/");
  await page.getByLabel("入力テキスト").fill("old");
  await started(page, 1);
  await page.getByLabel("入力テキスト").fill("current");
  await started(page, 2);
  await finish(page, 1);
  await assertBusy(page);
  await finish(page, 2);
  await assertValues(page, expected("current"));
  await page.getByLabel("入力テキスト").fill("third");
  await started(page, 3);
  await page.getByLabel("入力テキスト").fill("fourth");
  await started(page, 4);
  await finish(page, 4);
  await assertValues(page, expected("fourth"));
  await finish(page, 3);
  await assertValues(page, expected("fourth"));
});

test("controlled old digests stay revoked across mode, clear and same-file reselection", async ({
  offlinePage: page,
}) => {
  await controlDigests(page);
  await page.goto("/");
  await page.getByLabel("入力テキスト").fill("saved text");
  await started(page, 1);
  await page.getByRole("tab", { name: "ファイル", exact: true }).click();
  const file = { name: "same.txt", mimeType: "text/plain", buffer: Buffer.from("same") };
  await page.getByLabel("ファイルを選択", { exact: true }).setInputFiles(file);
  await started(page, 2);
  await page.getByLabel("ファイルを選択", { exact: true }).setInputFiles(file);
  await started(page, 3);
  await finish(page, 2);
  await finish(page, 1);
  await assertBusy(page);
  await expect(page.locator('.sr-only[role="status"]')).toBeEmpty();
  await finish(page, 3);
  await assertValues(page, expected("same"));
  await page
    .getByLabel("ファイルを選択", { exact: true })
    .setInputFiles({ ...file, name: "late.txt", buffer: Buffer.from("late") });
  await started(page, 4);
  await page.getByRole("button", { name: "ファイルをクリア" }).click();
  await finish(page, 4);
  await expect(page.locator(".hash-result-value")).toHaveCount(0);
  await expect(page.locator('.sr-only[role="status"]')).toBeEmpty();
  await page.getByRole("tab", { name: "テキスト", exact: true }).click();
  await expect(page.getByLabel("入力テキスト")).toHaveValue("saved text");
  await started(page, 5);
  await finish(page, 5);
  await assertValues(page, expected("saved text"));
});
