// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";
import { act, createElement, StrictMode, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route, computeMd5Bytes, bytesToHex, bytesToBase64 } from "../../app/routes/hash";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

interface DigestRequest {
  operation: number;
  algorithm: string;
  bytes: Uint8Array;
  resolve: (value: ArrayBuffer) => void;
  reject: (reason: Error) => void;
  settled: boolean;
}

function arrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

class ControlledReader {
  static readonly LOADING = 1;
  static instances: ControlledReader[] = [];
  static throwNext = false;
  readyState = 0;
  result: ArrayBuffer | string | null = null;
  onload: ((event: ProgressEvent<FileReader>) => unknown) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => unknown) | null = null;
  onabort: ((event: ProgressEvent<FileReader>) => unknown) | null = null;
  aborted = 0;
  file: Blob | undefined;
  constructor() {
    ControlledReader.instances.push(this);
  }
  readAsArrayBuffer(file: Blob) {
    this.file = file;
    if (ControlledReader.throwNext) {
      ControlledReader.throwNext = false;
      throw new Error("Synthetic private read exception must not be displayed");
    }
    this.readyState = 1;
  }
  event() {
    return { target: this } as unknown as ProgressEvent<FileReader>;
  }
  load(bytes: Uint8Array) {
    this.result = arrayBuffer(bytes);
    this.readyState = 2;
    return this.onload?.(this.event());
  }
  abort() {
    this.aborted++;
    this.readyState = 2;
    this.onabort?.(this.event());
  }
}

describe("Hash page latest-input lifecycle", () => {
  let container: HTMLDivElement;
  let root: Root | undefined;
  let requests: DigestRequest[];
  let operations: WeakMap<object, number>;
  let nextOperation: number;
  let externalFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("TextEncoder", TextEncoder);
    ControlledReader.instances = [];
    ControlledReader.throwNext = false;
    vi.stubGlobal("FileReader", ControlledReader);
    requests = [];
    operations = new WeakMap();
    nextOperation = 0;
    vi.stubGlobal("crypto", {
      subtle: {
        digest: (algorithm: string, data: Uint8Array) => {
          let operation = operations.get(data);
          if (operation === undefined) {
            operation = ++nextOperation;
            operations.set(data, operation);
          }
          return new Promise<ArrayBuffer>((resolve, reject) => {
            requests.push({
              operation,
              algorithm,
              bytes: new Uint8Array(data),
              resolve,
              reject,
              settled: false,
            });
          });
        },
      },
    });
    externalFetch = vi.fn(() => {
      throw new Error("Unexpected external fetch in hash lifecycle fixture");
    });
    vi.stubGlobal("fetch", externalFetch);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root?.render(
        createElement(
          StrictMode,
          null,
          createElement(
            ToastProvider,
            null,
            createElement(Route.options.component as ComponentType),
          ),
        ),
      );
    });
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    container.remove();
    expect(externalFetch).not.toHaveBeenCalled();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function enter(value: string) {
    const input = container.querySelector<HTMLTextAreaElement>("#hash-input")!;
    act(() => {
      input.value = value;
      Simulate.change(input);
    });
  }
  function tab(mode: "text" | "file") {
    const buttons = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    act(() => buttons[mode === "text" ? 0 : 1].click());
  }
  function select(file?: File) {
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: file ? [file] : [] });
    act(() => Simulate.change(input));
  }
  function clearFile() {
    act(() =>
      container.querySelector<HTMLButtonElement>('[aria-label="ファイルをクリア"]')!.click(),
    );
  }
  function lastReader() {
    return ControlledReader.instances.at(-1)!;
  }
  function notice() {
    return container.querySelector('.sr-only[role="status"]')!.textContent;
  }
  function readError() {
    return container.querySelector('[role="alert"]')?.textContent;
  }
  async function load(reader: ControlledReader, text: string) {
    await act(async () => {
      // Do not await the async load handler; the digest is intentionally deferred.
      void reader.load(new TextEncoder().encode(text));
    });
  }
  async function debounce(milliseconds = 150) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(milliseconds);
    });
  }
  async function finish(operation: number, rejectAlgorithm?: string) {
    for (let stage = 0; stage < 4; stage++) {
      const request = requests.find((item) => item.operation === operation && !item.settled);
      expect(request, `operation ${operation}, SHA stage ${stage}`).toBeDefined();
      request!.settled = true;
      const hash = await webcrypto.subtle.digest(
        request!.algorithm,
        new Uint8Array(request!.bytes),
      );
      await act(async () => {
        if (request!.algorithm === rejectAlgorithm)
          request!.reject(new Error("Synthetic digest failure"));
        else request!.resolve(hash);
      });
    }
  }
  function values() {
    return [...container.querySelectorAll(".hash-result-value")].map((node) => node.textContent);
  }
  function assertBusy() {
    expect(values()).toEqual(Array(5).fill("計算中..."));
    for (const button of container.querySelectorAll<HTMLButtonElement>(".hash-copy-btn")) {
      expect(button.disabled).toBe(true);
    }
  }
  async function expected(text: string, format: "hex" | "base64" = "hex") {
    const bytes = new TextEncoder().encode(text);
    const hashes = [computeMd5Bytes(bytes)];
    for (const algorithm of ["SHA-1", "SHA-256", "SHA-384", "SHA-512"]) {
      hashes.push(new Uint8Array(await webcrypto.subtle.digest(algorithm, bytes)));
    }
    return hashes.map(format === "hex" ? bytesToHex : bytesToBase64);
  }

  it("does not let old text completion replace a newer completed input", async () => {
    enter("old input");
    await debounce();
    enter("new input");
    await debounce();
    await finish(2);
    expect(values()).toEqual(await expected("new input"));
    await finish(1);
    expect(values()).toEqual(await expected("new input"));
  });

  it("keeps the newer operation busy when an old operation reaches finally", async () => {
    enter("old input");
    await debounce();
    enter("new input");
    await debounce();
    await finish(1);
    assertBusy();
    await finish(2);
    expect(values()).toEqual(await expected("new input"));
  });

  it("does not restore cleared hashes during a later input's debounce", async () => {
    enter("old input");
    await debounce();
    enter("");
    await finish(1);
    expect(container.querySelector(".hash-empty-state")).not.toBeNull();
    enter("new input");
    assertBusy();
    expect(container.querySelectorAll(".hash-result-meta")).toHaveLength(0);
  });

  it("starts only the latest text at the 150ms debounce boundary", async () => {
    enter("A");
    await debounce(149);
    expect(requests).toHaveLength(0);
    enter("B");
    await debounce(149);
    expect(requests).toHaveLength(0);
    await debounce(1);
    expect(requests).toHaveLength(1);
    expect(new TextDecoder().decode(requests[0].bytes)).toBe("B");
    await finish(1);
    expect(values()).toEqual(await expected("B"));
  });

  it("restarts batched A→B→A even though React ends with the same text", async () => {
    enter("A");
    await debounce();
    act(() => {
      enter("B");
      enter("A");
    });
    await debounce();
    expect(nextOperation).toBe(2);
    await finish(1, "SHA-256");
    assertBusy();
    await finish(2);
    expect(values()).toEqual(await expected("A"));
  });

  it("discards a stale SHA rejection without clearing current busy or publishing errors", async () => {
    enter("old");
    await debounce();
    enter("current");
    await finish(1, "SHA-1");
    assertBusy();
    expect(readError()).toBeUndefined();
    expect(notice()).toBe("");
    await debounce();
    await finish(2);
    expect(values()).toEqual(await expected("current"));
  });

  it("preserves active per-algorithm errors and the other successful hashes", async () => {
    enter("current");
    await debounce();
    await finish(1, "SHA-256");
    const current = await expected("current");
    current[2] = "エラー: Synthetic digest failure";
    expect(values()).toEqual(current);
    expect(
      [...container.querySelectorAll<HTMLButtonElement>(".hash-copy-btn")].map((b) => b.disabled),
    ).toEqual([false, false, true, false, false]);
  });

  it("ignores text completion after switching to a current file", async () => {
    enter("old text");
    await debounce();
    tab("file");
    select(new File(["file content"], "current.txt"));
    await load(lastReader(), "file content");
    await finish(2);
    expect(values()).toEqual(await expected("file content"));
    const currentNotice = notice();
    await finish(1);
    expect(values()).toEqual(await expected("file content"));
    expect(notice()).toBe(currentNotice);
  });

  it("ignores file completion and notification after restoring saved text", async () => {
    enter("retained text");
    tab("file");
    select(new File(["old file"], "old.txt"));
    await load(lastReader(), "old file");
    tab("text");
    expect(container.querySelector<HTMLTextAreaElement>("#hash-input")!.value).toBe(
      "retained text",
    );
    await debounce();
    await finish(1);
    assertBusy();
    expect(notice()).toBe("");
    await finish(2);
    expect(values()).toEqual(await expected("retained text"));
  });

  it("detaches and aborts a replaced reading file, including a captured late load callback", async () => {
    tab("file");
    select(new File(["A"], "a.txt"));
    const old = lastReader();
    const lateLoad = old.onload!;
    select(new File(["B"], "b.txt"));
    expect(old.aborted).toBe(1);
    expect([old.onload, old.onerror, old.onabort]).toEqual([null, null, null]);
    old.result = arrayBuffer(new TextEncoder().encode("A"));
    await act(async () => {
      void lateLoad(old.event());
    });
    expect(requests).toHaveLength(0);
    assertBusy();
    await load(lastReader(), "B");
    await finish(1);
    expect(values()).toEqual(await expected("B"));
    expect(container.querySelector(".hash-file-name")!.textContent).toBe("b.txt");
  });

  it("keeps the current filename, values and completion notice after an old file digest settles", async () => {
    tab("file");
    select(new File(["A"], "a.txt"));
    await load(lastReader(), "A");
    select(new File(["B"], "b.txt"));
    await load(lastReader(), "B");
    await finish(2);
    const currentNotice = notice();
    await finish(1, "SHA-512");
    expect(values()).toEqual(await expected("B"));
    expect(container.querySelector(".hash-file-name")!.textContent).toBe("b.txt");
    expect(notice()).toBe(currentNotice);
  });

  it.each(["reading", "digesting"])(
    "clears a file while %s and suppresses late events",
    async (phase) => {
      tab("file");
      select(new File(["old"], "old.txt"));
      const old = lastReader();
      const lateLoad = old.onload!;
      const lateError = old.onerror!;
      const lateAbort = old.onabort!;
      if (phase === "digesting") await load(old, "old");
      clearFile();
      old.result = arrayBuffer(new TextEncoder().encode("old"));
      await act(async () => {
        void lateLoad(old.event());
        lateError(old.event());
        lateAbort(old.event());
      });
      if (phase === "digesting") await finish(1);
      expect(values()).toEqual([]);
      expect(container.querySelector(".hash-file-info")).toBeNull();
      expect(readError()).toBeUndefined();
      expect(notice()).toBe("");
      if (phase === "reading") expect(requests).toHaveLength(0);
    },
  );

  it.each(["pending", "completed"])(
    "reselects the identical File object after %s selection",
    async (phase) => {
      tab("file");
      const file = new File(["same"], "same.txt");
      select(file);
      const old = lastReader();
      await load(old, "same");
      if (phase === "completed") await finish(1);
      select(file);
      expect(ControlledReader.instances).toHaveLength(2);
      expect(container.querySelector<HTMLInputElement>('input[type="file"]')!.value).toBe("");
      assertBusy();
      await load(lastReader(), "same");
      if (phase === "pending") {
        await finish(1, "SHA-256");
        assertBusy();
      }
      await finish(2);
      expect(values()).toEqual(await expected("same"));
    },
  );

  it("restarts batched File A→B→A even though the final File object is unchanged", async () => {
    tab("file");
    const a = new File(["A"], "a.txt");
    const b = new File(["B"], "b.txt");
    select(a);
    await load(lastReader(), "A");
    act(() => {
      select(b);
      select(a);
    });
    expect(ControlledReader.instances).toHaveLength(2);
    expect(lastReader().file).toBe(a);
    await load(lastReader(), "A");
    await finish(1);
    assertBusy();
    await finish(2);
    expect(values()).toEqual(await expected("A"));
    expect(container.querySelector(".hash-file-name")!.textContent).toBe("a.txt");
  });

  it("keeps a pending read when the native picker is cancelled", () => {
    tab("file");
    select(new File(["same"], "same.txt"));
    const reader = lastReader();
    select();
    expect(ControlledReader.instances).toHaveLength(1);
    expect(reader.aborted).toBe(0);
    assertBusy();
    expect(container.querySelector(".hash-file-name")!.textContent).toBe("same.txt");
  });

  it.each(["text", "file"] as const)(
    "does not restart the already-selected %s tab",
    async (mode) => {
      if (mode === "text") {
        enter("same");
        await debounce();
      } else {
        tab("file");
        select(new File(["same"], "same.txt"));
        await load(lastReader(), "same");
      }
      tab(mode);
      assertBusy();
      expect(nextOperation).toBe(1);
      await finish(1);
      const current = values();
      tab(mode);
      expect(values()).toEqual(current);
      expect(nextOperation).toBe(1);
    },
  );

  it.each(["error", "abort", "throw", "invalid"])(
    "recovers from a fixed safe file-read %s",
    async (kind) => {
      tab("file");
      ControlledReader.throwNext = kind === "throw";
      select(new File(["bad"], "bad.txt"));
      const reader = lastReader();
      act(() => {
        if (kind === "error") reader.onerror?.(reader.event());
        if (kind === "abort") reader.abort();
        if (kind === "invalid") {
          reader.result = "not an ArrayBuffer";
          void reader.onload?.(reader.event());
        }
      });
      const message = "ファイルを読み込めませんでした。もう一度選択してください。";
      expect(readError()).toBe(message);
      expect(notice()).toBe(message);
      expect(values()).not.toContain("計算中...");
      expect(container.textContent).not.toContain("Synthetic private read exception");
      select(new File(["good"], "good.txt"));
      expect(readError()).toBeUndefined();
      assertBusy();
      await load(lastReader(), "good");
      await finish(1);
      expect(values()).toEqual(await expected("good"));
    },
  );

  it("accepts an empty-byte file and renders the selected format without recalculating", async () => {
    tab("file");
    select(new File([], "empty.txt"));
    await load(lastReader(), "");
    const base64 = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (b) => b.textContent === "Base64",
    )!;
    act(() => base64.click());
    expect(nextOperation).toBe(1);
    expect(ControlledReader.instances).toHaveLength(1);
    await finish(1);
    expect(values()).toEqual(await expected("", "base64"));
  });

  it("catches unexpected text preparation failures and recovers without losing input", async () => {
    vi.stubGlobal(
      "TextEncoder",
      class {
        encode() {
          throw new Error("Synthetic private encoding exception");
        }
      },
    );
    enter("retained");
    await debounce();
    expect(readError()).toBe("ハッシュ計算に失敗しました。入力を変更してもう一度お試しください。");
    expect(container.querySelector<HTMLTextAreaElement>("#hash-input")!.value).toBe("retained");
    expect(values()).not.toContain("計算中...");
    vi.stubGlobal("TextEncoder", TextEncoder);
    enter("repaired");
    await debounce();
    await finish(1);
    expect(values()).toEqual(await expected("repaired"));
  });

  it.each(["debounce", "reading", "digesting"])("cleans up unmount during %s", async (phase) => {
    let reader: ControlledReader | undefined;
    let lateLoad: ControlledReader["onload"] = null;
    if (phase === "debounce") enter("old");
    else {
      tab("file");
      select(new File(["old"], "old.txt"));
      reader = lastReader();
      lateLoad = reader.onload;
      if (phase === "digesting") await load(reader, "old");
    }
    act(() => root?.unmount());
    root = undefined;
    if (reader) {
      expect([reader.onload, reader.onerror, reader.onabort]).toEqual([null, null, null]);
      reader.result = arrayBuffer(new TextEncoder().encode("old"));
      await act(async () => {
        void lateLoad?.(reader!.event());
      });
    }
    await debounce();
    if (phase === "digesting") await finish(1);
    else expect(requests).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    root = createRoot(container);
    act(() =>
      root?.render(
        createElement(ToastProvider, null, createElement(Route.options.component as ComponentType)),
      ),
    );
    expect(values()).toEqual([]);
    expect(notice()).toBe("");
  });
});
