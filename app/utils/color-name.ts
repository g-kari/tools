/**
 * 色名検索ユーティリティ
 *
 * CSS名前付き色のデータベースとCIE Lab色空間を使った最近傍色検索を提供する。
 * RGB距離よりも知覚的に正確なΔE (CIE76) による色差計算を使用。
 */

import { hexToRgb, type RgbColor } from './color-converter';

/** CSS名前付き色エントリ */
export interface NamedColor {
  /** CSS色名 */
  name: string;
  /** 16進数カラーコード (#RRGGBB大文字形式) */
  hex: string;
}

/** 色距離付きの名前付き色マッチ結果 */
export interface ColorMatch extends NamedColor {
  /** 知覚的色差 ΔE (CIE76、0に近いほど似ている) */
  deltaE: number;
  /** 名前付き色のRGB値 */
  rgb: RgbColor;
}

/**
 * CSS名前付き色データベース (重複hex除外、148色→140色)
 * 出典: https://www.w3.org/TR/css-color-4/#named-colors
 */
export const CSS_NAMED_COLORS: NamedColor[] = [
  { name: 'aliceblue', hex: '#F0F8FF' },
  { name: 'antiquewhite', hex: '#FAEBD7' },
  { name: 'aqua', hex: '#00FFFF' },
  { name: 'aquamarine', hex: '#7FFFD4' },
  { name: 'azure', hex: '#F0FFFF' },
  { name: 'beige', hex: '#F5F5DC' },
  { name: 'bisque', hex: '#FFE4C4' },
  { name: 'black', hex: '#000000' },
  { name: 'blanchedalmond', hex: '#FFEBCD' },
  { name: 'blue', hex: '#0000FF' },
  { name: 'blueviolet', hex: '#8A2BE2' },
  { name: 'brown', hex: '#A52A2A' },
  { name: 'burlywood', hex: '#DEB887' },
  { name: 'cadetblue', hex: '#5F9EA0' },
  { name: 'chartreuse', hex: '#7FFF00' },
  { name: 'chocolate', hex: '#D2691E' },
  { name: 'coral', hex: '#FF7F50' },
  { name: 'cornflowerblue', hex: '#6495ED' },
  { name: 'cornsilk', hex: '#FFF8DC' },
  { name: 'crimson', hex: '#DC143C' },
  { name: 'darkblue', hex: '#00008B' },
  { name: 'darkcyan', hex: '#008B8B' },
  { name: 'darkgoldenrod', hex: '#B8860B' },
  { name: 'darkgray', hex: '#A9A9A9' },
  { name: 'darkgreen', hex: '#006400' },
  { name: 'darkkhaki', hex: '#BDB76B' },
  { name: 'darkmagenta', hex: '#8B008B' },
  { name: 'darkolivegreen', hex: '#556B2F' },
  { name: 'darkorange', hex: '#FF8C00' },
  { name: 'darkorchid', hex: '#9932CC' },
  { name: 'darkred', hex: '#8B0000' },
  { name: 'darksalmon', hex: '#E9967A' },
  { name: 'darkseagreen', hex: '#8FBC8F' },
  { name: 'darkslateblue', hex: '#483D8B' },
  { name: 'darkslategray', hex: '#2F4F4F' },
  { name: 'darkturquoise', hex: '#00CED1' },
  { name: 'darkviolet', hex: '#9400D3' },
  { name: 'deeppink', hex: '#FF1493' },
  { name: 'deepskyblue', hex: '#00BFFF' },
  { name: 'dimgray', hex: '#696969' },
  { name: 'dodgerblue', hex: '#1E90FF' },
  { name: 'firebrick', hex: '#B22222' },
  { name: 'floralwhite', hex: '#FFFAF0' },
  { name: 'forestgreen', hex: '#228B22' },
  { name: 'fuchsia', hex: '#FF00FF' },
  { name: 'gainsboro', hex: '#DCDCDC' },
  { name: 'ghostwhite', hex: '#F8F8FF' },
  { name: 'gold', hex: '#FFD700' },
  { name: 'goldenrod', hex: '#DAA520' },
  { name: 'gray', hex: '#808080' },
  { name: 'green', hex: '#008000' },
  { name: 'greenyellow', hex: '#ADFF2F' },
  { name: 'honeydew', hex: '#F0FFF0' },
  { name: 'hotpink', hex: '#FF69B4' },
  { name: 'indianred', hex: '#CD5C5C' },
  { name: 'indigo', hex: '#4B0082' },
  { name: 'ivory', hex: '#FFFFF0' },
  { name: 'khaki', hex: '#F0E68C' },
  { name: 'lavender', hex: '#E6E6FA' },
  { name: 'lavenderblush', hex: '#FFF0F5' },
  { name: 'lawngreen', hex: '#7CFC00' },
  { name: 'lemonchiffon', hex: '#FFFACD' },
  { name: 'lightblue', hex: '#ADD8E6' },
  { name: 'lightcoral', hex: '#F08080' },
  { name: 'lightcyan', hex: '#E0FFFF' },
  { name: 'lightgoldenrodyellow', hex: '#FAFAD2' },
  { name: 'lightgray', hex: '#D3D3D3' },
  { name: 'lightgreen', hex: '#90EE90' },
  { name: 'lightpink', hex: '#FFB6C1' },
  { name: 'lightsalmon', hex: '#FFA07A' },
  { name: 'lightseagreen', hex: '#20B2AA' },
  { name: 'lightskyblue', hex: '#87CEFA' },
  { name: 'lightslategray', hex: '#778899' },
  { name: 'lightsteelblue', hex: '#B0C4DE' },
  { name: 'lightyellow', hex: '#FFFFE0' },
  { name: 'lime', hex: '#00FF00' },
  { name: 'limegreen', hex: '#32CD32' },
  { name: 'linen', hex: '#FAF0E6' },
  { name: 'maroon', hex: '#800000' },
  { name: 'mediumaquamarine', hex: '#66CDAA' },
  { name: 'mediumblue', hex: '#0000CD' },
  { name: 'mediumorchid', hex: '#BA55D3' },
  { name: 'mediumpurple', hex: '#9370DB' },
  { name: 'mediumseagreen', hex: '#3CB371' },
  { name: 'mediumslateblue', hex: '#7B68EE' },
  { name: 'mediumspringgreen', hex: '#00FA9A' },
  { name: 'mediumturquoise', hex: '#48D1CC' },
  { name: 'mediumvioletred', hex: '#C71585' },
  { name: 'midnightblue', hex: '#191970' },
  { name: 'mintcream', hex: '#F5FFFA' },
  { name: 'mistyrose', hex: '#FFE4E1' },
  { name: 'moccasin', hex: '#FFE4B5' },
  { name: 'navajowhite', hex: '#FFDEAD' },
  { name: 'navy', hex: '#000080' },
  { name: 'oldlace', hex: '#FDF5E6' },
  { name: 'olive', hex: '#808000' },
  { name: 'olivedrab', hex: '#6B8E23' },
  { name: 'orange', hex: '#FFA500' },
  { name: 'orangered', hex: '#FF4500' },
  { name: 'orchid', hex: '#DA70D6' },
  { name: 'palegoldenrod', hex: '#EEE8AA' },
  { name: 'palegreen', hex: '#98FB98' },
  { name: 'paleturquoise', hex: '#AFEEEE' },
  { name: 'palevioletred', hex: '#DB7093' },
  { name: 'papayawhip', hex: '#FFEFD5' },
  { name: 'peachpuff', hex: '#FFDAB9' },
  { name: 'peru', hex: '#CD853F' },
  { name: 'pink', hex: '#FFC0CB' },
  { name: 'plum', hex: '#DDA0DD' },
  { name: 'powderblue', hex: '#B0E0E6' },
  { name: 'purple', hex: '#800080' },
  { name: 'rebeccapurple', hex: '#663399' },
  { name: 'red', hex: '#FF0000' },
  { name: 'rosybrown', hex: '#BC8F8F' },
  { name: 'royalblue', hex: '#4169E1' },
  { name: 'saddlebrown', hex: '#8B4513' },
  { name: 'salmon', hex: '#FA8072' },
  { name: 'sandybrown', hex: '#F4A460' },
  { name: 'seagreen', hex: '#2E8B57' },
  { name: 'seashell', hex: '#FFF5EE' },
  { name: 'sienna', hex: '#A0522D' },
  { name: 'silver', hex: '#C0C0C0' },
  { name: 'skyblue', hex: '#87CEEB' },
  { name: 'slateblue', hex: '#6A5ACD' },
  { name: 'slategray', hex: '#708090' },
  { name: 'snow', hex: '#FFFAFA' },
  { name: 'springgreen', hex: '#00FF7F' },
  { name: 'steelblue', hex: '#4682B4' },
  { name: 'tan', hex: '#D2B48C' },
  { name: 'teal', hex: '#008080' },
  { name: 'thistle', hex: '#D8BFD8' },
  { name: 'tomato', hex: '#FF6347' },
  { name: 'turquoise', hex: '#40E0D0' },
  { name: 'violet', hex: '#EE82EE' },
  { name: 'wheat', hex: '#F5DEB3' },
  { name: 'white', hex: '#FFFFFF' },
  { name: 'whitesmoke', hex: '#F5F5F5' },
  { name: 'yellow', hex: '#FFFF00' },
  { name: 'yellowgreen', hex: '#9ACD32' },
];

// ==================== CIE Lab 変換 ====================

/**
 * RGBをXYZ色空間に変換 (D65光源)
 * @param rgb - RGBオブジェクト
 */
function rgbToXyz(rgb: RgbColor): { x: number; y: number; z: number } {
  const linearize = (c: number): number => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const r = linearize(rgb.r);
  const g = linearize(rgb.g);
  const b = linearize(rgb.b);
  return {
    x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    y: r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    z: r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
  };
}

/**
 * XYZをCIE Lab色空間に変換 (D65光源)
 * @param xyz - XYZオブジェクト
 */
function xyzToLab(xyz: {
  x: number;
  y: number;
  z: number;
}): { L: number; a: number; b: number } {
  // D65基準白色点
  const xn = 0.95047;
  const yn = 1.0;
  const zn = 1.08883;

  const f = (t: number): number => {
    const delta = 6 / 29;
    return t > delta ** 3
      ? Math.cbrt(t)
      : t / (3 * delta * delta) + 4 / 29;
  };

  const fx = f(xyz.x / xn);
  const fy = f(xyz.y / yn);
  const fz = f(xyz.z / zn);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * RGBをCIE Lab色空間に変換
 * @param rgb - RGBオブジェクト
 */
export function rgbToLab(rgb: RgbColor): { L: number; a: number; b: number } {
  return xyzToLab(rgbToXyz(rgb));
}

// ==================== 色差計算 ====================

/**
 * CIE76 色差 (ΔE) を計算する
 * 2色の知覚的な差を0〜100+の数値で表す。
 * ΔE < 1: 人間の目では区別できない差
 * ΔE < 2: わずかな差
 * ΔE < 10: 明らかな差
 * ΔE > 10: 大きな差
 *
 * @param lab1 - Lab色1
 * @param lab2 - Lab色2
 * @returns ΔE値 (0に近いほど似ている)
 */
export function deltaE76(
  lab1: { L: number; a: number; b: number },
  lab2: { L: number; a: number; b: number }
): number {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// ==================== 検索関数 ====================

/**
 * 入力色に最も近いCSS名前付き色を検索する
 * @param inputRgb - 検索する色のRGB値
 * @param count - 返す結果の数（デフォルト10）
 * @returns ΔEの小さい順にソートされた色マッチ配列
 */
export function findNearestColors(inputRgb: RgbColor, count = 10): ColorMatch[] {
  const inputLab = rgbToLab(inputRgb);

  return CSS_NAMED_COLORS.map((namedColor) => {
    const namedRgb = hexToRgb(namedColor.hex) ?? { r: 0, g: 0, b: 0 };
    const namedLab = rgbToLab(namedRgb);
    const de = deltaE76(inputLab, namedLab);
    return {
      ...namedColor,
      deltaE: Math.round(de * 10) / 10,
      rgb: namedRgb,
    };
  })
    .sort((a, b) => a.deltaE - b.deltaE)
    .slice(0, count);
}

/**
 * 入力HEXに完全一致するCSS色名を返す
 * @param hex - "#RRGGBB" 形式のHEX文字列
 * @returns CSS色名、一致なしの場合はnull
 */
export function findExactColorName(hex: string): string | null {
  const normalized = hex.replace('#', '').toUpperCase();
  const match = CSS_NAMED_COLORS.find(
    (c) => c.hex.replace('#', '').toUpperCase() === normalized
  );
  return match ? match.name : null;
}

/**
 * 輝度から前景色（白or黒）を決定する
 * @param rgb - 背景色のRGB
 * @returns '#000000' または '#FFFFFF'
 */
export function contrastColor(rgb: RgbColor): string {
  const luma = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  return luma > 128 ? '#000000' : '#FFFFFF';
}
