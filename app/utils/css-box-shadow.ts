/** CSS Box Shadow Generator - ユーティリティ関数群 */

/** ボックスシャドウの1レイヤー設定 */
export interface BoxShadowLayer {
  /** 一意なID */
  id: string;
  /** 水平オフセット（px） */
  offsetX: number;
  /** 垂直オフセット（px） */
  offsetY: number;
  /** ぼかし半径（px） */
  blur: number;
  /** 広がり半径（px） */
  spread: number;
  /** 影の色（hex） */
  color: string;
  /** 不透明度（0–100） */
  opacity: number;
  /** inset（内側）シャドウかどうか */
  inset: boolean;
}

/** プリセット定義 */
export interface BoxShadowPreset {
  /** プリセット名 */
  label: string;
  /** レイヤー一覧 */
  layers: Omit<BoxShadowLayer, 'id'>[];
}

/**
 * HEX カラーと不透明度から rgba() 文字列を生成する
 * @param hex - 6桁の16進数カラーコード（例: "#1a2b3c"）
 * @param opacity - 不透明度（0–100）
 * @returns rgba() 文字列
 */
export function hexToRgba(hex: string, opacity: number): string {
  const sanitized = hex.replace('#', '');
  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${opacity / 100})`;
  return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
}

/**
 * 1レイヤーの box-shadow 値文字列を生成する
 * @param layer - ボックスシャドウレイヤー設定
 * @returns box-shadow の値部分（例: "2px 4px 8px 0px rgba(0,0,0,0.20)"）
 */
export function layerToValue(layer: BoxShadowLayer): string {
  const insetPrefix = layer.inset ? 'inset ' : '';
  const rgba = hexToRgba(layer.color, layer.opacity);
  return `${insetPrefix}${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px ${rgba}`;
}

/**
 * 全レイヤーを結合した box-shadow プロパティ値を生成する
 * @param layers - ボックスシャドウレイヤー配列
 * @returns box-shadow プロパティ値（複数レイヤーはカンマ区切り）
 */
export function generateBoxShadowValue(layers: BoxShadowLayer[]): string {
  if (layers.length === 0) return 'none';
  return layers.map(layerToValue).join(',\n         ');
}

/**
 * CSSプロパティ全体のコードを生成する
 * @param layers - ボックスシャドウレイヤー配列
 * @returns コピー用 CSS コード文字列
 */
export function generateFullCSS(layers: BoxShadowLayer[]): string {
  const value = generateBoxShadowValue(layers);
  return `.element {\n  box-shadow: ${value};\n}`;
}

/**
 * デフォルトレイヤーを作成する
 * @param index - 追加順（IDの一意性確保に使用）
 * @returns 新しいボックスシャドウレイヤー
 */
export function createDefaultLayer(index: number): BoxShadowLayer {
  return {
    id: `layer-${Date.now()}-${index}`,
    offsetX: 2,
    offsetY: 4,
    blur: 8,
    spread: 0,
    color: '#000000',
    opacity: 20,
    inset: false,
  };
}

/** プリセット一覧 */
export const BOX_SHADOW_PRESETS: BoxShadowPreset[] = [
  {
    label: 'ソフト',
    layers: [
      { offsetX: 0, offsetY: 4, blur: 16, spread: -2, color: '#000000', opacity: 15, inset: false },
    ],
  },
  {
    label: 'ドロップシャドウ',
    layers: [
      { offsetX: 0, offsetY: 8, blur: 24, spread: -4, color: '#000000', opacity: 25, inset: false },
    ],
  },
  {
    label: '二重影',
    layers: [
      { offsetX: 0, offsetY: 2, blur: 4, spread: -1, color: '#000000', opacity: 12, inset: false },
      { offsetX: 0, offsetY: 8, blur: 20, spread: -4, color: '#000000', opacity: 20, inset: false },
    ],
  },
  {
    label: 'ニューモーフィズム（凸）',
    layers: [
      { offsetX: 5, offsetY: 5, blur: 10, spread: 0, color: '#bebebe', opacity: 100, inset: false },
      { offsetX: -5, offsetY: -5, blur: 10, spread: 0, color: '#ffffff', opacity: 100, inset: false },
    ],
  },
  {
    label: 'インセット',
    layers: [
      { offsetX: 0, offsetY: 2, blur: 8, spread: 0, color: '#000000', opacity: 20, inset: true },
    ],
  },
  {
    label: 'グロウ（青）',
    layers: [
      { offsetX: 0, offsetY: 0, blur: 0, spread: 3, color: '#3b82f6', opacity: 70, inset: false },
      { offsetX: 0, offsetY: 0, blur: 16, spread: 0, color: '#3b82f6', opacity: 40, inset: false },
    ],
  },
];
