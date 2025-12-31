import { describe, it, expect, beforeAll } from "vitest";
import { rgbToHex, extractColors, getPixelsFromImageData } from "../../app/routes/color-extractor";

// ImageData polyfill for Node.js environment
beforeAll(() => {
  if (typeof ImageData === "undefined") {
    global.ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;

      constructor(data: Uint8ClampedArray | number, width: number, height?: number) {
        if (data instanceof Uint8ClampedArray) {
          this.data = data;
          this.width = width;
          this.height = height || data.length / (4 * width);
        } else {
          this.width = data;
          this.height = width;
          this.data = new Uint8ClampedArray(data * width * 4);
        }
      }
    } as any;
  }
});

describe("rgbToHex", () => {
  it("converts RGB to HEX correctly", () => {
    expect(rgbToHex(255, 255, 255)).toBe("#FFFFFF");
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
    expect(rgbToHex(255, 0, 0)).toBe("#FF0000");
    expect(rgbToHex(0, 255, 0)).toBe("#00FF00");
    expect(rgbToHex(0, 0, 255)).toBe("#0000FF");
  });

  it("handles decimal values by rounding", () => {
    expect(rgbToHex(127.4, 127.4, 127.4)).toBe("#7F7F7F");
    expect(rgbToHex(127.6, 127.6, 127.6)).toBe("#808080");
  });

  it("handles single digit hex values", () => {
    expect(rgbToHex(1, 2, 3)).toBe("#010203");
    expect(rgbToHex(15, 15, 15)).toBe("#0F0F0F");
  });
});

describe("getPixelsFromImageData", () => {
  it("extracts pixels from ImageData", () => {
    // 2x2の画像データを作成（赤、緑、青、白）
    const imageData = new ImageData(
      new Uint8ClampedArray([
        255, 0, 0, 255,    // 赤
        0, 255, 0, 255,    // 緑
        0, 0, 255, 255,    // 青
        255, 255, 255, 255, // 白
      ]),
      2,
      2
    );

    const pixels = getPixelsFromImageData(imageData, 1);

    expect(pixels).toHaveLength(4);
    expect(pixels[0]).toEqual({ r: 255, g: 0, b: 0 });
    expect(pixels[1]).toEqual({ r: 0, g: 255, b: 0 });
    expect(pixels[2]).toEqual({ r: 0, g: 0, b: 255 });
    expect(pixels[3]).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("respects sampleRate parameter", () => {
    // 4x1の画像データを作成
    const imageData = new ImageData(
      new Uint8ClampedArray([
        255, 0, 0, 255,
        0, 255, 0, 255,
        0, 0, 255, 255,
        255, 255, 255, 255,
      ]),
      4,
      1
    );

    // サンプルレート2で半分のピクセルを取得
    const pixels = getPixelsFromImageData(imageData, 2);

    // サンプルレート2なので、2つのピクセルのみ取得される
    expect(pixels).toHaveLength(2);
  });

  it("filters out transparent pixels", () => {
    // 半透明と完全透明のピクセルを含む画像データ
    const imageData = new ImageData(
      new Uint8ClampedArray([
        255, 0, 0, 255,  // 不透明
        0, 255, 0, 127,  // 半透明（含まれない）
        0, 0, 255, 128,  // 半透明（境界、含まれる）
        255, 255, 255, 0, // 完全透明（含まれない）
      ]),
      4,
      1
    );

    const pixels = getPixelsFromImageData(imageData, 1);

    // アルファ値が128以上のピクセルのみ（最初と3番目）
    expect(pixels).toHaveLength(2);
    expect(pixels[0]).toEqual({ r: 255, g: 0, b: 0 });
    expect(pixels[1]).toEqual({ r: 0, g: 0, b: 255 });
  });
});

describe("extractColors", () => {
  it("extracts dominant colors from pixels", () => {
    // 赤が多く、青が少ない画像データ
    const pixels = [
      { r: 255, g: 0, b: 0 },
      { r: 250, g: 0, b: 0 },
      { r: 255, g: 5, b: 0 },
      { r: 0, g: 0, b: 255 },
    ];

    const colors = extractColors(pixels, 2);

    expect(colors).toHaveLength(2);
    // カウント順にソートされているので、赤が最初
    expect(colors[0].count).toBeGreaterThan(colors[1].count);
    // 赤系の色が最初に来る
    expect(colors[0].r).toBeGreaterThan(200);
    expect(colors[0].g).toBeLessThan(50);
    expect(colors[0].b).toBeLessThan(50);
  });

  it("returns empty array for empty pixels", () => {
    const colors = extractColors([], 5);
    expect(colors).toEqual([]);
  });

  it("includes hex color code in results", () => {
    const pixels = [
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 0, b: 0 },
    ];

    const colors = extractColors(pixels, 1);

    expect(colors).toHaveLength(1);
    expect(colors[0].hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("handles k larger than pixel count", () => {
    const pixels = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
    ];

    // ピクセル数より多いクラスター数を指定
    const colors = extractColors(pixels, 5);

    // エラーにならず、結果が返される
    expect(colors).toBeDefined();
    expect(colors.length).toBeGreaterThan(0);
  });

  it("returns sorted results by count", () => {
    // 赤が6個、緑が3個、青が1個
    const pixels = [
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
    ];

    const colors = extractColors(pixels, 3);

    // カウント順にソートされている
    expect(colors[0].count).toBeGreaterThanOrEqual(colors[1].count);
    expect(colors[1].count).toBeGreaterThanOrEqual(colors[2].count);
  });
});
