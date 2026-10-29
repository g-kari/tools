// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route as ColorRoute } from "../../app/routes/color-picker";
import { Route as CorsRoute } from "../../app/routes/cors-builder";

describe("color and CORS builder user workflows", () => {
  let container: HTMLDivElement;
  let root: Root;
  let clipboardDescriptor: PropertyDescriptor | undefined;
  const writeText = vi.fn<(text: string) => Promise<void>>();
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    writeText.mockReset().mockResolvedValue(undefined);
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    else Reflect.deleteProperty(navigator, "clipboard");
  });
  function mount(component: unknown) {
    act(() =>
      root.render(
        createElement(ToastProvider, { children: createElement(component as ComponentType) }),
      ),
    );
  }
  function get<T extends Element = HTMLElement>(selector: string): T {
    const found = container.querySelector<T>(selector);
    expect(found, selector).not.toBeNull();
    return found!;
  }
  function change(selector: string, value: string) {
    const input = get<HTMLInputElement>(selector);
    act(() => {
      input.value = value;
      Simulate.change(input);
    });
  }
  function check(selector: string, checked: boolean) {
    const input = get<HTMLInputElement>(selector);
    act(() => {
      input.checked = checked;
      Simulate.change(input);
    });
  }
  function click(label: string) {
    const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (candidate) =>
        candidate.getAttribute("aria-label") === label ||
        candidate.textContent?.trim() === label ||
        candidate.querySelector(".cors-preset-label")?.textContent === label,
    );
    expect(button, label).toBeDefined();
    act(() => button!.click());
  }
  async function copy(label: string) {
    await act(async () => click(label));
  }

  it("keeps HEX, RGB, HSL and CMYK synchronized and copies each actual format", async () => {
    mount(ColorRoute.options.component);
    change('[aria-label="HEX形式の色コード"]', "ff0000");
    expect(get<HTMLInputElement>("#rgb-r").value).toBe("255");
    expect(get<HTMLInputElement>("#rgb-g").value).toBe("0");
    change('[aria-label="HEX形式の色コード"]', "invalid");
    expect(get<HTMLInputElement>("#rgb-r").value).toBe("255");
    change('[aria-label="カラーピッカー"]', "#00ff00");
    expect(get<HTMLInputElement>("#rgb-g").value).toBe("255");
    change("#rgb-b", "999");
    expect(get<HTMLInputElement>("#rgb-b").value).toBe("255");
    change("#rgb-r", "-1");
    change("#rgb-g", "");
    change("#hsl-h", "240");
    change("#hsl-s", "100");
    change("#hsl-l", "50");
    expect(get<HTMLInputElement>("#rgb-b").value).toBe("255");
    for (const id of ["c", "m", "y", "k"]) change(`#cmyk-${id}`, "0");
    expect(get<HTMLInputElement>('[aria-label="HEX形式の色コード"]').value.toLowerCase()).toBe(
      "#ffffff",
    );
    for (const format of ["HEX", "RGB", "HSL", "CMYK"]) await copy(`${format}形式をコピー`);
    expect(writeText.mock.calls.map(([value]) => value)).toEqual([
      "#FFFFFF",
      "rgb(255, 255, 255)",
      "hsl(0, 0%, 100%)",
      "cmyk(0%, 0%, 0%, 0%)",
    ]);
    writeText.mockRejectedValueOnce(new Error("offline clipboard"));
    await copy("HEX形式をコピー");
    expect(container.textContent).toContain("コピーに失敗しました");
  });

  it("restores a palette, avoids duplicates, enforces its size limit and removes selected colors", () => {
    localStorage.setItem("color-picker-palette", JSON.stringify(["#010203"]));
    mount(ColorRoute.options.component);
    click("色 #010203 を選択（右クリックで削除）");
    click("現在の色をパレットに追加");
    expect(container.querySelectorAll(".palette-color-compact")).toHaveLength(1);
    expect(container.textContent).toContain("既にパレットに追加");
    for (let i = 1; i <= 9; i++) {
      change('[aria-label="HEX形式の色コード"]', `#ff00${String(i).padStart(2, "0")}`);
      click("現在の色をパレットに追加");
    }
    click("現在の色をパレットに追加");
    expect(container.textContent).toContain("最大10色");
    expect(JSON.parse(localStorage.getItem("color-picker-palette")!)).toHaveLength(10);
    act(() => Simulate.contextMenu(get(".palette-color-compact")));
    expect(container.querySelectorAll(".palette-color-compact")).toHaveLength(9);
    expect(JSON.parse(localStorage.getItem("color-picker-palette")!)).toHaveLength(9);
  });

  it("recovers from malformed saved data and unavailable storage", () => {
    localStorage.setItem("color-picker-palette", "{");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(ColorRoute.options.component);
    expect(get(".palette-empty-compact").textContent).toContain("未登録");
    expect(error).toHaveBeenCalled();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    click("現在の色をパレットに追加");
    expect(container.querySelectorAll(".palette-color-compact")).toHaveLength(1);
    expect(error).toHaveBeenCalledTimes(2);
  });

  it("validates uploads, reads a real file boundary, samples a pixel and clears the image", () => {
    let failRead = false;
    vi.stubGlobal(
      "FileReader",
      class {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        readAsDataURL() {
          if (failRead) this.onerror?.();
          else this.onload?.({ target: { result: "data:image/png;base64,AA==" } });
        }
      },
    );
    const drawImage = vi.fn();
    const getImageData = vi.fn(() => ({ data: new Uint8ClampedArray([12, 34, 56, 255]) }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
      getImageData,
    } as unknown as CanvasRenderingContext2D);
    mount(ColorRoute.options.component);
    const input = get<HTMLInputElement>("#image-upload");
    const upload = (file?: File) => {
      Object.defineProperty(input, "files", { value: file ? [file] : [], configurable: true });
      act(() => Simulate.change(input));
    };
    upload();
    upload(new File(["bad"], "file.txt", { type: "text/plain" }));
    expect(container.textContent).toContain("画像ファイルを選択");
    failRead = true;
    upload(new File(["png"], "image.png", { type: "image/png" }));
    expect(container.textContent).toContain("読み込みに失敗");
    failRead = false;
    upload(new File(["png"], "image.png", { type: "image/png" }));
    const img = get<HTMLImageElement>('img[alt="色取得用の画像"]');
    Object.defineProperties(img, { naturalWidth: { value: 800 }, naturalHeight: { value: 1200 } });
    act(() => {
      img.dispatchEvent(new Event("load"));
    });
    expect(drawImage).toHaveBeenCalledWith(img, 0, 0, 200, 300);
    const canvas = get<HTMLCanvasElement>("canvas");
    act(() => Simulate.click(canvas, { clientX: 10, clientY: 20 }));
    expect(getImageData).toHaveBeenCalledWith(10, 20, 1, 1);
    expect(get<HTMLInputElement>('[aria-label="HEX形式の色コード"]').value).toBe("#0C2238");
    click("画像をクリア");
    expect(container.querySelector("canvas")).toBeNull();
    const zone = get(".image-canvas-container");
    act(() => Simulate.dragOver(zone));
    const imageDrop: NonNullable<Parameters<typeof Simulate.drop>[1]> & {
      dataTransfer: { files: File[] };
    } = { dataTransfer: { files: [new File(["png"], "drop.png", { type: "image/png" })] } };
    act(() => Simulate.drop(zone, imageDrop));
    expect(container.querySelector("canvas")).not.toBeNull();
    click("画像をクリア");
    const textDrop: typeof imageDrop = {
      dataTransfer: { files: [new File(["bad"], "drop.txt", { type: "text/plain" })] },
    };
    act(() => Simulate.drop(zone, textDrop));
    expect(container.textContent).toContain("画像ファイルをドロップ");
  });

  it("generates each CORS code format, custom and list origins, warnings and clipboard output", async () => {
    mount(CorsRoute.options.component);
    click("プライベートAPI");
    expect(get<HTMLInputElement>('[aria-label="許可するオリジン"]').value).toBe(
      "https://example.com",
    );
    change('[aria-label="許可するオリジン"]', "https://app.example.com");
    check('input[name="originMode"][value="list"]', true);
    change(
      '[aria-label="許可するオリジンリスト（1行1オリジン）"]',
      "https://a.example.com\nhttps://b.example.com",
    );
    for (const label of ["Express.js", "nginx", "CF Workers"]) {
      click(label);
      expect(get(".cors-code-block").textContent).toContain("a.example.com");
      expect(get(".cors-code-block").textContent).toContain("b.example.com");
    }
    click("HTTPヘッダー");
    expect(get(".cors-headers-list").textContent).toContain("Vary:");
    for (const label of ["カスタムリクエストヘッダーを追加", "カスタム公開ヘッダーを追加"]) {
      for (const value of ["", "X-Custom", "X-Custom"]) {
        change(`[aria-label="${label}"]`, value);
        act(() => Simulate.keyDown(get(`[aria-label="${label}"]`), { key: "Enter" }));
      }
    }
    expect(get(".cors-headers-list").textContent).toContain("X-Custom");
    check('input[name="originMode"][value="wildcard"]', true);
    expect(get('[role="alert"]').textContent).toContain("ブラウザに拒否");
    check('[aria-labelledby="cors-credentials-heading"] input', false);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    for (const label of ["1時間", "1日", "1週間"]) click(label);
    change('[aria-label="Max-Age（秒）"]', "60");
    expect(container.textContent).toContain("1分");
    await copy("生成結果をコピー");
    expect(writeText.mock.calls.at(-1)![0]).toContain("Access-Control-Max-Age: 60");
    click("開発環境");
    expect(container.querySelector('[aria-label="Max-Age（秒）"]')).toBeNull();
    click("公開API");
    expect(get<HTMLInputElement>('[aria-label="Max-Age（秒）"]').value).toBe("86400");
  });

  it("updates CORS checkbox selections in both directions and shows the genuinely empty state", () => {
    mount(CorsRoute.options.component);
    for (const selector of [
      '[aria-label="PUT を許可"]',
      '[aria-label="許可するリクエストヘッダー"] input:last-of-type',
      '[aria-label="公開するレスポンスヘッダー"] input',
    ]) {
      check(selector, true);
      check(selector, false);
    }
    check('input[name="originMode"][value="specific"]', true);
    change('[aria-label="許可するオリジン"]', "");
    for (const input of Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    )) {
      if (input.checked)
        act(() => {
          input.checked = false;
          Simulate.change(input);
        });
    }
    expect(get(".cors-empty").textContent).toContain("設定を選択");
  });
});
