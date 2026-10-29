// @vitest-environment jsdom
import { Blob as NodeBlob } from "node:buffer";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/transparent-image";

async function dropFiles(node: Element, files: File[]) {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: { files } });
  await act(async () => {
    node.dispatchEvent(event);
  });
}

describe("transparent image real pixel-processing and export controls", () => {
  let container: HTMLDivElement;
  let root: Root;
  let failImage: boolean;
  let missingContext: boolean;
  let blob: Blob | null;
  const revoke = vi.fn();
  const drawImage = vi.fn();
  const getImageData = vi.fn();
  const putImageData = vi.fn();
  const toBlob = vi.fn();
  const downloads: string[] = [];
  const context = { drawImage, getImageData, putImageData, fillRect: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    failImage = false;
    missingContext = false;
    blob = new NodeBlob(["transparent PNG"], { type: "image/png" }) as Blob;
    downloads.length = 0;
    getImageData.mockImplementation((_x: number, _y: number, width: number) => ({
      data: new Uint8ClampedArray(
        width === 1 ? [12, 34, 56, 255] : [255, 255, 255, 255, 0, 0, 0, 255],
      ),
    }));
    toBlob.mockImplementation((callback: BlobCallback) => callback(blob));
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = vi.fn(() => "blob:transparent-image");
        static revokeObjectURL = revoke;
      },
    );
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 1000;
        naturalHeight = 500;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => (failImage ? this.onerror?.() : this.onload?.()));
        }
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => (missingContext ? null : context) as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(toBlob);
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      width: 500,
      height: 250,
      right: 500,
      bottom: 250,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        downloads.push(this.download);
      },
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const Component = Route.options.component as ComponentType;
    act(() => root.render(createElement(ToastProvider, { children: createElement(Component) })));
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  function field(selector: string) {
    return container.querySelector<HTMLInputElement>(selector)!;
  }
  async function change(selector: string, value: string) {
    await act(async () => {
      field(selector).value = value;
      Simulate.change(field(selector));
    });
  }
  async function click(text: string) {
    const button = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (element) => element.textContent?.trim() === text,
    )!;
    expect(button, text).toBeDefined();
    await act(async () => button.click());
  }
  async function upload(type = "image/png", present = true) {
    Object.defineProperty(field("#imageFile"), "files", {
      configurable: true,
      value: present ? [new File(["source"], "photo.final.jpg", { type })] : [],
    });
    await act(async () => Simulate.change(field("#imageFile")));
  }

  it("validates keyboard, drag/drop and decode failures, then recovers with an actual preview", async () => {
    const zone = field(".dropzone");
    const fileClick = vi.spyOn(field("#imageFile"), "click").mockImplementation(() => {});
    act(() => Simulate.keyDown(zone, { key: "Enter" }));
    act(() => Simulate.keyDown(zone, { key: " " }));
    act(() => Simulate.keyDown(zone, { key: "Escape" }));
    act(() => zone.click());
    expect(fileClick).toHaveBeenCalledTimes(3);
    act(() => Simulate.dragOver(zone));
    expect(zone.className).toContain("dragging");
    act(() => Simulate.dragLeave(zone));
    expect(zone.className).not.toContain("dragging");
    await upload("image/png", false);
    await upload("text/plain");
    expect(container.textContent).toContain("画像ファイルを選択してください");
    failImage = true;
    await upload();
    expect(container.textContent).toContain("画像の読み込みに失敗しました");
    failImage = false;
    await dropFiles(field(".dropzone"), []);
    await dropFiles(field(".dropzone"), [new File(["source"], "drop.png", { type: "image/png" })]);
    expect(container.querySelectorAll("canvas")).toHaveLength(2);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 500, 250);
    expect(container.textContent).toContain("1000 × 500 px");
  });

  it("processes real alpha pixels, selects a canvas color, validates HEX and downloads full-size PNG", async () => {
    await upload();
    expect([...putImageData.mock.calls.at(-1)![0].data]).toEqual([255, 255, 255, 0, 0, 0, 0, 255]);
    const original = container.querySelector<HTMLCanvasElement>('[aria-label="元画像プレビュー"]')!;
    const before = getImageData.mock.calls.length;
    act(() => Simulate.click(original, { clientX: 20, clientY: 30 }));
    expect(getImageData).toHaveBeenCalledTimes(before);
    await click("画像から");
    expect(original.className).toContain("picking-color");
    act(() => Simulate.click(original, { clientX: 20, clientY: 30 }));
    expect(field('[aria-label="透過色のHEX値"]').value).toBe("#0c2238");
    expect(getImageData).toHaveBeenCalledWith(20, 30, 1, 1);
    await change("#targetColor", "#ffffff");
    await change("#tolerance", "0");
    await change('[aria-label="透過色のHEX値"]', "invalid");
    await click("ダウンロード");
    expect(container.textContent).toContain("無効な色が指定されています");
    expect(downloads).toHaveLength(0);
    await change('[aria-label="透過色のHEX値"]', "#ffffff");
    await click("ダウンロード");
    expect(downloads).toEqual(["photo.final_transparent.png"]);
    expect(getImageData).toHaveBeenCalledWith(0, 0, 1000, 500);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
    await click("クリア");
    expect(container.querySelector("canvas")).toBeNull();
    expect(field("#imageFile").value).toBe("");
    expect(revoke).toHaveBeenCalled();
  });

  it("recovers from unavailable contexts and null encoders without enabling a fake download", async () => {
    await upload();
    missingContext = true;
    await click("ダウンロード");
    expect(container.textContent).toContain("画像処理に失敗しました");
    expect(downloads).toHaveLength(0);
    missingContext = false;
    blob = null;
    await click("ダウンロード");
    expect(container.textContent).toContain("画像の生成に失敗しました");
    expect(downloads).toHaveLength(0);
    blob = new NodeBlob(["good PNG"], { type: "image/png" }) as Blob;
    await change("#tolerance", "100");
    await click("ダウンロード");
    expect(downloads).toEqual(["photo.final_transparent.png"]);
    expect(container.textContent).toContain("透過画像をダウンロードしました");
  });
});
