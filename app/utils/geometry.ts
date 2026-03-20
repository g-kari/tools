/**
 * 幾何計算ユーティリティ
 * 2D図形の面積、3D図形の体積・表面積を計算する
 */

/** 2D図形の種類 */
export type Shape2D =
  | "circle"
  | "rectangle"
  | "triangle"
  | "trapezoid"
  | "parallelogram"
  | "ellipse"
  | "regularHexagon";

/** 3D図形の種類 */
export type Shape3D =
  | "sphere"
  | "cube"
  | "rectangularPrism"
  | "cylinder"
  | "cone";

/** 2D図形の計算結果 */
export interface Result2D {
  /** 面積 */
  area: number;
}

/** 3D図形の計算結果 */
export interface Result3D {
  /** 体積 */
  volume: number;
  /** 表面積 */
  surfaceArea: number;
}

/** 2D図形のラベル */
export const SHAPE_2D_LABELS: Record<Shape2D, string> = {
  circle: "円",
  rectangle: "長方形",
  triangle: "三角形",
  trapezoid: "台形",
  parallelogram: "平行四辺形",
  ellipse: "楕円",
  regularHexagon: "正六角形",
};

/** 3D図形のラベル */
export const SHAPE_3D_LABELS: Record<Shape3D, string> = {
  sphere: "球",
  cube: "立方体",
  rectangularPrism: "直方体",
  cylinder: "円柱",
  cone: "円錐",
};

/** 2D図形の入力パラメータ定義 */
export interface Shape2DParams {
  circle: { r: number };
  rectangle: { w: number; h: number };
  triangle: { base: number; height: number };
  trapezoid: { a: number; b: number; h: number };
  parallelogram: { base: number; height: number };
  ellipse: { a: number; b: number };
  regularHexagon: { a: number };
}

/** 3D図形の入力パラメータ定義 */
export interface Shape3DParams {
  sphere: { r: number };
  cube: { a: number };
  rectangularPrism: { l: number; w: number; h: number };
  cylinder: { r: number; h: number };
  cone: { r: number; h: number };
}

// ===== 2D図形面積計算関数 =====

/**
 * 円の面積を計算する
 * @param r - 半径
 * @returns 面積 π*r²
 */
export function calcCircleArea(r: number): number {
  if (r <= 0) return NaN;
  return Math.PI * r * r;
}

/**
 * 長方形の面積を計算する
 * @param w - 幅
 * @param h - 高さ
 * @returns 面積 w*h
 */
export function calcRectangleArea(w: number, h: number): number {
  if (w <= 0 || h <= 0) return NaN;
  return w * h;
}

/**
 * 三角形の面積を計算する
 * @param base - 底辺
 * @param height - 高さ
 * @returns 面積 base*height/2
 */
export function calcTriangleArea(base: number, height: number): number {
  if (base <= 0 || height <= 0) return NaN;
  return (base * height) / 2;
}

/**
 * 台形の面積を計算する
 * @param a - 上底
 * @param b - 下底
 * @param h - 高さ
 * @returns 面積 (a+b)*h/2
 */
export function calcTrapezoidArea(a: number, b: number, h: number): number {
  if (a <= 0 || b <= 0 || h <= 0) return NaN;
  return ((a + b) * h) / 2;
}

/**
 * 平行四辺形の面積を計算する
 * @param base - 底辺
 * @param height - 高さ
 * @returns 面積 base*height
 */
export function calcParallelogramArea(base: number, height: number): number {
  if (base <= 0 || height <= 0) return NaN;
  return base * height;
}

/**
 * 楕円の面積を計算する
 * @param a - 長半径
 * @param b - 短半径
 * @returns 面積 π*a*b
 */
export function calcEllipseArea(a: number, b: number): number {
  if (a <= 0 || b <= 0) return NaN;
  return Math.PI * a * b;
}

/**
 * 正六角形の面積を計算する
 * @param a - 一辺の長さ
 * @returns 面積 (3*√3/2)*a²
 */
export function calcRegularHexagonArea(a: number): number {
  if (a <= 0) return NaN;
  return ((3 * Math.sqrt(3)) / 2) * a * a;
}

// ===== 3D図形体積・表面積計算関数 =====

/**
 * 球の体積と表面積を計算する
 * @param r - 半径
 * @returns 体積 (4/3)*π*r³、表面積 4*π*r²
 */
export function calcSphere(r: number): Result3D {
  if (r <= 0) return { volume: NaN, surfaceArea: NaN };
  return {
    volume: (4 / 3) * Math.PI * r * r * r,
    surfaceArea: 4 * Math.PI * r * r,
  };
}

/**
 * 立方体の体積と表面積を計算する
 * @param a - 一辺の長さ
 * @returns 体積 a³、表面積 6*a²
 */
export function calcCube(a: number): Result3D {
  if (a <= 0) return { volume: NaN, surfaceArea: NaN };
  return {
    volume: a * a * a,
    surfaceArea: 6 * a * a,
  };
}

/**
 * 直方体の体積と表面積を計算する
 * @param l - 長さ
 * @param w - 幅
 * @param h - 高さ
 * @returns 体積 l*w*h、表面積 2*(lw+lh+wh)
 */
export function calcRectangularPrism(l: number, w: number, h: number): Result3D {
  if (l <= 0 || w <= 0 || h <= 0) return { volume: NaN, surfaceArea: NaN };
  return {
    volume: l * w * h,
    surfaceArea: 2 * (l * w + l * h + w * h),
  };
}

/**
 * 円柱の体積と表面積を計算する
 * @param r - 底面の半径
 * @param h - 高さ
 * @returns 体積 π*r²*h、表面積 2*π*r*(r+h)
 */
export function calcCylinder(r: number, h: number): Result3D {
  if (r <= 0 || h <= 0) return { volume: NaN, surfaceArea: NaN };
  return {
    volume: Math.PI * r * r * h,
    surfaceArea: 2 * Math.PI * r * (r + h),
  };
}

/**
 * 円錐の体積と表面積を計算する
 * @param r - 底面の半径
 * @param h - 高さ
 * @returns 体積 (1/3)*π*r²*h、表面積 π*r*(r+√(r²+h²))
 */
export function calcCone(r: number, h: number): Result3D {
  if (r <= 0 || h <= 0) return { volume: NaN, surfaceArea: NaN };
  const slantHeight = Math.sqrt(r * r + h * h);
  return {
    volume: (1 / 3) * Math.PI * r * r * h,
    surfaceArea: Math.PI * r * (r + slantHeight),
  };
}
