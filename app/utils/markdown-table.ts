/**
 * Markdownテーブル生成ユーティリティ
 * テーブルデータのMarkdown形式変換、CSV/TSVパース、行列操作を提供する
 * 全ての操作関数はイミュータブル（元のTableDataを変更せず新しいオブジェクトを返す）
 */

/** セルの配置方向 */
export type AlignType = "left" | "center" | "right" | "none";

/**
 * テーブルの列定義
 */
export interface TableColumn {
  /** 列ヘッダーテキスト */
  header: string;
  /** 列の配置方向 */
  align: AlignType;
}

/**
 * テーブルデータの型定義
 */
export interface TableData {
  /** 列定義の配列 */
  columns: TableColumn[];
  /** データ行の2次元配列 rows[rowIndex][colIndex] */
  rows: string[][];
}

/**
 * 指定された列数・行数の空テーブルを生成する
 * @param cols 列数
 * @param rows 行数
 * @returns 空のTableData
 */
export function createEmptyTable(cols: number, rows: number): TableData {
  const columns: TableColumn[] = Array.from({ length: cols }, (_, i) => ({
    header: `列${i + 1}`,
    align: "none" as AlignType,
  }));
  const dataRows: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "")
  );
  return { columns, rows: dataRows };
}

/**
 * セル内の | をエスケープする
 * @param cell エスケープするセルの文字列
 * @returns エスケープ済み文字列
 */
function escapeCell(cell: string): string {
  return cell.replace(/\|/g, "\\|");
}

/**
 * 配置方向と幅に基づいて区切り行のセルを生成する
 * @param align 配置方向
 * @param width セルの幅
 * @returns 区切りセル文字列
 */
function buildSeparator(align: AlignType, width: number): string {
  switch (align) {
    case "left":
      return `:${"-".repeat(width - 1)}`;
    case "center":
      return `:${"-".repeat(Math.max(width - 2, 1))}:`;
    case "right":
      return `${"-".repeat(width - 1)}:`;
    default:
      return "-".repeat(width);
  }
}

/**
 * TableDataをMarkdown形式のテーブル文字列に変換する
 * 各列の幅はmax(ヘッダー文字数, 最大セル文字数, 3)でパディング
 * セル内の | は \| にエスケープ
 * @param table 変換するテーブルデータ
 * @returns Markdown形式のテーブル文字列
 */
export function generateMarkdown(table: TableData): string {
  const { columns, rows } = table;
  if (columns.length === 0) return "";

  const colWidths = columns.map((col, i) => {
    const headerLen = escapeCell(col.header).length;
    const maxCellLen = rows.reduce((max, row) => {
      return Math.max(max, escapeCell(row[i] ?? "").length);
    }, 0);
    return Math.max(headerLen, maxCellLen, 3);
  });

  const headerRow =
    "| " +
    columns
      .map((col, i) => escapeCell(col.header).padEnd(colWidths[i]))
      .join(" | ") +
    " |";

  const separatorRow =
    "| " +
    columns
      .map((col, i) => buildSeparator(col.align, colWidths[i]))
      .join(" | ") +
    " |";

  const dataRows = rows.map(
    (row) =>
      "| " +
      columns
        .map((_, i) => escapeCell(row[i] ?? "").padEnd(colWidths[i]))
        .join(" | ") +
      " |"
  );

  return [headerRow, separatorRow, ...dataRows].join("\n");
}

/**
 * CSV/TSV文字列をTableDataに変換する
 * 空文字列はcreateEmptyTable(3, 2)を返す
 * タブが含まれていればTSV、そうでなければCSVとして解析する
 * 1行目をヘッダー、2行目以降をデータ行として扱う
 * @param csv パースするCSVまたはTSV文字列
 * @returns パース結果のTableData
 */
export function parseCSV(csv: string): TableData {
  if (!csv.trim()) return createEmptyTable(3, 2);

  const delimiter = csv.includes("\t") ? "\t" : ",";
  const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length === 0) return createEmptyTable(3, 2);

  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const columns: TableColumn[] = headers.map((header) => ({
    header,
    align: "none" as AlignType,
  }));

  const dataRows: string[][] = lines.slice(1).map((line) => {
    const cells = line.split(delimiter).map((c) => c.trim());
    return Array.from({ length: columns.length }, (_, i) => cells[i] ?? "");
  });

  return { columns, rows: dataRows };
}

/**
 * テーブルに列を1つ追加する（イミュータブル）
 * @param table 元のテーブルデータ
 * @returns 列が追加された新しいTableData
 */
export function addColumn(table: TableData): TableData {
  const newIndex = table.columns.length + 1;
  return {
    columns: [...table.columns, { header: `列${newIndex}`, align: "none" }],
    rows: table.rows.map((row) => [...row, ""]),
  };
}

/**
 * 指定インデックスの列を削除する（イミュータブル）
 * @param table 元のテーブルデータ
 * @param colIndex 削除する列のインデックス
 * @returns 列が削除された新しいTableData
 */
export function removeColumn(table: TableData, colIndex: number): TableData {
  return {
    columns: table.columns.filter((_, i) => i !== colIndex),
    rows: table.rows.map((row) => row.filter((_, i) => i !== colIndex)),
  };
}

/**
 * テーブルに行を1つ追加する（イミュータブル）
 * @param table 元のテーブルデータ
 * @returns 行が追加された新しいTableData
 */
export function addRow(table: TableData): TableData {
  return {
    columns: table.columns,
    rows: [
      ...table.rows,
      Array.from({ length: table.columns.length }, () => ""),
    ],
  };
}

/**
 * 指定インデックスの行を削除する（イミュータブル）
 * @param table 元のテーブルデータ
 * @param rowIndex 削除する行のインデックス
 * @returns 行が削除された新しいTableData
 */
export function removeRow(table: TableData, rowIndex: number): TableData {
  return {
    columns: table.columns,
    rows: table.rows.filter((_, i) => i !== rowIndex),
  };
}

/**
 * 指定列の配置方向を変更する（イミュータブル）
 * @param table 元のテーブルデータ
 * @param colIndex 変更する列のインデックス
 * @param align 新しい配置方向
 * @returns 配置方向が変更された新しいTableData
 */
export function setColumnAlign(
  table: TableData,
  colIndex: number,
  align: AlignType
): TableData {
  return {
    columns: table.columns.map((col, i) =>
      i === colIndex ? { ...col, align } : col
    ),
    rows: table.rows,
  };
}

/**
 * 指定列のヘッダーテキストを更新する（イミュータブル）
 * @param table 元のテーブルデータ
 * @param colIndex 更新する列のインデックス
 * @param value 新しいヘッダーテキスト
 * @returns ヘッダーが更新された新しいTableData
 */
export function updateHeader(
  table: TableData,
  colIndex: number,
  value: string
): TableData {
  return {
    columns: table.columns.map((col, i) =>
      i === colIndex ? { ...col, header: value } : col
    ),
    rows: table.rows,
  };
}

/**
 * 指定セルの値を更新する（イミュータブル）
 * @param table 元のテーブルデータ
 * @param rowIndex 更新する行のインデックス
 * @param colIndex 更新する列のインデックス
 * @param value 新しいセル値
 * @returns セルが更新された新しいTableData
 */
export function updateCell(
  table: TableData,
  rowIndex: number,
  colIndex: number,
  value: string
): TableData {
  return {
    columns: table.columns,
    rows: table.rows.map((row, ri) =>
      ri === rowIndex
        ? row.map((cell, ci) => (ci === colIndex ? value : cell))
        : row
    ),
  };
}
