/**
 * CSS Container Query ビルダーのユーティリティ
 */

/** コンテナータイプ */
export type ContainerType = "inline-size" | "size" | "normal";

/** クエリ条件のタイプ */
export type ConditionType =
  | "min-width"
  | "max-width"
  | "width-range"
  | "min-height"
  | "max-height"
  | "aspect-ratio";

/** CSS 単位 */
export type CssUnit = "px" | "em" | "rem" | "%";

/** クエリ条件 */
export interface QueryCondition {
  /** 一意 ID */
  id: string;
  /** 条件タイプ */
  type: ConditionType;
  /** 値（min 値または単一値） */
  value: number;
  /** 最大値（width-range 用） */
  maxValue: number;
  /** CSS 単位 */
  unit: CssUnit;
  /** アスペクト比の幅（aspect-ratio 用） */
  ratioW: number;
  /** アスペクト比の高さ（aspect-ratio 用） */
  ratioH: number;
}

/** コンテナー設定 */
export interface ContainerConfig {
  /** container-type */
  containerType: ContainerType;
  /** container-name（空の場合は省略） */
  containerName: string;
  /** コンテナーの CSS セレクタ */
  containerSelector: string;
}

/** クエリ設定 */
export interface QueryConfig {
  /** 条件一覧 */
  conditions: QueryCondition[];
  /** 条件間の論理演算子 */
  logicalOp: "and" | "or";
  /** クエリ内の CSS セレクタ */
  targetSelector: string;
  /** クエリ内の CSS プロパティ */
  innerCSS: string;
}

/**
 * デフォルト条件を生成する
 * @returns 新しいデフォルト条件
 */
export function createDefaultCondition(): QueryCondition {
  return {
    id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "min-width",
    value: 400,
    maxValue: 800,
    unit: "px",
    ratioW: 16,
    ratioH: 9,
  };
}

/** デフォルトコンテナー設定 */
export const defaultContainerConfig: ContainerConfig = {
  containerType: "inline-size",
  containerName: "",
  containerSelector: ".container",
};

/** デフォルトクエリ設定 */
export const defaultQueryConfig: QueryConfig = {
  conditions: [
    {
      id: "cond-default",
      type: "min-width",
      value: 400,
      maxValue: 800,
      unit: "px",
      ratioW: 16,
      ratioH: 9,
    },
  ],
  logicalOp: "and",
  targetSelector: ".card",
  innerCSS: "  display: flex;\n  flex-direction: row;",
};

/**
 * 条件文字列を生成する
 * @param cond - クエリ条件
 * @returns CSS 条件文字列
 */
export function formatCondition(cond: QueryCondition): string {
  switch (cond.type) {
    case "min-width":
      return `(min-width: ${cond.value}${cond.unit})`;
    case "max-width":
      return `(max-width: ${cond.value}${cond.unit})`;
    case "width-range":
      return `(${cond.value}${cond.unit} <= width <= ${cond.maxValue}${cond.unit})`;
    case "min-height":
      return `(min-height: ${cond.value}${cond.unit})`;
    case "max-height":
      return `(max-height: ${cond.value}${cond.unit})`;
    case "aspect-ratio":
      return `(aspect-ratio >= ${cond.ratioW}/${cond.ratioH})`;
  }
}

/**
 * コンテナー定義の CSS を生成する
 * @param config - コンテナー設定
 * @returns コンテナー定義の CSS 文字列
 */
export function generateContainerCSS(config: ContainerConfig): string {
  const sel = config.containerSelector.trim() || ".container";
  const lines: string[] = [`${sel} {`];
  lines.push(`  container-type: ${config.containerType};`);
  if (config.containerName.trim()) {
    lines.push(`  container-name: ${config.containerName.trim()};`);
  }
  lines.push("}");
  return lines.join("\n");
}

/**
 * @container クエリの CSS を生成する
 * @param containerConfig - コンテナー設定
 * @param queryConfig - クエリ設定
 * @returns @container クエリの CSS 文字列
 */
export function generateQueryCSS(
  containerConfig: ContainerConfig,
  queryConfig: QueryConfig,
): string {
  if (queryConfig.conditions.length === 0) return "";

  const containerRef = containerConfig.containerName.trim();
  const sep = ` ${queryConfig.logicalOp} `;
  const condStr = queryConfig.conditions.map(formatCondition).join(sep);

  const queryHeader = containerRef
    ? `@container ${containerRef} ${condStr}`
    : `@container ${condStr}`;

  const targetSel = queryConfig.targetSelector.trim() || ".card";
  const innerLines = queryConfig.innerCSS
    .split("\n")
    .map((l) => `    ${l.trimStart()}`)
    .join("\n");
  const inner = queryConfig.innerCSS.trim() ? innerLines : "    /* ここにスタイルを記述 */";

  return `${queryHeader} {\n  ${targetSel} {\n${inner}\n  }\n}`;
}

/**
 * 完全な CSS（コンテナー定義 + クエリ）を生成する
 * @param containerConfig - コンテナー設定
 * @param queryConfig - クエリ設定
 * @returns 完全な CSS 文字列
 */
export function generateFullCSS(
  containerConfig: ContainerConfig,
  queryConfig: QueryConfig,
): string {
  const parts: string[] = [generateContainerCSS(containerConfig)];
  const query = generateQueryCSS(containerConfig, queryConfig);
  if (query) parts.push(query);
  return parts.join("\n\n");
}

/**
 * 指定した幅（px）で単一条件を満たすか確認する（プレビュー用）
 * @param cond - クエリ条件
 * @param widthPx - コンテナー幅（px）
 * @returns 条件を満たす場合 true
 */
export function checkCondition(cond: QueryCondition, widthPx: number): boolean {
  // em/rem は 16px 基準で近似
  const toPx = (v: number, unit: CssUnit): number => {
    if (unit === "em" || unit === "rem") return v * 16;
    if (unit === "%") return (v / 100) * 800; // 800px を 100% とする近似
    return v;
  };

  switch (cond.type) {
    case "min-width":
      return widthPx >= toPx(cond.value, cond.unit);
    case "max-width":
      return widthPx <= toPx(cond.value, cond.unit);
    case "width-range":
      return widthPx >= toPx(cond.value, cond.unit) && widthPx <= toPx(cond.maxValue, cond.unit);
    case "min-height":
    case "max-height":
      // プレビューでは height は固定なので常に true として扱う
      return true;
    case "aspect-ratio":
      // プレビューでは高さを 150px として近似
      return widthPx / 150 >= cond.ratioW / cond.ratioH;
  }
}

/**
 * 全条件を満たすか確認する（プレビュー用）
 * @param conditions - 条件一覧
 * @param logicalOp - 論理演算子
 * @param widthPx - コンテナー幅（px）
 * @returns 全条件を満たす場合 true
 */
export function checkAllConditions(
  conditions: QueryCondition[],
  logicalOp: "and" | "or",
  widthPx: number,
): boolean {
  if (conditions.length === 0) return false;
  if (logicalOp === "and") {
    return conditions.every((c) => checkCondition(c, widthPx));
  }
  return conditions.some((c) => checkCondition(c, widthPx));
}
