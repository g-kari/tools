import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  calculateRelativeLuminance,
  calculateContrastRatio,
  getWcagResult,
} from "../../app/routes/color-contrast";

describe("hexToRgb", () => {
  it("黒（#000000）を正しく変換する", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("白（#ffffff）を正しく変換する", () => {
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("白（#FFFFFF）を大文字で正しく変換する", () => {
    expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("赤（#ff0000）を正しく変換する", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("青（#0000ff）を正しく変換する", () => {
    expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("任意の色（#1a2b3c）を正しく変換する", () => {
    expect(hexToRgb("#1a2b3c")).toEqual({ r: 26, g: 43, b: 60 });
  });

  it("#なしのHEX文字列を正しく変換する", () => {
    expect(hexToRgb("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("#なしの黒を正しく変換する", () => {
    expect(hexToRgb("000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("無効なHEX文字列はnullを返す", () => {
    expect(hexToRgb("#gg0000")).toBeNull();
  });

  it("短すぎるHEX文字列はnullを返す", () => {
    expect(hexToRgb("#fff")).toBeNull();
  });

  it("空文字列はnullを返す", () => {
    expect(hexToRgb("")).toBeNull();
  });
});

describe("calculateRelativeLuminance", () => {
  it("黒（0, 0, 0）の輝度は0", () => {
    expect(calculateRelativeLuminance(0, 0, 0)).toBe(0);
  });

  it("白（255, 255, 255）の輝度は1", () => {
    expect(calculateRelativeLuminance(255, 255, 255)).toBeCloseTo(1, 5);
  });

  it("赤（255, 0, 0）の輝度は正しく計算される", () => {
    // 赤の相対輝度は約0.2126
    expect(calculateRelativeLuminance(255, 0, 0)).toBeCloseTo(0.2126, 3);
  });

  it("緑（0, 128, 0）の輝度は0より大きく1未満", () => {
    const luminance = calculateRelativeLuminance(0, 128, 0);
    expect(luminance).toBeGreaterThan(0);
    expect(luminance).toBeLessThan(1);
  });

  it("中間値（128, 128, 128）の輝度は0と1の間", () => {
    const luminance = calculateRelativeLuminance(128, 128, 128);
    expect(luminance).toBeGreaterThan(0);
    expect(luminance).toBeLessThan(1);
  });
});

describe("calculateContrastRatio", () => {
  it("黒（#000000）と白（#ffffff）のコントラスト比は21:1", () => {
    expect(calculateContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("同じ色のコントラスト比は1:1", () => {
    expect(calculateContrastRatio("#000000", "#000000")).toBeCloseTo(1, 5);
  });

  it("白（#ffffff）と黒（#000000）のコントラスト比は21:1（順序が逆でも同じ）", () => {
    expect(calculateContrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
  });

  it("白同士のコントラスト比は1:1", () => {
    expect(calculateContrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("コントラスト比は常に1以上", () => {
    const ratio = calculateContrastRatio("#123456", "#abcdef");
    expect(ratio).toBeGreaterThanOrEqual(1);
  });

  it("コントラスト比は常に21以下", () => {
    const ratio = calculateContrastRatio("#000000", "#ffffff");
    expect(ratio).toBeLessThanOrEqual(21);
  });
});

describe("getWcagResult", () => {
  it("比率21はすべてPass", () => {
    const result = getWcagResult(21);
    expect(result.normalAA).toBe(true);
    expect(result.normalAAA).toBe(true);
    expect(result.largeAA).toBe(true);
    expect(result.largeAAA).toBe(true);
  });

  it("比率1はすべてFail", () => {
    const result = getWcagResult(1);
    expect(result.normalAA).toBe(false);
    expect(result.normalAAA).toBe(false);
    expect(result.largeAA).toBe(false);
    expect(result.largeAAA).toBe(false);
  });

  it("比率4.5はAA通常テキストPass、AAA通常テキストFail", () => {
    const result = getWcagResult(4.5);
    expect(result.normalAA).toBe(true);
    expect(result.normalAAA).toBe(false);
  });

  it("比率4.5はAA大テキストPass、AAA大テキストPass", () => {
    const result = getWcagResult(4.5);
    expect(result.largeAA).toBe(true);
    expect(result.largeAAA).toBe(true);
  });

  it("比率3はAA大テキストPass、AA通常テキストFail", () => {
    const result = getWcagResult(3);
    expect(result.largeAA).toBe(true);
    expect(result.normalAA).toBe(false);
  });

  it("比率3はAAA大テキストFail", () => {
    const result = getWcagResult(3);
    expect(result.largeAAA).toBe(false);
  });

  it("比率7はすべてPass", () => {
    const result = getWcagResult(7);
    expect(result.normalAA).toBe(true);
    expect(result.normalAAA).toBe(true);
    expect(result.largeAA).toBe(true);
    expect(result.largeAAA).toBe(true);
  });

  it("比率6.99はAAA通常テキストFail", () => {
    const result = getWcagResult(6.99);
    expect(result.normalAAA).toBe(false);
    expect(result.normalAA).toBe(true);
  });

  it("比率2.99はすべてFail", () => {
    const result = getWcagResult(2.99);
    expect(result.normalAA).toBe(false);
    expect(result.normalAAA).toBe(false);
    expect(result.largeAA).toBe(false);
    expect(result.largeAAA).toBe(false);
  });
});
