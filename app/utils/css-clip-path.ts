/**
 * @fileoverview CSS Clip-path ジェネレーターのユーティリティ
 * inset / circle / ellipse / polygon の4種類の clip-path をサポート
 */

/** clip-path の種類 */
export type ClipPathType = "inset" | "circle" | "ellipse" | "polygon";

/** inset() の状態 */
export interface InsetState {
  /** 上辺 (%) */
  top: number;
  /** 右辺 (%) */
  right: number;
  /** 下辺 (%) */
  bottom: number;
  /** 左辺 (%) */
  left: number;
  /** 角丸半径 (%) */
  radius: number;
}

/** circle() の状態 */
export interface CircleState {
  /** 半径 (%) */
  radius: number;
  /** 中心X (%) */
  cx: number;
  /** 中心Y (%) */
  cy: number;
}

/** ellipse() の状態 */
export interface EllipseState {
  /** X軸半径 (%) */
  rx: number;
  /** Y軸半径 (%) */
  ry: number;
  /** 中心X (%) */
  cx: number;
  /** 中心Y (%) */
  cy: number;
}

/** polygon() の各頂点 */
export interface PolygonPoint {
  /** X座標 (%) */
  x: number;
  /** Y座標 (%) */
  y: number;
}

/** polygon() の状態 */
export interface PolygonState {
  /** 頂点リスト */
  points: PolygonPoint[];
}

/** 各シェイプのデフォルト状態 */
export const DEFAULT_INSET: InsetState = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 10,
  radius: 0,
};

export const DEFAULT_CIRCLE: CircleState = {
  radius: 40,
  cx: 50,
  cy: 50,
};

export const DEFAULT_ELLIPSE: EllipseState = {
  rx: 40,
  ry: 30,
  cx: 50,
  cy: 50,
};

export const DEFAULT_POLYGON: PolygonState = {
  points: [
    { x: 50, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
};

/** polygon プリセット */
export interface PolygonPreset {
  /** プリセット名 */
  name: string;
  /** 頂点リスト */
  points: PolygonPoint[];
}

/**
 * n角形の頂点を生成する
 * @param n - 頂点数
 * @param cx - 中心X (%)
 * @param cy - 中心Y (%)
 * @param r - 半径 (%)
 * @param startAngle - 開始角度 (度)
 */
function regularPolygon(
  n: number,
  cx: number,
  cy: number,
  r: number,
  startAngle = -90
): PolygonPoint[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = ((startAngle + (360 / n) * i) * Math.PI) / 180;
    return {
      x: Math.round((cx + r * Math.cos(angle)) * 10) / 10,
      y: Math.round((cy + r * Math.sin(angle)) * 10) / 10,
    };
  });
}

/**
 * 星形の頂点を生成する
 * @param points - 星の先端の数
 * @param outerR - 外側半径 (%)
 * @param innerR - 内側半径 (%)
 */
function starPolygon(
  points: number,
  outerR: number,
  innerR: number
): PolygonPoint[] {
  return Array.from({ length: points * 2 }, (_, i) => {
    const angle = ((i * 180) / points - 90) * (Math.PI / 180);
    const r = i % 2 === 0 ? outerR : innerR;
    return {
      x: Math.round((50 + r * Math.cos(angle)) * 10) / 10,
      y: Math.round((50 + r * Math.sin(angle)) * 10) / 10,
    };
  });
}

export const POLYGON_PRESETS: PolygonPreset[] = [
  {
    name: "三角形",
    points: [
      { x: 50, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
  },
  {
    name: "逆三角形",
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 100 },
    ],
  },
  {
    name: "ダイヤモンド",
    points: [
      { x: 50, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 50 },
    ],
  },
  {
    name: "平行四辺形",
    points: [
      { x: 25, y: 0 },
      { x: 100, y: 0 },
      { x: 75, y: 100 },
      { x: 0, y: 100 },
    ],
  },
  {
    name: "台形",
    points: [
      { x: 20, y: 0 },
      { x: 80, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
  },
  {
    name: "五角形",
    points: regularPolygon(5, 50, 50, 48),
  },
  {
    name: "六角形",
    points: regularPolygon(6, 50, 50, 48, -30),
  },
  {
    name: "八角形",
    points: regularPolygon(8, 50, 50, 48),
  },
  {
    name: "五芒星",
    points: starPolygon(5, 48, 20),
  },
  {
    name: "右矢印",
    points: [
      { x: 0, y: 20 },
      { x: 60, y: 20 },
      { x: 60, y: 0 },
      { x: 100, y: 50 },
      { x: 60, y: 100 },
      { x: 60, y: 80 },
      { x: 0, y: 80 },
    ],
  },
  {
    name: "メッセージバブル",
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 75 },
      { x: 25, y: 75 },
      { x: 0, y: 100 },
      { x: 10, y: 75 },
      { x: 0, y: 75 },
    ],
  },
];

/**
 * inset() CSS 値を生成する
 * @param state - inset の状態
 * @returns CSS 値文字列
 */
export function generateInsetValue(state: InsetState): string {
  const { top, right, bottom, left, radius } = state;
  const base = `${top}% ${right}% ${bottom}% ${left}%`;
  if (radius > 0) {
    return `${base} round ${radius}%`;
  }
  return base;
}

/**
 * circle() CSS 値を生成する
 * @param state - circle の状態
 * @returns CSS 値文字列
 */
export function generateCircleValue(state: CircleState): string {
  return `${state.radius}% at ${state.cx}% ${state.cy}%`;
}

/**
 * ellipse() CSS 値を生成する
 * @param state - ellipse の状態
 * @returns CSS 値文字列
 */
export function generateEllipseValue(state: EllipseState): string {
  return `${state.rx}% ${state.ry}% at ${state.cx}% ${state.cy}%`;
}

/**
 * polygon() CSS 値を生成する
 * @param state - polygon の状態
 * @returns CSS 値文字列
 */
export function generatePolygonValue(state: PolygonState): string {
  return state.points
    .map((p) => `${Math.round(p.x * 10) / 10}% ${Math.round(p.y * 10) / 10}%`)
    .join(", ");
}

/**
 * clip-path プロパティ全体を生成する
 * @param type - clip-path の種類
 * @param inset - inset の状態
 * @param circle - circle の状態
 * @param ellipse - ellipse の状態
 * @param polygon - polygon の状態
 * @returns CSS プロパティ文字列
 */
export function generateClipPathCSS(
  type: ClipPathType,
  inset: InsetState,
  circle: CircleState,
  ellipse: EllipseState,
  polygon: PolygonState
): string {
  switch (type) {
    case "inset":
      return `clip-path: inset(${generateInsetValue(inset)});`;
    case "circle":
      return `clip-path: circle(${generateCircleValue(circle)});`;
    case "ellipse":
      return `clip-path: ellipse(${generateEllipseValue(ellipse)});`;
    case "polygon":
      return `clip-path: polygon(${generatePolygonValue(polygon)});`;
  }
}

/**
 * clip-path の値部分のみを生成する（`clip-path:` プレフィックスなし）
 * @param type - clip-path の種類
 * @param inset - inset の状態
 * @param circle - circle の状態
 * @param ellipse - ellipse の状態
 * @param polygon - polygon の状態
 * @returns CSS 値文字列（関数形式）
 */
export function generateClipPathValue(
  type: ClipPathType,
  inset: InsetState,
  circle: CircleState,
  ellipse: EllipseState,
  polygon: PolygonState
): string {
  switch (type) {
    case "inset":
      return `inset(${generateInsetValue(inset)})`;
    case "circle":
      return `circle(${generateCircleValue(circle)})`;
    case "ellipse":
      return `ellipse(${generateEllipseValue(ellipse)})`;
    case "polygon":
      return `polygon(${generatePolygonValue(polygon)})`;
  }
}
