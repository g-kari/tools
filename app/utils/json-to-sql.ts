/**
 * JSON→SQL CREATE TABLE ジェネレーターユーティリティ
 */

/**
 * サポートするSQLダイアレクト
 */
export type SqlDialect = "postgresql" | "mysql" | "sqlite";

/**
 * SQL生成のオプション
 */
export interface JsonToSqlOptions {
  /** テーブル名（デフォルト: "my_table"） */
  tableName: string;
  /** SQLダイアレクト */
  dialect: SqlDialect;
  /** true=null以外のカラムにNOT NULLを付与する */
  notNull: boolean;
  /** true=idカラム（PRIMARY KEY）を先頭に追加する */
  addId: boolean;
}

/**
 * JSON値からSQLの型名を推論する
 * @param value - 型を推論する対象の値
 * @param dialect - SQLダイアレクト
 * @param isNull - null値かどうか
 * @returns SQL型名文字列
 */
function inferSqlType(
  value: unknown,
  dialect: SqlDialect,
  isNull: boolean
): string {
  if (isNull || value === null) {
    return dialect === "postgresql" ? "TEXT" : "TEXT";
  }

  if (typeof value === "string") {
    switch (dialect) {
      case "postgresql":
        return "TEXT";
      case "mysql":
        return "VARCHAR(255)";
      case "sqlite":
        return "TEXT";
    }
  }

  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      switch (dialect) {
        case "postgresql":
          return "INTEGER";
        case "mysql":
          return "INT";
        case "sqlite":
          return "INTEGER";
      }
    } else {
      switch (dialect) {
        case "postgresql":
          return "DOUBLE PRECISION";
        case "mysql":
          return "DOUBLE";
        case "sqlite":
          return "REAL";
      }
    }
  }

  if (typeof value === "boolean") {
    switch (dialect) {
      case "postgresql":
        return "BOOLEAN";
      case "mysql":
        return "TINYINT(1)";
      case "sqlite":
        return "INTEGER";
    }
  }

  // オブジェクト・配列はJSON型またはTEXTで格納
  if (typeof value === "object") {
    switch (dialect) {
      case "postgresql":
        return "JSONB";
      case "mysql":
        return "JSON";
      case "sqlite":
        return "TEXT";
    }
  }

  return "TEXT";
}

/**
 * キャメルケース/混在大文字のキーをスネークケースに変換する
 * @param key - 変換対象のキー文字列
 * @returns スネークケース文字列
 */
function toSnakeCase(key: string): string {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
}

/**
 * カラム名をダイアレクトに合わせてクォートする
 * @param name - カラム名
 * @param dialect - SQLダイアレクト
 * @returns クォートされたカラム名
 */
function quoteIdentifier(name: string, dialect: SqlDialect): string {
  if (dialect === "mysql") {
    return `\`${name}\``;
  }
  // PostgreSQL・SQLiteはダブルクォート
  return `"${name}"`;
}

/**
 * AUTO INCREMENT構文をダイアレクト別に返す
 * @param dialect - SQLダイアレクト
 * @returns PRIMARY KEY定義文字列
 */
function buildIdColumn(dialect: SqlDialect): string {
  switch (dialect) {
    case "postgresql":
      return `  "id" SERIAL PRIMARY KEY`;
    case "mysql":
      return `  \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY`;
    case "sqlite":
      return `  "id" INTEGER PRIMARY KEY AUTOINCREMENT`;
  }
}

/**
 * JSON文字列からSQL CREATE TABLE文を生成する
 * @param json - 変換対象のJSON文字列
 * @param options - SQL生成オプション
 * @returns SQL CREATE TABLE文字列
 * @throws {Error} 空文字列または無効なJSON形式の場合にエラーをスローする
 */
export function generateSqlCreateTable(
  json: string,
  options: JsonToSqlOptions
): string {
  if (!json.trim()) {
    throw new Error("JSONを入力してください");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("無効なJSON形式です");
  }

  // ルートが配列の場合は最初の要素を使用
  const rootValue = Array.isArray(parsed)
    ? parsed.length > 0
      ? parsed[0]
      : {}
    : parsed;

  if (typeof rootValue !== "object" || rootValue === null) {
    throw new Error(
      "JSONのルートはオブジェクト（{}）または配列（[{}]）である必要があります"
    );
  }

  const obj = rootValue as Record<string, unknown>;
  const tableName = (options.tableName || "my_table").replace(
    /[^a-zA-Z0-9_]/g,
    "_"
  );
  const { dialect, notNull, addId } = options;

  const columnLines: string[] = [];

  if (addId) {
    columnLines.push(buildIdColumn(dialect));
  }

  for (const [key, value] of Object.entries(obj)) {
    const colName = toSnakeCase(key);
    const quotedCol = quoteIdentifier(colName, dialect);
    const isNull = value === null;
    const sqlType = inferSqlType(value, dialect, isNull);

    let colDef = `  ${quotedCol} ${sqlType}`;

    if (notNull && !isNull) {
      colDef += " NOT NULL";
    }

    columnLines.push(colDef);
  }

  const dialectComment: Record<SqlDialect, string> = {
    postgresql: "-- PostgreSQL",
    mysql: "-- MySQL",
    sqlite: "-- SQLite",
  };

  const tableIdent =
    dialect === "mysql" ? `\`${tableName}\`` : `"${tableName}"`;

  const lines = [
    `${dialectComment[dialect]}`,
    `CREATE TABLE ${tableIdent} (`,
    columnLines.join(",\n"),
    ");",
  ];

  return lines.join("\n");
}

/**
 * JSON→SQL生成のデモ用サンプルJSONを返す
 * 各種型を含む複合オブジェクト
 * @returns サンプルJSON文字列
 */
export function getSampleJson(): string {
  const sample = {
    id: 1,
    userName: "山田太郎",
    email: "yamada@example.com",
    age: 25,
    score: 98.5,
    isActive: true,
    bio: null,
    createdAt: "2024-01-01T00:00:00Z",
    metadata: { role: "admin" },
    tags: ["developer", "typescript"],
  };
  return JSON.stringify(sample, null, 2);
}
