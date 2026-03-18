import { describe, it, expect } from 'vitest';

/**
 * color-mix() CSS値を生成する
 */
function buildColorMixCss(
  colorSpace: string,
  color1: string,
  percentage1: number,
  color2: string
): string {
  const p2 = 100 - percentage1;
  return `color-mix(in ${colorSpace}, ${color1} ${percentage1}%, ${color2} ${p2}%)`;
}

/**
 * HEX カラーを RGB オブジェクトに変換する
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * RGB値でsRGB色空間の線形補間を行う
 */
function mixColorsRgb(hex1: string, hex2: string, percentage1: number): string {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return '#808080';
  const t = percentage1 / 100;
  const r = Math.round(c1.r * t + c2.r * (1 - t));
  const g = Math.round(c1.g * t + c2.g * (1 - t));
  const b = Math.round(c1.b * t + c2.b * (1 - t));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

describe('buildColorMixCss', () => {
  it('should generate correct color-mix() CSS for 50/50 sRGB', () => {
    const result = buildColorMixCss('srgb', '#3b82f6', 50, '#ef4444');
    expect(result).toBe('color-mix(in srgb, #3b82f6 50%, #ef4444 50%)');
  });

  it('should generate correct color-mix() CSS for 100% color1', () => {
    const result = buildColorMixCss('srgb', 'red', 100, 'blue');
    expect(result).toBe('color-mix(in srgb, red 100%, blue 0%)');
  });

  it('should generate correct color-mix() CSS for 0% color1', () => {
    const result = buildColorMixCss('srgb', 'red', 0, 'blue');
    expect(result).toBe('color-mix(in srgb, red 0%, blue 100%)');
  });

  it('should work with oklch color space', () => {
    const result = buildColorMixCss('oklch', '#3b82f6', 30, '#ef4444');
    expect(result).toBe('color-mix(in oklch, #3b82f6 30%, #ef4444 70%)');
  });

  it('should work with hsl color space', () => {
    const result = buildColorMixCss('hsl', 'hsl(200, 80%, 50%)', 25, 'hsl(0, 80%, 50%)');
    expect(result).toBe('color-mix(in hsl, hsl(200, 80%, 50%) 25%, hsl(0, 80%, 50%) 75%)');
  });

  it('should sum percentages to 100', () => {
    for (let pct = 0; pct <= 100; pct += 10) {
      const css = buildColorMixCss('srgb', 'red', pct, 'blue');
      const match = css.match(/(\d+)%.*?(\d+)%/);
      if (match) {
        const p1 = parseInt(match[1]);
        const p2 = parseInt(match[2]);
        expect(p1 + p2).toBe(100);
      }
    }
  });
});

describe('hexToRgb', () => {
  it('should convert white to {r:255, g:255, b:255}', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('should convert black to {r:0, g:0, b:0}', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('should convert red to {r:255, g:0, b:0}', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('should work without # prefix', () => {
    expect(hexToRgb('3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
  });

  it('should be case-insensitive', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('should return null for invalid hex', () => {
    expect(hexToRgb('invalid')).toBeNull();
    expect(hexToRgb('#xyz')).toBeNull();
    expect(hexToRgb('')).toBeNull();
  });

  it('should return null for short hex (3-digit)', () => {
    // 実装は6桁のみ対応
    expect(hexToRgb('#fff')).toBeNull();
  });
});

describe('mixColorsRgb', () => {
  it('should return color1 at 100%', () => {
    const result = mixColorsRgb('#ff0000', '#0000ff', 100);
    expect(result).toBe('#ff0000');
  });

  it('should return color2 at 0%', () => {
    const result = mixColorsRgb('#ff0000', '#0000ff', 0);
    expect(result).toBe('#0000ff');
  });

  it('should return gray when mixing white and black at 50%', () => {
    const result = mixColorsRgb('#ffffff', '#000000', 50);
    expect(result).toBe('#808080');
  });

  it('should return fallback color on invalid hex', () => {
    const result = mixColorsRgb('invalid', '#0000ff', 50);
    expect(result).toBe('#808080');
  });

  it('should mix red and blue at 50% correctly', () => {
    const result = mixColorsRgb('#ff0000', '#0000ff', 50);
    // r=128, g=0, b=128 => #800080 (紫)
    expect(result).toBe('#800080');
  });

  it('should produce valid hex string output', () => {
    const result = mixColorsRgb('#3b82f6', '#ef4444', 50);
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('should handle all percentage steps 0-100', () => {
    for (let pct = 0; pct <= 100; pct += 10) {
      const result = mixColorsRgb('#ff0000', '#0000ff', pct);
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
