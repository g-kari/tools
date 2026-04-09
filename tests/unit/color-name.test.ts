import { describe, test, expect } from 'vite-plus/test';
import {
  CSS_NAMED_COLORS,
  findNearestColors,
  findExactColorName,
  deltaE76,
  rgbToLab,
  contrastColor,
} from '../../app/utils/color-name';

// ==================== データベース検証 ====================

describe('CSS_NAMED_COLORS', () => {
  test('135色以上が収録されている', () => {
    expect(CSS_NAMED_COLORS.length).toBeGreaterThanOrEqual(135);
  });

  test('全エントリが name と hex プロパティを持つ', () => {
    for (const color of CSS_NAMED_COLORS) {
      expect(color.name).toBeTruthy();
      expect(color.hex).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  test('代表的なCSS色名が含まれている', () => {
    const names = CSS_NAMED_COLORS.map((c) => c.name);
    expect(names).toContain('red');
    expect(names).toContain('green');
    expect(names).toContain('blue');
    expect(names).toContain('white');
    expect(names).toContain('black');
    expect(names).toContain('tomato');
    expect(names).toContain('rebeccapurple');
  });

  test('red のHEXが #FF0000 である', () => {
    const red = CSS_NAMED_COLORS.find((c) => c.name === 'red');
    expect(red?.hex.toUpperCase()).toBe('#FF0000');
  });

  test('blue のHEXが #0000FF である', () => {
    const blue = CSS_NAMED_COLORS.find((c) => c.name === 'blue');
    expect(blue?.hex.toUpperCase()).toBe('#0000FF');
  });

  test('black のHEXが #000000 である', () => {
    const black = CSS_NAMED_COLORS.find((c) => c.name === 'black');
    expect(black?.hex.toUpperCase()).toBe('#000000');
  });

  test('white のHEXが #FFFFFF である', () => {
    const white = CSS_NAMED_COLORS.find((c) => c.name === 'white');
    expect(white?.hex.toUpperCase()).toBe('#FFFFFF');
  });
});

// ==================== rgbToLab ====================

describe('rgbToLab', () => {
  test('黒のLab値 (L≈0)', () => {
    const lab = rgbToLab({ r: 0, g: 0, b: 0 });
    expect(lab.L).toBeCloseTo(0, 1);
  });

  test('白のLab値 (L≈100)', () => {
    const lab = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(lab.L).toBeCloseTo(100, 0);
  });

  test('無彩色はa≈0, b≈0', () => {
    const lab = rgbToLab({ r: 128, g: 128, b: 128 });
    expect(Math.abs(lab.a)).toBeLessThan(1);
    expect(Math.abs(lab.b)).toBeLessThan(1);
  });
});

// ==================== deltaE76 ====================

describe('deltaE76', () => {
  test('同一色のΔEは0', () => {
    const lab = rgbToLab({ r: 255, g: 0, b: 0 });
    expect(deltaE76(lab, lab)).toBe(0);
  });

  test('黒と白のΔEは約100', () => {
    const black = rgbToLab({ r: 0, g: 0, b: 0 });
    const white = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(deltaE76(black, white)).toBeGreaterThan(90);
  });

  test('近い色のΔEは小さい', () => {
    const lab1 = rgbToLab({ r: 255, g: 0, b: 0 });
    const lab2 = rgbToLab({ r: 250, g: 5, b: 5 });
    const lab3 = rgbToLab({ r: 0, g: 255, b: 0 });
    expect(deltaE76(lab1, lab2)).toBeLessThan(deltaE76(lab1, lab3));
  });

  test('対称性: deltaE(A,B) == deltaE(B,A)', () => {
    const labA = rgbToLab({ r: 100, g: 150, b: 200 });
    const labB = rgbToLab({ r: 200, g: 100, b: 50 });
    expect(deltaE76(labA, labB)).toBeCloseTo(deltaE76(labB, labA), 5);
  });
});

// ==================== findNearestColors ====================

describe('findNearestColors', () => {
  test('デフォルトで10件返す', () => {
    const results = findNearestColors({ r: 100, g: 100, b: 100 });
    expect(results).toHaveLength(10);
  });

  test('count引数で件数を変更できる', () => {
    expect(findNearestColors({ r: 0, g: 0, b: 0 }, 5)).toHaveLength(5);
    expect(findNearestColors({ r: 255, g: 255, b: 255 }, 3)).toHaveLength(3);
  });

  test('結果はΔEの昇順にソートされている', () => {
    const results = findNearestColors({ r: 200, g: 100, b: 50 });
    for (let i = 1; i < results.length; i++) {
      expect(results[i].deltaE).toBeGreaterThanOrEqual(results[i - 1].deltaE);
    }
  });

  test('純粋な赤 (#FF0000) の最近傍は red', () => {
    const results = findNearestColors({ r: 255, g: 0, b: 0 });
    expect(results[0].name).toBe('red');
    expect(results[0].deltaE).toBe(0);
  });

  test('純粋な黒 (#000000) の最近傍は black', () => {
    const results = findNearestColors({ r: 0, g: 0, b: 0 });
    expect(results[0].name).toBe('black');
    expect(results[0].deltaE).toBe(0);
  });

  test('純粋な白 (#FFFFFF) の最近傍は white', () => {
    const results = findNearestColors({ r: 255, g: 255, b: 255 });
    expect(results[0].name).toBe('white');
    expect(results[0].deltaE).toBe(0);
  });

  test('純粋な青 (#0000FF) の最近傍は blue', () => {
    const results = findNearestColors({ r: 0, g: 0, b: 255 });
    expect(results[0].name).toBe('blue');
    expect(results[0].deltaE).toBe(0);
  });

  test('結果に deltaE プロパティが含まれる', () => {
    const results = findNearestColors({ r: 128, g: 128, b: 128 });
    for (const r of results) {
      expect(r).toHaveProperty('deltaE');
      expect(typeof r.deltaE).toBe('number');
      expect(r.deltaE).toBeGreaterThanOrEqual(0);
    }
  });

  test('結果に rgb プロパティが含まれる', () => {
    const results = findNearestColors({ r: 128, g: 128, b: 128 });
    for (const r of results) {
      expect(r).toHaveProperty('rgb');
      expect(r.rgb).toHaveProperty('r');
      expect(r.rgb).toHaveProperty('g');
      expect(r.rgb).toHaveProperty('b');
    }
  });

  test('tomato (#FF6347) の最近傍は tomato', () => {
    const results = findNearestColors({ r: 0xff, g: 0x63, b: 0x47 });
    expect(results[0].name).toBe('tomato');
    expect(results[0].deltaE).toBe(0);
  });
});

// ==================== findExactColorName ====================

describe('findExactColorName', () => {
  test('既知の色名を正しく返す', () => {
    expect(findExactColorName('#FF0000')).toBe('red');
    expect(findExactColorName('#0000FF')).toBe('blue');
    expect(findExactColorName('#008000')).toBe('green');
    expect(findExactColorName('#000000')).toBe('black');
    expect(findExactColorName('#FFFFFF')).toBe('white');
  });

  test('大文字小文字を区別しない', () => {
    expect(findExactColorName('#ff0000')).toBe('red');
    expect(findExactColorName('#FF0000')).toBe('red');
    expect(findExactColorName('#Ff0000')).toBe('red');
  });

  test('# なしでも動作する', () => {
    expect(findExactColorName('FF0000')).toBe('red');
  });

  test('一致しない色はnullを返す', () => {
    expect(findExactColorName('#123456')).toBeNull();
    expect(findExactColorName('#ABCDEF')).toBeNull();
  });

  test('tomato を正しく返す', () => {
    expect(findExactColorName('#FF6347')).toBe('tomato');
  });

  test('rebeccapurple を正しく返す', () => {
    expect(findExactColorName('#663399')).toBe('rebeccapurple');
  });
});

// ==================== contrastColor ====================

describe('contrastColor', () => {
  test('明るい色には黒を返す', () => {
    expect(contrastColor({ r: 255, g: 255, b: 255 })).toBe('#000000');
    expect(contrastColor({ r: 200, g: 200, b: 200 })).toBe('#000000');
  });

  test('暗い色には白を返す', () => {
    expect(contrastColor({ r: 0, g: 0, b: 0 })).toBe('#FFFFFF');
    expect(contrastColor({ r: 30, g: 30, b: 30 })).toBe('#FFFFFF');
  });
});
