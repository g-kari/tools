import { describe, it, expect } from "vite-plus/test";
import { kelvinToRgb, rgbToHex, kelvinToHex } from "../../app/routes/color-temperature";

describe("kelvinToRgb", () => {
  it("1000K（最低値）は赤みがかった色になる", () => {
    const { r, g, b } = kelvinToRgb(1000);
    expect(r).toBe(255);
    expect(g).toBeGreaterThan(0);
    expect(g).toBeLessThan(120);
    expect(b).toBe(0);
  });

  it("2700K（白熱電球）は暖色系になる", () => {
    const { r, g, b } = kelvinToRgb(2700);
    expect(r).toBe(255);
    expect(g).toBeGreaterThan(150);
    expect(b).toBeGreaterThan(0);
    expect(b).toBeLessThan(120);
  });

  it("6500K（昼光色）は白に近い色になる", () => {
    const { r, g, b } = kelvinToRgb(6500);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeGreaterThan(200);
    expect(b).toBeGreaterThan(240);
  });

  it("6600K以上は blue が 255 になる", () => {
    const { b } = kelvinToRgb(6600);
    expect(b).toBe(255);
  });

  it("40000K（最高値）は青みがかった白になる", () => {
    const { r, g, b } = kelvinToRgb(40000);
    expect(r).toBeGreaterThan(100);
    expect(g).toBeGreaterThan(150);
    expect(b).toBe(255);
  });

  it("各チャンネルは0〜255の範囲内に収まる", () => {
    for (const k of [1000, 2000, 3000, 5000, 6500, 10000, 20000, 40000]) {
      const { r, g, b } = kelvinToRgb(k);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });

  it("999K未満は1000Kとして扱われる（クランプ）", () => {
    const clamped = kelvinToRgb(999);
    const min = kelvinToRgb(1000);
    expect(clamped).toEqual(min);
  });

  it("40001K以上は40000Kとして扱われる（クランプ）", () => {
    const clamped = kelvinToRgb(40001);
    const max = kelvinToRgb(40000);
    expect(clamped).toEqual(max);
  });

  it("整数値を返す", () => {
    const { r, g, b } = kelvinToRgb(5500);
    expect(Number.isInteger(r)).toBe(true);
    expect(Number.isInteger(g)).toBe(true);
    expect(Number.isInteger(b)).toBe(true);
  });
});

describe("rgbToHex", () => {
  it("黒（0, 0, 0）は #000000 になる", () => {
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
  });

  it("白（255, 255, 255）は #FFFFFF になる", () => {
    expect(rgbToHex(255, 255, 255)).toBe("#FFFFFF");
  });

  it("赤（255, 0, 0）は #FF0000 になる", () => {
    expect(rgbToHex(255, 0, 0)).toBe("#FF0000");
  });

  it("緑（0, 255, 0）は #00FF00 になる", () => {
    expect(rgbToHex(0, 255, 0)).toBe("#00FF00");
  });

  it("青（0, 0, 255）は #0000FF になる", () => {
    expect(rgbToHex(0, 0, 255)).toBe("#0000FF");
  });

  it("任意の色（128, 64, 32）は正しい HEX になる", () => {
    expect(rgbToHex(128, 64, 32)).toBe("#804020");
  });

  it("#記号で始まる 7文字の文字列を返す", () => {
    const hex = rgbToHex(100, 150, 200);
    expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("大文字の HEX を返す", () => {
    const hex = rgbToHex(171, 205, 239);
    expect(hex).toBe(hex.toUpperCase());
  });
});

describe("kelvinToHex", () => {
  it("6500K は有効な HEX 文字列を返す", () => {
    const hex = kelvinToHex(6500);
    expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("2700K（白熱電球）は赤成分が最大の暖色系 HEX を返す", () => {
    const hex = kelvinToHex(2700);
    expect(hex.startsWith("#FF")).toBe(true);
  });

  it("異なるケルビン値は異なる HEX を返す", () => {
    const hex1 = kelvinToHex(2000);
    const hex2 = kelvinToHex(6500);
    expect(hex1).not.toBe(hex2);
  });
});
