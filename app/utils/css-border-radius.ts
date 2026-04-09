/** CSS Border Radius Generator - ユーティリティ関数群 */

/** 各コーナーの角丸設定 */
export interface BorderRadiusCorner {
  /** 水平半径 */
  h: number;
  /** 垂直半径 */
  v: number;
}

/** 角丸全体の設定 */
export interface BorderRadiusState {
  /** 左上 */
  topLeft: BorderRadiusCorner;
  /** 右上 */
  topRight: BorderRadiusCorner;
  /** 右下 */
  bottomRight: BorderRadiusCorner;
  /** 左下 */
  bottomLeft: BorderRadiusCorner;
  /** 単位 */
  unit: "px" | "%";
  /** 楕円モード（水平・垂直を独立制御） */
  elliptic: boolean;
}

/** プリセット定義 */
export interface BorderRadiusPreset {
  /** プリセット名 */
  label: string;
  /** 適用する状態（elliptic は含まない） */
  state: Omit<BorderRadiusState, "elliptic">;
}

/**
 * 4つの値を最短の CSS shorthand に変換する
 * CSS の border-radius shorthand は TL TR BR BL（時計回り）
 * @param values - [TL, TR, BR, BL] の値配列
 * @param unit - 単位文字列（"px"、"%"等）
 * @returns CSS shorthand 文字列
 */
export function simplifyFourValues(values: number[], unit: string): string {
  const [tl, tr, br, bl] = values;

  // 全て等しい場合: "TL"
  if (tl === tr && tr === br && br === bl) {
    return `${tl}${unit}`;
  }
  // TL=BR かつ TR=BL の場合: "TL TR"
  if (tl === br && tr === bl) {
    return `${tl}${unit} ${tr}${unit}`;
  }
  // TR=BL の場合: "TL TR BR"
  if (tr === bl) {
    return `${tl}${unit} ${tr}${unit} ${br}${unit}`;
  }
  // それ以外: "TL TR BR BL"
  return `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit}`;
}

/**
 * border-radius の CSS プロパティ値を生成する
 * @param state - 角丸の設定
 * @returns CSS プロパティ値文字列（例: "8px"、"50% 30% / 40% 60%"）
 */
export function generateBorderRadiusValue(state: BorderRadiusState): string {
  const { topLeft, topRight, bottomRight, bottomLeft, unit, elliptic } = state;

  if (elliptic) {
    const hValues = [topLeft.h, topRight.h, bottomRight.h, bottomLeft.h];
    const vValues = [topLeft.v, topRight.v, bottomRight.v, bottomLeft.v];

    // h と v が全て同じであれば単純表記
    const allSameHV = hValues.every((h, i) => h === vValues[i]);
    if (allSameHV) {
      return simplifyFourValues(hValues, unit);
    }

    const hStr = simplifyFourValues(hValues, unit);
    const vStr = simplifyFourValues(vValues, unit);
    return `${hStr} / ${vStr}`;
  }

  // 非楕円モード: h のみ使用
  const values = [topLeft.h, topRight.h, bottomRight.h, bottomLeft.h];
  return simplifyFourValues(values, unit);
}

/**
 * CSSプロパティブロック全体を生成する
 * @param state - 角丸の設定
 * @returns コピー用 CSS コード文字列
 */
export function generateFullCSS(state: BorderRadiusState): string {
  const value = generateBorderRadiusValue(state);
  return `.element {\n  border-radius: ${value};\n}`;
}

/**
 * デフォルト状態を生成する
 * @returns デフォルトの BorderRadiusState
 */
export function createDefaultState(): BorderRadiusState {
  return {
    topLeft: { h: 8, v: 8 },
    topRight: { h: 8, v: 8 },
    bottomRight: { h: 8, v: 8 },
    bottomLeft: { h: 8, v: 8 },
    unit: "px",
    elliptic: false,
  };
}

/** プリセット一覧 */
export const BORDER_RADIUS_PRESETS: BorderRadiusPreset[] = [
  {
    label: "角丸",
    state: {
      topLeft: { h: 8, v: 8 },
      topRight: { h: 8, v: 8 },
      bottomRight: { h: 8, v: 8 },
      bottomLeft: { h: 8, v: 8 },
      unit: "px",
    },
  },
  {
    label: "カード",
    state: {
      topLeft: { h: 16, v: 16 },
      topRight: { h: 16, v: 16 },
      bottomRight: { h: 16, v: 16 },
      bottomLeft: { h: 16, v: 16 },
      unit: "px",
    },
  },
  {
    label: "円形",
    state: {
      topLeft: { h: 50, v: 50 },
      topRight: { h: 50, v: 50 },
      bottomRight: { h: 50, v: 50 },
      bottomLeft: { h: 50, v: 50 },
      unit: "%",
    },
  },
  {
    label: "ピル型",
    state: {
      topLeft: { h: 9999, v: 9999 },
      topRight: { h: 9999, v: 9999 },
      bottomRight: { h: 9999, v: 9999 },
      bottomLeft: { h: 9999, v: 9999 },
      unit: "px",
    },
  },
  {
    label: "リーフ",
    state: {
      topLeft: { h: 0, v: 0 },
      topRight: { h: 50, v: 50 },
      bottomRight: { h: 0, v: 0 },
      bottomLeft: { h: 50, v: 50 },
      unit: "%",
    },
  },
  {
    label: "斜め丸",
    state: {
      topLeft: { h: 40, v: 40 },
      topRight: { h: 0, v: 0 },
      bottomRight: { h: 40, v: 40 },
      bottomLeft: { h: 0, v: 0 },
      unit: "%",
    },
  },
  {
    label: "吹き出し",
    state: {
      topLeft: { h: 16, v: 16 },
      topRight: { h: 16, v: 16 },
      bottomRight: { h: 16, v: 16 },
      bottomLeft: { h: 0, v: 0 },
      unit: "px",
    },
  },
  {
    label: "上丸",
    state: {
      topLeft: { h: 24, v: 24 },
      topRight: { h: 24, v: 24 },
      bottomRight: { h: 0, v: 0 },
      bottomLeft: { h: 0, v: 0 },
      unit: "px",
    },
  },
];
