/**
 * CSS Gridジェネレーター ユーティリティ
 * グリッドレイアウトのプロパティ管理とCSS生成機能を提供する
 */

/** グリッドコンテナの設定 */
export interface GridContainerConfig {
  /** grid-template-columns */
  gridTemplateColumns: string;
  /** grid-template-rows */
  gridTemplateRows: string;
  /** gap (row-gap column-gap) */
  gap: string;
  /** justify-items */
  justifyItems: "start" | "end" | "center" | "stretch";
  /** align-items */
  alignItems: "start" | "end" | "center" | "stretch";
  /** justify-content */
  justifyContent:
    | "start"
    | "end"
    | "center"
    | "stretch"
    | "space-between"
    | "space-around"
    | "space-evenly";
  /** align-content */
  alignContent:
    | "start"
    | "end"
    | "center"
    | "stretch"
    | "space-between"
    | "space-around"
    | "space-evenly";
}

/** グリッドアイテムの設定 */
export interface GridItemConfig {
  /** アイテムの一意ID */
  id: string;
  /** 表示ラベル */
  label: string;
  /** grid-column (例: "1 / 3", "span 2", "auto") */
  gridColumn: string;
  /** grid-row (例: "1 / 3", "span 2", "auto") */
  gridRow: string;
  /** justify-self */
  justifySelf: "auto" | "start" | "end" | "center" | "stretch";
  /** align-self */
  alignSelf: "auto" | "start" | "end" | "center" | "stretch";
}

/** アイテムのプレビュー用カラー */
export const ITEM_COLORS: readonly string[] = [
  "#6750A4",
  "#0061A4",
  "#006C51",
  "#984715",
  "#B3261E",
  "#7B5800",
  "#00658C",
  "#4E5B92",
] as const;

/** デフォルトのコンテナ設定 */
export const defaultContainerConfig: GridContainerConfig = {
  gridTemplateColumns: "repeat(3, 1fr)",
  gridTemplateRows: "auto",
  gap: "8px",
  justifyItems: "stretch",
  alignItems: "stretch",
  justifyContent: "start",
  alignContent: "start",
};

/**
 * デフォルトのアイテムを1件作成する
 * @param index - アイテムの連番（0始まり）
 * @returns 新規グリッドアイテム設定
 */
export function createDefaultItem(index: number): GridItemConfig {
  return {
    id: `item-${Date.now()}-${index}`,
    label: `Item ${index + 1}`,
    gridColumn: "auto",
    gridRow: "auto",
    justifySelf: "auto",
    alignSelf: "auto",
  };
}

/**
 * 初期表示用の4アイテムを生成する
 * @returns グリッドアイテム設定の配列
 */
export function createDefaultItems(): GridItemConfig[] {
  return Array.from({ length: 6 }, (_, i) => createDefaultItem(i));
}

/**
 * コンテナのCSSを生成する
 * @param config - グリッドコンテナ設定
 * @returns コンテナのCSS文字列
 */
export function generateContainerCSS(config: GridContainerConfig): string {
  const lines: string[] = [".container {", "  display: grid;"];

  if (config.gridTemplateColumns) {
    lines.push(`  grid-template-columns: ${config.gridTemplateColumns};`);
  }
  if (config.gridTemplateRows && config.gridTemplateRows !== "auto") {
    lines.push(`  grid-template-rows: ${config.gridTemplateRows};`);
  }
  if (config.gap) {
    lines.push(`  gap: ${config.gap};`);
  }
  if (config.justifyItems !== "stretch") {
    lines.push(`  justify-items: ${config.justifyItems};`);
  }
  if (config.alignItems !== "stretch") {
    lines.push(`  align-items: ${config.alignItems};`);
  }
  if (config.justifyContent !== "start") {
    lines.push(`  justify-content: ${config.justifyContent};`);
  }
  if (config.alignContent !== "start") {
    lines.push(`  align-content: ${config.alignContent};`);
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * アイテムのCSSを生成する（デフォルト値と異なる場合のみ出力）
 * @param item - グリッドアイテム設定
 * @param selector - CSSセレクタ
 * @returns アイテムのCSS文字列、またはプロパティがない場合は空文字列
 */
export function generateItemCSS(
  item: GridItemConfig,
  selector: string
): string {
  const props: string[] = [];

  if (item.gridColumn !== "auto") {
    props.push(`  grid-column: ${item.gridColumn};`);
  }
  if (item.gridRow !== "auto") {
    props.push(`  grid-row: ${item.gridRow};`);
  }
  if (item.justifySelf !== "auto") {
    props.push(`  justify-self: ${item.justifySelf};`);
  }
  if (item.alignSelf !== "auto") {
    props.push(`  align-self: ${item.alignSelf};`);
  }

  if (props.length === 0) return "";
  return `${selector} {\n${props.join("\n")}\n}`;
}

/**
 * コンテナとアイテム全体のCSSを生成する
 * @param container - グリッドコンテナ設定
 * @param items - グリッドアイテム設定の配列
 * @returns 完全なCSS文字列
 */
export function generateFullCSS(
  container: GridContainerConfig,
  items: GridItemConfig[]
): string {
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

/**
 * コンテナのインラインスタイルオブジェクトを返す（プレビュー用）
 * @param config - グリッドコンテナ設定
 * @returns React.CSSProperties 相当のオブジェクト
 */
export function getContainerStyles(
  config: GridContainerConfig
): Record<string, string> {
  const style: Record<string, string> = {
    display: "grid",
  };
  if (config.gridTemplateColumns) {
    style.gridTemplateColumns = config.gridTemplateColumns;
  }
  if (config.gridTemplateRows) {
    style.gridTemplateRows = config.gridTemplateRows;
  }
  if (config.gap) {
    style.gap = config.gap;
  }
  if (config.justifyItems !== "stretch") {
    style.justifyItems = config.justifyItems;
  }
  if (config.alignItems !== "stretch") {
    style.alignItems = config.alignItems;
  }
  if (config.justifyContent !== "start") {
    style.justifyContent = config.justifyContent;
  }
  if (config.alignContent !== "start") {
    style.alignContent = config.alignContent;
  }
  return style;
}

/**
 * アイテムのインラインスタイルオブジェクトを返す（プレビュー用）
 * @param item - グリッドアイテム設定
 * @returns React.CSSProperties 相当のオブジェクト
 */
export function getItemStyles(
  item: GridItemConfig
): Record<string, string> {
  const style: Record<string, string> = {};
  if (item.gridColumn !== "auto") {
    style.gridColumn = item.gridColumn;
  }
  if (item.gridRow !== "auto") {
    style.gridRow = item.gridRow;
  }
  if (item.justifySelf !== "auto") {
    style.justifySelf = item.justifySelf;
  }
  if (item.alignSelf !== "auto") {
    style.alignSelf = item.alignSelf;
  }
  return style;
}
