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
    Array.from({ length: cols }, () => ""),
  );
  return { columns, rows: dataRows };
}

/**
 * セル内の | をエスケープし、改行を同じMarkdown行内のbrへ変換する
 * @param cell エスケープするセルの文字列
 * @returns エスケープ済み文字列
 */
function escapeCell(cell: string): string {
  return cell
    .replace(/\|/g, "\\|")
    .replace(/\\+|\r\n|\r|\n/g, (token: string, offset: number, text: string) => {
      if (token[0] !== "\\") return "<br>";
      // 挿入するHTMLタグが直前のbackslashでMarkdownエスケープされないようにする。
      // 改行直前だけは元のbackslash数も描画結果に保持する。他のMarkdown記法は維持する。
      // run自体を必ず消費し、改行のない長いrunで位置ごとの再探索を発生させない。
      const next = text[offset + token.length];
      return next === "\r" || next === "\n" ? token.repeat(2) : token;
    });
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
    "| " + columns.map((col, i) => escapeCell(col.header).padEnd(colWidths[i])).join(" | ") + " |";

  const separatorRow =
    "| " + columns.map((col, i) => buildSeparator(col.align, colWidths[i])).join(" | ") + " |";

  const dataRows = rows.map(
    (row) =>
      "| " +
      columns.map((_, i) => escapeCell(row[i] ?? "").padEnd(colWidths[i])).join(" | ") +
      " |",
  );

  return [headerRow, separatorRow, ...dataRows].join("\n");
}

/**
 * ヘッダーレコードの引用符外にあるタブでTSVを判定する。
 * データや引用符内のタブでCSVの列構造を変更しない。
 */
function detectTableDelimiter(csv: string): "," | "\t" {
  // 空白だけの物理行のタブは区切り文字の候補にしない。
  // 同じ行にヘッダーがあれば、先頭の空TSV列を含むタブは残す。
  const text = csv.replace(/^(?:[^\S\r\n]*(?:\r\n|\r|\n))+/, "");
  let quoted = false;
  let fieldStart = true;
  let recordStart = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') i++;
        else quoted = false;
      }
    } else if (ch === "\t") {
      return "\t";
    } else if (ch === "\n" || ch === "\r") {
      if (text.slice(recordStart, i).trim()) break;
      recordStart = i + 1;
      fieldStart = true;
    } else if (ch === ",") {
      fieldStart = true;
    } else if (ch === '"' && fieldStart) {
      quoted = true;
      fieldStart = false;
    } else if (ch.trim()) {
      fieldStart = false;
    }
  }
  return ",";
}

/**
 * CSVの引用符・エスケープ・複数行を扱い、不正な構文は位置付きで拒否する。
 * 引用符外の前後空白と空の物理行は従来どおり除去する。
 */
function parseTableCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let fields: string[] = [];
  let current = "";
  let state: "start" | "unquoted" | "quoted" | "closed" = "start";
  let recordStart = 0;
  const fail = (message: string): never => {
    throw new Error(`レコード ${records.length + 1}、列 ${fields.length + 1}: ${message}`);
  };
  const finishField = () => {
    fields.push(state === "closed" ? current : current.trim());
    current = "";
    state = "start";
  };
  const finishRecord = (end: number) => {
    // 引用符付き空文字や区切りのみのレコードは空行ではない。
    if (text.slice(recordStart, end).trim()) {
      finishField();
      records.push(fields);
    }
    fields = [];
    current = "";
    state = "start";
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (state === "quoted") {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else state = "closed";
      } else current += ch;
    } else if (ch === ",") {
      finishField();
    } else if (ch === "\r" || ch === "\n") {
      finishRecord(i);
      if (ch === "\r" && text[i + 1] === "\n") i++;
      recordStart = i + 1;
    } else if (state === "closed") {
      if (ch.trim()) fail("引用符を閉じた後は区切り文字または改行を指定してください");
    } else if (ch === '"') {
      if (state !== "start") fail("引用符を含む値全体をダブルクォートで囲んでください");
      current = "";
      state = "quoted";
    } else {
      current += ch;
      if (ch.trim()) state = "unquoted";
    }
  }
  if (state === "quoted") fail("ダブルクォートが閉じられていません");
  finishRecord(text.length);
  return records;
}

/**
 * TSVは同一セル内で閉じた引用符を文字として維持する。
 * 引用符付き改行・タブの疑いがある未閉じセルは、列へ分割して成功扱いしない。
 */
function parseTableTsvRecords(text: string): string[][] {
  return text
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim() !== "")
    .map((line, recordIndex) =>
      line.split("\t").map((cell, columnIndex) => {
        const value = cell.trim();
        if (value.startsWith('"')) {
          let closed = false;
          for (let i = 1; i < value.length; i++) {
            if (value[i] === '"') {
              if (value[i + 1] === '"') i++;
              else {
                closed = true;
                break;
              }
            }
          }
          if (!closed) {
            throw new Error(
              `レコード ${recordIndex + 1}、列 ${columnIndex + 1}: TSVの先頭の引用符は同じセル内で閉じてください。引用符付き改行・タブは未対応です。カンマ区切りのCSVとして入力してください`,
            );
          }
        }
        return value;
      }),
    );
}

/**
 * CSV/TSV文字列をTableDataに変換する
 * 空文字列はcreateEmptyTable(3, 2)を返す
 * ヘッダーの引用符外にタブがあれば従来の単純なTSVとして解析する
 * CSVは引用符内のカンマ・改行・二重引用符を保持する
 * 1行目をヘッダー、2行目以降をデータ行として扱う
 * 不足列は空文字で補完し、超過列と不正なCSV構文はエラーにする
 * @param csv パースするCSVまたはTSV文字列
 * @returns パース結果のTableData
 */
export function parseCSV(csv: string): TableData {
  if (!csv.trim()) return createEmptyTable(3, 2);

  const text = csv.startsWith("\uFEFF") ? csv.slice(1) : csv;
  const delimiter = detectTableDelimiter(text);
  const records = delimiter === "\t" ? parseTableTsvRecords(text) : parseTableCsvRecords(text);

  if (records.length === 0) return createEmptyTable(3, 2);

  const headers = records[0];
  const columns: TableColumn[] = headers.map((header) => ({
    header,
    align: "none" as AlignType,
  }));

  const dataRows: string[][] = records.slice(1).map((cells, index) => {
    if (cells.length > columns.length) {
      throw new Error(
        `レコード ${index + 2} はヘッダーより列数が多いためインポートできません（ヘッダー ${columns.length} 列、データ ${cells.length} 列）。ヘッダーまたは区切り文字を確認してください`,
      );
    }
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
    rows: [...table.rows, Array.from({ length: table.columns.length }, () => "")],
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
export function setColumnAlign(table: TableData, colIndex: number, align: AlignType): TableData {
  return {
    columns: table.columns.map((col, i) => (i === colIndex ? { ...col, align } : col)),
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
export function updateHeader(table: TableData, colIndex: number, value: string): TableData {
  return {
    columns: table.columns.map((col, i) => (i === colIndex ? { ...col, header: value } : col)),
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
  value: string,
): TableData {
  return {
    columns: table.columns,
    rows: table.rows.map((row, ri) =>
      ri === rowIndex ? row.map((cell, ci) => (ci === colIndex ? value : cell)) : row,
    ),
  };
}
