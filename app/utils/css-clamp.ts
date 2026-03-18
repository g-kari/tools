/**
 * CSS clamp() / Fluid Values Calculator
 *
 * レスポンシブデザインのための CSS clamp() 値を計算する。
 * ビューポート幅の範囲でリニア補間を行い、min/max 値を持つ fluid 値を生成する。
 */

/** 値の単位 */
export type FluidUnit = 'px' | 'rem';

/** Fluid 値の設定 */
export interface FluidConfig {
  /** 最小値 */
  minValue: number;
  /** 最大値 */
  maxValue: number;
  /** 最小ビューポート幅 (px) */
  minViewport: number;
  /** 最大ビューポート幅 (px) */
  maxViewport: number;
  /** 値の単位 */
  unit: FluidUnit;
  /** rem の基準フォントサイズ (px) */
  remBase: number;
}

/** スケールポイント（プレビュー用）*/
export interface FluidPoint {
  viewport: number;
  value: number;
  /** clamp の min/max に達してクランプされているか */
  clamped: boolean;
}

/** 計算結果 */
export interface FluidResult {
  /** clamp() CSS 値 */
  clampValue: string;
  /** CSS カスタムプロパティ宣言 */
  cssVar: string;
  /** SCSS 変数宣言 */
  scssVar: string;
  /** slope（vw あたりの変化率） */
  slope: number;
  /** y 切片 (px) */
  yInterceptPx: number;
  /** スケールポイント（プレビュー用）*/
  points: FluidPoint[];
}

/** プリセット */
export interface FluidPreset {
  label: string;
  config: FluidConfig;
}

/** デフォルト設定 */
export const DEFAULT_FLUID_CONFIG: FluidConfig = {
  minValue: 16,
  maxValue: 24,
  minViewport: 320,
  maxViewport: 1280,
  unit: 'px',
  remBase: 16,
};

/** プリセット一覧 */
export const FLUID_PRESETS: FluidPreset[] = [
  {
    label: '本文フォント (16→18px)',
    config: { minValue: 16, maxValue: 18, minViewport: 320, maxViewport: 1280, unit: 'px', remBase: 16 },
  },
  {
    label: '見出し h1 (28→48px)',
    config: { minValue: 28, maxValue: 48, minViewport: 375, maxViewport: 1440, unit: 'px', remBase: 16 },
  },
  {
    label: '見出し h2 (22→36px)',
    config: { minValue: 22, maxValue: 36, minViewport: 375, maxViewport: 1440, unit: 'px', remBase: 16 },
  },
  {
    label: 'パディング (16→48px)',
    config: { minValue: 16, maxValue: 48, minViewport: 320, maxViewport: 1280, unit: 'px', remBase: 16 },
  },
  {
    label: 'ギャップ (8→24px)',
    config: { minValue: 8, maxValue: 24, minViewport: 320, maxViewport: 1440, unit: 'px', remBase: 16 },
  },
  {
    label: 'rem: フォント (1→1.5rem)',
    config: { minValue: 1, maxValue: 1.5, minViewport: 320, maxViewport: 1280, unit: 'rem', remBase: 16 },
  },
];

/**
 * 数値を指定の小数桁数で丸める
 */
function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/**
 * px 値を指定単位の文字列にフォーマットする
 */
function formatValue(px: number, unit: FluidUnit, remBase: number): string {
  if (unit === 'rem') {
    return `${roundTo(px / remBase, 4)}rem`;
  }
  return `${roundTo(px, 2)}px`;
}

/**
 * CSS clamp() の値を計算する
 *
 * 計算式:
 *   slope = (maxPx - minPx) / (maxViewport - minViewport)
 *   yIntercept = minPx - slope * minViewport
 *   preferred = slope * 100vw + yIntercept
 *   result = clamp(min, preferred, max)
 */
export function calculateFluid(config: FluidConfig): FluidResult {
  const { minValue, maxValue, minViewport, maxViewport, unit, remBase } = config;

  // px に変換して計算
  const minPx = unit === 'rem' ? minValue * remBase : minValue;
  const maxPx = unit === 'rem' ? maxValue * remBase : maxValue;

  // リニア補間の傾き（px/px = 無次元）
  const slope = (maxPx - minPx) / (maxViewport - minViewport);
  // y 切片 (px)
  const yInterceptPx = minPx - slope * minViewport;

  // 傾きを vw 係数として表示（slope * 100vw の係数）
  const slopePct = roundTo(slope * 100, 4);
  const interceptRounded = roundTo(yInterceptPx, 4);
  const interceptSign = interceptRounded >= 0 ? ' + ' : ' - ';
  const interceptStr = formatValue(Math.abs(yInterceptPx), unit, remBase);

  const minStr = formatValue(minPx, unit, remBase);
  const maxStr = formatValue(maxPx, unit, remBase);
  const preferredPart = `${slopePct}vw${interceptSign}${interceptStr}`;
  const clampValue = `clamp(${minStr}, ${preferredPart}, ${maxStr})`;

  const cssVar = `--fluid-value: ${clampValue};`;
  const scssVar = `$fluid-value: ${clampValue};`;

  // プレビューポイント生成（ビューポート幅でリニア補間）
  const points: FluidPoint[] = [];
  const range = maxViewport - minViewport;
  const startVp = minViewport - range * 0.2;
  const endVp = maxViewport + range * 0.2;
  const stepCount = 12;

  for (let i = 0; i <= stepCount; i++) {
    const viewport = Math.round(startVp + ((endVp - startVp) / stepCount) * i);
    const rawPx = slope * viewport + yInterceptPx;
    const clampedPx = Math.max(minPx, Math.min(maxPx, rawPx));
    const clamped = rawPx < minPx || rawPx > maxPx;
    points.push({ viewport, value: roundTo(clampedPx, 2), clamped });
  }

  return { clampValue, cssVar, scssVar, slope, yInterceptPx, points };
}

/**
 * 設定値が有効かどうかを検証する
 *
 * @returns エラーメッセージ（有効な場合は null）
 */
export function validateFluidConfig(config: FluidConfig): string | null {
  if (config.minViewport <= 0 || config.maxViewport <= 0) {
    return 'ビューポート幅は正の値が必要です';
  }
  if (config.minViewport >= config.maxViewport) {
    return '最大ビューポートは最小ビューポートより大きい必要があります';
  }
  if (config.remBase <= 0) {
    return 'rem の基準フォントサイズは正の値が必要です';
  }
  if (config.minValue === config.maxValue) {
    return '最小値と最大値が同じです（fluid にはなりません）';
  }
  return null;
}
