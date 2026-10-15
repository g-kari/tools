/**
 * CSV → SQL INSERT文ジェネレーター ユーティリティ
 *
 * CSVデータを解析し、各種SQLダイアレクト向けのINSERT文を生成します。
 */

/** SQLダイアレクト */
export type SqlDialect = "mysql" | "postgresql" | "sqlite" | "sqlserver";

/** NULL として扱う文字列のセット */
const NULL_LITERALS = new Set(["null", "NULL", "nil", "NIL", "", "N/A", "n/a", "NA", "na"]);

/** 数値パターン */
const NUMBER_RE = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;

/** ブーリアン文字列 */
const BOOL_TRUE = new Set(["true", "TRUE", "True", "1", "yes", "YES", "Yes"]);
const BOOL_FALSE = new Set(["false", "FALSE", "False", "0", "no", "NO", "No"]);

/** CSV 生成オプション */
export interface CsvSqlOptions {
  /** テーブル名 */
  tableName: string;
  /** SQLダイアレクト */
  dialect: SqlDialect;
  /** NULL 変換を有効にするか */
  convertNull: boolean;
  /** 数値を自動検出してクォートを省略するか */
  detectNumbers: boolean;
  /** ブーリアンを自動検出するか */
  detectBooleans: boolean;
  /** バッチINSERT（複数行を一つのINSERTにまとめる）のバッチサイズ（1 = 個別） */
  batchSize: number;
  /** ヘッダー行を含むか */
  hasHeader: boolean;
}

/** デフォルトオプション */
export const DEFAULT_OPTIONS: CsvSqlOptions = {
  tableName: "my_table",
  dialect: "mysql",
  convertNull: true,
  detectNumbers: true,
  detectBooleans: false,
  batchSize: 1,
  hasHeader: true,
};

/** CSV パース結果 */
export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
}

/** SQL 生成結果 */
export interface SqlResult {
  sql: string;
  rowCount: number;
  columnCount: number;
  statementCount: number;
}

/** エラー */
export interface CsvSqlError {
  type: "parse" | "generate";
  message: string;
}

/**
 * CSVテキストを行・フィールド配列に解析します。
 * RFC 4180 準拠（ダブルクォートエスケープ対応）。
 */
export function parseCsv(csv: string): ParsedCsv | CsvSqlError {
  const trimmed = csv.trim();
  if (!trimmed) {
    return { type: "parse", message: "CSV データが空です。" };
  }

  const rows: string[][] = [];
  let i = 0;

  while (i < trimmed.length) {
    const row: string[] = [];
    while (i < trimmed.length) {
      // クォートフィールド
      if (trimmed[i] === '"') {
        i++; // 開始クォートをスキップ
        let field = "";
        let closed = false;
        while (i < trimmed.length) {
          if (trimmed[i] === '"') {
            if (trimmed[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++; // 終了クォートをスキップ
              closed = true;
              break;
            }
          } else {
            field += trimmed[i++];
          }
        }
        if (!closed) {
          return {
            type: "parse",
            message: `CSV の${rows.length + 1}番目のレコードの${row.length + 1}列目: 引用符が閉じていません。`,
          };
        }
        if (
          i < trimmed.length &&
          trimmed[i] !== "," &&
          trimmed[i] !== "\r" &&
          trimmed[i] !== "\n"
        ) {
          return {
            type: "parse",
            message: `CSV の${rows.length + 1}番目のレコードの${row.length + 1}列目: 閉じた引用符の後にはカンマまたは改行を置いてください。`,
          };
        }
        row.push(field);
      } else {
        // 非クォートフィールド（カンマまたは改行まで）
        let field = "";
        while (
          i < trimmed.length &&
          trimmed[i] !== "," &&
          trimmed[i] !== "\n" &&
          trimmed[i] !== "\r"
        ) {
          if (trimmed[i] === '"') {
            return {
              type: "parse",
              message: `CSV の${rows.length + 1}番目のレコードの${row.length + 1}列目: 引用符を含む値は全体を引用符で囲み、内部の引用符を二重にしてください。`,
            };
          }
          field += trimmed[i++];
        }
        row.push(field);
      }

      // 区切り文字の処理
      if (i < trimmed.length && trimmed[i] === ",") {
        i++; // カンマをスキップして次のフィールドへ
        // 最終カンマの後にも空セルがある。EOF で内側のループを抜ける前に保持する。
        if (i === trimmed.length) row.push("");
      } else {
        break; // 行末
      }
    }

    // 改行をスキップ
    if (i < trimmed.length && trimmed[i] === "\r") i++;
    if (i < trimmed.length && trimmed[i] === "\n") i++;

    if (row.length > 0) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return { type: "parse", message: "CSV データを解析できませんでした。" };
  }

  const columnCount = rows[0].length;
  const headers = rows[0];

  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount,
  };
}

/**
 * ダイアレクトに応じた識別子クォートを返します。
 */
function quoteIdentifier(name: string, dialect: SqlDialect): string {
  switch (dialect) {
    case "mysql":
      return "`" + name.replace(/`/g, "``") + "`";
    case "sqlserver":
      return "[" + name.replace(/]/g, "]]") + "]";
    default:
      // postgresql, sqlite は二重引用符
      return '"' + name.replace(/"/g, '""') + '"';
  }
}

/**
 * 値を SQL リテラルに変換します。
 */
function toSqlLiteral(value: string, options: CsvSqlOptions, dialect: SqlDialect): string {
  // NULL 変換
  if (options.convertNull && NULL_LITERALS.has(value)) {
    return "NULL";
  }

  // 数値検出
  if (options.detectNumbers && NUMBER_RE.test(value.trim())) {
    return value.trim();
  }

  // ブーリアン検出
  if (options.detectBooleans) {
    if (BOOL_TRUE.has(value)) {
      return dialect === "mysql" ? "1" : "TRUE";
    }
    if (BOOL_FALSE.has(value)) {
      return dialect === "mysql" ? "0" : "FALSE";
    }
  }

  // 文字列：シングルクォートエスケープ
  const escaped = value.replace(/'/g, "''");
  return `'${escaped}'`;
}

/**
 * CSV データから SQL INSERT 文を生成します。
 * 最初のレコードより列が多い場合はエラー、不足列は NULL で補完します。
 */
export function generateSql(csv: string, options: CsvSqlOptions): SqlResult | CsvSqlError {
  const parsed = parseCsv(csv);
  if ("type" in parsed) return parsed;

  const { headers, rows, columnCount } = parsed;

  if (!options.tableName.trim()) {
    return { type: "generate", message: "テーブル名を入力してください。" };
  }

  const dataRows = options.hasHeader ? rows.slice(1) : rows;

  if (dataRows.length === 0) {
    return { type: "generate", message: "データ行がありません。ヘッダー行のみが含まれています。" };
  }

  // SQL を組み立てる前に全レコードを検証し、余分なセルの切り捨てを防ぐ。
  const extraColumnIndex = dataRows.findIndex((row) => row.length > columnCount);
  if (extraColumnIndex !== -1) {
    const recordNumber = extraColumnIndex + (options.hasHeader ? 2 : 1);
    return {
      type: "generate",
      message: `CSV の${recordNumber}番目のレコードは${dataRows[extraColumnIndex].length}列あります。1番目のレコードに合わせて${columnCount}列以内にしてください。`,
    };
  }

  const { dialect, batchSize } = options;
  const table = quoteIdentifier(options.tableName.trim(), dialect);

  // カラム名リスト
  const columnNames = options.hasHeader
    ? headers.map((h) => quoteIdentifier(h.trim() || `col${headers.indexOf(h) + 1}`, dialect))
    : Array.from({ length: columnCount }, (_, i) => quoteIdentifier(`col${i + 1}`, dialect));

  const columnList = `(${columnNames.join(", ")})`;

  const statements: string[] = [];
  const effectiveBatch = Math.max(1, batchSize);

  for (let i = 0; i < dataRows.length; i += effectiveBatch) {
    const batch = dataRows.slice(i, i + effectiveBatch);

    if (effectiveBatch === 1) {
      // 個別 INSERT
      const row = batch[0];
      const values = row.map((v) => toSqlLiteral(v, options, dialect)).join(", ");
      // 列数が足りない場合は NULL で埋める
      const missing = columnCount - row.length;
      const nullPad = missing > 0 ? ", " + Array(missing).fill("NULL").join(", ") : "";
      statements.push(`INSERT INTO ${table} ${columnList}\nVALUES (${values}${nullPad});`);
    } else {
      // バッチ INSERT
      const valuesList = batch.map((row) => {
        const values = row.map((v) => toSqlLiteral(v, options, dialect)).join(", ");
        const missing = columnCount - row.length;
        const nullPad = missing > 0 ? ", " + Array(missing).fill("NULL").join(", ") : "";
        return `  (${values}${nullPad})`;
      });
      statements.push(`INSERT INTO ${table} ${columnList}\nVALUES\n${valuesList.join(",\n")};`);
    }
  }

  const sql = statements.join("\n\n");

  return {
    sql,
    rowCount: dataRows.length,
    columnCount,
    statementCount: statements.length,
  };
}

/**
 * 型のガード: CsvSqlError かどうかを判定します。
 */
export function isCsvSqlError(result: SqlResult | CsvSqlError | ParsedCsv): result is CsvSqlError {
  return (
    "type" in result &&
    ("parse" === (result as CsvSqlError).type || "generate" === (result as CsvSqlError).type)
  );
}
