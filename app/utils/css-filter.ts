/** CSS Filter Generator - ユーティリティ関数群 */

/** CSS filter プロパティの設定 */
export interface FilterState {
  /** ぼかし（0–20px） */
  blur: number;
  /** 明るさ（0–200%） */
  brightness: number;
  /** コントラスト（0–200%） */
  contrast: number;
  /** グレースケール（0–100%） */
  grayscale: number;
  /** 色相回転（0–360deg） */
  hueRotate: number;
  /** 反転（0–100%） */
  invert: number;
  /** 不透明度（0–100%） */
  opacity: number;
  /** 彩度（0–300%） */
  saturate: number;
  /** セピア（0–100%） */
  sepia: number;
}

/** プリセット定義 */
export interface FilterPreset {
  /** プリセット名 */
  label: string;
  /** 適用する状態 */
  state: FilterState;
}

/**
 * デフォルト状態（フィルターなし）を返す
 * @returns デフォルトの FilterState
 */
export function createDefaultState(): FilterState {
  return {
    blur: 0,
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    hueRotate: 0,
    invert: 0,
    opacity: 100,
    saturate: 100,
    sepia: 0,
  };
}

/**
 * FilterState から CSS filter プロパティ値を生成する
 * デフォルト値のフィルターは省略する
 * @param state - フィルター設定
 * @returns CSS filter プロパティ値文字列
 */
export function generateFilterValue(state: FilterState): string {
  const parts: string[] = [];

  if (state.blur !== 0) parts.push(`blur(${state.blur}px)`);
  if (state.brightness !== 100) parts.push(`brightness(${state.brightness}%)`);
  if (state.contrast !== 100) parts.push(`contrast(${state.contrast}%)`);
  if (state.grayscale !== 0) parts.push(`grayscale(${state.grayscale}%)`);
  if (state.hueRotate !== 0) parts.push(`hue-rotate(${state.hueRotate}deg)`);
  if (state.invert !== 0) parts.push(`invert(${state.invert}%)`);
  if (state.opacity !== 100) parts.push(`opacity(${state.opacity}%)`);
  if (state.saturate !== 100) parts.push(`saturate(${state.saturate}%)`);
  if (state.sepia !== 0) parts.push(`sepia(${state.sepia}%)`);

  return parts.length === 0 ? 'none' : parts.join(' ');
}

/**
 * CSSプロパティブロック全体を生成する
 * @param state - フィルター設定
 * @returns コピー用 CSS コード文字列
 */
export function generateFullCSS(state: FilterState): string {
  const value = generateFilterValue(state);
  return `.element {\n  filter: ${value};\n}`;
}

/**
 * フィルター設定がデフォルト（フィルターなし）かどうかを判定する
 * @param state - フィルター設定
 * @returns デフォルト状態であれば true
 */
export function isDefaultState(state: FilterState): boolean {
  const def = createDefaultState();
  return (
    state.blur === def.blur &&
    state.brightness === def.brightness &&
    state.contrast === def.contrast &&
    state.grayscale === def.grayscale &&
    state.hueRotate === def.hueRotate &&
    state.invert === def.invert &&
    state.opacity === def.opacity &&
    state.saturate === def.saturate &&
    state.sepia === def.sepia
  );
}

/** プリセット一覧 */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    label: 'モノクロ',
    state: { ...createDefaultState(), grayscale: 100 },
  },
  {
    label: 'セピア',
    state: { ...createDefaultState(), sepia: 80, brightness: 90 },
  },
  {
    label: 'ヴィンテージ',
    state: { ...createDefaultState(), sepia: 40, contrast: 85, brightness: 95, saturate: 80 },
  },
  {
    label: 'ウォーム',
    state: { ...createDefaultState(), brightness: 105, saturate: 130, sepia: 20 },
  },
  {
    label: 'クール',
    state: { ...createDefaultState(), hueRotate: 30, saturate: 110, brightness: 98 },
  },
  {
    label: 'ドリーミー',
    state: { ...createDefaultState(), blur: 1, brightness: 115, saturate: 130, contrast: 90 },
  },
  {
    label: 'ダーク',
    state: { ...createDefaultState(), brightness: 65, contrast: 115 },
  },
  {
    label: '反転',
    state: { ...createDefaultState(), invert: 100 },
  },
  {
    label: 'ハイコントラスト',
    state: { ...createDefaultState(), contrast: 175, brightness: 105 },
  },
];
