/**
 * GraphQL トークンの型定義
 */
export type GraphQLTokenType =
  | "name"
  | "string"
  | "block_string"
  | "integer"
  | "float"
  | "punctuation"
  | "spread"
  | "comment"
  | "unknown";

export interface GraphQLToken {
  type: GraphQLTokenType;
  value: string;
}

/**
 * GraphQL 文字列をトークンの配列に分解する。
 * @param input - 解析対象の GraphQL 文字列
 * @returns GraphQLToken の配列
 * @throws {Error} 文字列リテラルが閉じられていない場合
 */
export function tokenizeGraphQL(input: string): GraphQLToken[] {
  const tokens: GraphQLToken[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    // 空白・改行・BOM・コンマ（GraphQL の Ignored Tokens）をスキップ
    if (/[\s,\uFEFF]/.test(ch)) {
      i++;
      continue;
    }

    // コメント # ...
    if (ch === "#") {
      const end = input.indexOf("\n", i + 1);
      const lineEnd = end === -1 ? len : end;
      tokens.push({ type: "comment", value: input.slice(i, lineEnd).trim() });
      i = end === -1 ? len : end + 1;
      continue;
    }

    // ブロック文字列 """..."""
    if (input.startsWith('"""', i)) {
      const end = input.indexOf('"""', i + 3);
      if (end === -1) {
        throw new Error("ブロック文字列リテラルが閉じられていません");
      }
      tokens.push({ type: "block_string", value: input.slice(i, end + 3) });
      i = end + 3;
      continue;
    }

    // 文字列 "..."
    if (ch === '"') {
      let j = i + 1;
      while (j < len && input[j] !== '"') {
        if (input[j] === "\\") j++; // エスケープシーケンスをスキップ
        j++;
      }
      if (j >= len) {
        throw new Error("文字列リテラルが閉じられていません");
      }
      tokens.push({ type: "string", value: input.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // スプレッド演算子 ...
    if (input.startsWith("...", i)) {
      tokens.push({ type: "spread", value: "..." });
      i += 3;
      continue;
    }

    // 記号（句読点）
    if ("{}()[]!|=@:$&".includes(ch)) {
      tokens.push({ type: "punctuation", value: ch });
      i++;
      continue;
    }

    // 数値（整数・浮動小数点）
    if (/[0-9]/.test(ch) || (ch === "-" && i + 1 < len && /[0-9]/.test(input[i + 1]))) {
      let j = i;
      if (input[j] === "-") j++;
      while (j < len && /[0-9]/.test(input[j])) j++;
      let isFloat = false;
      if (j < len && input[j] === ".") {
        isFloat = true;
        j++;
        while (j < len && /[0-9]/.test(input[j])) j++;
      }
      if (j < len && /[eE]/.test(input[j])) {
        isFloat = true;
        j++;
        if (j < len && /[+-]/.test(input[j])) j++;
        while (j < len && /[0-9]/.test(input[j])) j++;
      }
      tokens.push({
        type: isFloat ? "float" : "integer",
        value: input.slice(i, j),
      });
      i = j;
      continue;
    }

    // 名前（キーワードを含む）
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_]/.test(input[j])) j++;
      tokens.push({ type: "name", value: input.slice(i, j) });
      i = j;
      continue;
    }

    // 未知の文字
    tokens.push({ type: "unknown", value: ch });
    i++;
  }

  return tokens;
}

/**
 * トークン間のスペース付与ルールを適用して現在の行バッファに追加する。
 * @param current - 現在の行の内容
 * @param token - 追加するトークン
 * @returns スペースを考慮した新しい行の内容
 */
function appendWithSpacing(current: string, token: GraphQLToken): string {
  if (!current) return token.value;

  const v = token.value;
  const lastChar = current[current.length - 1];

  // 前のトークンの後にスペースが不要なケース
  // ただし `... on` のインラインフラグメントでは `on` の前にスペースが必要
  const noSpaceAfterPrev =
    lastChar === "(" ||
    lastChar === "[" ||
    lastChar === "@" ||
    lastChar === "$" ||
    (current.endsWith("...") && v !== "on");

  // このトークンの前にスペースが不要なケース
  const noSpaceBeforeCurr =
    v === "!" || v === ")" || v === "]" || v === ":" || v === "|" || v === "(" || v === "[";

  if (noSpaceAfterPrev) {
    return current + v;
  }
  if (noSpaceBeforeCurr) {
    return current.trimEnd() + v;
  }
  return current + " " + v;
}

/**
 * GraphQL 文字列を整形（フォーマット）する。
 * @param input - 整形対象の GraphQL 文字列
 * @param indentSize - インデントのスペース数（デフォルト: 2）
 * @returns 整形された GraphQL 文字列
 * @throws {Error} GraphQL 文字列が空の場合、または構文が不正な場合
 */
export function formatGraphQL(input: string, indentSize: number = 2): string {
  if (!input.trim()) {
    throw new Error("GraphQL 文字列が空です");
  }

  const tokens = tokenizeGraphQL(input);
  const ind = " ".repeat(indentSize);
  const lines: string[] = [];
  let depth = 0;
  let current = ""; // 現在の行バッファ
  let argDepth = 0; // ( ) [ ] の深さ
  let prevToken: GraphQLToken | null = null;

  function flushCurrent(): void {
    const trimmed = current.trim();
    if (trimmed) {
      lines.push(ind.repeat(depth) + trimmed);
    }
    current = "";
  }

  for (const token of tokens) {
    // コメント処理
    if (token.type === "comment") {
      flushCurrent();
      lines.push(ind.repeat(depth) + token.value);
      prevToken = token;
      continue;
    }

    // 括弧の深さを追跡
    if (token.type === "punctuation") {
      if (token.value === "(" || token.value === "[") argDepth++;
      else if (token.value === ")" || token.value === "]") argDepth = Math.max(0, argDepth - 1);
    }

    // 開き波括弧 { → 選択セット開始
    if (token.type === "punctuation" && token.value === "{") {
      const trimmed = current.trim();
      if (trimmed) {
        lines.push(ind.repeat(depth) + trimmed + " {");
      } else {
        lines.push(ind.repeat(depth) + "{");
      }
      current = "";
      depth++;
      prevToken = token;
      continue;
    }

    // 閉じ波括弧 } → 選択セット終了
    if (token.type === "punctuation" && token.value === "}") {
      flushCurrent();
      depth = Math.max(0, depth - 1);
      lines.push(ind.repeat(depth) + "}");
      prevToken = token;
      continue;
    }

    // フィールド区切りの検出:
    // depth > 0（選択セット内）かつ argDepth = 0 のとき、
    // 新しい name または spread トークンが来た場合は前のフィールドをフラッシュする。
    // ただし以下の場合はフラッシュしない:
    //   - 前のトークンが `:` （エイリアスや型アノテーション）
    //   - 前のトークンが `on` キーワード（インラインフラグメントの型条件）
    //   - 前のトークンが spread `...` （フラグメントスプレッドの一部）
    if (
      depth > 0 &&
      argDepth === 0 &&
      (token.type === "name" || token.type === "spread") &&
      current.trim() !== "" &&
      prevToken !== null &&
      !(prevToken.type === "punctuation" && prevToken.value === ":") &&
      !(prevToken.type === "punctuation" && prevToken.value === "@") &&
      !(prevToken.type === "name" && prevToken.value === "on") &&
      !(prevToken.type === "spread")
    ) {
      flushCurrent();
    }

    // トークンをスペースルールに従って追加
    current = appendWithSpacing(current, token);
    prevToken = token;
  }

  flushCurrent();

  return lines.join("\n");
}

/**
 * GraphQL 文字列を圧縮（ミニファイ）する。コメントを削除し空白を最小化する。
 * @param input - 圧縮対象の GraphQL 文字列
 * @returns 圧縮された GraphQL 文字列
 * @throws {Error} GraphQL 文字列が空の場合
 */
export function minifyGraphQL(input: string): string {
  if (!input.trim()) {
    throw new Error("GraphQL 文字列が空です");
  }

  const tokens = tokenizeGraphQL(input);
  const parts: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : null;

    // コメントはスキップ
    if (token.type === "comment") continue;

    const v = token.value;

    // 前のトークンの後にスペース不要なケース
    const noSpaceAfterPrev =
      !prev ||
      prev.type === "comment" ||
      (prev.type === "punctuation" &&
        (prev.value === "(" ||
          prev.value === "[" ||
          prev.value === "{" ||
          prev.value === "@" ||
          prev.value === "$"));

    // このトークンの前にスペース不要なケース
    const noSpaceBeforeCurr =
      token.type === "punctuation" &&
      (v === ")" ||
        v === "]" ||
        v === "}" ||
        v === "!" ||
        v === ":" ||
        v === "|" ||
        v === "{" ||
        v === "(" ||
        v === "[" ||
        v === "@");

    if (!noSpaceAfterPrev && !noSpaceBeforeCurr && parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      if (lastPart !== " ") {
        parts.push(" ");
      }
    }

    parts.push(v);
  }

  return parts.join("").trim();
}

/**
 * GraphQL 文字列の構文を基本的に検証する。
 * 括弧の対応と文字列リテラルの閉じを確認する。
 * @param input - 検証対象の GraphQL 文字列
 * @returns 検証結果。valid が true なら有効、false なら error にエラーメッセージ
 */
export function validateGraphQL(input: string): { valid: boolean; error?: string } {
  if (!input.trim()) {
    return { valid: false, error: "GraphQL 文字列が空です" };
  }

  let tokens: GraphQLToken[];
  try {
    tokens = tokenizeGraphQL(input);
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "GraphQL 解析エラーが発生しました",
    };
  }

  // 各種括弧の対応チェック
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;

  for (const token of tokens) {
    if (token.type === "punctuation") {
      if (token.value === "{") braceDepth++;
      else if (token.value === "}") {
        braceDepth--;
        if (braceDepth < 0) {
          return { valid: false, error: "対応する開き括弧のない閉じ波括弧 `}` があります" };
        }
      } else if (token.value === "(") parenDepth++;
      else if (token.value === ")") {
        parenDepth--;
        if (parenDepth < 0) {
          return { valid: false, error: "対応する開き括弧のない閉じ括弧 `)` があります" };
        }
      } else if (token.value === "[") bracketDepth++;
      else if (token.value === "]") {
        bracketDepth--;
        if (bracketDepth < 0) {
          return { valid: false, error: "対応する開き括弧のない閉じ角括弧 `]` があります" };
        }
      }
    }
  }

  if (braceDepth !== 0) {
    return {
      valid: false,
      error: `閉じられていない波括弧 \`{\` が ${braceDepth} 個あります`,
    };
  }
  if (parenDepth !== 0) {
    return {
      valid: false,
      error: `閉じられていない括弧 \`(\` が ${parenDepth} 個あります`,
    };
  }
  if (bracketDepth !== 0) {
    return {
      valid: false,
      error: `閉じられていない角括弧 \`[\` が ${bracketDepth} 個あります`,
    };
  }

  // 先頭の意味のあるトークンをチェック（有効な GraphQL ドキュメントの開始を確認）
  const firstMeaningful = tokens.find((t) => t.type !== "comment");
  if (!firstMeaningful) {
    return { valid: false, error: "コメントのみのドキュメントは無効です" };
  }

  const validStartNames = new Set([
    "query",
    "mutation",
    "subscription",
    "fragment",
    "schema",
    "type",
    "interface",
    "enum",
    "union",
    "input",
    "scalar",
    "directive",
    "extend",
  ]);

  if (firstMeaningful.type === "punctuation" && firstMeaningful.value === "{") {
    // 無名クエリ（省略記法）→ 有効
  } else if (firstMeaningful.type === "name" && !validStartNames.has(firstMeaningful.value)) {
    return {
      valid: false,
      error: `GraphQL ドキュメントの開始キーワードが不正です: "${firstMeaningful.value}"`,
    };
  }

  return { valid: true };
}
