/**
 * SQL CREATE TABLE → TypeScript型変換ユーティリティ
 */

/**
 * TypeScript型生成のオプション
 */
export interface SqlToTsOptions {
  /** true=interface, false=type */
  useInterface: boolean;
  /** NULLABLEカラムをオプショナル（?）にする */
  nullableAsOptional: boolean;
  /** 日付型をDateオブジェクトとして扱う */
  dateAsDate: boolean;
}

/** 解析済みカラム情報 */
interface ColumnInfo {
  /** TypeScript用カラム名（camelCase） */
  name: string;
  /** TypeScript型 */
  tsType: string;
  /** NULL許容かどうか */
  isNullable: boolean;
}

/**
 * SQLの型名をTypeScriptの型に変換する
 * @param sqlType - SQLの型名（括弧付き可）
 * @param dateAsDate - trueなら日付型をDateとして扱う
 * @returns TypeScript型文字列
 */
function sqlTypeToTs(sqlType: string, dateAsDate: boolean): string {
  const upper = sqlType.toUpperCase().trim();
  const base = upper
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    /^(TEXT|VARCHAR|CHAR|NCHAR|NVARCHAR|CLOB|TINYTEXT|MEDIUMTEXT|LONGTEXT|CHARACTER VARYING|CHARACTER|STRING|CITEXT|NAME)$/.test(
      base
    )
  )
    return 'string';

  if (
    /^(INTEGER|INT|BIGINT|SMALLINT|TINYINT|MEDIUMINT|INT2|INT4|INT8|SERIAL|BIGSERIAL|SMALLSERIAL|NUMBER|OID|XID)$/.test(
      base
    )
  )
    return 'number';

  if (
    /^(REAL|DOUBLE|FLOAT|DECIMAL|NUMERIC|MONEY|DOUBLE PRECISION|FLOAT4|FLOAT8)$/.test(
      base
    )
  )
    return 'number';

  if (/^(BOOLEAN|BOOL|BIT)$/.test(base)) return 'boolean';

  if (/^(JSON|JSONB)$/.test(base)) return 'Record<string, unknown>';

  if (
    /^(TIMESTAMP|DATE|DATETIME|TIME|TIMESTAMPTZ|TIMETZ|TIMESTAMP WITH TIME ZONE|TIMESTAMP WITHOUT TIME ZONE|TIME WITH TIME ZONE)$/.test(
      base
    )
  )
    return dateAsDate ? 'Date' : 'string';

  if (
    /^(BLOB|BINARY|VARBINARY|BYTEA|LONGBLOB|MEDIUMBLOB|TINYBLOB)$/.test(base)
  )
    return 'Uint8Array';

  if (/^(UUID)$/.test(base)) return 'string';

  if (base.endsWith('[]') || /^(ARRAY)$/.test(base)) return 'unknown[]';

  return 'unknown';
}

/**
 * トップレベルのカンマで文字列を分割する（括弧内のカンマは無視）
 * @param str - 分割対象の文字列
 * @returns 分割された文字列配列
 */
function splitTopLevel(str: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';

  for (const ch of str) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

/**
 * スネークケース文字列をキャメルケースに変換する
 * @param str - 変換対象の文字列
 * @returns camelCaseに変換された文字列
 */
function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * テーブル名をPascalCaseに変換する
 * @param tableName - テーブル名
 * @returns PascalCaseに変換された文字列
 */
function toPascalCase(tableName: string): string {
  return tableName
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/**
 * 1つのカラム定義行を解析する
 * @param line - カラム定義文字列
 * @param dateAsDate - 日付型をDateとして扱うか
 * @returns ColumnInfoまたはnull（テーブル制約の場合）
 */
function parseColumn(line: string, dateAsDate: boolean): ColumnInfo | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // テーブル制約はスキップ
  if (
    /^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|INDEX|KEY|CHECK|CONSTRAINT)\b/i.test(
      trimmed
    )
  )
    return null;

  // カラム名を抽出（クォート付きまたは非クォート）
  const nameMatch = trimmed.match(
    /^`([^`]+)`|^"([^"]+)"|^\[([^\]]+)\]|^([a-zA-Z_]\w*)/
  );
  if (!nameMatch) return null;
  const rawName =
    nameMatch[1] ?? nameMatch[2] ?? nameMatch[3] ?? nameMatch[4];

  // カラム名以降を取得
  const rest = trimmed.slice(nameMatch[0].length).trim();

  // SQLの型を抽出（複合型に対応: DOUBLE PRECISION, CHARACTER VARYING, etc.）
  const typeMatch = rest.match(
    /^(DOUBLE\s+PRECISION|CHARACTER\s+VARYING|TIMESTAMP\s+(?:WITH(?:OUT)?\s+TIME\s+ZONE)|TIME\s+WITH\s+TIME\s+ZONE|[\w]+(?:\s*\([^)]*\))?(?:\[\])?)/i
  );
  if (!typeMatch) return null;
  const sqlType = typeMatch[1];

  // NOT NULL制約の確認
  const constraintsPart = rest.slice(typeMatch[0].length);
  const isNullable = !/\bNOT\s+NULL\b/i.test(constraintsPart);

  return {
    name: toCamelCase(rawName),
    tsType: sqlTypeToTs(sqlType, dateAsDate),
    isNullable,
  };
}

/**
 * SQL CREATE TABLE文を解析してTypeScriptの型定義を生成する
 * @param sql - SQL CREATE TABLE文
 * @param options - 生成オプション
 * @returns TypeScript型定義文字列
 * @throws {Error} 無効なSQL形式の場合
 */
export function generateTypeScript(sql: string, options: SqlToTsOptions): string {
  const { useInterface, nullableAsOptional, dateAsDate } = options;

  const trimmed = sql.trim();
  if (!trimmed) throw new Error('SQLを入力してください');

  const normalized = trimmed.replace(/\r\n/g, '\n');

  // テーブル名を抽出
  const tableNameMatch = normalized.match(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|(\w+))/i
  );
  if (!tableNameMatch) throw new Error('CREATE TABLE文が見つかりません');
  const rawTableName =
    tableNameMatch[1] ?? tableNameMatch[2] ?? tableNameMatch[3];

  const typeName = toPascalCase(rawTableName);

  // ボディを抽出（最初の(から最後の)まで）
  const bodyStart = normalized.indexOf('(');
  const bodyEnd = normalized.lastIndexOf(')');
  if (bodyStart === -1 || bodyEnd === -1)
    throw new Error('カラム定義が見つかりません');
  const body = normalized.slice(bodyStart + 1, bodyEnd);

  // カラム定義を分割・解析
  const parts = splitTopLevel(body);
  const columns: ColumnInfo[] = [];
  for (const part of parts) {
    const col = parseColumn(part.trim(), dateAsDate);
    if (col) columns.push(col);
  }

  if (columns.length === 0) throw new Error('カラムが見つかりません');

  // TypeScript型定義を生成
  const lines: string[] = [];

  if (useInterface) {
    lines.push(`interface ${typeName} {`);
  } else {
    lines.push(`type ${typeName} = {`);
  }

  for (const col of columns) {
    const optional = nullableAsOptional && col.isNullable ? '?' : '';
    const nullable = !nullableAsOptional && col.isNullable ? ' | null' : '';
    lines.push(`  ${col.name}${optional}: ${col.tsType}${nullable};`);
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * サンプルSQL CREATE TABLE文を返す
 * @returns サンプルSQL文字列
 */
export function getSampleSql(): string {
  return `CREATE TABLE users (
  id INTEGER NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email TEXT NOT NULL,
  age INTEGER,
  score DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL,
  metadata JSONB,
  avatar BYTEA,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);`;
}
