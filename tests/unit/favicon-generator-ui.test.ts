// @vitest-environment jsdom
import { Blob as NodeBlob, Buffer } from "node:buffer";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import {
  createFaviconsZip,
  createIcoFile,
  generateFavicons,
  resizeImage,
  Route,
} from "../../app/routes/favicon-generator";

const png = () =>
  new NodeBlob(
    [
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKk0AAAAASUVORK5CYII=",
        "base64",
      ),
    ],
    { type: "image/png" },
  ) as Blob;

async function dropFiles(node: Element, files: File[]) {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: { files } });
  await act(async () => {
    node.dispatchEvent(event);
  });
}

describe("favicon generator actual exports and browser controls", () => {
  let container: HTMLDivElement;
  let root: Root;
  let failImage: boolean;
  let missingContext: boolean;
  let failReader: boolean;
  let output: Blob | null;
  const urls = new Map<string, Blob>();
  const downloads: { name: string; blob: Blob }[] = [];
  const revoke = vi.fn();
  const toBlob = vi.fn();
  const drawImage = vi.fn();
  const context = {
    drawImage,
    fillRect: vi.fn(),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    failImage = false;
    missingContext = false;
    failReader = false;
    output = png();
    urls.clear();
    downloads.length = 0;
    toBlob.mockImplementation((callback: BlobCallback) => callback(output));
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL(blob: Blob) {
          const url = `blob:favicon-${urls.size}`;
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
        set src(_value: string) {
          queueMicrotask(() => (failImage ? this.onerror?.() : this.onload?.()));
        }
      },
    );
    // Real Blob bytes cross the browser FileReader boundary; JSZip stays real.
    // Copy to the jsdom ArrayBuffer realm, as a browser FileReader would return.
    vi.stubGlobal(
      "FileReader",
      class {
        onload: ((event: { target: { result: ArrayBuffer } }) => void) | null = null;
        onerror: ((event: { target: { error: Error } }) => void) | null = null;
        readAsArrayBuffer(blob: Blob) {
          if (failReader) {
            this.onerror?.({ target: { error: new Error("offline reader failure") } });
            return;
          }
          void blob
            .arrayBuffer()
            .then((result) =>
              this.onload?.({ target: { result: Uint8Array.from(new Uint8Array(result)).buffer } }),
            );
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
  function button(text: string) {
    const result = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (element) =>
        element.textContent?.trim() === text || element.getAttribute("aria-label") === text,
    );
    expect(result, text).toBeDefined();
    return result!;
  }
  async function click(text: string) {
    // The route intentionally fires its async handler without returning its promise.
    // Observe (not replace) the real ZIP promise so the test owns the full operation.
    const generation =
      text === "ZIPで一括ダウンロード" ? vi.spyOn(JSZip.prototype, "generateAsync") : undefined;
    try {
      await act(async () => {
        button(text).click();
        if (generation) {
          await vi.waitFor(() => expect(generation).toHaveBeenCalled());
          await generation.mock.results[0].value.catch(() => undefined);
        }
      });
    } finally {
      generation?.mockRestore();
    }
  }
  async function upload(type = "image/png", present = true) {
    const input = container.querySelector<HTMLInputElement>("#imageFile")!;
    Object.defineProperty(input, "files", {
      configurable: true,
      value: present ? [new File(["source"], "source.png", { type })] : [],
    });
    await act(async () => Simulate.change(input));
  }
  function toggle(size: string) {
    const label = [...container.querySelectorAll<HTMLLabelElement>(".favicon-size-item")].find(
      (item) => item.querySelector(".favicon-size-name")?.textContent === size,
    )!;
    act(() => Simulate.change(label.querySelector("input")!));
  }

  it("executes resize and batch generation, omitting only failed canvas encodes", async () => {
    const image = document.createElement("img");
    await expect(resizeImage(image, 16, 16)).resolves.toBe(output);
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 16, 16);
    expect(context.imageSmoothingQuality).toBe("high");
    missingContext = true;
    await expect(resizeImage(image, 32, 32)).resolves.toBeNull();
    missingContext = false;
    toBlob.mockImplementationOnce((callback: BlobCallback) => callback(null));
    const sizes: Parameters<typeof generateFavicons>[1] = [16, 32].map((size) => ({
      name: `${size}x${size}`,
      width: size,
      height: size,
      filename: `${size}.png`,
      description: "test",
      defaultSelected: true,
    }));
    const result = await generateFavicons(image, sizes);
    expect([...result.keys()]).toEqual(["32.png"]);
    expect(result.get("32.png")).toBe(output);
  });

  it("creates real ZIP entries and sorted ICO offsets from the actual image bytes", async () => {
    const icons = new Map([
      ["16.png", png()],
      ["32.png", png()],
    ]);
    const ico = await createIcoFile([
      { size: 256, blob: png() },
      { size: 16, blob: png() },
    ]);
    const view = new DataView(await ico.arrayBuffer());
    expect(view.getUint16(4, true)).toBe(2);
    expect(view.getUint8(6)).toBe(16);
    expect(view.getUint8(22)).toBe(0);
    expect(view.getUint32(18, true)).toBe(38);
    for (const includeIco of [false, true]) {
      const zipBlob = await createFaviconsZip(icons, includeIco ? ico : undefined);
      const archive = await JSZip.loadAsync(
        Uint8Array.from(new Uint8Array(await zipBlob.arrayBuffer())),
      );
      expect(Object.keys(archive.files)).toEqual(
        includeIco ? ["16.png", "32.png", "favicon.ico"] : ["16.png", "32.png"],
      );
      expect(await archive.file("16.png")!.async("uint8array")).toEqual(
        new Uint8Array(await icons.get("16.png")!.arrayBuffer()),
      );
    }
  });

  it("validates file selection and keyboard/drop controls, then recovers from decode failure", async () => {
    render();
    const zone = container.querySelector<HTMLElement>(".dropzone")!;
    const fileClick = vi
      .spyOn(container.querySelector<HTMLInputElement>("#imageFile")!, "click")
      .mockImplementation(() => {});
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
    await upload("text/plain");
    expect(container.textContent).toContain("画像ファイルを選択してください");
    await upload("image/png", false);
    failImage = true;
    await upload();
    expect(container.textContent).toContain("画像の読み込みに失敗しました");
    failImage = false;
    await dropFiles(container.querySelector(".dropzone")!, [
      new File(["source"], "source.png", { type: "image/png" }),
    ]);
    expect(container.textContent).toContain("正方形でない画像は引き伸ばされます");
    expect(container.querySelectorAll(".favicon-preview-canvas")).toHaveLength(9);
    expect(drawImage).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalled();
  });

  it("selects all/none and individual sizes, generates and downloads PNG, ICO and a real ZIP", async () => {
    render();
    await upload();
    await click("すべて解除");
    expect(button("Favicon生成").disabled).toBe(true);
    toggle("16x16");
    toggle("16x16");
    await click("すべて選択");
    await click("Favicon生成");
    expect(container.querySelectorAll(".favicon-result-item")).toHaveLength(9);
    await click("favicon-16x16.pngをダウンロード");
    await click("ICOをダウンロード");
    await click("ZIPで一括ダウンロード");
    expect(downloads.map(({ name }) => name)).toEqual([
      "favicon-16x16.png",
      "favicon.ico",
      "favicons.zip",
    ]);
    const archive = await JSZip.loadAsync(
      Uint8Array.from(new Uint8Array(await downloads[2].blob.arrayBuffer())),
    );
    expect(Object.keys(archive.files)).toHaveLength(10);
    expect(archive.file("apple-touch-icon.png")).not.toBeNull();
    expect(archive.file("favicon.ico")).not.toBeNull();
    await click("別の画像を選択");
    expect(container.querySelector(".favicon-result-item")).toBeNull();
    expect(container.querySelector(".dropzone")).not.toBeNull();
  });

  it("allows non-ICO ZIP exports, reports archive/ICO errors, and retries without losing results", async () => {
    render();
    await upload();
    await click("すべて解除");
    toggle("512x512");
    await click("Favicon生成");
    await click("ICOをダウンロード");
    expect(container.textContent).toContain("16x16, 32x32, 48x48のサイズが必要");
    await click("ZIPで一括ダウンロード");
    const archive = await JSZip.loadAsync(
      Uint8Array.from(new Uint8Array(await downloads[0].blob.arrayBuffer())),
    );
    expect(Object.keys(archive.files)).toEqual(["android-chrome-512x512.png"]);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    failReader = true;
    await click("ZIPで一括ダウンロード");
    expect(container.textContent).toContain("ZIPファイルの作成に失敗しました");
    expect(error).toHaveBeenCalledWith("ZIP creation failed:", expect.any(Error));
    failReader = false;
    await click("すべて選択");
    await click("Favicon生成");
    vi.spyOn(NodeBlob.prototype, "arrayBuffer").mockRejectedValueOnce(new Error("unreadable PNG"));
    await click("ICOをダウンロード");
    expect(container.textContent).toContain("ICOファイルの作成に失敗しました");
    expect(error).toHaveBeenCalledWith("ICO creation failed:", expect.any(Error));
    await click("ICOをダウンロード");
    expect(downloads.at(-1)!.name).toBe("favicon.ico");
    expect(button("Favicon生成").disabled).toBe(false);
  });
});
