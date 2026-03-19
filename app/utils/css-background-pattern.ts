/**
 * CSSバックグラウンドパターン生成ユーティリティ
 *
 * repeating-linear-gradient / radial-gradient / repeating-conic-gradient を
 * 使ったバックグラウンドパターンのCSS生成関数群を提供します。
 */

/** パターン種類 */
export type PatternType =
  | 'stripes'
  | 'dots'
  | 'grid'
  | 'checkerboard'
  | 'diagonal'
  | 'zigzag';

/** パターン設定 */
export interface PatternConfig {
  /** パターン種類 */
  type: PatternType;
  /** メインカラー (HEX例: "#3b82f6") */
  color1: string;
  /** サブカラー (HEX例: "#ffffff") */
  color2: string;
  /** パターンサイズ (px, 4〜100) */
  size: number;
  /** 角度 (deg, 0〜180, stripes/diagonal で使用) */
  angle: number;
  /** 線幅 (px, 1〜20, stripes/diagonal/grid で使用) */
  lineWidth: number;
  /** 点の半径 (%, 10〜50, dots で使用) */
  dotRadius: number;
}

/** パターン生成結果 */
export interface PatternResult {
  /** background CSSプロパティ値 */
  background: string;
  /** background-size値（省略時はundefined） */
  backgroundSize?: string;
  /** コピー用の完全なCSS文字列 */
  fullCSS: string;
}

/** パターンプリセット */
export interface PatternPreset {
  /** プリセット名 */
  name: string;
  /** パターン設定 */
  config: PatternConfig;
}

/**
 * fullCSS 文字列を組み立てるヘルパー
 */
function buildFullCSS(background: string, backgroundSize?: string): string {
  if (backgroundSize) {
    return `background: ${background};\nbackground-size: ${backgroundSize};`;
  }
  return `background: ${background};`;
}

/**
 * 縞模様（stripes）パターンを生成する
 *
 * @param config - パターン設定
 * @returns PatternResult
 */
export function generateStripes(config: PatternConfig): PatternResult {
  const { color1, color2, size, angle, lineWidth } = config;
  const half = lineWidth;
  const background = `repeating-linear-gradient(${angle}deg, ${color1}, ${color1} ${half}px, ${color2} ${half}px, ${color2} ${size}px)`;
  return { background, fullCSS: buildFullCSS(background) };
}

/**
 * 斜め縞（diagonal）パターンを生成する
 *
 * @param config - パターン設定
 * @returns PatternResult
 */
export function generateDiagonal(config: PatternConfig): PatternResult {
  const { color1, color2, size, angle, lineWidth } = config;
  const half = lineWidth;
  const background = `repeating-linear-gradient(${angle}deg, ${color1}, ${color1} ${half}px, ${color2} ${half}px, ${color2} ${size}px)`;
  return { background, fullCSS: buildFullCSS(background) };
}

/**
 * グリッド（grid）パターンを生成する
 *
 * @param config - パターン設定
 * @returns PatternResult
 */
export function generateGrid(config: PatternConfig): PatternResult {
  const { color1, color2, size, lineWidth } = config;
  const gap = size - lineWidth;
  const background = [
    `repeating-linear-gradient(0deg, transparent, transparent ${gap}px, ${color1} ${gap}px, ${color1} ${size}px)`,
    `repeating-linear-gradient(90deg, transparent, transparent ${gap}px, ${color1} ${gap}px, ${color1} ${size}px)`,
    color2,
  ].join(', ');
  return { background, fullCSS: buildFullCSS(background) };
}

/**
 * 市松模様（checkerboard）パターンを生成する
 *
 * @param config - パターン設定
 * @returns PatternResult
 */
export function generateCheckerboard(config: PatternConfig): PatternResult {
  const { color1, color2, size } = config;
  const background = `repeating-conic-gradient(${color1} 0% 25%, ${color2} 0% 50%)`;
  const backgroundSize = `${size}px ${size}px`;
  return { background, backgroundSize, fullCSS: buildFullCSS(background, backgroundSize) };
}

/**
 * 水玉（dots）パターンを生成する
 *
 * @param config - パターン設定
 * @returns PatternResult
 */
export function generateDots(config: PatternConfig): PatternResult {
  const { color1, color2, size, dotRadius } = config;
  const background = `radial-gradient(circle, ${color1} ${dotRadius}%, transparent ${dotRadius}%) ${color2}`;
  const backgroundSize = `${size}px ${size}px`;
  return { background, backgroundSize, fullCSS: buildFullCSS(background, backgroundSize) };
}

/**
 * ジグザグ（zigzag）パターンを生成する
 *
 * @param config - パターン設定
 * @returns PatternResult
 */
export function generateZigzag(config: PatternConfig): PatternResult {
  const { color1, color2, size } = config;
  const half = size / 2;
  const background = [
    `repeating-linear-gradient(135deg, ${color1} 25%, transparent 25%) -${half}px 0`,
    `repeating-linear-gradient(225deg, ${color1} 25%, transparent 25%) -${half}px 0`,
    `repeating-linear-gradient(315deg, ${color1} 25%, transparent 25%)`,
    `repeating-linear-gradient(45deg, ${color1} 25%, transparent 25%) ${color2}`,
  ].join(', ');
  const backgroundSize = `${size}px ${half}px`;
  return { background, backgroundSize, fullCSS: buildFullCSS(background, backgroundSize) };
}

/**
 * 設定に基づいてパターンCSSを生成するディスパッチャー
 *
 * @param config - パターン設定
 * @returns PatternResult
 */
export function generatePatternCSS(config: PatternConfig): PatternResult {
  switch (config.type) {
    case 'stripes':
      return generateStripes(config);
    case 'diagonal':
      return generateDiagonal(config);
    case 'grid':
      return generateGrid(config);
    case 'checkerboard':
      return generateCheckerboard(config);
    case 'dots':
      return generateDots(config);
    case 'zigzag':
      return generateZigzag(config);
  }
}

/**
 * デフォルトのパターン設定を生成する
 *
 * @returns PatternConfig
 */
export function createDefaultConfig(): PatternConfig {
  return {
    type: 'stripes',
    color1: '#3b82f6',
    color2: '#f8fafc',
    size: 20,
    angle: 45,
    lineWidth: 4,
    dotRadius: 30,
  };
}

/** パターンプリセット一覧 */
export const PATTERN_PRESETS: PatternPreset[] = [
  {
    name: '青縞',
    config: { type: 'stripes', color1: '#3b82f6', color2: '#eff6ff', size: 20, angle: 45, lineWidth: 4, dotRadius: 30 },
  },
  {
    name: 'ドット',
    config: { type: 'dots', color1: '#8b5cf6', color2: '#faf5ff', size: 24, angle: 0, lineWidth: 4, dotRadius: 25 },
  },
  {
    name: 'グリッド',
    config: { type: 'grid', color1: '#64748b', color2: '#f8fafc', size: 24, angle: 0, lineWidth: 1, dotRadius: 30 },
  },
  {
    name: '市松',
    config: { type: 'checkerboard', color1: '#334155', color2: '#f8fafc', size: 24, angle: 0, lineWidth: 4, dotRadius: 30 },
  },
  {
    name: '斜め縞',
    config: { type: 'diagonal', color1: '#f59e0b', color2: '#fffbeb', size: 20, angle: 45, lineWidth: 5, dotRadius: 30 },
  },
  {
    name: 'ジグザグ',
    config: { type: 'zigzag', color1: '#ec4899', color2: '#fdf2f8', size: 20, angle: 0, lineWidth: 4, dotRadius: 30 },
  },
];
