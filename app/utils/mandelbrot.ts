/**
 * マンデルブロット集合 (Mandelbrot Set) ユーティリティ
 *
 * マンデルブロット集合は複素平面上で以下の漸化式が発散しない点 c の集合です：
 *   z₀ = 0
 *   z_{n+1} = z_n² + c
 *
 * c = cx + cy*i において |z_n| > 2 となれば発散（集合外）と判定します。
 */

/** ビューポート（複素平面上の表示領域） */
export interface MandelbrotViewport {
  /** 実軸の左端 */
  xMin: number;
  /** 実軸の右端 */
  xMax: number;
  /** 虚軸の下端 */
  yMin: number;
  /** 虚軸の上端 */
  yMax: number;
}

/** カラースキーム種別 */
export type ColorScheme = 'classic' | 'fire' | 'ocean' | 'grayscale' | 'neon';

/** デフォルトのビューポート（全体像が見える範囲） */
export const DEFAULT_VIEWPORT: MandelbrotViewport = {
  xMin: -2.5,
  xMax: 1.0,
  yMin: -1.25,
  yMax: 1.25,
};

/**
 * 複素点 (cx, cy) のマンデルブロット反復回数を計算する
 * @param cx - 実部
 * @param cy - 虚部
 * @param maxIter - 最大反復回数
 * @returns 発散するまでの反復回数（発散しない場合は maxIter）
 */
export function mandelbrotIterations(
  cx: number,
  cy: number,
  maxIter: number
): number {
  let zx = 0;
  let zy = 0;
  let iter = 0;

  while (iter < maxIter && zx * zx + zy * zy <= 4) {
    const tmp = zx * zx - zy * zy + cx;
    zy = 2 * zx * zy + cy;
    zx = tmp;
    iter++;
  }

  return iter;
}

/**
 * スムーズな反復カウントを計算する（色のバンディングを軽減）
 * @param cx - 実部
 * @param cy - 虚部
 * @param maxIter - 最大反復回数
 * @returns スムーズな反復値（0〜maxIter）
 */
export function mandelbrotSmooth(
  cx: number,
  cy: number,
  maxIter: number
): number {
  let zx = 0;
  let zy = 0;
  let iter = 0;

  while (iter < maxIter && zx * zx + zy * zy <= 4) {
    const tmp = zx * zx - zy * zy + cx;
    zy = 2 * zx * zy + cy;
    zx = tmp;
    iter++;
  }

  if (iter === maxIter) return maxIter;

  // スムーズカラーリングのためのlog補正
  const modZ = Math.sqrt(zx * zx + zy * zy);
  const smooth = iter - Math.log2(Math.log2(modZ));
  return Math.max(0, smooth);
}

/**
 * 反復回数を RGB カラーに変換する
 * @param iterations - 反復回数（mandelbrotSmooth の戻り値）
 * @param maxIter - 最大反復回数
 * @param scheme - カラースキーム
 * @returns [r, g, b] (0〜255)
 */
export function iterationsToColor(
  iterations: number,
  maxIter: number,
  scheme: ColorScheme
): [number, number, number] {
  // 集合内（発散しない点）は黒
  if (iterations >= maxIter) return [0, 0, 0];

  const t = iterations / maxIter;

  switch (scheme) {
    case 'classic': {
      // 青〜シアン〜白のグラデーション
      const r = Math.floor(9 * (1 - t) * t * t * t * 255);
      const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
      const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
      return [r, g, b];
    }
    case 'fire': {
      // 黒〜赤〜オレンジ〜黄〜白
      const r = Math.min(255, Math.floor(t * 3 * 255));
      const g = Math.min(255, Math.max(0, Math.floor((t * 3 - 1) * 255)));
      const b = Math.min(255, Math.max(0, Math.floor((t * 3 - 2) * 255)));
      return [r, g, b];
    }
    case 'ocean': {
      // 黒〜濃紺〜青〜シアン〜白
      const r = Math.min(255, Math.max(0, Math.floor((t - 0.5) * 2 * 255)));
      const g = Math.min(255, Math.floor(t * t * 255));
      const b = Math.min(255, Math.floor(Math.sqrt(t) * 255));
      return [r, g, b];
    }
    case 'grayscale': {
      const v = Math.floor(t * 255);
      return [v, v, v];
    }
    case 'neon': {
      // 周期的な虹色
      const hue = (t * 360 * 5) % 360;
      return hsvToRgb(hue, 1, t < 0.01 ? 0 : 1);
    }
    default:
      return [0, 0, 0];
  }
}

/**
 * HSV から RGB に変換する
 * @param h - 色相 (0〜360)
 * @param s - 彩度 (0〜1)
 * @param v - 明度 (0〜1)
 * @returns [r, g, b] (0〜255)
 */
export function hsvToRgb(
  h: number,
  s: number,
  v: number
): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * スクリーン座標を複素平面の座標に変換する
 * @param px - スクリーン X 座標（ピクセル）
 * @param py - スクリーン Y 座標（ピクセル）
 * @param viewport - 現在のビューポート
 * @param width - キャンバス幅
 * @param height - キャンバス高さ
 * @returns [実部, 虚部]
 */
export function screenToComplex(
  px: number,
  py: number,
  viewport: MandelbrotViewport,
  width: number,
  height: number
): [number, number] {
  const cx = viewport.xMin + (px / width) * (viewport.xMax - viewport.xMin);
  const cy = viewport.yMax - (py / height) * (viewport.yMax - viewport.yMin);
  return [cx, cy];
}

/**
 * ズームイン操作後の新しいビューポートを計算する
 * @param centerX - ズーム中心の実部
 * @param centerY - ズーム中心の虚部
 * @param viewport - 現在のビューポート
 * @param factor - ズーム倍率（> 1 で拡大）
 * @returns 新しいビューポート
 */
export function zoomViewport(
  centerX: number,
  centerY: number,
  viewport: MandelbrotViewport,
  factor: number
): MandelbrotViewport {
  const halfW = (viewport.xMax - viewport.xMin) / (2 * factor);
  const halfH = (viewport.yMax - viewport.yMin) / (2 * factor);
  return {
    xMin: centerX - halfW,
    xMax: centerX + halfW,
    yMin: centerY - halfH,
    yMax: centerY + halfH,
  };
}

/**
 * 現在のズーム倍率を返す（デフォルトビューポートとの比較）
 * @param viewport - 現在のビューポート
 * @returns ズーム倍率
 */
export function getZoomLevel(viewport: MandelbrotViewport): number {
  const defaultWidth = DEFAULT_VIEWPORT.xMax - DEFAULT_VIEWPORT.xMin;
  const currentWidth = viewport.xMax - viewport.xMin;
  return defaultWidth / currentWidth;
}

/** 有名な座標のプリセット */
export const MANDELBROT_PRESETS = [
  {
    label: '全体像',
    viewport: DEFAULT_VIEWPORT,
  },
  {
    label: '海馬の谷',
    viewport: { xMin: -0.76, xMax: -0.74, yMin: 0.09, yMax: 0.11 },
  },
  {
    label: 'ミニブロット',
    viewport: { xMin: -1.78, xMax: -1.74, yMin: -0.02, yMax: 0.02 },
  },
  {
    label: 'スパイラル',
    viewport: { xMin: -0.747, xMax: -0.736, yMin: 0.116, yMax: 0.127 },
  },
  {
    label: '象の谷',
    viewport: { xMin: 0.281, xMax: 0.285, yMin: 0.012, yMax: 0.016 },
  },
] as const;
