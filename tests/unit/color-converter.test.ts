import { describe, test, expect } from 'vite-plus/test';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToCmyk,
  cmykToRgb,
  rgbToOklch,
  oklchToRgb,
  rgbToAllFormats,
  rgbToString,
  hslToString,
  hsvToString,
  cmykToString,
  oklchToString,
} from '../../app/utils/color-converter';

// ==================== HEX <-> RGB ====================

describe('hexToRgb', () => {
  test('6桁HEXを正しく変換する', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  test('先頭の # なしでも変換できる', () => {
    expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  test('小文字HEXを変換できる', () => {
    expect(hexToRgb('#ff6600')).toEqual({ r: 255, g: 102, b: 0 });
  });

  test('3桁省略HEXを展開して変換する', () => {
    expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#0F0')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  test('無効な入力はnullを返す', () => {
    expect(hexToRgb('#GGGGGG')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull();
    expect(hexToRgb('')).toBeNull();
    expect(hexToRgb('xyz')).toBeNull();
  });
});

describe('rgbToHex', () => {
  test('RGBを大文字HEXに変換する', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#FF0000');
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00FF00');
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000FF');
  });

  test('値が255を超える場合はクランプする', () => {
    expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe('#FF0000');
  });

  test('負の値は0にクランプする', () => {
    expect(rgbToHex({ r: -10, g: 0, b: 0 })).toBe('#000000');
  });

  test('hexToRgbとの往復変換が一致する', () => {
    const original = { r: 123, g: 45, b: 67 };
    expect(hexToRgb(rgbToHex(original))).toEqual(original);
  });
});

// ==================== RGB <-> HSL ====================

describe('rgbToHsl', () => {
  test('純粋な赤', () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  test('純粋な緑', () => {
    const hsl = rgbToHsl({ r: 0, g: 255, b: 0 });
    expect(hsl.h).toBe(120);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  test('白', () => {
    const hsl = rgbToHsl({ r: 255, g: 255, b: 255 });
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(100);
  });

  test('黒', () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 0 });
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(0);
  });
});

describe('hslToRgb', () => {
  test('hslToRgb → rgbToHsl 往復変換', () => {
    const colors = [
      { h: 0, s: 100, l: 50 },
      { h: 120, s: 100, l: 50 },
      { h: 240, s: 100, l: 50 },
      { h: 60, s: 80, l: 40 },
    ];
    for (const hsl of colors) {
      const rgb = hslToRgb(hsl);
      const back = rgbToHsl(rgb);
      expect(back.h).toBeCloseTo(hsl.h, -1);
      expect(back.s).toBeCloseTo(hsl.s, -1);
      expect(back.l).toBeCloseTo(hsl.l, -1);
    }
  });

  test('無彩色はRGBが均一', () => {
    const rgb = hslToRgb({ h: 0, s: 0, l: 50 });
    expect(rgb.r).toBe(rgb.g);
    expect(rgb.g).toBe(rgb.b);
  });
});

// ==================== RGB <-> HSV ====================

describe('rgbToHsv / hsvToRgb', () => {
  test('純粋な赤のHSV', () => {
    const hsv = rgbToHsv({ r: 255, g: 0, b: 0 });
    expect(hsv.h).toBe(0);
    expect(hsv.s).toBe(100);
    expect(hsv.v).toBe(100);
  });

  test('黒のHSV', () => {
    const hsv = rgbToHsv({ r: 0, g: 0, b: 0 });
    expect(hsv.s).toBe(0);
    expect(hsv.v).toBe(0);
  });

  test('往復変換の一致', () => {
    const testColors = [
      { r: 255, g: 128, b: 0 },
      { r: 100, g: 200, b: 50 },
      { r: 0, g: 0, b: 255 },
    ];
    for (const rgb of testColors) {
      const hsv = rgbToHsv(rgb);
      const back = hsvToRgb(hsv);
      expect(back.r).toBeCloseTo(rgb.r, -1);
      expect(back.g).toBeCloseTo(rgb.g, -1);
      expect(back.b).toBeCloseTo(rgb.b, -1);
    }
  });
});

// ==================== RGB <-> CMYK ====================

describe('rgbToCmyk / cmykToRgb', () => {
  test('純粋な赤のCMYK', () => {
    const cmyk = rgbToCmyk({ r: 255, g: 0, b: 0 });
    expect(cmyk.c).toBe(0);
    expect(cmyk.m).toBe(100);
    expect(cmyk.y).toBe(100);
    expect(cmyk.k).toBe(0);
  });

  test('黒のCMYK', () => {
    const cmyk = rgbToCmyk({ r: 0, g: 0, b: 0 });
    expect(cmyk.k).toBe(100);
  });

  test('白のCMYK', () => {
    const cmyk = rgbToCmyk({ r: 255, g: 255, b: 255 });
    expect(cmyk.c).toBe(0);
    expect(cmyk.m).toBe(0);
    expect(cmyk.y).toBe(0);
    expect(cmyk.k).toBe(0);
  });

  test('往復変換の一致', () => {
    const testColors = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 128, b: 255 },
      { r: 200, g: 100, b: 50 },
    ];
    for (const rgb of testColors) {
      const cmyk = rgbToCmyk(rgb);
      const back = cmykToRgb(cmyk);
      expect(back.r).toBeCloseTo(rgb.r, -1);
      expect(back.g).toBeCloseTo(rgb.g, -1);
      expect(back.b).toBeCloseTo(rgb.b, -1);
    }
  });
});

// ==================== RGB <-> OKLCH ====================

describe('rgbToOklch / oklchToRgb', () => {
  test('白のOKLCH (L≈1)', () => {
    const oklch = rgbToOklch({ r: 255, g: 255, b: 255 });
    expect(oklch.l).toBeCloseTo(1, 1);
    expect(oklch.c).toBeCloseTo(0, 2);
  });

  test('黒のOKLCH (L≈0)', () => {
    const oklch = rgbToOklch({ r: 0, g: 0, b: 0 });
    expect(oklch.l).toBeCloseTo(0, 2);
    expect(oklch.c).toBeCloseTo(0, 2);
  });

  test('往復変換で概ね一致する（±3の誤差許容）', () => {
    const testColors = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 128, g: 128, b: 128 },
      { r: 57, g: 211, b: 83 },
    ];
    for (const rgb of testColors) {
      const oklch = rgbToOklch(rgb);
      const back = oklchToRgb(oklch);
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(3);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(3);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(3);
    }
  });
});

// ==================== rgbToAllFormats ====================

describe('rgbToAllFormats', () => {
  test('全フォーマットを返す', () => {
    const result = rgbToAllFormats({ r: 57, g: 211, b: 83 });
    expect(result).toHaveProperty('hex');
    expect(result).toHaveProperty('rgb');
    expect(result).toHaveProperty('hsl');
    expect(result).toHaveProperty('hsv');
    expect(result).toHaveProperty('cmyk');
    expect(result).toHaveProperty('oklch');
  });

  test('hexがRGBと一致する', () => {
    const rgb = { r: 100, g: 150, b: 200 };
    const result = rgbToAllFormats(rgb);
    expect(hexToRgb(result.hex)).toEqual(rgb);
  });
});

// ==================== フォーマット文字列 ====================

describe('フォーマット文字列', () => {
  test('rgbToString', () => {
    expect(rgbToString({ r: 255, g: 128, b: 0 })).toBe('rgb(255, 128, 0)');
  });

  test('hslToString', () => {
    expect(hslToString({ h: 30, s: 100, l: 50 })).toBe('hsl(30, 100%, 50%)');
  });

  test('hsvToString', () => {
    expect(hsvToString({ h: 30, s: 100, v: 100 })).toBe('hsv(30, 100%, 100%)');
  });

  test('cmykToString', () => {
    expect(cmykToString({ c: 0, m: 50, y: 100, k: 0 })).toBe('cmyk(0%, 50%, 100%, 0%)');
  });

  test('oklchToString', () => {
    expect(oklchToString({ l: 0.628, c: 0.258, h: 29.2 })).toBe('oklch(0.628 0.258 29.2)');
  });
});
