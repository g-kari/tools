/** CSS Transform Generator - ユーティリティ関数群 */

/** CSS transform プロパティの設定 */
export interface TransformState {
  /** X方向の移動（px） */
  translateX: number;
  /** Y方向の移動（px） */
  translateY: number;
  /** Z方向の移動（px） */
  translateZ: number;
  /** X軸回転（deg） */
  rotateX: number;
  /** Y軸回転（deg） */
  rotateY: number;
  /** Z軸回転（deg） */
  rotateZ: number;
  /** X方向のスケール */
  scaleX: number;
  /** Y方向のスケール */
  scaleY: number;
  /** X方向のスキュー（deg） */
  skewX: number;
  /** Y方向のスキュー（deg） */
  skewY: number;
  /** パースペクティブ（px、0は無効） */
  perspective: number;
}

/** プリセット定義 */
export interface TransformPreset {
  /** プリセット名 */
  label: string;
  /** 適用する状態 */
  state: TransformState;
}

/**
 * デフォルト状態（変形なし）を返す
 * @returns デフォルトの TransformState
 */
export function createDefaultState(): TransformState {
  return {
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    perspective: 0,
  };
}

/**
 * TransformState から CSS transform プロパティ値を生成する
 * デフォルト値の関数は省略する
 * @param state - transform 設定
 * @returns CSS transform プロパティ値文字列
 */
export function generateTransformValue(state: TransformState): string {
  const parts: string[] = [];

  if (state.translateX !== 0) parts.push(`translateX(${state.translateX}px)`);
  if (state.translateY !== 0) parts.push(`translateY(${state.translateY}px)`);
  if (state.translateZ !== 0) parts.push(`translateZ(${state.translateZ}px)`);
  if (state.rotateX !== 0) parts.push(`rotateX(${state.rotateX}deg)`);
  if (state.rotateY !== 0) parts.push(`rotateY(${state.rotateY}deg)`);
  if (state.rotateZ !== 0) parts.push(`rotateZ(${state.rotateZ}deg)`);
  if (state.scaleX !== 1 && state.scaleY !== 1 && state.scaleX === state.scaleY) {
    parts.push(`scale(${state.scaleX})`);
  } else {
    if (state.scaleX !== 1) parts.push(`scaleX(${state.scaleX})`);
    if (state.scaleY !== 1) parts.push(`scaleY(${state.scaleY})`);
  }
  if (state.skewX !== 0) parts.push(`skewX(${state.skewX}deg)`);
  if (state.skewY !== 0) parts.push(`skewY(${state.skewY}deg)`);

  return parts.length === 0 ? "none" : parts.join(" ");
}

/**
 * CSS プロパティブロック全体を生成する
 * perspective が有効な場合は perspective も含む
 * @param state - transform 設定
 * @returns コピー用 CSS コード文字列
 */
export function generateFullCSS(state: TransformState): string {
  const transformValue = generateTransformValue(state);
  const lines: string[] = [`.element {`];

  if (state.perspective > 0) {
    lines.push(`  perspective: ${state.perspective}px;`);
  }
  lines.push(`  transform: ${transformValue};`);
  lines.push(`}`);

  return lines.join("\n");
}

/**
 * transform 設定がデフォルト（変形なし）かどうかを判定する
 * @param state - transform 設定
 * @returns デフォルト状態であれば true
 */
export function isDefaultState(state: TransformState): boolean {
  const def = createDefaultState();
  return (
    state.translateX === def.translateX &&
    state.translateY === def.translateY &&
    state.translateZ === def.translateZ &&
    state.rotateX === def.rotateX &&
    state.rotateY === def.rotateY &&
    state.rotateZ === def.rotateZ &&
    state.scaleX === def.scaleX &&
    state.scaleY === def.scaleY &&
    state.skewX === def.skewX &&
    state.skewY === def.skewY &&
    state.perspective === def.perspective
  );
}

/** プリセット一覧 */
export const TRANSFORM_PRESETS: TransformPreset[] = [
  {
    label: "右移動",
    state: { ...createDefaultState(), translateX: 50 },
  },
  {
    label: "右回転",
    state: { ...createDefaultState(), rotateZ: 45 },
  },
  {
    label: "縮小",
    state: { ...createDefaultState(), scaleX: 0.5, scaleY: 0.5 },
  },
  {
    label: "拡大",
    state: { ...createDefaultState(), scaleX: 1.5, scaleY: 1.5 },
  },
  {
    label: "スキュー",
    state: { ...createDefaultState(), skewX: 20, skewY: 10 },
  },
  {
    label: "X軸回転",
    state: { ...createDefaultState(), rotateX: 45, perspective: 600 },
  },
  {
    label: "Y軸回転",
    state: { ...createDefaultState(), rotateY: 45, perspective: 600 },
  },
  {
    label: "フリップ",
    state: { ...createDefaultState(), rotateY: 180 },
  },
  {
    label: "複合変形",
    state: { ...createDefaultState(), translateX: 20, rotateZ: 15, scaleX: 1.2, scaleY: 1.2 },
  },
];
