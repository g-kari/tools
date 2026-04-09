/**
 * SQLトークンの型定義
 */
export type SqlTokenType =
  | "keyword"
  | "identifier"
  | "quoted_identifier"
  | "string"
  | "number"
  | "operator"
  | "comma"
  | "semicolon"
  | "lparen"
  | "rparen"
  | "dot"
  | "line_comment"
  | "block_comment"
  | "unknown";

export interface SqlToken {
  type: SqlTokenType;
  value: string;
}

/** SQLキーワードセット */
const SQL_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "JOIN",
  "LEFT",
  "RIGHT",
  "INNER",
  "OUTER",
  "FULL",
  "CROSS",
  "ON",
  "AS",
  "GROUP",
  "BY",
  "ORDER",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
  "TABLE",
  "VIEW",
  "INDEX",
  "UNION",
  "EXCEPT",
  "INTERSECT",
  "ALL",
  "DISTINCT",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "NULL",
  "IS",
  "IN",
  "EXISTS",
  "LIKE",
  "BETWEEN",
  "ILIKE",
  "ASC",
  "DESC",
  "NULLS",
  "FIRST",
  "LAST",
  "PRIMARY",
  "KEY",
  "FOREIGN",
  "REFERENCES",
  "UNIQUE",
  "IF",
  "WITH",
  "RECURSIVE",
  "RETURNING",
  "USING",
  "TRUE",
  "FALSE",
  "DEFAULT",
  "CONSTRAINT",
  "NATURAL",
  "STRAIGHT_JOIN",
]);

/**
 * SQL文字列をトークンの配列に分解する。
 * @param sql - 解析対象のSQL文字列
 * @returns SqlTokenの配列
 */
export function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let i = 0;
  const len = sql.length;

  while (i < len) {
    const ch = sql[i];

    // 空白・改行をスキップ（消費するが保存しない）
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // ブロックコメント /* ... */
    if (sql.startsWith("/*", i)) {
      const end = sql.indexOf("*/", i + 2);
      if (end === -1) {
        throw new Error("ブロックコメントが閉じられていません");
      }
      tokens.push({ type: "block_comment", value: sql.slice(i, end + 2) });
      i = end + 2;
      continue;
    }

    // 行コメント -- ...
    if (sql.startsWith("--", i)) {
      const end = sql.indexOf("\n", i + 2);
      const lineEnd = end === -1 ? len : end;
      tokens.push({ type: "line_comment", value: sql.slice(i, lineEnd).trim() });
      i = end === -1 ? len : end + 1;
      continue;
    }

    // 行コメント # ... (MySQL)
    if (ch === "#") {
      const end = sql.indexOf("\n", i + 1);
      const lineEnd = end === -1 ? len : end;
      tokens.push({ type: "line_comment", value: sql.slice(i, lineEnd).trim() });
      i = end === -1 ? len : end + 1;
      continue;
    }

    // シングルクォート文字列
    if (ch === "'") {
      let j = i + 1;
      while (j < len) {
        if (sql[j] === "'" && sql[j - 1] !== "\\") {
          // エスケープされていないクォート
          if (sql[j + 1] === "'") {
            // SQL標準のエスケープ ''
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      if (j >= len) {
        throw new Error("文字列リテラルが閉じられていません");
      }
      tokens.push({ type: "string", value: sql.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // バッククォート識別子 (MySQL)
    if (ch === "`") {
      const end = sql.indexOf("`", i + 1);
      if (end === -1) {
        throw new Error("バッククォート識別子が閉じられていません");
      }
      tokens.push({ type: "quoted_identifier", value: sql.slice(i, end + 1) });
      i = end + 1;
      continue;
    }

    // ダブルクォート識別子 (PostgreSQL/標準SQL)
    if (ch === '"') {
      const end = sql.indexOf('"', i + 1);
      if (end === -1) {
        throw new Error("ダブルクォート識別子が閉じられていません");
      }
      tokens.push({ type: "quoted_identifier", value: sql.slice(i, end + 1) });
      i = end + 1;
      continue;
    }

    // 括弧
    if (ch === "(") {
      tokens.push({ type: "lparen", value: "(" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen", value: ")" });
      i++;
      continue;
    }

    // カンマ
    if (ch === ",") {
      tokens.push({ type: "comma", value: "," });
      i++;
      continue;
    }

    // セミコロン
    if (ch === ";") {
      tokens.push({ type: "semicolon", value: ";" });
      i++;
      continue;
    }

    // ドット
    if (ch === ".") {
      tokens.push({ type: "dot", value: "." });
      i++;
      continue;
    }

    // 数値
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(sql[i + 1] ?? ""))) {
      let j = i;
      while (j < len && /[0-9]/.test(sql[j])) j++;
      if (j < len && sql[j] === ".") {
        j++;
        while (j < len && /[0-9]/.test(sql[j])) j++;
      }
      // 指数表記
      if (j < len && /[eE]/.test(sql[j])) {
        j++;
        if (j < len && /[+-]/.test(sql[j])) j++;
        while (j < len && /[0-9]/.test(sql[j])) j++;
      }
      tokens.push({ type: "number", value: sql.slice(i, j) });
      i = j;
      continue;
    }

    // キーワードと識別子
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_$]/.test(sql[j])) j++;
      const word = sql.slice(i, j);
      const upper = word.toUpperCase();
      if (SQL_KEYWORDS.has(upper)) {
        tokens.push({ type: "keyword", value: upper });
      } else {
        tokens.push({ type: "identifier", value: word });
      }
      i = j;
      continue;
    }

    // 演算子
    if (/[<>=!+\-*/%|&^~]/.test(ch)) {
      // 複合演算子
      const two = sql.slice(i, i + 2);
      if (["<>", "<=", ">=", "!=", ":=", "||", "&&", "<<", ">>"].includes(two)) {
        tokens.push({ type: "operator", value: two });
        i += 2;
        continue;
      }
      tokens.push({ type: "operator", value: ch });
      i++;
      continue;
    }

    // コロン (PostgreSQL パラメータ等)
    if (ch === ":") {
      tokens.push({ type: "operator", value: ch });
      i++;
      continue;
    }

    // 不明文字
    tokens.push({ type: "unknown", value: ch });
    i++;
  }

  return tokens;
}

/** トップレベルで改行すべきキーワードシーケンス（長い順に並べて先にマッチさせる） */
const TOP_LEVEL_SEQUENCES: string[][] = [
  ["LEFT", "OUTER", "JOIN"],
  ["RIGHT", "OUTER", "JOIN"],
  ["FULL", "OUTER", "JOIN"],
  ["LEFT", "JOIN"],
  ["RIGHT", "JOIN"],
  ["INNER", "JOIN"],
  ["FULL", "JOIN"],
  ["CROSS", "JOIN"],
  ["NATURAL", "JOIN"],
  ["STRAIGHT_JOIN"],
  ["GROUP", "BY"],
  ["ORDER", "BY"],
  ["UNION", "ALL"],
  ["INSERT", "INTO"],
  ["DELETE", "FROM"],
  ["CREATE", "TABLE"],
  ["ALTER", "TABLE"],
  ["DROP", "TABLE"],
  ["SELECT"],
  ["FROM"],
  ["WHERE"],
  ["ON"],
  ["JOIN"],
  ["HAVING"],
  ["LIMIT"],
  ["OFFSET"],
  ["UNION"],
  ["EXCEPT"],
  ["INTERSECT"],
  ["SET"],
  ["VALUES"],
  ["UPDATE"],
  ["WITH"],
  ["RETURNING"],
];

/** WHERE 句内でインデントつき改行するキーワード */
const INDENT_KEYWORDS = new Set(["AND", "OR"]);

/**
 * SQLをフォーマット（整形）する。
 * @param sql - 整形対象のSQL文字列
 * @param indentSize - インデントのスペース数（デフォルト: 2）
 * @returns 整形されたSQL文字列
 * @throws {Error} SQL文字列が空の場合、またはSQL構文が不正な場合
 */
export function formatSql(sql: string, indentSize: number = 2): string {
  if (!sql.trim()) {
    throw new Error("SQL文字列が空です");
  }

  const tokens = tokenizeSql(sql);
  const indent = " ".repeat(indentSize);
  const lines: string[] = [];
  let currentLine = "";
  let depth = 0; // 括弧の深さ
  let i = 0;

  /**
   * 現在行をflushして次の行を開始する
   */
  function flushLine(nextPrefix: string = ""): void {
    const trimmed = currentLine.trimEnd();
    if (trimmed) {
      lines.push(trimmed);
    }
    currentLine = nextPrefix;
  }

  /**
   * 現在位置からtopLevelSequencesのいずれかにマッチするか確認する
   * @returns マッチしたシーケンスのキーワード配列、またはnull
   */
  function matchTopLevel(): string[] | null {
    if (depth > 0) return null;
    for (const seq of TOP_LEVEL_SEQUENCES) {
      let match = true;
      let offset = 0;
      let ki = 0;
      while (ki < seq.length) {
        // コメントや空白トークンをスキップ
        while (
          i + offset < tokens.length &&
          (tokens[i + offset].type === "line_comment" ||
            tokens[i + offset].type === "block_comment")
        ) {
          offset++;
        }
        if (i + offset >= tokens.length) {
          match = false;
          break;
        }
        const tok = tokens[i + offset];
        if (tok.type !== "keyword" || tok.value !== seq[ki]) {
          match = false;
          break;
        }
        offset++;
        ki++;
      }
      if (match) {
        return seq;
      }
    }
    return null;
  }

  while (i < tokens.length) {
    const token = tokens[i];

    // コメントはそのまま出力
    if (token.type === "line_comment" || token.type === "block_comment") {
      flushLine(currentLine.trimEnd() ? currentLine + " " : "");
      currentLine += token.value;
      i++;
      continue;
    }

    // セミコロン
    if (token.type === "semicolon") {
      currentLine += ";";
      flushLine("");
      i++;
      continue;
    }

    // トップレベルキーワードシーケンスのチェック
    const seq = matchTopLevel();
    if (seq) {
      flushLine("");
      currentLine = seq.join(" ");
      i += seq.length;
      continue;
    }

    // WHERE内でのAND/OR（depth=0の場合のみ）
    if (depth === 0 && token.type === "keyword" && INDENT_KEYWORDS.has(token.value)) {
      flushLine("");
      currentLine = indent + token.value;
      i++;
      continue;
    }

    // 括弧を開く
    if (token.type === "lparen") {
      depth++;
      currentLine += "(";
      i++;
      continue;
    }

    // 括弧を閉じる
    if (token.type === "rparen") {
      depth = Math.max(0, depth - 1);
      currentLine += ")";
      i++;
      continue;
    }

    // カンマ：depth=0では改行してインデント
    if (token.type === "comma") {
      if (depth === 0) {
        currentLine += ",";
        flushLine(indent);
      } else {
        currentLine += ", ";
      }
      i++;
      continue;
    }

    // ドット（テーブル.カラムの間はスペースなし）
    if (token.type === "dot") {
      currentLine += ".";
      i++;
      continue;
    }

    // 演算子はスペースで囲む
    if (token.type === "operator") {
      // 直前の文字がスペースでなければスペースを追加
      if (currentLine.length > 0 && !currentLine.endsWith(" ")) {
        currentLine += " ";
      }
      currentLine += token.value;
      // 次のトークンがドットでなければスペース
      const next = tokens[i + 1];
      if (next && next.type !== "dot" && next.type !== "rparen") {
        currentLine += " ";
      }
      i++;
      continue;
    }

    // その他のトークン（キーワード、識別子、文字列、数値）
    if (currentLine.length > 0 && !currentLine.endsWith(" ") && !currentLine.endsWith("(")) {
      currentLine += " ";
    }
    currentLine += token.value;
    i++;
  }

  // 最終行をflush
  flushLine("");

  return lines.join("\n");
}

/**
 * SQL文字列を圧縮（ミニファイ）する。改行・インデントを除去する。
 * @param sql - 圧縮対象のSQL文字列
 * @returns 圧縮されたSQL文字列
 * @throws {Error} SQL文字列が空の場合、またはSQL構文が不正な場合
 */
export function minifySql(sql: string): string {
  if (!sql.trim()) {
    throw new Error("SQL文字列が空です");
  }

  const tokens = tokenizeSql(sql);
  const parts: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : null;
    const next = i < tokens.length - 1 ? tokens[i + 1] : null;

    // コメントはスキップ
    if (token.type === "line_comment" || token.type === "block_comment") {
      continue;
    }

    // 括弧、カンマ、セミコロンの前後はスペース不要
    if (
      token.type === "lparen" ||
      token.type === "rparen" ||
      token.type === "comma" ||
      token.type === "semicolon" ||
      token.type === "dot"
    ) {
      // 直前のスペースを除去
      if (parts.length > 0 && parts[parts.length - 1] === " ") {
        parts.pop();
      }
      parts.push(token.value);
      continue;
    }

    // 次がドット、括弧閉じの場合はスペース不要
    const needsSpaceAfter =
      next &&
      next.type !== "dot" &&
      next.type !== "rparen" &&
      next.type !== "comma" &&
      next.type !== "semicolon";

    // 直前がドット、括弧開きの場合はスペース不要
    const needsSpaceBefore =
      prev &&
      prev.type !== "dot" &&
      prev.type !== "lparen" &&
      prev.type !== "line_comment" &&
      prev.type !== "block_comment";

    if (needsSpaceBefore && parts.length > 0 && parts[parts.length - 1] !== " ") {
      parts.push(" ");
    }

    parts.push(token.value);

    if (needsSpaceAfter) {
      parts.push(" ");
    }
  }

  return parts.join("").trim();
}

/**
 * SQL文字列の構文を基本的に検証する。
 * 括弧の対応と文字列リテラルの閉じを確認する。
 * @param sql - 検証対象のSQL文字列
 * @returns 検証結果オブジェクト。validがtrueなら有効、falseならerrorにエラーメッセージを含む
 */
export function validateSql(sql: string): { valid: boolean; error?: string } {
  if (!sql.trim()) {
    return { valid: false, error: "SQL文字列が空です" };
  }

  let tokens: SqlToken[];
  try {
    tokens = tokenizeSql(sql);
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "SQL解析エラーが発生しました",
    };
  }

  // 括弧の対応チェック
  let depth = 0;
  for (const token of tokens) {
    if (token.type === "lparen") depth++;
    if (token.type === "rparen") {
      depth--;
      if (depth < 0) {
        return { valid: false, error: "対応する開き括弧のない閉じ括弧があります" };
      }
    }
  }
  if (depth > 0) {
    return { valid: false, error: `閉じられていない括弧が ${depth} 個あります` };
  }

  // 基本的なSQL構造チェック（DML/DDLの先頭キーワード確認）
  const firstKeyword = tokens.find((t) => t.type === "keyword");
  const validStartKeywords = new Set([
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "ALTER",
    "DROP",
    "WITH",
    "EXPLAIN",
    "SHOW",
    "DESCRIBE",
    "BEGIN",
    "COMMIT",
    "ROLLBACK",
    "GRANT",
    "REVOKE",
  ]);

  if (firstKeyword && !validStartKeywords.has(firstKeyword.value)) {
    return {
      valid: false,
      error: `SQLの開始キーワードが不正です: ${firstKeyword.value}`,
    };
  }

  return { valid: true };
}
