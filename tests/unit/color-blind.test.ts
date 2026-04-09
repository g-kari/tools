import { describe, test, expect, beforeAll } from "vite-plus/test";
import { clampByte, applyMatrix3x3, applySimulation, CVD_INFOS } from "../../app/utils/color-blind";

// Node.js 環境では ImageData が未定義のためポリフィルを適用する
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
          this.height = height ?? data.length / (4 * width);
        } else {
          this.width = data;
          this.height = width;
          this.data = new Uint8ClampedArray(data * width * 4);
        }
      }
    } as unknown as typeof ImageData;
  }
});

describe("clampByte", () => {
  test("通常の値はそのまま返す", () => {
    expect(clampByte(100)).toBe(100);
    expect(clampByte(0)).toBe(0);
    expect(clampByte(255)).toBe(255);
  });

  test("255超は255にクランプされる", () => {
    expect(clampByte(256)).toBe(255);
    expect(clampByte(1000)).toBe(255);
  });

  test("負の値は0にクランプされる", () => {
    expect(clampByte(-1)).toBe(0);
    expect(clampByte(-100)).toBe(0);
  });

  test("小数点は四捨五入される", () => {
    expect(clampByte(100.6)).toBe(101);
    expect(clampByte(100.4)).toBe(100);
    expect(clampByte(100.5)).toBe(101);
  });
});

describe("applyMatrix3x3", () => {
  test("単位行列では値が変わらない", () => {
    const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    expect(applyMatrix3x3(100, 150, 200, identity)).toEqual([100, 150, 200]);
    expect(applyMatrix3x3(0, 0, 0, identity)).toEqual([0, 0, 0]);
    expect(applyMatrix3x3(255, 255, 255, identity)).toEqual([255, 255, 255]);
  });

  test("全色盲変換（グレースケール）でRGB値が同一になる", () => {
    const achroma = [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722];
    const [r, g, b] = applyMatrix3x3(255, 0, 0, achroma);
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  test("純粋な赤に対する輝度計算が正しい", () => {
    const achroma = [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722];
    const [r] = applyMatrix3x3(255, 0, 0, achroma);
    // 0.2126 * 255 ≈ 54.2 → 54
    expect(r).toBe(54);
  });

  test("結果は常に [0, 255] の範囲内", () => {
    const overflowMatrix = [2, 2, 2, 2, 2, 2, 2, 2, 2];
    const [r, g, b] = applyMatrix3x3(255, 255, 255, overflowMatrix);
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);

    const negativeMatrix = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
    const [r2, g2, b2] = applyMatrix3x3(255, 255, 255, negativeMatrix);
    expect(r2).toBe(0);
    expect(g2).toBe(0);
    expect(b2).toBe(0);
  });
});

describe("CVD_INFOS", () => {
  test("6種類のシミュレーションが定義されている", () => {
    expect(CVD_INFOS).toHaveLength(6);
  });

  test("期待する種別 ID がすべて存在する", () => {
    const ids = CVD_INFOS.map((i) => i.id);
    expect(ids).toContain("deuteranopia");
    expect(ids).toContain("protanopia");
    expect(ids).toContain("tritanopia");
    expect(ids).toContain("deuteranomaly");
    expect(ids).toContain("protanomaly");
    expect(ids).toContain("achromatopsia");
  });

  test("各シミュレーションに必要なフィールドがある", () => {
    for (const info of CVD_INFOS) {
      expect(info.id).toBeTruthy();
      expect(info.label).toBeTruthy();
      expect(info.english).toBeTruthy();
      expect(info.description).toBeTruthy();
      expect(info.svgMatrix).toBeTruthy();
      expect(info.matrix3x3).toHaveLength(9);
    }
  });

  test("SVG 行列は feColorMatrix の 4×5 形式（20要素）", () => {
    for (const info of CVD_INFOS) {
      const values = info.svgMatrix.trim().split(/\s+/);
      expect(values).toHaveLength(20);
    }
  });

  test("SVG 行列の最後の行はアルファ維持（0 0 0 1 0）", () => {
    for (const info of CVD_INFOS) {
      const values = info.svgMatrix.trim().split(/\s+/);
      // 4行目: index 15-19
      expect(values[15]).toBe("0");
      expect(values[16]).toBe("0");
      expect(values[17]).toBe("0");
      expect(values[18]).toBe("1");
      expect(values[19]).toBe("0");
    }
  });
});

describe("applySimulation", () => {
  test("アルファチャンネルは変換されない", () => {
    const data = new Uint8ClampedArray([255, 0, 0, 128, 0, 255, 0, 200]);
    const imageData = new ImageData(data, 2, 1);
    const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const result = applySimulation(imageData, identity);
    expect(result.data[3]).toBe(128);
    expect(result.data[7]).toBe(200);
  });

  test("元の ImageData は変更されない（イミュータブル）", () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    const imageData = new ImageData(data, 1, 1);
    const deutM = CVD_INFOS.find((i) => i.id === "deuteranopia")!.matrix3x3;
    applySimulation(imageData, deutM);
    expect(imageData.data[0]).toBe(255);
    expect(imageData.data[1]).toBe(0);
    expect(imageData.data[2]).toBe(0);
  });

  test("全色盲変換では RGB 値が同一になる", () => {
    const data = new Uint8ClampedArray([200, 100, 50, 255]);
    const imageData = new ImageData(data, 1, 1);
    const achroMatrix = CVD_INFOS.find((i) => i.id === "achromatopsia")!.matrix3x3;
    const result = applySimulation(imageData, achroMatrix);
    expect(result.data[0]).toBe(result.data[1]);
    expect(result.data[1]).toBe(result.data[2]);
  });

  test("出力サイズは入力と同じ", () => {
    const data = new Uint8ClampedArray(4 * 10 * 10).fill(128);
    const imageData = new ImageData(data, 10, 10);
    const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const result = applySimulation(imageData, identity);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
    expect(result.data).toHaveLength(4 * 10 * 10);
  });

  test("単位行列では出力が入力と同一", () => {
    const data = new Uint8ClampedArray([100, 150, 200, 255]);
    const imageData = new ImageData(data, 1, 1);
    const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const result = applySimulation(imageData, identity);
    expect(result.data[0]).toBe(100);
    expect(result.data[1]).toBe(150);
    expect(result.data[2]).toBe(200);
    expect(result.data[3]).toBe(255);
  });
});
