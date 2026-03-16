/**
 * カラートークンジェネレーターユーティリティ
 *
 * ベースカラーからデザインシステム用のシェードスケール（50〜950）を生成する。
 * Tailwind CSS の配色システムを参考にした知覚的に均一なスケール生成アルゴリズムを採用。
 */

/** RGB カラー */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** HSL カラー */
export interface HslColor {
  h: number;
  /** 0〜100 */
  s: number;
  /** 0〜100 */
  l: number;
}

/** シェードスケールのキー */
export type ShadeKey =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 950;

/** シェードエントリ */
export interface ShadeEntry {
  /** シェードキー（50〜950） */
  key: ShadeKey;
  /** HEX カラーコード（# 付き） */
  hex: string;
  /** RGB 表記文字列 */
  rgb: string;
  /** HSL 表記文字列 */
  hsl: string;
  /** テキストを白にすべきか（WCAG コントラスト比に基づく） */
  useWhiteText: boolean;
}

/** 出力フォーマット種別 */
export type TokenOutputFormat = "css" | "scss" | "tailwind" | "json";

/** 全シェードキーの定義（明→暗の順） */
export const SHADE_KEYS: ShadeKey[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];

/**
 * 各シェードキーに対応する目標輝度（0〜100）
 * Tailwind CSS v3 のパレット生成を参考に設定
 */
const SHADE_LIGHTNESS: Record<ShadeKey, number> = {
  50: 97,
  100: 94,
  200: 86,
  300: 74,
  400: 62,
  500: 50,
  600: 40,
  700: 31,
  800: 22,
  900: 14,
  950: 8,
};

/**
 * 各シェードキーの彩度補正係数（中間が最大、両端で低下）
 * 0〜1 の乗数。1 = ベース彩度をそのまま使用
 */
const SHADE_SATURATION_FACTOR: Record<ShadeKey, number> = {
  50: 0.4,
  100: 0.55,
  200: 0.75,
  300: 0.9,
  400: 0.95,
  500: 1.0,
  600: 0.95,
  700: 0.9,
  800: 0.8,
  900: 0.65,
  950: 0.5,
};

/**
 * HEX 文字列を RGB オブジェクトに変換する
 * @param hex - HEX カラーコード（# ありなし問わず）
 * @returns RGB オブジェクト、または無効な場合は null
 */
export function hexToRgb(hex: string): RgbColor | null {
  const clean = hex.replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/**
 * RGB オブジェクトを HEX 文字列に変換する
 * @param rgb - RGB オブジェクト
 * @returns HEX カラーコード（# 付き）
 */
export function rgbToHex(rgb: RgbColor): string {
  const toHex = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * RGB を HSL に変換する
 * @param rgb - RGB オブジェクト
 * @returns HSL オブジェクト（h: 0〜360, s: 0〜100, l: 0〜100）
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

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * HSL を RGB に変換する
 * @param hsl - HSL オブジェクト（h: 0〜360, s: 0〜100, l: 0〜100）
 * @returns RGB オブジェクト
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
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
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

/**
 * WCAG 2.1 の相対輝度に基づいてテキストを白にするか判断する
 * @param hex - 背景色の HEX コード
 * @returns true なら白テキスト、false なら黒テキスト
 */
export function shouldUseWhiteText(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L =
    0.2126 * toLinear(rgb.r) +
    0.7152 * toLinear(rgb.g) +
    0.0722 * toLinear(rgb.b);
  return L <= 0.179;
}

/**
 * ベースカラーから全シェードスケールを生成する
 * @param baseHex - ベースカラーの HEX コード
 * @returns シェードエントリの配列（50〜950）
 */
export function generateShades(baseHex: string): ShadeEntry[] {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [];

  const hsl = rgbToHsl(rgb);

  return SHADE_KEYS.map((key) => {
    const targetL = SHADE_LIGHTNESS[key];
    const satFactor = SHADE_SATURATION_FACTOR[key];
    const adjustedS = Math.round(hsl.s * satFactor);

    const shadeHsl: HslColor = {
      h: hsl.h,
      s: adjustedS,
      l: targetL,
    };

    const shadeRgb = hslToRgb(shadeHsl);
    const hex = rgbToHex(shadeRgb);

    return {
      key,
      hex,
      rgb: `rgb(${shadeRgb.r}, ${shadeRgb.g}, ${shadeRgb.b})`,
      hsl: `hsl(${shadeHsl.h}, ${shadeHsl.s}%, ${targetL}%)`,
      useWhiteText: shouldUseWhiteText(hex),
    };
  });
}

/**
 * CSS カスタムプロパティ形式に出力する
 * @param shades - シェードエントリ配列
 * @param name - カラー名（変数名に使用）
 * @returns CSS テキスト
 */
export function formatAsCss(shades: ShadeEntry[], name: string): string {
  const safeName = name.trim() || "color";
  const vars = shades
    .map((s) => `  --${safeName}-${s.key}: ${s.hex};`)
    .join("\n");
  return `:root {\n${vars}\n}`;
}

/**
 * SCSS 変数形式に出力する
 * @param shades - シェードエントリ配列
 * @param name - カラー名（変数名に使用）
 * @returns SCSS テキスト
 */
export function formatAsScss(shades: ShadeEntry[], name: string): string {
  const safeName = name.trim() || "color";
  return shades.map((s) => `$${safeName}-${s.key}: ${s.hex};`).join("\n");
}

/**
 * Tailwind CSS v3 設定形式に出力する
 * @param shades - シェードエントリ配列
 * @param name - カラー名
 * @returns Tailwind 設定テキスト
 */
export function formatAsTailwind(shades: ShadeEntry[], name: string): string {
  const safeName = name.trim() || "color";
  const entries = shades
    .map((s) => `      ${s.key}: '${s.hex}',`)
    .join("\n");
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        '${safeName}': {\n${entries}\n        },\n      },\n    },\n  },\n};`;
}

/**
 * JSON 形式に出力する
 * @param shades - シェードエントリ配列
 * @param name - カラー名
 * @returns JSON テキスト
 */
export function formatAsJson(shades: ShadeEntry[], name: string): string {
  const safeName = name.trim() || "color";
  const obj: Record<string, string> = {};
  shades.forEach((s) => {
    obj[`${safeName}-${s.key}`] = s.hex;
  });
  return JSON.stringify(obj, null, 2);
}

/**
 * 指定フォーマットでシェードをテキスト出力する
 * @param shades - シェードエントリ配列
 * @param name - カラー名
 * @param format - 出力フォーマット
 * @returns フォーマット済みテキスト
 */
export function formatShades(
  shades: ShadeEntry[],
  name: string,
  format: TokenOutputFormat
): string {
  switch (format) {
    case "css":
      return formatAsCss(shades, name);
    case "scss":
      return formatAsScss(shades, name);
    case "tailwind":
      return formatAsTailwind(shades, name);
    case "json":
      return formatAsJson(shades, name);
  }
}
