/**
 * CSS cubic-bezier() タイミング関数のユーティリティ
 */

/**
 * ベジェプリセットの型定義
 */
export interface BezierPreset {
  /** プリセット名 */
  name: string;
  /** 説明 */
  description: string;
  /** 制御点1のX座標 (0〜1) */
  x1: number;
  /** 制御点1のY座標 */
  y1: number;
  /** 制御点2のX座標 (0〜1) */
  x2: number;
  /** 制御点2のY座標 */
  y2: number;
}

/**
 * 値を指定した範囲にクランプする
 * @param value - クランプする値
 * @param min - 最小値
 * @param max - 最大値
 * @returns クランプされた値
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 値を小数点以下3桁に丸める
 * @param value - 丸める値
 * @returns 丸められた値
 */
export function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * cubic-bezier() CSS関数文字列を生成する
 * @param x1 - 制御点1のX座標
 * @param y1 - 制御点1のY座標
 * @param x2 - 制御点2のX座標
 * @param y2 - 制御点2のY座標
 * @returns cubic-bezier() 文字列
 */
export function formatCubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  return `cubic-bezier(${round3(x1)}, ${round3(y1)}, ${round3(x2)}, ${round3(y2)})`;
}

/**
 * transition-timing-function と animation-timing-function の CSS宣言を生成する
 * @param x1 - 制御点1のX座標
 * @param y1 - 制御点1のY座標
 * @param x2 - 制御点2のX座標
 * @param y2 - 制御点2のY座標
 * @returns CSS宣言文字列
 */
export function generateTimingFunctionCSS(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const fn = formatCubicBezier(x1, y1, x2, y2);
  return `transition-timing-function: ${fn};\nanimation-timing-function: ${fn};`;
}

/**
 * ベジェ曲線上の点を計算する（可視化用）
 * P0=(0,0), P1=(x1,y1), P2=(x2,y2), P3=(1,1) の3次ベジェ曲線
 * @param t - パラメータ (0〜1)
 * @param x1 - 制御点1のX座標
 * @param y1 - 制御点1のY座標
 * @param x2 - 制御点2のX座標
 * @param y2 - 制御点2のY座標
 * @returns {x, y} 座標
 */
export function computeBezierPoint(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number } {
  const mt = 1 - t;
  const x = 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t;
  const y = 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t;
  return { x, y };
}

/**
 * よく使われるCSSタイミング関数のプリセット一覧
 */
export const BEZIER_PRESETS: BezierPreset[] = [
  {
    name: "linear",
    description: "等速で直線的なアニメーション",
    x1: 0,
    y1: 0,
    x2: 1,
    y2: 1,
  },
  {
    name: "ease",
    description: "ゆっくり始まりゆっくり終わる（CSSデフォルト）",
    x1: 0.25,
    y1: 0.1,
    x2: 0.25,
    y2: 1,
  },
  {
    name: "ease-in",
    description: "ゆっくり始まり速く終わる",
    x1: 0.42,
    y1: 0,
    x2: 1,
    y2: 1,
  },
  {
    name: "ease-out",
    description: "速く始まりゆっくり終わる",
    x1: 0,
    y1: 0,
    x2: 0.58,
    y2: 1,
  },
  {
    name: "ease-in-out",
    description: "ゆっくり始まりゆっくり終わる（対称）",
    x1: 0.42,
    y1: 0,
    x2: 0.58,
    y2: 1,
  },
  {
    name: "Accelerate",
    description: "急加速するイーズイン（Material Design）",
    x1: 0.4,
    y1: 0,
    x2: 1,
    y2: 1,
  },
  {
    name: "Decelerate",
    description: "急減速するイーズアウト（Material Design）",
    x1: 0,
    y1: 0,
    x2: 0.2,
    y2: 1,
  },
  {
    name: "Standard",
    description: "標準的なアニメーション（Material Design）",
    x1: 0.2,
    y1: 0,
    x2: 0,
    y2: 1,
  },
  {
    name: "Bounce Out",
    description: "終点でバウンスする効果",
    x1: 0.34,
    y1: 1.56,
    x2: 0.64,
    y2: 1,
  },
  {
    name: "Back In",
    description: "後方から飛び込む効果",
    x1: 0.36,
    y1: 0,
    x2: 0.66,
    y2: -0.56,
  },
  {
    name: "Elastic",
    description: "弾性のある動き（オーバーシュートあり）",
    x1: 0.5,
    y1: -0.5,
    x2: 0.5,
    y2: 1.5,
  },
  {
    name: "Swift Out",
    description: "素早く開始してゆっくり終わる",
    x1: 0.55,
    y1: 0,
    x2: 0.1,
    y2: 1,
  },
];
