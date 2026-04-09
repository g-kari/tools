/**
 * リサジュー図形 (Lissajous Figure) ユーティリティ
 *
 * リサジュー図形は以下のパラメトリック方程式で定義されます：
 *   x(t) = A * sin(a*t + δ)
 *   y(t) = B * sin(b*t)
 *
 * - A, B: 振幅
 * - a, b: 周波数比
 * - δ (delta): 位相差
 */

/** リサジュー図形の描画パラメータ */
export interface LissajousParams {
  /** X軸の周波数 (整数 1〜20) */
  freqX: number;
  /** Y軸の周波数 (整数 1〜20) */
  freqY: number;
  /** 位相差 (度, 0〜360) */
  phaseDeg: number;
  /** 振幅 (0〜1, キャンバスの半径に対する比率) */
  amplitude: number;
}

/** 座標点 */
export interface LissajousPoint {
  x: number;
  y: number;
}

/**
 * 位相差を度からラジアンに変換する
 * @param degrees - 度
 * @returns ラジアン
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * t における座標点を計算する
 * @param t - パラメータ (0 〜 2π)
 * @param params - リサジューパラメータ
 * @returns キャンバス正規化座標 (-1 〜 1)
 */
export function calcLissajousPoint(t: number, params: LissajousParams): LissajousPoint {
  const delta = degToRad(params.phaseDeg);
  return {
    x: params.amplitude * Math.sin(params.freqX * t + delta),
    y: params.amplitude * Math.sin(params.freqY * t),
  };
}

/**
 * リサジュー図形の全座標点を生成する
 * @param params - リサジューパラメータ
 * @param steps - 描画ステップ数 (多いほど滑らか)
 * @returns 座標点の配列
 */
export function generateLissajousPoints(
  params: LissajousParams,
  steps: number = 2000,
): LissajousPoint[] {
  const points: LissajousPoint[] = [];
  const totalPeriod = 2 * Math.PI * lcm(params.freqX, params.freqY);

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalPeriod;
    points.push(calcLissajousPoint(t, params));
  }
  return points;
}

/**
 * 最大公約数を求める
 * @param a - 整数 a
 * @param b - 整数 b
 * @returns 最大公約数
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

/**
 * 最小公倍数を求める
 * @param a - 整数 a
 * @param b - 整数 b
 * @returns 最小公倍数
 */
export function lcm(a: number, b: number): number {
  return (Math.abs(Math.round(a)) * Math.abs(Math.round(b))) / gcd(a, b);
}

/**
 * 周波数比の簡略表現を返す
 * @param freqX - X軸周波数
 * @param freqY - Y軸周波数
 * @returns 例: "3:2"
 */
export function formatFreqRatio(freqX: number, freqY: number): string {
  const g = gcd(freqX, freqY);
  return `${freqX / g}:${freqY / g}`;
}

/**
 * 図形の種類の説明を返す
 * @param freqX - X軸周波数
 * @param freqY - Y軸周波数
 * @param phaseDeg - 位相差（度）
 * @returns 図形の説明文字列
 */
export function describeLissajous(freqX: number, freqY: number, phaseDeg: number): string {
  if (freqX === freqY) {
    if (phaseDeg === 0 || phaseDeg === 180) return "斜線（直線）";
    if (phaseDeg === 90 || phaseDeg === 270) return "円";
    return "楕円";
  }
  const ratio = formatFreqRatio(freqX, freqY);
  return `リサジュー図形 (${ratio})`;
}
