// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { generateFilename, resizeImage, Route } from "../../app/routes/image-resize";

describe("image resize actual image pipeline and controls", () => {
  let container: HTMLDivElement;
  let root: Root;
  let failImage: boolean;
  let missingContext: boolean;
  let encodedBlob: Blob | null;
  const revoke = vi.fn();
  const createUrl = vi.fn();
  const drawImage = vi.fn();
  const toBlob = vi.fn();
  const downloads: string[] = [];
  const context = {
    drawImage,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low",
  };

  beforeEach(() => {
    failImage = false;
    missingContext = false;
    encodedBlob = new Blob(["resized"], { type: "image/png" });
    downloads.length = 0;
    vi.clearAllMocks();
    createUrl.mockImplementation(() => `blob:image-${createUrl.mock.calls.length}`);
    toBlob.mockImplementation((callback: BlobCallback) => callback(encodedBlob));
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
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
        naturalWidth = 400;
        naturalHeight = 200;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private source = "";
        get src() {
          return this.source;
        }
        set src(value: string) {
          this.source = value;
          queueMicrotask(() => (failImage ? this.onerror?.() : this.onload?.()));
        }
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => (missingContext ? null : context) as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(toBlob);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        downloads.push(this.download);
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

  async function selectFile(type = "image/png") {
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [new File([new Uint8Array(32)], "source.png", { type })],
    });
    await act(async () => Simulate.change(input));
  }

  function button(text: string) {
    const result = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (element) => element.textContent?.trim() === text,
    );
    expect(result, `button ${text}`).toBeDefined();
    return result!;
  }

  async function click(text: string) {
    await act(async () => button(text).click());
  }

  function change(selector: string, value: string) {
    const input = container.querySelector<HTMLInputElement>(selector)!;
    act(() => {
      input.value = value;
      Simulate.change(input);
    });
  }

  function toggle(index: number, checked: boolean) {
    const input = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[index];
    act(() => {
      input.checked = checked;
      Simulate.change(input);
    });
  }

  function dimensions() {
    return [
      container.querySelector<HTMLInputElement>("#width")!.value,
      container.querySelector<HTMLInputElement>("#height")!.value,
    ];
  }

  it("executes the real resize encoder with normal, crop, GIF and missing-type inputs", async () => {
    const file = new File(["input"], "source.png", { type: "image/png" });
    await expect(resizeImage(file, 100, 50)).resolves.toBe(encodedBlob);
    expect(drawImage).toHaveBeenLastCalledWith(expect.anything(), 0, 0, 100, 50);
    expect(context.imageSmoothingEnabled).toBe(true);
    expect(context.imageSmoothingQuality).toBe("high");
    expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), "image/png", 0.92);
    await resizeImage(file, 30, 20, { x: 5, y: 6, width: 70, height: 80 });
    expect(drawImage).toHaveBeenLastCalledWith(expect.anything(), 5, 6, 70, 80, 0, 0, 30, 20);
    for (const type of ["image/gif", ""]) {
      await resizeImage(new File(["input"], "source.gif", { type }), 10, 10);
      expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), "image/png", 0.92);
    }
    await resizeImage(new File(["input"], "source.webp", { type: "image/webp" }), 10, 10);
    expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), "image/webp", 0.92);
    expect(revoke).toHaveBeenCalledTimes(5);
  });

  it("returns null on decode/context/encoder failures and releases image object URLs", async () => {
    const file = new File(["broken"], "source.png", { type: "image/png" });
    failImage = true;
    await expect(resizeImage(file, 1, 1)).resolves.toBeNull();
    expect(revoke).toHaveBeenCalledOnce();
    failImage = false;
    missingContext = true;
    await expect(resizeImage(file, 1, 1)).resolves.toBeNull();
    missingContext = false;
    encodedBlob = null;
    await expect(resizeImage(file, 1, 1)).resolves.toBeNull();
    expect(revoke).toHaveBeenCalledTimes(3);
    expect(generateFilename("photo.final.jpg", 12, 34, true)).toBe("photo.final_cropped_12x34.jpg");
    expect(generateFilename("photo", 12, 34)).toBe("photo_resized_12x34.png");
  });

  it("validates upload, maintains aspect in either direction, applies presets and resets", async () => {
    render();
    await selectFile("text/plain");
    expect(container.textContent).toContain("画像ファイルを選択してください");
    await selectFile();
    expect(dimensions()).toEqual(["400", "200"]);
    change("#width", "200");
    expect(dimensions()).toEqual(["200", "100"]);
    change("#height", "50");
    expect(dimensions()).toEqual(["100", "50"]);
    toggle(0, false);
    change("#height", "75");
    expect(dimensions()).toEqual(["100", "75"]);
    toggle(0, true);
    expect(dimensions()).toEqual(["150", "75"]);
    toggle(0, false);
    await click("HD (1280×720)");
    expect(dimensions()).toEqual(["1280", "720"]);
    toggle(0, true);
    expect(dimensions()).toEqual(["1280", "640"]);
    await click("Full HD (1920×1080)");
    expect(dimensions()).toEqual(["1920", "960"]);
    change("#width", "0");
    expect(dimensions()).toEqual(["1", "1"]);
    await click("別の画像を選択");
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
    expect(container.querySelector("#width")).toBeNull();
    expect(revoke).toHaveBeenCalled();
  });

  it("reports processing failure, recovers, downloads the real result and clears it", async () => {
    render();
    await selectFile();
    encodedBlob = null;
    await click("リサイズ");
    expect(container.textContent).toContain("画像の処理に失敗しました");
    expect(container.querySelector('img[alt="リサイズ結果"]')).toBeNull();
    encodedBlob = new Blob(["small"], { type: "image/png" });
    change("#width", "100");
    await click("リサイズ");
    expect(container.querySelector('img[alt="リサイズ結果"]')).not.toBeNull();
    expect(container.textContent).toContain("画像をリサイズしました");
    await click("ダウンロード");
    expect(downloads).toEqual(["source_resized_100x50.png"]);
    await click("リサイズ");
    expect(revoke).toHaveBeenCalled();
    await click("別の画像を選択");
    expect(container.querySelector('img[alt="リサイズ結果"]')).toBeNull();
  });

  it("creates, moves and bounds crop selections through canvas and global mouse events", async () => {
    render();
    await selectFile();
    toggle(1, true);
    expect(container.textContent).toContain("選択範囲: 160 × 160 px");
    expect(container.textContent).toContain("位置: (120, 20)");
    await click("1:1");
    const canvas = container.querySelector<HTMLCanvasElement>("canvas")!;
    act(() => Simulate.mouseDown(canvas, { clientX: 10, clientY: 10 }));
    act(() => Simulate.mouseMove(canvas, { clientX: 12, clientY: 12 }));
    expect(container.textContent).toContain("選択範囲: 160 × 160 px");
    act(() => Simulate.mouseMove(canvas, { clientX: 110, clientY: 60 }));
    expect(container.textContent).toContain("選択範囲: 50 × 50 px");
    act(() => Simulate.mouseUp(canvas));
    act(() => Simulate.mouseDown(canvas, { clientX: 20, clientY: 20 }));
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 50, clientY: 40 }));
    });
    expect(container.textContent).toContain("位置: (40, 30)");
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 900, clientY: 900 }));
    });
    expect(container.textContent).toContain("位置: (350, 150)");
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    await click("4:3");
    act(() => Simulate.mouseDown(canvas, { clientX: 0, clientY: 0 }));
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 160, clientY: 90 }));
    });
    expect(container.textContent).toContain("選択範囲: 120 × 90 px");
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    await click("トリミング&リサイズ");
    expect(drawImage).toHaveBeenLastCalledWith(expect.anything(), 0, 0, 120, 90, 0, 0, 400, 300);
    await click("ダウンロード");
    expect(downloads).toEqual(["source_cropped_400x300.png"]);
    toggle(1, false);
    expect(container.querySelector("canvas")).toBeNull();
  });
});
