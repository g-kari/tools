import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToCmyk,
  cmykToRgb,
  rgbToString,
  hslToString,
  cmykToString,
  type RGB,
  type HSL,
  type CMYK,
} from "../../app/routes/color-picker";

describe("Color Picker - HEX <-> RGB", () => {
  it("should convert HEX to RGB (red)", () => {
    expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("should convert HEX to RGB (green)", () => {
    expect(hexToRgb("#00FF00")).toEqual({ r: 0, g: 255, b: 0 });
  });

  it("should convert HEX to RGB (blue)", () => {
    expect(hexToRgb("#0000FF")).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("should convert HEX to RGB (white)", () => {
    expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("should convert HEX to RGB (black)", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("should convert HEX to RGB without # prefix", () => {
    expect(hexToRgb("FF5733")).toEqual({ r: 255, g: 87, b: 51 });
  });

  it("should handle lowercase HEX", () => {
    expect(hexToRgb("#ff5733")).toEqual({ r: 255, g: 87, b: 51 });
  });

  it("should return black for invalid HEX", () => {
    expect(hexToRgb("#GGGGGG")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("invalid")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("should convert RGB to HEX (red)", () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#FF0000");
  });

  it("should convert RGB to HEX (green)", () => {
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe("#00FF00");
  });

  it("should convert RGB to HEX (blue)", () => {
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe("#0000FF");
  });

  it("should convert RGB to HEX (custom color)", () => {
    expect(rgbToHex({ r: 255, g: 87, b: 51 })).toBe("#FF5733");
  });

  it("should clamp RGB values to valid range", () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe("#FF0080");
  });

  it("should handle zero-padded HEX values", () => {
    expect(rgbToHex({ r: 0, g: 15, b: 255 })).toBe("#000FFF");
  });
});

describe("Color Picker - RGB <-> HSL", () => {
  it("should convert RGB to HSL (red)", () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it("should convert RGB to HSL (green)", () => {
    const hsl = rgbToHsl({ r: 0, g: 255, b: 0 });
    expect(hsl.h).toBe(120);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it("should convert RGB to HSL (blue)", () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 255 });
    expect(hsl.h).toBe(240);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it("should convert RGB to HSL (white)", () => {
    const hsl = rgbToHsl({ r: 255, g: 255, b: 255 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(100);
  });

  it("should convert RGB to HSL (black)", () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(0);
  });

  it("should convert RGB to HSL (gray)", () => {
    const hsl = rgbToHsl({ r: 128, g: 128, b: 128 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(50);
  });

  it("should convert HSL to RGB (red)", () => {
    const rgb = hslToRgb({ h: 0, s: 100, l: 50 });
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  it("should convert HSL to RGB (green)", () => {
    const rgb = hslToRgb({ h: 120, s: 100, l: 50 });
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(255);
    expect(rgb.b).toBe(0);
  });

  it("should convert HSL to RGB (blue)", () => {
    const rgb = hslToRgb({ h: 240, s: 100, l: 50 });
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(255);
  });

  it("should convert HSL to RGB (white)", () => {
    const rgb = hslToRgb({ h: 0, s: 0, l: 100 });
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(255);
    expect(rgb.b).toBe(255);
  });

  it("should convert HSL to RGB (black)", () => {
    const rgb = hslToRgb({ h: 0, s: 0, l: 0 });
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  it("should convert HSL to RGB (gray)", () => {
    const rgb = hslToRgb({ h: 0, s: 0, l: 50 });
    expect(rgb.r).toBe(128);
    expect(rgb.g).toBe(128);
    expect(rgb.b).toBe(128);
  });

  it("should round-trip RGB -> HSL -> RGB accurately", () => {
    const originalRgb: RGB = { r: 123, g: 45, b: 67 };
    const hsl = rgbToHsl(originalRgb);
    const convertedRgb = hslToRgb(hsl);
    expect(convertedRgb.r).toBeCloseTo(originalRgb.r, 0);
    expect(convertedRgb.g).toBeCloseTo(originalRgb.g, 0);
    expect(convertedRgb.b).toBeCloseTo(originalRgb.b, 0);
  });
});

describe("Color Picker - RGB <-> CMYK", () => {
  it("should convert RGB to CMYK (red)", () => {
    const cmyk = rgbToCmyk({ r: 255, g: 0, b: 0 });
    expect(cmyk.c).toBe(0);
    expect(cmyk.m).toBe(100);
    expect(cmyk.y).toBe(100);
    expect(cmyk.k).toBe(0);
  });

  it("should convert RGB to CMYK (green)", () => {
    const cmyk = rgbToCmyk({ r: 0, g: 255, b: 0 });
    expect(cmyk.c).toBe(100);
    expect(cmyk.m).toBe(0);
    expect(cmyk.y).toBe(100);
    expect(cmyk.k).toBe(0);
  });

  it("should convert RGB to CMYK (blue)", () => {
    const cmyk = rgbToCmyk({ r: 0, g: 0, b: 255 });
    expect(cmyk.c).toBe(100);
    expect(cmyk.m).toBe(100);
    expect(cmyk.y).toBe(0);
    expect(cmyk.k).toBe(0);
  });

  it("should convert RGB to CMYK (white)", () => {
    const cmyk = rgbToCmyk({ r: 255, g: 255, b: 255 });
    expect(cmyk.c).toBe(0);
    expect(cmyk.m).toBe(0);
    expect(cmyk.y).toBe(0);
    expect(cmyk.k).toBe(0);
  });

  it("should convert RGB to CMYK (black)", () => {
    const cmyk = rgbToCmyk({ r: 0, g: 0, b: 0 });
    expect(cmyk.c).toBe(0);
    expect(cmyk.m).toBe(0);
    expect(cmyk.y).toBe(0);
    expect(cmyk.k).toBe(100);
  });

  it("should convert CMYK to RGB (red)", () => {
    const rgb = cmykToRgb({ c: 0, m: 100, y: 100, k: 0 });
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  it("should convert CMYK to RGB (green)", () => {
    const rgb = cmykToRgb({ c: 100, m: 0, y: 100, k: 0 });
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(255);
    expect(rgb.b).toBe(0);
  });

  it("should convert CMYK to RGB (blue)", () => {
    const rgb = cmykToRgb({ c: 100, m: 100, y: 0, k: 0 });
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(255);
  });

  it("should convert CMYK to RGB (white)", () => {
    const rgb = cmykToRgb({ c: 0, m: 0, y: 0, k: 0 });
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(255);
    expect(rgb.b).toBe(255);
  });

  it("should convert CMYK to RGB (black)", () => {
    const rgb = cmykToRgb({ c: 0, m: 0, y: 0, k: 100 });
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  it("should round-trip RGB -> CMYK -> RGB accurately", () => {
    const originalRgb: RGB = { r: 200, g: 150, b: 100 };
    const cmyk = rgbToCmyk(originalRgb);
    const convertedRgb = cmykToRgb(cmyk);
    // Allow for ±1 rounding error due to CMYK conversion precision
    expect(Math.abs(convertedRgb.r - originalRgb.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(convertedRgb.g - originalRgb.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(convertedRgb.b - originalRgb.b)).toBeLessThanOrEqual(1);
  });
});

describe("Color Picker - String Formatting", () => {
  it("should format RGB to string", () => {
    expect(rgbToString({ r: 255, g: 128, b: 0 })).toBe("rgb(255, 128, 0)");
  });

  it("should format HSL to string", () => {
    expect(hslToString({ h: 180, s: 50, l: 75 })).toBe("hsl(180, 50%, 75%)");
  });

  it("should format CMYK to string", () => {
    expect(cmykToString({ c: 50, m: 25, y: 0, k: 10 })).toBe(
      "cmyk(50%, 25%, 0%, 10%)"
    );
  });
});

describe("Color Picker - Edge Cases", () => {
  it("should handle boundary values for RGB", () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe("#FFFFFF");
  });

  it("should handle boundary values for HSL", () => {
    const rgb1 = hslToRgb({ h: 0, s: 0, l: 0 });
    expect(rgb1).toEqual({ r: 0, g: 0, b: 0 });

    const rgb2 = hslToRgb({ h: 360, s: 100, l: 100 });
    expect(rgb2).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("should handle boundary values for CMYK", () => {
    const rgb1 = cmykToRgb({ c: 0, m: 0, y: 0, k: 0 });
    expect(rgb1).toEqual({ r: 255, g: 255, b: 255 });

    const rgb2 = cmykToRgb({ c: 100, m: 100, y: 100, k: 100 });
    expect(rgb2).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("should handle partial saturation in HSL", () => {
    const rgb = hslToRgb({ h: 180, s: 50, l: 50 });
    expect(rgb.r).toBeGreaterThanOrEqual(0);
    expect(rgb.r).toBeLessThanOrEqual(255);
    expect(rgb.g).toBeGreaterThanOrEqual(0);
    expect(rgb.g).toBeLessThanOrEqual(255);
    expect(rgb.b).toBeGreaterThanOrEqual(0);
    expect(rgb.b).toBeLessThanOrEqual(255);
  });
});

describe("Color Picker - Full Round-trip Conversion", () => {
  it("should maintain color integrity through HEX -> RGB -> HSL -> RGB -> HEX", () => {
    const originalHex = "#FF5733";
    const rgb1 = hexToRgb(originalHex);
    const hsl = rgbToHsl(rgb1);
    const rgb2 = hslToRgb(hsl);
    const finalHex = rgbToHex(rgb2);
    // Allow for ±1 RGB component difference due to rounding in HSL conversion
    const originalRgb = hexToRgb(originalHex);
    const finalRgb = hexToRgb(finalHex);
    expect(Math.abs(originalRgb.r - finalRgb.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(originalRgb.g - finalRgb.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(originalRgb.b - finalRgb.b)).toBeLessThanOrEqual(1);
  });

  it("should maintain color integrity through RGB -> CMYK -> RGB", () => {
    const originalRgb: RGB = { r: 128, g: 64, b: 192 };
    const cmyk = rgbToCmyk(originalRgb);
    const finalRgb = cmykToRgb(cmyk);
    // Allow for ±1 rounding error due to CMYK conversion precision
    expect(Math.abs(finalRgb.r - originalRgb.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(finalRgb.g - originalRgb.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(finalRgb.b - originalRgb.b)).toBeLessThanOrEqual(1);
  });
});
