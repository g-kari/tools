/** CSS Text Shadow Generator - ユーティリティ関数群 */

/** テキストシャドウの1レイヤー設定 */
export interface TextShadowLayer {
  /** 一意なID */
  id: string;
  /** 水平オフセット（px） */
  offsetX: number;
  /** 垂直オフセット（px） */
  offsetY: number;
  /** ぼかし半径（px） */
  blur: number;
  /** 影の色（hex） */
  color: string;
  /** 不透明度（0–100） */
  opacity: number;
}

/** プリセット定義 */
export interface TextShadowPreset {
  /** プリセット名 */
  label: string;
  /** レイヤー一覧 */
  layers: Omit<TextShadowLayer, 'id'>[];
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
 * 1レイヤーの text-shadow 値文字列を生成する
 * @param layer - テキストシャドウレイヤー設定
 * @returns text-shadow の値部分（例: "2px 2px 4px rgba(0,0,0,0.50)"）
 */
export function layerToValue(layer: TextShadowLayer): string {
  const rgba = hexToRgba(layer.color, layer.opacity);
  return `${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${rgba}`;
}

/**
 * 全レイヤーを結合した text-shadow プロパティ値を生成する
 * @param layers - テキストシャドウレイヤー配列
 * @returns text-shadow プロパティ値（複数レイヤーはカンマ区切り）
 */
export function generateTextShadowValue(layers: TextShadowLayer[]): string {
  if (layers.length === 0) return 'none';
  return layers.map(layerToValue).join(',\n           ');
}

/**
 * CSSプロパティ全体のコードを生成する
 * @param layers - テキストシャドウレイヤー配列
 * @returns コピー用 CSS コード文字列
 */
export function generateFullCSS(layers: TextShadowLayer[]): string {
  const value = generateTextShadowValue(layers);
  return `.element {\n  text-shadow: ${value};\n}`;
}

/**
 * デフォルトレイヤーを作成する
 * @param index - 追加順（IDの一意性確保に使用）
 * @returns 新しいテキストシャドウレイヤー
 */
export function createDefaultLayer(index: number): TextShadowLayer {
  return {
    id: `layer-${Date.now()}-${index}`,
    offsetX: 2,
    offsetY: 2,
    blur: 4,
    color: '#000000',
    opacity: 50,
  };
}

/** プリセット一覧 */
export const TEXT_SHADOW_PRESETS: TextShadowPreset[] = [
  {
    label: 'シンプル',
    layers: [
      { offsetX: 1, offsetY: 1, blur: 2, color: '#000000', opacity: 50 },
    ],
  },
  {
    label: 'ネオン（青）',
    layers: [
      { offsetX: 0, offsetY: 0, blur: 4, color: '#00bfff', opacity: 100 },
      { offsetX: 0, offsetY: 0, blur: 10, color: '#00bfff', opacity: 70 },
      { offsetX: 0, offsetY: 0, blur: 20, color: '#0080ff', opacity: 50 },
    ],
  },
  {
    label: 'ネオン（ピンク）',
    layers: [
      { offsetX: 0, offsetY: 0, blur: 4, color: '#ff00ff', opacity: 100 },
      { offsetX: 0, offsetY: 0, blur: 10, color: '#ff00ff', opacity: 70 },
      { offsetX: 0, offsetY: 0, blur: 20, color: '#cc00cc', opacity: 50 },
    ],
  },
  {
    label: 'エンボス',
    layers: [
      { offsetX: -1, offsetY: -1, blur: 0, color: '#ffffff', opacity: 80 },
      { offsetX: 1, offsetY: 1, blur: 0, color: '#000000', opacity: 60 },
    ],
  },
  {
    label: 'アウトライン',
    layers: [
      { offsetX: 1, offsetY: 0, blur: 0, color: '#000000', opacity: 100 },
      { offsetX: -1, offsetY: 0, blur: 0, color: '#000000', opacity: 100 },
      { offsetX: 0, offsetY: 1, blur: 0, color: '#000000', opacity: 100 },
      { offsetX: 0, offsetY: -1, blur: 0, color: '#000000', opacity: 100 },
    ],
  },
  {
    label: '長い影',
    layers: [
      { offsetX: 2, offsetY: 2, blur: 0, color: '#333333', opacity: 80 },
      { offsetX: 4, offsetY: 4, blur: 0, color: '#555555', opacity: 60 },
      { offsetX: 6, offsetY: 6, blur: 0, color: '#777777', opacity: 40 },
    ],
  },
];
