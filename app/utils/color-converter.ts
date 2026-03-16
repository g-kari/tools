/**
 * カラーフォーマット変換ユーティリティ
 *
 * 対応フォーマット:
 * - HEX (#RRGGBB)
 * - RGB (r, g, b)
 * - HSL (h, s%, l%)
 * - HSV/HSB (h, s%, v%)
 * - CMYK (c%, m%, y%, k%)
 * - OKLCH (l, c, h°)
 */

/** RGB色 (各チャンネル 0〜255) */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** HSL色 (h: 0〜360, s: 0〜100, l: 0〜100) */
export interface HslColor {
  h: number;
  s: number;
  l: number;
}

/** HSV色 (h: 0〜360, s: 0〜100, v: 0〜100) */
export interface HsvColor {
  h: number;
  s: number;
  v: number;
}

/** CMYK色 (各チャンネル 0〜100) */
export interface CmykColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

/** OKLCH色 (l: 0〜1, c: 0〜0.4, h: 0〜360) */
export interface OklchColor {
  l: number;
  c: number;
  h: number;
}

/** 全フォーマットをまとめた型 */
export interface ColorFormats {
  hex: string;
  rgb: RgbColor;
  hsl: HslColor;
  hsv: HsvColor;
  cmyk: CmykColor;
  oklch: OklchColor;
}

// ==================== HEX <-> RGB ====================

/**
 * HEX文字列をRGBに変換
 * @param hex - "#RRGGBB" または "#RGB" 形式
 * @returns RGBオブジェクト、無効な場合はnull
 */
export function hexToRgb(hex: string): RgbColor | null {
  const clean = hex.replace('#', '').trim();
  let r: number, g: number, b: number;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

/**
 * RGBをHEX文字列に変換
 * @param rgb - RGBオブジェクト
 * @returns "#RRGGBB" 形式の大文字HEX文字列
 */
export function rgbToHex(rgb: RgbColor): string {
  const clamp = (n: number) => Math.round(Math.max(0, Math.min(255, n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

// ==================== RGB <-> HSL ====================

/**
 * RGBをHSLに変換
 * @param rgb - RGBオブジェクト
 * @returns HSLオブジェクト
 */
export function rgbToHsl(rgb: RgbColor): HslColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }
  h /= 6;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * HSLをRGBに変換
 * @param hsl - HSLオブジェクト
 * @returns RGBオブジェクト
 */
export function hslToRgb(hsl: HslColor): RgbColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

// ==================== RGB <-> HSV ====================

/**
 * RGBをHSVに変換
 * @param rgb - RGBオブジェクト
 * @returns HSVオブジェクト
 */
export function rgbToHsv(rgb: RgbColor): HsvColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  const v = max;
  const s = max === 0 ? 0 : d / max;

  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * HSVをRGBに変換
 * @param hsv - HSVオブジェクト
 * @returns RGBオブジェクト
 */
export function hsvToRgb(hsv: HsvColor): RgbColor {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = v;
  } else {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      default:
        r = v;
        g = p;
        b = q;
        break;
    }
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ==================== RGB <-> CMYK ====================

/**
 * RGBをCMYKに変換
 * @param rgb - RGBオブジェクト
 * @returns CMYKオブジェクト
 */
export function rgbToCmyk(rgb: RgbColor): CmykColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

/**
 * CMYKをRGBに変換
 * @param cmyk - CMYKオブジェクト
 * @returns RGBオブジェクト
 */
export function cmykToRgb(cmyk: CmykColor): RgbColor {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;

  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

// ==================== RGB <-> OKLCH ====================

/** sRGB値をリニア値に変換（ガンマ補正除去） */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** リニア値をsRGB値に変換（ガンマ補正適用） */
function linearToSrgb(c: number): number {
  const clamped = Math.max(0, c);
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

/**
 * RGBをOKLCHに変換
 * @param rgb - RGBオブジェクト
 * @returns OKLCHオブジェクト
 */
export function rgbToOklch(rgb: RgbColor): OklchColor {
  // sRGB → Linear sRGB
  const lr = srgbToLinear(rgb.r / 255);
  const lg = srgbToLinear(rgb.g / 255);
  const lb = srgbToLinear(rgb.b / 255);

  // Linear sRGB → LMS (Oklab行列)
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  // 立方根
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS → OKLab
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  // OKLab → OKLCH
  const C = Math.sqrt(a * a + bVal * bVal);
  const H = (Math.atan2(bVal, a) * 180) / Math.PI;

  return {
    l: Math.round(L * 1000) / 1000,
    c: Math.round(C * 1000) / 1000,
    h: Math.round((((H % 360) + 360) % 360) * 10) / 10,
  };
}

/**
 * OKLCHをRGBに変換
 * @param oklch - OKLCHオブジェクト
 * @returns RGBオブジェクト
 */
export function oklchToRgb(oklch: OklchColor): RgbColor {
  const { l: L, c: C, h: H } = oklch;

  // OKLCH → OKLab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const lm = l_ * l_ * l_;
  const mm = m_ * m_ * m_;
  const sm = s_ * s_ * s_;

  // LMS → Linear sRGB
  const lr = 4.0767416621 * lm - 3.3077115913 * mm + 0.2309699292 * sm;
  const lg = -1.2684380046 * lm + 2.6097574011 * mm - 0.3413193965 * sm;
  const lbl = -0.0041960863 * lm - 0.7034186147 * mm + 1.707614701 * sm;

  // Linear sRGB → sRGB (クランプ付き)
  const toSrgb8 = (n: number) => Math.max(0, Math.min(255, Math.round(linearToSrgb(n) * 255)));

  return {
    r: toSrgb8(lr),
    g: toSrgb8(lg),
    b: toSrgb8(lbl),
  };
}

// ==================== フォーマット文字列 ====================

/**
 * RGBを文字列に変換
 * @param rgb - RGBオブジェクト
 * @returns "rgb(r, g, b)" 形式の文字列
 */
export function rgbToString(rgb: RgbColor): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * HSLを文字列に変換
 * @param hsl - HSLオブジェクト
 * @returns "hsl(h, s%, l%)" 形式の文字列
 */
export function hslToString(hsl: HslColor): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * HSVを文字列に変換
 * @param hsv - HSVオブジェクト
 * @returns "hsv(h, s%, v%)" 形式の文字列
 */
export function hsvToString(hsv: HsvColor): string {
  return `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
}

/**
 * CMYKを文字列に変換
 * @param cmyk - CMYKオブジェクト
 * @returns "cmyk(c%, m%, y%, k%)" 形式の文字列
 */
export function cmykToString(cmyk: CmykColor): string {
  return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
}

/**
 * OKLCHを文字列に変換
 * @param oklch - OKLCHオブジェクト
 * @returns "oklch(l c h)" 形式の文字列
 */
export function oklchToString(oklch: OklchColor): string {
  return `oklch(${oklch.l} ${oklch.c} ${oklch.h})`;
}

// ==================== 全フォーマット変換 ====================

/**
 * RGBから全フォーマットを一括計算
 * @param rgb - RGBオブジェクト
 * @returns 全フォーマットを含むColorFormatsオブジェクト
 */
export function rgbToAllFormats(rgb: RgbColor): ColorFormats {
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl: rgbToHsl(rgb),
    hsv: rgbToHsv(rgb),
    cmyk: rgbToCmyk(rgb),
    oklch: rgbToOklch(rgb),
  };
}

/** デフォルトカラー（ターミナルグリーン） */
export const DEFAULT_COLOR_RGB: RgbColor = { r: 57, g: 211, b: 83 };
