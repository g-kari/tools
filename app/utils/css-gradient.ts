/**
 * CSSグラジェント生成ユーティリティ
 */

/** グラジェントタイプ */
export type GradientType = "linear" | "radial" | "conic";

/** カラーストップ */
export interface ColorStop {
  id: string;
  color: string;
  position: number; // 0〜100 (%)
}

/** Radialグラジェントの形状 */
export type RadialShape = "circle" | "ellipse";

/** Linearグラジェントのオプション */
export interface LinearOptions {
  angle: number; // 0〜360 (deg)
}

/** Radialグラジェントのオプション */
export interface RadialOptions {
  shape: RadialShape;
  positionX: number; // 0〜100 (%)
  positionY: number; // 0〜100 (%)
}

/** Conicグラジェントのオプション */
export interface ConicOptions {
  angle: number; // 0〜360 (deg)
  positionX: number; // 0〜100 (%)
  positionY: number; // 0〜100 (%)
}

/** グラジェント設定 */
export interface GradientConfig {
  type: GradientType;
  stops: ColorStop[];
  linear?: LinearOptions;
  radial?: RadialOptions;
  conic?: ConicOptions;
}

/** プリセットグラジェント */
export interface GradientPreset {
  name: string;
  config: GradientConfig;
}

/**
 * カラーストップのCSS文字列を生成する
 * @param stops - カラーストップの配列
 * @returns カラーストップのCSS文字列
 */
export function formatColorStops(stops: ColorStop[]): string {
  return stops.map((s) => `${s.color} ${s.position}%`).join(", ");
}

/**
 * linear-gradient のCSS文字列を生成する
 * @param config - グラジェント設定
 * @returns CSS文字列
 */
export function generateLinearGradient(config: GradientConfig): string {
  const angle = config.linear?.angle ?? 90;
  const stops = formatColorStops(config.stops);
  return `linear-gradient(${angle}deg, ${stops})`;
}

/**
 * radial-gradient のCSS文字列を生成する
 * @param config - グラジェント設定
 * @returns CSS文字列
 */
export function generateRadialGradient(config: GradientConfig): string {
  const shape = config.radial?.shape ?? "ellipse";
  const x = config.radial?.positionX ?? 50;
  const y = config.radial?.positionY ?? 50;
  const stops = formatColorStops(config.stops);
  return `radial-gradient(${shape} at ${x}% ${y}%, ${stops})`;
}

/**
 * conic-gradient のCSS文字列を生成する
 * @param config - グラジェント設定
 * @returns CSS文字列
 */
export function generateConicGradient(config: GradientConfig): string {
  const angle = config.conic?.angle ?? 0;
  const x = config.conic?.positionX ?? 50;
  const y = config.conic?.positionY ?? 50;
  const stops = formatColorStops(config.stops);
  return `conic-gradient(from ${angle}deg at ${x}% ${y}%, ${stops})`;
}

/**
 * グラジェント設定からCSS background 値を生成する
 * @param config - グラジェント設定
 * @returns CSS background 値
 */
export function generateGradientCSS(config: GradientConfig): string {
  switch (config.type) {
    case "linear":
      return generateLinearGradient(config);
    case "radial":
      return generateRadialGradient(config);
    case "conic":
      return generateConicGradient(config);
    default:
      return generateLinearGradient(config);
  }
}

/**
 * background プロパティを含む完全なCSS宣言を生成する
 * @param config - グラジェント設定
 * @returns CSS宣言文字列
 */
export function generateFullCSS(config: GradientConfig): string {
  const gradient = generateGradientCSS(config);
  return `background: ${gradient};`;
}

/**
 * デフォルトのカラーストップを生成する
 * @returns デフォルトカラーストップ
 */
export function createDefaultStops(): ColorStop[] {
  return [
    { id: crypto.randomUUID(), color: "#6366f1", position: 0 },
    { id: crypto.randomUUID(), color: "#a855f7", position: 100 },
  ];
}

/**
 * カラーストップを均等に再配置する
 * @param stops - カラーストップの配列
 * @returns 均等配置されたカラーストップ
 */
export function redistributeStops(stops: ColorStop[]): ColorStop[] {
  if (stops.length <= 1) return stops;
  const step = 100 / (stops.length - 1);
  return stops.map((s, i) => ({
    ...s,
    position: Math.round(i * step),
  }));
}

/** プリセット一覧 */
export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: "サンセット",
    config: {
      type: "linear",
      stops: [
        { id: "sunset-0", color: "#f97316", position: 0 },
        { id: "sunset-1", color: "#ec4899", position: 50 },
        { id: "sunset-2", color: "#8b5cf6", position: 100 },
      ],
      linear: { angle: 135 },
    },
  },
  {
    name: "オーシャン",
    config: {
      type: "linear",
      stops: [
        { id: "ocean-0", color: "#06b6d4", position: 0 },
        { id: "ocean-1", color: "#3b82f6", position: 100 },
      ],
      linear: { angle: 90 },
    },
  },
  {
    name: "フォレスト",
    config: {
      type: "linear",
      stops: [
        { id: "forest-0", color: "#22c55e", position: 0 },
        { id: "forest-1", color: "#16a34a", position: 50 },
        { id: "forest-2", color: "#166534", position: 100 },
      ],
      linear: { angle: 180 },
    },
  },
  {
    name: "ゴールド",
    config: {
      type: "linear",
      stops: [
        { id: "gold-0", color: "#fbbf24", position: 0 },
        { id: "gold-1", color: "#f59e0b", position: 100 },
      ],
      linear: { angle: 45 },
    },
  },
  {
    name: "ラジアル フレイム",
    config: {
      type: "radial",
      stops: [
        { id: "flame-0", color: "#fef08a", position: 0 },
        { id: "flame-1", color: "#f97316", position: 50 },
        { id: "flame-2", color: "#7c3aed", position: 100 },
      ],
      radial: { shape: "ellipse", positionX: 50, positionY: 50 },
    },
  },
  {
    name: "コニック レインボー",
    config: {
      type: "conic",
      stops: [
        { id: "rainbow-0", color: "#ef4444", position: 0 },
        { id: "rainbow-1", color: "#f97316", position: 17 },
        { id: "rainbow-2", color: "#eab308", position: 33 },
        { id: "rainbow-3", color: "#22c55e", position: 50 },
        { id: "rainbow-4", color: "#3b82f6", position: 67 },
        { id: "rainbow-5", color: "#8b5cf6", position: 83 },
        { id: "rainbow-6", color: "#ef4444", position: 100 },
      ],
      conic: { angle: 0, positionX: 50, positionY: 50 },
    },
  },
];
