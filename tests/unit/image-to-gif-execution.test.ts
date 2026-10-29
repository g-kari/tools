// @vitest-environment jsdom
import { Blob as NodeBlob, Buffer, File as NodeFile } from "node:buffer";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { Route } from "../../app/routes/image-to-gif";

const worker = vi.hoisted(() => ({
  load: vi.fn(),
  exec: vi.fn(),
  write: vi.fn(),
  remove: vi.fn(),
  fetchFile: vi.fn(),
  toBlobURL: vi.fn(),
  instances: [] as {
    loaded: boolean;
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
  }[],
  output: new Uint8Array(),
}));
vi.mock("@ffmpeg/ffmpeg", () => ({
  FFmpeg: class {
    loaded = false;
    on = vi.fn();
    off = vi.fn();
    constructor() {
      worker.instances.push(this);
    }
    async load(options: unknown) {
      await worker.load(options);
      this.loaded = true;
    }
    exec = worker.exec;
    writeFile = worker.write;
    deleteFile = worker.remove;
    async readFile() {
      return worker.output;
    }
  },
}));
vi.mock("@ffmpeg/util", () => ({ fetchFile: worker.fetchFile, toBlobURL: worker.toBlobURL }));

async function dropFiles(node: Element, files: File[]) {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: { files } });
  await act(async () => {
    node.dispatchEvent(event);
  });
}

describe("image-to-GIF actual route and worker protocol", () => {
  let container: HTMLDivElement;
  let root: Root;
  let clipboard: PropertyDescriptor | undefined;
  const writeText = vi.fn();
  const revoke = vi.fn();
  const fetch = vi.fn();
  const downloads: { name: string; url: string }[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-29T00:00:00Z"));
    worker.instances.length = 0;
    worker.output = new Uint8Array(
      Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
    );
    worker.load.mockResolvedValue(undefined);
    worker.exec.mockResolvedValue(0);
    worker.write.mockResolvedValue(true);
    worker.remove.mockResolvedValue(true);
    worker.fetchFile.mockImplementation(
      async (file: File) => new Uint8Array(await file.arrayBuffer()),
    );
    worker.toBlobURL.mockImplementation(async (_url: string, type: string) => `blob:core-${type}`);
    writeText.mockResolvedValue(undefined);
    fetch.mockImplementation(() => {
      throw new Error("Unexpected external request");
    });
    downloads.length = 0;
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("File", NodeFile);
    vi.stubGlobal("fetch", fetch);
    let url = 0;
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = vi.fn(() => `blob:gif-${url++}`);
        static revokeObjectURL = revoke;
      },
    );
    clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        downloads.push({ name: this.download, url: this.href });
      },
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const Component = Route.options.component as ComponentType;
    act(() => root.render(createElement(Component)));
  });
  afterEach(() => {
    act(() => root.unmount());
    expect(vi.getTimerCount()).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
    container.remove();
    if (clipboard) Object.defineProperty(navigator, "clipboard", clipboard);
    else Reflect.deleteProperty(navigator, "clipboard");
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  const status = () => container.querySelector(".sr-only")!.textContent;
  const field = (selector: string) => container.querySelector<HTMLInputElement>(selector)!;
  function button(text: string) {
    const result = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (item) => item.textContent?.trim() === text || item.getAttribute("aria-label") === text,
    );
    expect(result, text).toBeDefined();
    return result!;
  }
  async function click(text: string) {
    await act(async () => button(text).click());
  }
  function change(selector: string, value: string) {
    act(() => {
      field(selector).value = value;
      Simulate.change(field(selector));
    });
  }
  function upload(files: File[]) {
    Object.defineProperty(field("#imageFiles"), "files", { configurable: true, value: files });
    act(() => Simulate.change(field("#imageFiles")));
  }

  it("selects real file bytes, applies settings and copies the actual CLI command", async () => {
    expect(button("GIFに変換").disabled).toBe(true);
    upload([]);
    upload([new File(["invalid"], "bad.txt", { type: "text/plain" })]);
    expect(status()).toContain("有効な画像ファイルを選択してください");
    upload([
      new File(["first"], "first.png", { type: "image/png" }),
      new File(["second"], "second.jpg", { type: "image/jpeg" }),
    ]);
    expect(container.querySelectorAll(".image-preview-item")).toHaveLength(2);
    for (const [selector, value] of [
      ["#framerate", "12"],
      ["#quality", "65"],
      ["#loop", "2"],
      ["#ditherMode", "bayer"],
      ["#maxColors", "128"],
    ])
      change(selector, value);
    expect(container.querySelector(".command-output")!.textContent).toContain("fps=12");
    expect(container.querySelector(".command-output")!.textContent).toContain("max_colors=128");
    await click("コマンドをコピー");
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("-loop 2"));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(status()).toBe("");
    await click("GIFに変換");
    expect(worker.toBlobURL.mock.calls.map(([url]) => url)).toEqual([
      "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js",
      "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm",
    ]);
    expect(worker.write.mock.calls.map(([name, bytes]) => [name, [...bytes]])).toEqual([
      ["input0.png", [...new TextEncoder().encode("first")]],
      ["input1.jpg", [...new TextEncoder().encode("second")]],
    ]);
    expect(worker.exec.mock.calls[0][0]).toContain(
      "concat=n=2:v=1:a=0,fps=12,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=full[p];[s1][p]paletteuse=dither=bayer:bayer_scale=2",
    );
    expect(worker.remove.mock.calls.map(([name]) => name)).toEqual([
      "input0.png",
      "input1.jpg",
      "output.gif",
    ]);
    const preview = container.querySelector<HTMLImageElement>('img[alt="生成されたGIF"]')!;
    expect(preview).not.toBeNull();
    const firstOutputUrl = preview.src;
    await click("ダウンロード");
    expect(downloads[0].name).toMatch(/^animated-\d+\.gif$/);
    expect(downloads[0].url).toBe(preview.src);
    await click("GIFに変換");
    expect(worker.load).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith(firstOutputUrl);
    const log = worker.instances[0].on.mock.calls[0][1] as (entry: { message: string }) => void;
    act(() => log({ message: "offline worker progress" }));
    expect(container.querySelector(".progress-message")!.textContent).toBe(
      "offline worker progress",
    );
    await click("クリア");
    expect(container.querySelector('img[alt="生成されたGIF"]')).toBeNull();
    expect(container.querySelectorAll(".image-preview-item")).toHaveLength(0);
    expect(status()).toContain("すべてクリアしました");
  });

  it("retries worker loading and conversion failures and preserves input for recovery", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    upload([new File(["PNG bytes"], "one.png", { type: "image/png" })]);
    worker.load.mockRejectedValueOnce(new Error("core unavailable"));
    await click("GIFに変換");
    expect(status()).toContain("FFmpegの読み込みに失敗しました");
    expect(error).toHaveBeenCalledWith("Failed to load FFmpeg:", expect.any(Error));
    worker.exec.mockRejectedValueOnce(new Error("encoder unavailable"));
    await click("GIFに変換");
    expect(status()).toContain("GIFの生成に失敗しました");
    expect(error).toHaveBeenCalledWith("Failed to convert images to GIF:", expect.any(Error));
    expect(container.querySelectorAll(".image-preview-item")).toHaveLength(1);
    await click("GIFに変換");
    expect(status()).toContain("GIFを生成しました");
    expect(worker.exec.mock.calls.at(-1)![0]).toContain("-vf");
    expect(field("#framerate").disabled).toBe(true);
  });

  it("handles keyboard/drop replacement and removal and detaches the active worker log handler", async () => {
    const zone = field(".dropzone");
    const fileClick = vi.spyOn(field("#imageFiles"), "click").mockImplementation(() => {});
    act(() => Simulate.keyDown(zone, { key: "Enter" }));
    act(() => Simulate.keyDown(zone, { key: " " }));
    act(() => Simulate.keyDown(zone, { key: "Escape" }));
    act(() => zone.click());
    expect(fileClick).toHaveBeenCalledTimes(3);
    act(() => Simulate.dragOver(zone));
    expect(zone.className).toContain("dragging");
    act(() => Simulate.dragLeave(zone));
    expect(zone.className).not.toContain("dragging");
    await dropFiles(zone, []);
    expect(status()).toContain("有効な画像ファイルをドロップ");
    await dropFiles(zone, [new File(["image"], "old.png", { type: "image/png" })]);
    await dropFiles(zone, [new File(["image"], "new.png", { type: "image/png" })]);
    expect(container.querySelector(".image-name")!.textContent).toBe("new.png");
    expect(revoke).toHaveBeenCalled();
    await click("new.pngを削除");
    expect(container.querySelector(".image-preview-item")).toBeNull();
    const active = worker.instances[0];
    const handler = active.on.mock.calls[0][1];
    act(() => root.unmount());
    expect(active.off).toHaveBeenCalledWith("log", handler);
    root = createRoot(container);
  });
});
