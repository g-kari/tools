// @vitest-environment jsdom
import { Blob as NodeBlob, Buffer } from "node:buffer";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import {
  applyEditOptions,
  canvasToBlobWithLimit,
  EmojiConverter,
  resizeImage,
} from "../../app/routes/emoji-converter";

const encoderBoundary = vi.hoisted(() => ({
  load: vi.fn(),
  terminate: vi.fn(),
  write: vi.fn(),
  exec: vi.fn(),
  remove: vi.fn(),
  bytes: new Uint8Array(),
}));

// FFmpeg is a browser-worker boundary. The route, GIF serializer/validator,
// generated-artifact ownership hook and all image/edit algorithms stay real.
vi.mock("@ffmpeg/ffmpeg", () => ({
  FFmpeg: class {
    loaded = true;
    terminate = encoderBoundary.terminate;
    writeFile = encoderBoundary.write;
    exec = encoderBoundary.exec;
    deleteFile = encoderBoundary.remove;
    async readFile() {
      return encoderBoundary.bytes;
    }
  },
}));
vi.mock("../../app/routes/image-to-gif", () => ({ loadFFmpeg: encoderBoundary.load }));

const defaultOptions: Parameters<typeof applyEditOptions>[1] = {
  text: "",
  fontSize: 24,
  textColor: "#ffffff",
  textX: 50,
  textY: 50,
  rotation: 0,
  flipH: false,
  flipV: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  transparent: false,
  transparentColor: "#ffffff",
  border: false,
  borderWidth: 2,
  borderColor: "#000000",
};

/** Valid one-frame GIF89a, with the existing encoder fixture's logical screen set to 128×128. */
function validGif(minimumSize = 0) {
  const bytes = new Uint8Array(
    Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
  );
  bytes[6] = 128;
  bytes[8] = 128;
  if (minimumSize <= bytes.length) return bytes;
  // Legal GIF comment sub-blocks exercise the size cap without corrupting the image stream.
  const padded = [...bytes.subarray(0, -1), 0x21, 0xfe];
  let remaining = minimumSize - bytes.length;
  while (remaining > 0) {
    const length = Math.min(remaining, 255);
    padded.push(length, ...Array.from({ length }, () => 0));
    remaining -= length;
  }
  padded.push(0, 0x3b);
  return new Uint8Array(padded);
}

async function dropFiles(node: Element, files: File[]) {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: { files } });
  await act(async () => {
    node.dispatchEvent(event);
  });
}

describe("emoji converter actual execution", () => {
  let container: HTMLDivElement;
  let root: Root;
  let failImage: boolean;
  let missingContext: boolean;
  let autoLoad: boolean;
  let pixels: Uint8ClampedArray;
  let blobResult: Blob | null;
  const images: { onload: (() => void) | null; onerror: (() => void) | null }[] = [];
  const createUrl = vi.fn();
  const revoke = vi.fn();
  const toBlob = vi.fn();
  const fetch = vi.fn();
  const downloads: { filename: string; href: string }[] = [];
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    font: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    textAlign: "",
    textBaseline: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    failImage = false;
    missingContext = false;
    autoLoad = true;
    pixels = new Uint8ClampedArray([100, 150, 200, 255]);
    images.length = 0;
    downloads.length = 0;
    blobResult = new NodeBlob(["canvas PNG"], { type: "image/png" }) as Blob;
    encoderBoundary.bytes = validGif();
    encoderBoundary.load.mockResolvedValue(true);
    encoderBoundary.write.mockResolvedValue(true);
    encoderBoundary.exec.mockResolvedValue(0);
    encoderBoundary.remove.mockResolvedValue(true);
    fetch.mockImplementation(() => {
      throw new Error("Unexpected external request");
    });
    createUrl.mockImplementation(() => `blob:emoji-${createUrl.mock.calls.length}`);
    toBlob.mockImplementation((callback: BlobCallback) => callback(blobResult));
    context.getImageData.mockImplementation(() => ({ data: pixels }));
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = createUrl;
        static revokeObjectURL = revoke;
      },
    );
    vi.stubGlobal(
      "Image",
      class {
        width = 400;
        height = 200;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private source = "";
        constructor() {
          images.push(this);
        }
        get src() {
          return this.source;
        }
        set src(value: string) {
          this.source = value;
          if (autoLoad) queueMicrotask(() => (failImage ? this.onerror?.() : this.onload?.()));
        }
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => (missingContext ? null : context) as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(toBlob);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(
      (type) => `data:${type};base64,canvas`,
    );
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        downloads.push({ filename: this.download, href: this.href });
      },
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    expect(fetch).not.toHaveBeenCalled();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function render() {
    act(() => root.render(createElement(EmojiConverter as ComponentType)));
  }

  const status = () => container.querySelector('[aria-live="polite"]')!.textContent;
  const field = (selector: string) => container.querySelector<HTMLInputElement>(selector)!;
  const button = (text: string) =>
    [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (element) => element.textContent?.trim() === text,
    )!;

  async function change(selector: string, value: string) {
    await act(async () => {
      field(selector).value = value;
      Simulate.change(field(selector));
    });
  }

  async function checked(selector: string, value: boolean) {
    await act(async () => {
      field(selector).checked = value;
      Simulate.change(field(selector));
    });
  }

  async function selectFile(name = "source.png", type = "image/png") {
    Object.defineProperty(field("#imageFile"), "files", {
      configurable: true,
      value: [new File(["source"], name, { type })],
    });
    await act(async () => Simulate.change(field("#imageFile")));
  }

  it("resizes the actual image, preserves aspect ratio and rejects missing context/invalid images", async () => {
    const file = new File(["source"], "source.png", { type: "image/png" });
    const canvas = await resizeImage(file, 128);
    expect([canvas.width, canvas.height]).toEqual([128, 128]);
    expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 32, 128, 64);
    expect(revoke).toHaveBeenCalledWith("blob:emoji-1");
    failImage = true;
    await expect(resizeImage(file, 128)).rejects.toThrow("Failed to load image");
    missingContext = true;
    await expect(resizeImage(file, 128)).rejects.toThrow("Canvas context not available");
  });

  it("applies real transforms, filter arithmetic, text placement and border geometry", () => {
    const source = document.createElement("canvas");
    source.width = 128;
    source.height = 64;
    const result = applyEditOptions(source, {
      ...defaultOptions,
      flipH: true,
      flipV: true,
      rotation: 90,
      brightness: 50,
      saturation: 0,
      border: true,
      borderWidth: 4,
      borderColor: "#123456",
      text: "Hi",
      fontSize: 18,
      textColor: "#abcdef",
      textX: 25,
      textY: 75,
    });
    expect(result).not.toBe(source);
    expect(context.translate).toHaveBeenCalledWith(64, 32);
    expect(context.scale).toHaveBeenCalledWith(-1, -1);
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect([...pixels]).toEqual([70, 70, 70, 255]);
    expect(context.putImageData).toHaveBeenCalledWith(
      expect.objectContaining({ data: pixels }),
      0,
      0,
    );
    expect(context.strokeRect).toHaveBeenCalledWith(2, 2, 124, 60);
    expect(context.fillText).toHaveBeenCalledWith("Hi", 32, 48);
    expect(context.font).toContain("18px");
    expect(context.fillStyle).toBe("#abcdef");
    applyEditOptions(source, { ...defaultOptions, contrast: 0 });
    expect([...pixels]).toEqual([128, 128, 128, 255]);
    missingContext = true;
    expect(applyEditOptions(source, defaultOptions)).toBe(source);
  });

  it("uses strict per-channel transparency tolerance without erasing boundary colors", () => {
    pixels = new Uint8ClampedArray([
      255, 255, 255, 255, 226, 226, 226, 255, 225, 255, 255, 255, 255, 225, 255, 255, 255, 255, 225,
      255,
    ]);
    applyEditOptions(document.createElement("canvas"), { ...defaultOptions, transparent: true });
    expect([pixels[3], pixels[7], pixels[11], pixels[15], pixels[19]]).toEqual([
      0, 0, 255, 255, 255,
    ]);
  });

  it.each(["jpeg", "webp", "avif"] as const)(
    "retries real %s encoding at lower quality and preserves the requested MIME",
    async (format) => {
      const canvas = document.createElement("canvas");
      const big = new NodeBlob([new Uint8Array(101)]) as Blob;
      const small = new NodeBlob([new Uint8Array(80)]) as Blob;
      toBlob.mockImplementationOnce((callback: BlobCallback) => callback(big));
      toBlob.mockImplementationOnce((callback: BlobCallback) => callback(small));
      await expect(canvasToBlobWithLimit(canvas, format, 0.9, 100)).resolves.toBe(small);
      expect(toBlob).toHaveBeenNthCalledWith(1, expect.any(Function), `image/${format}`, 0.9);
      expect(toBlob).toHaveBeenNthCalledWith(2, expect.any(Function), `image/${format}`, 0.85);
    },
  );

  it("handles null encoders and quality exhaustion without inventing a valid artifact", async () => {
    const canvas = document.createElement("canvas");
    blobResult = null;
    await expect(canvasToBlobWithLimit(canvas, "webp", 0.2, 1)).resolves.toBeNull();
    expect(toBlob.mock.calls.length).toBeGreaterThan(1);
    toBlob.mockClear();
    blobResult = new NodeBlob(["too big"]) as Blob;
    await expect(canvasToBlobWithLimit(canvas, "avif", 0.1, 1)).resolves.toBe(blobResult);
    expect(toBlob).toHaveBeenCalledOnce();
  });

  it("validates files, edits real output, resets each section, downloads and resets the image", async () => {
    render();
    await selectFile("bad.txt", "text/plain");
    expect(status()).toContain("画像ファイルを選択してください");
    await selectFile();
    expect(status()).toContain("処理完了");
    await change("#text", "Hello");
    await change("#fontSize", "32");
    await change("#textColor", "#123456");
    await change("#textX", "20");
    await change("#textY", "70");
    expect(context.fillText).toHaveBeenLastCalledWith("Hello", 25.6, 89.6);
    await change("#rotation", "90");
    await checked('input[type="checkbox"]:not([id])', true);
    const flips = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:not([id])');
    await act(async () => {
      flips[1].checked = true;
      Simulate.change(flips[1]);
    });
    await change("#brightness", "50");
    await change("#contrast", "80");
    await change("#saturation", "70");
    await act(async () => {
      flips[2].checked = true;
      Simulate.change(flips[2]);
    });
    await change("#transparentColor", "#102030");
    await act(async () => {
      flips[3].checked = true;
      Simulate.change(flips[3]);
    });
    await change("#borderWidth", "5");
    await change("#borderColor", "#223344");
    for (const label of [
      "テキスト設定をリセット",
      "回転・反転設定をリセット",
      "フィルター設定をリセット",
      "透過設定をリセット",
      "枠線設定をリセット",
      "全ての編集設定をリセット",
    ]) {
      await act(async () => field(`button[aria-label="${label}"]`).click());
      expect(status()).toContain("処理完了");
    }
    expect(field("#text").value).toBe("");
    expect(field("#rotation").value).toBe("0");
    expect(field("#brightness").value).toBe("100");
    await checked('input[name="outputFormat"][value="jpeg"]', true);
    await change("#outputQuality", "0.75");
    await change("#platform", "slack");
    await act(async () => button("ダウンロード").click());
    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toMatch(/^emoji_\d+\.jpg$/);
    expect(downloads[0].href).toMatch(/^blob:emoji-/);
    expect(status()).toContain("ダウンロードしました");
    await act(async () => container.querySelector<HTMLButtonElement>(".btn-clear")!.click());
    expect(container.querySelector(".emoji-editor-layout")).toBeNull();
    expect(status()).toContain("リセットしました");
    expect(revoke).toHaveBeenCalled();
  });

  it("does not publish an old image after a newer upload has finished", async () => {
    autoLoad = false;
    render();
    await selectFile("old.png");
    await selectFile("new.png");
    expect(images).toHaveLength(2);
    await act(async () => images[1].onload?.());
    const count = createUrl.mock.calls.length;
    expect(status()).toContain("処理完了");
    await act(async () => images[0].onload?.());
    expect(createUrl).toHaveBeenCalledTimes(count);
    expect(container.textContent).toContain("new.png");
    expect(container.textContent).not.toContain("old.png");
  });

  it("reports decode and encoder failures and recovers on replacement", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render();
    failImage = true;
    await selectFile("broken.png");
    expect(status()).toContain("画像の処理に失敗しました");
    expect(error).toHaveBeenCalledOnce();
    failImage = false;
    blobResult = null;
    await selectFile("empty.png");
    expect(status()).toContain("画像を生成できませんでした");
    blobResult = new NodeBlob(["working"], { type: "image/png" }) as Blob;
    await selectFile("working.png");
    expect(status()).toContain("処理完了");
    expect(button("ダウンロード").disabled).toBe(false);
  });

  it("retries FFmpeg, generates/validates real GIF artifacts, saves exact preview and invalidates edits", async () => {
    encoderBoundary.load.mockResolvedValueOnce(false).mockResolvedValue(true);
    render();
    await checked('input[name="outputFormat"][value="gif"]', true);
    expect(container.textContent).toContain("FFmpegを読み込めませんでした");
    expect(encoderBoundary.terminate).toHaveBeenCalledOnce();
    await act(async () => button("FFmpegを再読み込み").click());
    expect(encoderBoundary.load).toHaveBeenCalledTimes(2);
    await checked("#gifAnimate", false);
    await selectFile();
    expect(button("GIFを生成").disabled).toBe(false);
    await act(async () => button("GIFを生成").click());
    const preview = container.querySelector<HTMLImageElement>(
      'img[alt="生成されたGIFのプレビュー"]',
    )!;
    expect(preview).not.toBeNull();
    expect(encoderBoundary.write).toHaveBeenCalledOnce();
    expect(encoderBoundary.exec.mock.calls[0][0]).toContain("-frames:v");
    await act(async () => button("GIFを保存").click());
    expect(downloads[0].href).toBe(preview.src);
    expect(downloads[0].filename).toMatch(/\.gif$/);
    await change("#gifColors", "128");
    expect(container.querySelector('img[alt="生成されたGIFのプレビュー"]')).toBeNull();
    expect(button("GIFを保存").disabled).toBe(true);
    encoderBoundary.bytes = new Uint8Array([1, 2, 3]);
    await act(async () => button("GIFを生成").click());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("有効な128×128 GIF");
    encoderBoundary.bytes = validGif(300_000);
    await act(async () => button("GIFを生成").click());
    expect(button("GIFを保存").disabled).toBe(true);
    expect(container.textContent).toContain("容量制限を超えています");
    await change("#platform", "slack");
    await act(async () => button("GIFを生成").click());
    expect(button("GIFを保存").disabled).toBe(false);
  });

  it("routes drag/drop, keyboard selection and every animation setting through the actual UI", async () => {
    render();
    const dropzone = field('[aria-label="画像ファイルをアップロード"]');
    const fileClick = vi.spyOn(field("#imageFile"), "click").mockImplementation(() => {});
    act(() => Simulate.keyDown(dropzone, { key: "Enter" }));
    act(() => Simulate.keyDown(dropzone, { key: " " }));
    act(() => Simulate.keyDown(dropzone, { key: "Escape" }));
    expect(fileClick).toHaveBeenCalledTimes(2);
    act(() => Simulate.dragOver(dropzone));
    expect(dropzone.className).toContain("dragging");
    act(() => Simulate.dragLeave(dropzone));
    expect(dropzone.className).not.toContain("dragging");
    await checked('input[name="outputFormat"][value="gif"]', true);
    for (const [name, value] of [
      ["animationEffect", "rotate"],
      ["gsapEasing", "sine"],
      ["easingDirection", "inOut"],
    ])
      await checked(`input[name="${name}"][value="${value}"]`, true);
    await change("#animationDuration", "0.5");
    await change("#animationFps", "6");
    await change("#animationLoop", "2");
    await change("#gifColors", "64");
    await change("#gifDither", "bayer");
    await change("#gifQuality", "55");
    expect(field("#gifQuality").value).toBe("55");
    await dropFiles(dropzone, [new File(["source"], "drop.png", { type: "image/png" })]);
    expect(container.textContent).toContain("drop.png");
    expect(button("GIFを生成").disabled).toBe(false);
    await act(async () => button("GIFを生成").click());
    expect(encoderBoundary.write).toHaveBeenCalledTimes(3);
    await checked("#gifAnimate", false);
    expect(container.querySelector('img[alt="生成されたGIFのプレビュー"]')).toBeNull();
  });
});
