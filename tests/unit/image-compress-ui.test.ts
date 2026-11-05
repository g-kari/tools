// @vitest-environment jsdom
import { Blob as NodeBlob } from "node:buffer";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { compressImage, Route } from "../../app/routes/image-compress";

describe("image compressor real browser execution", () => {
  let container: HTMLDivElement;
  let root: Root;
  let failImage: boolean;
  let autoLoad: boolean;
  let missingContext: boolean;
  let output: Blob | null;
  const images: { onload: (() => void) | null; onerror: (() => void) | null }[] = [];
  const urls = new Map<string, Blob>();
  const revoke = vi.fn();
  const drawImage = vi.fn();
  const fillRect = vi.fn();
  const toBlob = vi.fn();
  const downloads: { name: string; blob: Blob }[] = [];
  const context = { drawImage, fillRect, fillStyle: "" };
  const file = (name: string) => new File([new Uint8Array(100)], name, { type: "image/png" });

  beforeEach(() => {
    vi.clearAllMocks();
    failImage = false;
    autoLoad = true;
    missingContext = false;
    output = new NodeBlob(["small"], { type: "image/jpeg" }) as Blob;
    images.length = 0;
    urls.clear();
    downloads.length = 0;
    toBlob.mockImplementation((callback: BlobCallback) => callback(output));
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL(blob: Blob) {
          const url = `blob:compress-${urls.size}`;
          urls.set(url, blob);
          return url;
        }
        static revokeObjectURL = revoke;
      },
    );
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 400;
        naturalHeight = 200;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor() {
          images.push(this);
        }
        set src(_value: string) {
          if (autoLoad) queueMicrotask(() => (failImage ? this.onerror?.() : this.onload?.()));
        }
      },
    );
    vi.stubGlobal(
      "FileReader",
      class {
        onload: ((event: { target: { result: ArrayBuffer } }) => void) | null = null;
        onerror: ((event: { target: { error: unknown } }) => void) | null = null;
        readAsArrayBuffer(blob: Blob) {
          void blob
            .arrayBuffer()
            .then((buffer) =>
              this.onload?.({ target: { result: Uint8Array.from(new Uint8Array(buffer)).buffer } }),
            )
            .catch((error) => this.onerror?.({ target: { error } }));
        }
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => (missingContext ? null : context) as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(toBlob);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        downloads.push({ name: this.download, blob: urls.get(this.href)! });
      },
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  function render() {
    const Component = Route.options.component as ComponentType;
    act(() => root.render(createElement(ToastProvider, { children: createElement(Component) })));
  }
  function button(label: string) {
    const result = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (item) => item.textContent?.trim() === label || item.getAttribute("aria-label") === label,
    );
    expect(result, label).toBeDefined();
    return result!;
  }
  async function click(label: string) {
    await act(async () => button(label).click());
  }
  async function upload(files: File[]) {
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: files });
    await act(async () => Simulate.change(input));
  }
  function change(selector: string, value: string) {
    const input = container.querySelector<HTMLInputElement>(selector)!;
    act(() => {
      input.value = value;
      Simulate.change(input);
    });
  }

  it("uses white JPEG backgrounds, explicit WebP quality and quality-free PNG encoding", async () => {
    await expect(compressImage(file("a.png"), 0.75, "jpeg")).resolves.toBe(output);
    expect(fillRect).toHaveBeenCalledWith(0, 0, 400, 200);
    expect(context.fillStyle).toBe("#FFFFFF");
    expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), "image/jpeg", 0.75);
    fillRect.mockClear();
    await compressImage(file("a.png"), 0.6, "webp");
    expect(fillRect).not.toHaveBeenCalled();
    expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), "image/webp", 0.6);
    await compressImage(file("a.png"), 0.6, "png");
    expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), "image/png", undefined);
    failImage = true;
    await expect(compressImage(file("a.png"), 0.6, "png")).resolves.toBeNull();
    failImage = false;
    missingContext = true;
    await expect(compressImage(file("a.png"), 0.6, "png")).resolves.toBeNull();
    expect(revoke).toHaveBeenCalledTimes(5);
  });

  it("compresses multiple real inputs, deduplicates uploads and downloads real single/ZIP outputs", async () => {
    render();
    await upload([new File(["bad"], "bad.txt", { type: "text/plain" })]);
    expect(container.textContent).toContain("画像ファイルを選択してください");
    await upload([file("one.png"), file("two.png")]);
    expect(container.querySelectorAll(".compress-image-card")).toHaveLength(2);
    expect(container.querySelector('[aria-label="圧縮統計"]')!.textContent).toContain("2 / 2");
    await upload([file("one.png")]);
    expect(container.textContent).toContain("重複するファイルはスキップ");
    await upload([file("one.png"), file("three.png")]);
    expect(container.querySelectorAll(".compress-image-card")).toHaveLength(3);
    expect(container.textContent).toContain("1件の重複ファイルをスキップ");
    change("#quality", "60");
    change("#format", "webp");
    await click("全て再圧縮");
    expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), "image/webp", 0.6);
    await click("one.png をダウンロード");
    const generation = vi.spyOn(JSZip.prototype, "generateAsync");
    await act(async () => {
      button("ZIPでまとめてダウンロード (3件)").click();
      await vi.waitFor(() => expect(generation).toHaveBeenCalled());
      await generation.mock.results[0].value;
    });
    expect(downloads[0].name).toBe("one_compressed.webp");
    expect(downloads[1].name).toMatch(/^compressed_images_\d{8}\.zip$/);
    const archive = await JSZip.loadAsync(
      Uint8Array.from(new Uint8Array(await downloads[1].blob.arrayBuffer())),
    );
    expect(Object.keys(archive.files)).toEqual([
      "one_compressed.webp",
      "two_compressed.webp",
      "three_compressed.webp",
    ]);
    expect(await archive.file("one_compressed.webp")!.async("string")).toBe("small");
    await click("two.png を削除");
    expect(container.querySelectorAll(".compress-image-card")).toHaveLength(2);
    await click("全てクリア");
    expect(container.querySelector(".compress-image-card")).toBeNull();
    expect(revoke).toHaveBeenCalled();
  });

  it("retains failed items for recompression, recovers and reports increased size honestly", async () => {
    render();
    failImage = true;
    await upload([file("broken.png")]);
    expect(container.querySelector('[role="alert"]')!.textContent).toContain("圧縮に失敗");
    expect(button("broken.png をダウンロード").disabled).toBe(true);
    failImage = false;
    output = null;
    await click("全て再圧縮");
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    output = new NodeBlob([new Uint8Array(200)], { type: "image/png" }) as Blob;
    change("#format", "png");
    await click("全て再圧縮");
    expect(container.querySelector(".compress-error-text")).toBeNull();
    expect(container.querySelector(".compress-ratio-negative")!.textContent).toBe("+100%");
    expect(button("broken.png をダウンロード").disabled).toBe(false);
  });

  it("does not resurrect a removed item when its in-flight image decode completes", async () => {
    autoLoad = false;
    render();
    await upload([file("removed.png"), file("remaining.png")]);
    expect(images).toHaveLength(2);
    expect(container.querySelectorAll(".compress-card-compressing")).toHaveLength(2);
    await click("removed.png を削除");
    const before = revoke.mock.calls.length;
    await act(async () => images[0].onload?.());
    expect(revoke.mock.calls.length).toBeGreaterThan(before);
    expect(container.textContent).not.toContain("removed.png");
    await act(async () => images[1].onerror?.());
    expect(container.querySelectorAll(".compress-image-card")).toHaveLength(1);
    expect(container.querySelector('[role="alert"]')!.textContent).toContain("圧縮に失敗");
  });
});
