/**
 * パーセンテージ計算ユーティリティ
 */

/**
 * 計算結果の型定義
 */
export interface PercentageResult {
  /** 計算結果の数値 */
  value: number;
  /** 結果の説明文字列 */
  description: string;
}

/**
 * XはYの何%かを計算する
 * @param x - 対象の数値
 * @param y - 基準となる数値
 * @returns パーセンテージ（0除算の場合はnull）
 */
export function calcWhatPercent(x: number, y: number): number | null {
  if (y === 0) return null;
  return (x / y) * 100;
}

/**
 * XのY%の値を計算する
 * @param x - 基準となる数値
 * @param y - パーセンテージ
 * @returns XのY%の値
 */
export function calcPercentOf(x: number, y: number): number {
  return x * (y / 100);
}

/**
 * XからYへの変化率（%）を計算する
 * @param from - 元の数値
 * @param to - 変化後の数値
 * @returns 変化率（0除算の場合はnull）
 */
export function calcPercentChange(from: number, to: number): number | null {
  if (from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

/**
 * Xを整数に増加・減少させた後の値を計算する
 * @param base - 元の数値
 * @param percent - 変化させるパーセンテージ（正: 増加、負: 減少）
 * @returns 変化後の値
 */
export function calcPercentIncrease(base: number, percent: number): number {
  return base * (1 + percent / 100);
}

/**
 * 数値を小数点以下最大10桁で整形する（末尾ゼロを除去）
 * @param value - 整形対象の数値
 * @param maxDecimals - 最大小数桁数（デフォルト: 10）
 * @returns 整形された文字列
 */
export function formatResult(value: number, maxDecimals = 10): string {
  if (!isFinite(value)) return "計算不能";
  const rounded = parseFloat(value.toFixed(maxDecimals));
  return rounded.toLocaleString("ja-JP", {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  });
}
