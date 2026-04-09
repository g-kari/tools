/**
 * 三角関数ユーティリティ
 *
 * 角度変換・三角関数・逆三角関数の計算をサポートします。
 */

/** 角度の単位 */
export type AngleUnit = "deg" | "rad" | "grad" | "turn";

/** 角度単位のラベル */
export const ANGLE_UNIT_LABELS: Record<AngleUnit, string> = {
  deg: "度 (°)",
  rad: "ラジアン (rad)",
  grad: "グラジアン (grad)",
  turn: "回転 (turn)",
};

/** 角度単位の短縮形 */
export const ANGLE_UNIT_SHORT: Record<AngleUnit, string> = {
  deg: "°",
  rad: "rad",
  grad: "grad",
  turn: "turn",
};

/**
 * 任意の単位の角度を度 (degree) に変換する
 * @param value 角度の値
 * @param unit 入力単位
 * @returns 度に変換した値
 */
export function toDegrees(value: number, unit: AngleUnit): number {
  switch (unit) {
    case "deg":
      return value;
    case "rad":
      return (value * 180) / Math.PI;
    case "grad":
      return value * 0.9;
    case "turn":
      return value * 360;
  }
}

/**
 * 度を指定の単位に変換する
 * @param degrees 度の値
 * @param unit 出力単位
 * @returns 指定単位に変換した値
 */
export function fromDegrees(degrees: number, unit: AngleUnit): number {
  switch (unit) {
    case "deg":
      return degrees;
    case "rad":
      return (degrees * Math.PI) / 180;
    case "grad":
      return degrees / 0.9;
    case "turn":
      return degrees / 360;
  }
}

/**
 * 三角関数の計算結果
 */
export interface TrigValues {
  sin: number;
  cos: number;
  tan: number | null;
  cot: number | null;
  sec: number | null;
  csc: number | null;
}

/** タンジェントが定義されない角度 (度) の倍数 */
const TAN_UNDEFINED_DEG = 90;
/** コタンジェントが定義されない角度 (度) の倍数 */
const COT_UNDEFINED_DEG = 180;
/** 浮動小数点誤差のしきい値 */
const EPSILON = 1e-10;

/**
 * 値が実質的にゼロか判定する
 */
function isNearZero(v: number): boolean {
  return Math.abs(v) < EPSILON;
}

/**
 * 度で指定した角度の三角関数値をすべて計算する
 * @param degrees 角度 (度)
 * @returns sin / cos / tan / cot / sec / csc の値
 */
export function calcTrigValues(degrees: number): TrigValues {
  const rad = (degrees * Math.PI) / 180;
  const sinVal = Math.sin(rad);
  const cosVal = Math.cos(rad);

  const tanUndefined = isNearZero(cosVal);
  const cotUndefined = isNearZero(sinVal);

  const tanVal = tanUndefined ? null : sinVal / cosVal;
  const cotVal = cotUndefined ? null : cosVal / sinVal;
  const secVal = tanUndefined ? null : 1 / cosVal;
  const cscVal = cotUndefined ? null : 1 / sinVal;

  return {
    sin: sinVal,
    cos: cosVal,
    tan: tanVal,
    cot: cotVal,
    sec: secVal,
    csc: cscVal,
  };
}

/**
 * 逆三角関数の入力タイプ
 */
export type InverseTrigFn = "asin" | "acos" | "atan" | "atan2";

/**
 * 逆三角関数を計算して度で返す
 * @param fn 逆三角関数の種類
 * @param x 入力値 (atan2の場合はy成分)
 * @param y atan2の場合のx成分
 * @returns 角度 (度)、範囲外の場合は null
 */
export function calcInverseTrig(fn: InverseTrigFn, x: number, y?: number): number | null {
  switch (fn) {
    case "asin":
      if (x < -1 || x > 1) return null;
      return (Math.asin(x) * 180) / Math.PI;
    case "acos":
      if (x < -1 || x > 1) return null;
      return (Math.acos(x) * 180) / Math.PI;
    case "atan":
      return (Math.atan(x) * 180) / Math.PI;
    case "atan2":
      if (y === undefined) return null;
      return (Math.atan2(x, y) * 180) / Math.PI;
  }
}

/**
 * 三角関数の値を見やすい文字列にフォーマットする
 * @param value 三角関数の値
 * @param precision 小数点以下の桁数
 * @returns フォーマットされた文字列
 */
export function formatTrigValue(value: number | null, precision = 8): string {
  if (value === null) return "未定義";
  if (!isFinite(value)) return "∞";
  // 非常に小さい値はゼロに丸める
  if (Math.abs(value) < EPSILON) return "0";
  return value.toPrecision(precision).replace(/\.?0+$/, "");
}

/**
 * 角度の値を見やすい文字列にフォーマットする
 * @param value 角度の値
 * @param precision 小数点以下の桁数
 * @returns フォーマットされた文字列
 */
export function formatAngle(value: number, precision = 10): string {
  if (!isFinite(value)) return "∞";
  if (isNearZero(value)) return "0";
  // 整数に近い値はそのまま表示
  if (Math.abs(value - Math.round(value)) < EPSILON) {
    return String(Math.round(value));
  }
  return value.toPrecision(precision).replace(/\.?0+$/, "");
}

/**
 * よく使う角度のテーブル (度)
 */
export const COMMON_ANGLES_DEG = [0, 30, 45, 60, 90, 120, 135, 150, 180, 270, 360] as const;

/**
 * よく使う角度の分数表現 (rad)
 */
export const COMMON_ANGLE_RAD_LABELS: Record<number, string> = {
  0: "0",
  30: "π/6",
  45: "π/4",
  60: "π/3",
  90: "π/2",
  120: "2π/3",
  135: "3π/4",
  150: "5π/6",
  180: "π",
  270: "3π/2",
  360: "2π",
};
