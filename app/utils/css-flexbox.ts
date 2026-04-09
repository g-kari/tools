/**
 * CSSフレックスボックスジェネレーター ユーティリティ
 * フレックスコンテナ・アイテムの設定からCSSを生成する
 */

/** フレックスコンテナのプロパティ設定 */
export interface FlexContainerConfig {
  /** 主軸の方向 */
  flexDirection: "row" | "row-reverse" | "column" | "column-reverse";
  /** 主軸方向の揃え */
  justifyContent:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  /** 交差軸方向の揃え */
  alignItems: "flex-start" | "flex-end" | "center" | "baseline" | "stretch";
  /** 折り返し設定 */
  flexWrap: "nowrap" | "wrap" | "wrap-reverse";
  /** 複数行の揃え（flex-wrap: wrap 時に有効） */
  alignContent:
    | "normal"
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "stretch";
  /** アイテム間のギャップ */
  gap: string;
}

/** フレックスアイテムのプロパティ設定 */
export interface FlexItemConfig {
  /** 一意なID */
  id: string;
  /** 表示ラベル */
  label: string;
  /** 拡大係数 */
  flexGrow: number;
  /** 縮小係数 */
  flexShrink: number;
  /** ベースサイズ */
  flexBasis: string;
  /** 個別の交差軸方向の揃え */
  alignSelf: "auto" | "flex-start" | "flex-end" | "center" | "baseline" | "stretch";
  /** 表示順序 */
  order: number;
}

/** デフォルトのフレックスコンテナ設定 */
export const defaultContainerConfig: FlexContainerConfig = {
  flexDirection: "row",
  justifyContent: "flex-start",
  alignItems: "stretch",
  flexWrap: "nowrap",
  alignContent: "normal",
  gap: "8px",
};

/** プレビュー用アイテムのカラーパレット */
export const ITEM_COLORS = [
  "#4285F4",
  "#EA4335",
  "#FBBC05",
  "#34A853",
  "#9C27B0",
  "#00BCD4",
  "#FF5722",
  "#607D8B",
];

/**
 * 新しいフレックスアイテムを作成する
 * @param index - アイテムのインデックス（ラベル番号用）
 * @returns 新しいフレックスアイテム設定
 */
export function createDefaultItem(index: number): FlexItemConfig {
  return {
    id: `item-${Date.now()}-${index}`,
    label: `Item ${index + 1}`,
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
    alignSelf: "auto",
    order: 0,
  };
}

/**
 * デフォルトのアイテム一覧を作成する
 * @returns 3つのデフォルトフレックスアイテム
 */
export function createDefaultItems(): FlexItemConfig[] {
  return [createDefaultItem(0), createDefaultItem(1), createDefaultItem(2)];
}

/**
 * フレックスコンテナのCSSプロパティオブジェクトを生成する
 * プレビュー表示用に使用する
 * @param config - フレックスコンテナの設定
 * @returns CSSプロパティの Record
 */
export function getContainerStyles(config: FlexContainerConfig): Record<string, string> {
  const styles: Record<string, string> = {
    display: "flex",
    flexDirection: config.flexDirection,
    justifyContent: config.justifyContent,
    alignItems: config.alignItems,
    flexWrap: config.flexWrap,
    gap: config.gap,
  };

  if (config.flexWrap !== "nowrap" && config.alignContent !== "normal") {
    styles.alignContent = config.alignContent;
  }

  return styles;
}

/**
 * フレックスアイテムのCSSプロパティオブジェクトを生成する
 * プレビュー表示用に使用する
 * @param item - フレックスアイテムの設定
 * @returns CSSプロパティの Record
 */
export function getItemStyles(item: FlexItemConfig): Record<string, string> {
  const styles: Record<string, string> = {};

  const hasFlex = item.flexGrow !== 0 || item.flexShrink !== 1 || item.flexBasis !== "auto";
  if (hasFlex) {
    styles.flex = `${item.flexGrow} ${item.flexShrink} ${item.flexBasis}`;
  }

  if (item.alignSelf !== "auto") {
    styles.alignSelf = item.alignSelf;
  }

  if (item.order !== 0) {
    styles.order = String(item.order);
  }

  return styles;
}

/**
 * フレックスコンテナのCSS文字列を生成する
 * @param config - フレックスコンテナの設定
 * @param selector - CSSセレクター名（デフォルト: .container）
 * @returns CSS文字列
 */
export function generateContainerCSS(config: FlexContainerConfig, selector = ".container"): string {
  const lines: string[] = [`${selector} {`, "  display: flex;"];

  if (config.flexDirection !== "row") {
    lines.push(`  flex-direction: ${config.flexDirection};`);
  }
  if (config.justifyContent !== "flex-start") {
    lines.push(`  justify-content: ${config.justifyContent};`);
  }
  if (config.alignItems !== "stretch") {
    lines.push(`  align-items: ${config.alignItems};`);
  }
  if (config.flexWrap !== "nowrap") {
    lines.push(`  flex-wrap: ${config.flexWrap};`);
  }
  if (config.flexWrap !== "nowrap" && config.alignContent !== "normal") {
    lines.push(`  align-content: ${config.alignContent};`);
  }
  if (config.gap !== "0px" && config.gap !== "0") {
    lines.push(`  gap: ${config.gap};`);
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * フレックスアイテムのCSS文字列を生成する
 * @param item - フレックスアイテムの設定
 * @param selector - CSSセレクター名
 * @returns CSS文字列（変更がない場合は空文字列）
 */
export function generateItemCSS(item: FlexItemConfig, selector: string): string {
  const lines: string[] = [];

  const hasFlex = item.flexGrow !== 0 || item.flexShrink !== 1 || item.flexBasis !== "auto";
  if (hasFlex) {
    lines.push(`  flex: ${item.flexGrow} ${item.flexShrink} ${item.flexBasis};`);
  }
  if (item.alignSelf !== "auto") {
    lines.push(`  align-self: ${item.alignSelf};`);
  }
  if (item.order !== 0) {
    lines.push(`  order: ${item.order};`);
  }

  if (lines.length === 0) return "";

  return [`${selector} {`, ...lines, "}"].join("\n");
}

/**
 * 全体のCSS（コンテナ + 全アイテム）を生成する
 * @param container - フレックスコンテナの設定
 * @param items - フレックスアイテムの設定リスト
 * @returns 完全なCSS文字列
 */
export function generateFullCSS(container: FlexContainerConfig, items: FlexItemConfig[]): string {
  const parts: string[] = [generateContainerCSS(container)];

  items.forEach((item, idx) => {
    const selector = `.item:nth-child(${idx + 1})`;
    const itemCSS = generateItemCSS(item, selector);
    if (itemCSS) {
      parts.push(itemCSS);
    }
  });

  return parts.join("\n\n");
}
