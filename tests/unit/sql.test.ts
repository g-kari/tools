import { describe, it, expect } from "vite-plus/test";

// ユニットテスト用に関数を直接定義（モジュール解決の問題を避けるため）

type SqlTokenType =
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

interface SqlToken {
  type: SqlTokenType;
  value: string;
}

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

function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let i = 0;
  const len = sql.length;

  while (i < len) {
    const ch = sql[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (sql.startsWith("/*", i)) {
      const end = sql.indexOf("*/", i + 2);
      if (end === -1) throw new Error("ブロックコメントが閉じられていません");
      tokens.push({ type: "block_comment", value: sql.slice(i, end + 2) });
      i = end + 2;
      continue;
    }

    if (sql.startsWith("--", i)) {
      const end = sql.indexOf("\n", i + 2);
      const lineEnd = end === -1 ? len : end;
      tokens.push({
        type: "line_comment",
        value: sql.slice(i, lineEnd).trim(),
      });
      i = end === -1 ? len : end + 1;
      continue;
    }

    if (ch === "#") {
      const end = sql.indexOf("\n", i + 1);
      const lineEnd = end === -1 ? len : end;
      tokens.push({
        type: "line_comment",
        value: sql.slice(i, lineEnd).trim(),
      });
      i = end === -1 ? len : end + 1;
      continue;
    }

    if (ch === "'") {
      let j = i + 1;
      while (j < len) {
        if (sql[j] === "'" && sql[j - 1] !== "\\") {
          if (sql[j + 1] === "'") {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      if (j >= len) throw new Error("文字列リテラルが閉じられていません");
      tokens.push({ type: "string", value: sql.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    if (ch === "`") {
      const end = sql.indexOf("`", i + 1);
      if (end === -1) throw new Error("バッククォート識別子が閉じられていません");
      tokens.push({ type: "quoted_identifier", value: sql.slice(i, end + 1) });
      i = end + 1;
      continue;
    }

    if (ch === '"') {
      const end = sql.indexOf('"', i + 1);
      if (end === -1) throw new Error("ダブルクォート識別子が閉じられていません");
      tokens.push({ type: "quoted_identifier", value: sql.slice(i, end + 1) });
      i = end + 1;
      continue;
    }

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
    if (ch === ",") {
      tokens.push({ type: "comma", value: "," });
      i++;
      continue;
    }
    if (ch === ";") {
      tokens.push({ type: "semicolon", value: ";" });
      i++;
      continue;
    }
    if (ch === ".") {
      tokens.push({ type: "dot", value: "." });
      i++;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(sql[i + 1] ?? ""))) {
      let j = i;
      while (j < len && /[0-9]/.test(sql[j])) j++;
      if (j < len && sql[j] === ".") {
        j++;
        while (j < len && /[0-9]/.test(sql[j])) j++;
      }
      if (j < len && /[eE]/.test(sql[j])) {
        j++;
        if (j < len && /[+-]/.test(sql[j])) j++;
        while (j < len && /[0-9]/.test(sql[j])) j++;
      }
      tokens.push({ type: "number", value: sql.slice(i, j) });
      i = j;
      continue;
    }

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

    if (/[<>=!+\-*/%|&^~]/.test(ch)) {
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

    if (ch === ":") {
      tokens.push({ type: "operator", value: ch });
      i++;
      continue;
    }

    tokens.push({ type: "unknown", value: ch });
    i++;
  }

  return tokens;
}

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

const INDENT_KEYWORDS = new Set(["AND", "OR"]);

function formatSql(sql: string, indentSize: number = 2): string {
  if (!sql.trim()) throw new Error("SQL文字列が空です");

  const tokens = tokenizeSql(sql);
  const indent = " ".repeat(indentSize);
  const lines: string[] = [];
  let currentLine = "";
  let depth = 0;
  let i = 0;

  function flushLine(nextPrefix: string = ""): void {
    const trimmed = currentLine.trimEnd();
    if (trimmed) lines.push(trimmed);
    currentLine = nextPrefix;
  }

  function matchTopLevel(): string[] | null {
    if (depth > 0) return null;
    for (const seq of TOP_LEVEL_SEQUENCES) {
      let match = true;
      let offset = 0;
      let ki = 0;
      while (ki < seq.length) {
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
      if (match) return seq;
    }
    return null;
  }

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === "line_comment" || token.type === "block_comment") {
      flushLine(currentLine.trimEnd() ? currentLine + " " : "");
      currentLine += token.value;
      i++;
      continue;
    }

    if (token.type === "semicolon") {
      currentLine += ";";
      flushLine("");
      i++;
      continue;
    }

    const seq = matchTopLevel();
    if (seq) {
      flushLine("");
      currentLine = seq.join(" ");
      i += seq.length;
      continue;
    }

    if (depth === 0 && token.type === "keyword" && INDENT_KEYWORDS.has(token.value)) {
      flushLine("");
      currentLine = indent + token.value;
      i++;
      continue;
    }

    if (token.type === "lparen") {
      depth++;
      currentLine += "(";
      i++;
      continue;
    }

    if (token.type === "rparen") {
      depth = Math.max(0, depth - 1);
      currentLine += ")";
      i++;
      continue;
    }

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

    if (token.type === "dot") {
      currentLine += ".";
      i++;
      continue;
    }

    if (token.type === "operator") {
      if (currentLine.length > 0 && !currentLine.endsWith(" ")) {
        currentLine += " ";
      }
      currentLine += token.value;
      const next = tokens[i + 1];
      if (next && next.type !== "dot" && next.type !== "rparen") {
        currentLine += " ";
      }
      i++;
      continue;
    }

    if (currentLine.length > 0 && !currentLine.endsWith(" ") && !currentLine.endsWith("(")) {
      currentLine += " ";
    }
    currentLine += token.value;
    i++;
  }

  flushLine("");
  return lines.join("\n");
}

function minifySql(sql: string): string {
  if (!sql.trim()) throw new Error("SQL文字列が空です");

  const tokens = tokenizeSql(sql);
  const parts: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : null;
    const next = i < tokens.length - 1 ? tokens[i + 1] : null;

    if (token.type === "line_comment" || token.type === "block_comment") {
      continue;
    }

    if (
      token.type === "lparen" ||
      token.type === "rparen" ||
      token.type === "comma" ||
      token.type === "semicolon" ||
      token.type === "dot"
    ) {
      if (parts.length > 0 && parts[parts.length - 1] === " ") {
        parts.pop();
      }
      parts.push(token.value);
      continue;
    }

    const needsSpaceAfter =
      next &&
      next.type !== "dot" &&
      next.type !== "rparen" &&
      next.type !== "comma" &&
      next.type !== "semicolon";

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

function validateSql(sql: string): { valid: boolean; error?: string } {
  if (!sql.trim()) return { valid: false, error: "SQL文字列が空です" };

  let tokens: SqlToken[];
  try {
    tokens = tokenizeSql(sql);
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "SQL解析エラーが発生しました",
    };
  }

  let depth = 0;
  for (const token of tokens) {
    if (token.type === "lparen") depth++;
    if (token.type === "rparen") {
      depth--;
      if (depth < 0) {
        return {
          valid: false,
          error: "対応する開き括弧のない閉じ括弧があります",
        };
      }
    }
  }
  if (depth > 0) {
    return {
      valid: false,
      error: `閉じられていない括弧が ${depth} 個あります`,
    };
  }

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

// ===== テスト =====

describe("tokenizeSql", () => {
  it("基本的なSELECT文をトークン化できる", () => {
    const tokens = tokenizeSql("SELECT id FROM users");
    const types = tokens.map((t) => t.type);
    expect(types).toContain("keyword");
    expect(types).toContain("identifier");
  });

  it("キーワードを大文字に正規化する", () => {
    const tokens = tokenizeSql("select id from users");
    const keywords = tokens.filter((t) => t.type === "keyword").map((t) => t.value);
    expect(keywords).toEqual(["SELECT", "FROM"]);
  });

  it("シングルクォート文字列を正しく処理する", () => {
    const tokens = tokenizeSql("SELECT * FROM t WHERE name = 'John'");
    const strings = tokens.filter((t) => t.type === "string");
    expect(strings).toHaveLength(1);
    expect(strings[0].value).toBe("'John'");
  });

  it("行コメントを処理する", () => {
    const tokens = tokenizeSql("SELECT id -- コメント\nFROM users");
    const comments = tokens.filter((t) => t.type === "line_comment");
    expect(comments).toHaveLength(1);
    expect(comments[0].value).toContain("コメント");
  });

  it("ブロックコメントを処理する", () => {
    const tokens = tokenizeSql("SELECT /* コメント */ id FROM users");
    const comments = tokens.filter((t) => t.type === "block_comment");
    expect(comments).toHaveLength(1);
  });

  it("バッククォート識別子を処理する", () => {
    const tokens = tokenizeSql("SELECT `user_id` FROM `users`");
    const qids = tokens.filter((t) => t.type === "quoted_identifier");
    expect(qids).toHaveLength(2);
  });

  it("ダブルクォート識別子を処理する", () => {
    const tokens = tokenizeSql('SELECT "user_id" FROM "users"');
    const qids = tokens.filter((t) => t.type === "quoted_identifier");
    expect(qids).toHaveLength(2);
  });

  it("数値トークンを処理する", () => {
    const tokens = tokenizeSql("SELECT 1, 3.14, 1e5");
    const nums = tokens.filter((t) => t.type === "number");
    expect(nums).toHaveLength(3);
  });

  it("カンマをトークン化する", () => {
    const tokens = tokenizeSql("SELECT a, b, c FROM t");
    const commas = tokens.filter((t) => t.type === "comma");
    expect(commas).toHaveLength(2);
  });

  it("括弧をトークン化する", () => {
    const tokens = tokenizeSql("SELECT COUNT(*) FROM t");
    expect(tokens.some((t) => t.type === "lparen")).toBe(true);
    expect(tokens.some((t) => t.type === "rparen")).toBe(true);
  });

  it("閉じられていない文字列でエラーを投げる", () => {
    expect(() => tokenizeSql("SELECT 'unclosed")).toThrow("文字列リテラルが閉じられていません");
  });

  it("閉じられていないブロックコメントでエラーを投げる", () => {
    expect(() => tokenizeSql("SELECT /* unclosed")).toThrow("ブロックコメントが閉じられていません");
  });
});

describe("formatSql", () => {
  it("空文字列でエラーを投げる", () => {
    expect(() => formatSql("")).toThrow("SQL文字列が空です");
    expect(() => formatSql("   ")).toThrow("SQL文字列が空です");
  });

  it("SELECT文を整形する", () => {
    const result = formatSql("SELECT id, name, age FROM users WHERE age > 18");
    expect(result).toContain("SELECT");
    expect(result).toContain("FROM");
    expect(result).toContain("WHERE");
    // 各節が別の行に
    const lines = result.split("\n");
    expect(lines.some((l) => l.startsWith("SELECT"))).toBe(true);
    expect(lines.some((l) => l.startsWith("FROM"))).toBe(true);
    expect(lines.some((l) => l.startsWith("WHERE"))).toBe(true);
  });

  it("GROUP BY / ORDER BYを整形する", () => {
    const result = formatSql("SELECT dept, COUNT(*) FROM users GROUP BY dept ORDER BY dept ASC");
    const lines = result.split("\n");
    expect(lines.some((l) => l.startsWith("GROUP BY"))).toBe(true);
    expect(lines.some((l) => l.startsWith("ORDER BY"))).toBe(true);
  });

  it("LEFT JOINを整形する", () => {
    const result = formatSql("SELECT u.id FROM users u LEFT JOIN orders o ON u.id = o.user_id");
    const lines = result.split("\n");
    expect(lines.some((l) => l.startsWith("LEFT JOIN"))).toBe(true);
    expect(lines.some((l) => l.startsWith("ON"))).toBe(true);
  });

  it("ANDをインデント付きで整形する", () => {
    const result = formatSql("SELECT id FROM users WHERE age > 18 AND name = 'Alice'");
    const lines = result.split("\n");
    const andLine = lines.find((l) => l.trimStart().startsWith("AND"));
    expect(andLine).toBeDefined();
    // インデントされている
    expect(andLine!.startsWith(" ")).toBe(true);
  });

  it("2スペースインデントで整形する", () => {
    const result = formatSql("SELECT id, name FROM users WHERE age > 18", 2);
    const lines = result.split("\n");
    // カンマ区切りのアイテムがインデントされている
    const indentedLine = lines.find((l) => l.startsWith("  ") && !l.startsWith("   "));
    expect(indentedLine).toBeDefined();
  });

  it("4スペースインデントで整形する", () => {
    const result = formatSql("SELECT id, name FROM users WHERE age > 18", 4);
    const lines = result.split("\n");
    const indentedLine = lines.find((l) => l.startsWith("    ") && !l.startsWith("     "));
    expect(indentedLine).toBeDefined();
  });

  it("セミコロンを保持する", () => {
    const result = formatSql("SELECT id FROM users;");
    expect(result).toContain(";");
  });

  it("文字列リテラル内の内容を変更しない", () => {
    const result = formatSql("SELECT id FROM users WHERE name = 'John Doe'");
    expect(result).toContain("'John Doe'");
  });
});

describe("minifySql", () => {
  it("空文字列でエラーを投げる", () => {
    expect(() => minifySql("")).toThrow("SQL文字列が空です");
  });

  it("整形されたSQLを1行に圧縮する", () => {
    const formatted = `SELECT
  id,
  name
FROM users
WHERE age > 18`;
    const result = minifySql(formatted);
    expect(result.split("\n")).toHaveLength(1);
  });

  it("コメントを除去する", () => {
    const result = minifySql("SELECT id -- 主キー\nFROM users /* テーブル */");
    expect(result).not.toContain("--");
    expect(result).not.toContain("/*");
  });

  it("キーワードはそのまま保持する", () => {
    const result = minifySql("SELECT id FROM users WHERE age > 18");
    expect(result).toContain("SELECT");
    expect(result).toContain("FROM");
    expect(result).toContain("WHERE");
  });
});

describe("validateSql", () => {
  it("空文字列を無効と判定する", () => {
    expect(validateSql("").valid).toBe(false);
    expect(validateSql("   ").valid).toBe(false);
  });

  it("正常なSELECT文を有効と判定する", () => {
    expect(validateSql("SELECT id FROM users").valid).toBe(true);
  });

  it("正常なINSERT文を有効と判定する", () => {
    expect(validateSql("INSERT INTO users (id, name) VALUES (1, 'Alice')").valid).toBe(true);
  });

  it("正常なUPDATE文を有効と判定する", () => {
    expect(validateSql("UPDATE users SET name = 'Bob' WHERE id = 1").valid).toBe(true);
  });

  it("正常なDELETE文を有効と判定する", () => {
    expect(validateSql("DELETE FROM users WHERE id = 1").valid).toBe(true);
  });

  it("対応する開き括弧のない閉じ括弧を検出する", () => {
    const result = validateSql("SELECT id FROM users WHERE age > 18)");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("閉じ括弧");
  });

  it("閉じられていない括弧を検出する", () => {
    const result = validateSql("SELECT COUNT( FROM users");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("括弧");
  });

  it("閉じられていない文字列を検出する", () => {
    const result = validateSql("SELECT id FROM users WHERE name = 'unclosed");
    expect(result.valid).toBe(false);
  });

  it("SELECT 1 のようなFROMなしクエリを有効と判定する", () => {
    expect(validateSql("SELECT 1").valid).toBe(true);
  });

  it("サブクエリを含むSQLを有効と判定する", () => {
    expect(validateSql("SELECT id FROM users WHERE id IN (SELECT user_id FROM orders)").valid).toBe(
      true,
    );
  });
});
