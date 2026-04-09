import { describe, it, expect } from "vite-plus/test";
import {
  generateAllHarmonySchemes,
  toRgbString,
  toHslString,
} from "../../app/routes/color-harmony";

describe("generateAllHarmonySchemes", () => {
  it("5つのスキームを返す", () => {
    const result = generateAllHarmonySchemes("#FF0000");
    expect(result).toHaveLength(5);
  });

  it("各スキームはid・name・description・colorsを持つ", () => {
    const result = generateAllHarmonySchemes("#FF0000");
    for (const scheme of result) {
      expect(scheme.id).toBeTruthy();
      expect(scheme.name).toBeTruthy();
      expect(scheme.description).toBeTruthy();
      expect(Array.isArray(scheme.colors)).toBe(true);
    }
  });

  it("補色スキームは2色を返す", () => {
    const result = generateAllHarmonySchemes("#FF0000");
    const complementary = result.find((s) => s.id === "complementary");
    expect(complementary?.colors).toHaveLength(2);
  });

  it("類似色スキームは5色を返す", () => {
    const result = generateAllHarmonySchemes("#FF0000");
    const analogous = result.find((s) => s.id === "analogous");
    expect(analogous?.colors).toHaveLength(5);
  });

  it("トライアドスキームは3色を返す", () => {
    const result = generateAllHarmonySchemes("#FF0000");
    const triadic = result.find((s) => s.id === "triadic");
    expect(triadic?.colors).toHaveLength(3);
  });

  it("分割補色スキームは3色を返す", () => {
    const result = generateAllHarmonySchemes("#FF0000");
    const split = result.find((s) => s.id === "split-complementary");
    expect(split?.colors).toHaveLength(3);
  });

  it("テトラッドスキームは4色を返す", () => {
    const result = generateAllHarmonySchemes("#FF0000");
    const tetradic = result.find((s) => s.id === "tetradic");
    expect(tetradic?.colors).toHaveLength(4);
  });

  it("補色・トライアド・分割補色・テトラッドの最初の色はベースカラー", () => {
    const base = "#4a90e2";
    const result = generateAllHarmonySchemes(base);
    for (const id of [
      "complementary",
      "triadic",
      "split-complementary",
      "tetradic",
    ]) {
      const scheme = result.find((s) => s.id === id);
      expect(scheme?.colors[0].toLowerCase()).toBe(base.toLowerCase());
    }
  });

  it("類似色の中央(index=2)の色はベースカラー", () => {
    const base = "#4a90e2";
    const result = generateAllHarmonySchemes(base);
    const analogous = result.find((s) => s.id === "analogous");
    expect(analogous?.colors[2].toLowerCase()).toBe(base.toLowerCase());
  });

  it("全色が有効なHEX文字列", () => {
    const result = generateAllHarmonySchemes("#4a90e2");
    for (const scheme of result) {
      for (const color of scheme.colors) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/i);
      }
    }
  });

  it("赤色(#FF0000)の補色は青緑系", () => {
    const result = generateAllHarmonySchemes("#FF0000");
    const complementary = result.find((s) => s.id === "complementary");
    // 補色は180度シフト = シアン系 (#00FFFF 近似)
    const comp = complementary?.colors[1];
    expect(comp).toBeTruthy();
    // RGBで確認: Rが低く、G+Bが高い
    const r = parseInt(comp!.slice(1, 3), 16);
    const g = parseInt(comp!.slice(3, 5), 16);
    const b = parseInt(comp!.slice(5, 7), 16);
    expect(r).toBe(0);
    expect(g + b).toBeGreaterThan(300);
  });
});

describe("toRgbString", () => {
  it("RGB文字列を正しく返す", () => {
    expect(toRgbString({ r: 255, g: 0, b: 0 })).toBe("rgb(255, 0, 0)");
  });

  it("全て0の場合", () => {
    expect(toRgbString({ r: 0, g: 0, b: 0 })).toBe("rgb(0, 0, 0)");
  });

  it("全て255の場合", () => {
    expect(toRgbString({ r: 255, g: 255, b: 255 })).toBe(
      "rgb(255, 255, 255)"
    );
  });
});

describe("toHslString", () => {
  it("HSL文字列を正しく返す", () => {
    expect(toHslString({ h: 0, s: 100, l: 50 })).toBe("hsl(0, 100%, 50%)");
  });

  it("hue=360の場合", () => {
    expect(toHslString({ h: 360, s: 0, l: 100 })).toBe("hsl(360, 0%, 100%)");
  });
});
