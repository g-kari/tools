/**
 * アスペクト比計算機のユーティリティ関数
 */

/**
 * 最大公約数（ユークリッドの互除法）
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a === 0 ? 1 : a;
}

/**
 * 比を最も簡単な形に約分する
 */
export function simplifyRatio(width: number, height: number): [number, number] {
  if (width <= 0 || height <= 0) return [width, height];
  const divisor = gcd(width, height);
  return [Math.round(width / divisor), Math.round(height / divisor)];
}

/**
 * 幅とアスペクト比から高さを計算する
 */
export function calcHeightFromWidth(width: number, ratioW: number, ratioH: number): number {
  if (ratioW <= 0) return 0;
  return Math.round((width * ratioH) / ratioW);
}

/**
 * 高さとアスペクト比から幅を計算する
 */
export function calcWidthFromHeight(height: number, ratioW: number, ratioH: number): number {
  if (ratioH <= 0) return 0;
  return Math.round((height * ratioW) / ratioH);
}

/**
 * アスペクト比の小数値を返す（width / height）
 */
export function ratioToDecimal(ratioW: number, ratioH: number): number {
  if (ratioH === 0) return 0;
  return ratioW / ratioH;
}

export interface AspectRatioPreset {
  label: string;
  ratioW: number;
  ratioH: number;
  description: string;
}

/**
 * よく使われるアスペクト比プリセット
 */
export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { label: "16:9", ratioW: 16, ratioH: 9, description: "フルHD・動画標準" },
  { label: "4:3", ratioW: 4, ratioH: 3, description: "従来のモニター・TV" },
  { label: "1:1", ratioW: 1, ratioH: 1, description: "正方形（SNS）" },
  { label: "21:9", ratioW: 21, ratioH: 9, description: "ウルトラワイド" },
  { label: "3:2", ratioW: 3, ratioH: 2, description: "カメラ・写真" },
  { label: "2:3", ratioW: 2, ratioH: 3, description: "縦向きポートレート" },
  { label: "9:16", ratioW: 9, ratioH: 16, description: "スマートフォン縦" },
  { label: "4:5", ratioW: 4, ratioH: 5, description: "Instagram縦向き" },
  { label: "5:4", ratioW: 5, ratioH: 4, description: '印刷（8x10"）' },
  { label: "2:1", ratioW: 2, ratioH: 1, description: "Twitterヘッダー" },
];
