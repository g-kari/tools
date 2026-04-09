/**
 * 論理式真理値表ジェネレーター ユーティリティ
 *
 * ブール論理式をパースし、真理値表を生成します。
 * 対応演算子: AND, OR, NOT, XOR, NAND, NOR, XNOR
 * 対応変数: A〜Z（1文字の大文字）
 * 最大変数数: 5（32行）
 */

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

/** トークン種別 */
type TokenKind =
  | "VAR"
  | "AND"
  | "OR"
  | "NOT"
  | "XOR"
  | "NAND"
  | "NOR"
  | "XNOR"
  | "LPAREN"
  | "RPAREN"
  | "EOF";

/** 字句トークン */
interface Token {
  kind: TokenKind;
  value: string;
}

/** ASTノード */
type ASTNode =
  | { op: "VAR"; name: string }
  | { op: "NOT"; operand: ASTNode }
  | {
      op: "AND" | "OR" | "XOR" | "NAND" | "NOR" | "XNOR";
      left: ASTNode;
      right: ASTNode;
    };

/** 真理値表の1行 */
export interface TruthTableRow {
  /** 各変数の真偽値 */
  inputs: Record<string, boolean>;
  /** 式全体の評価結果 */
  output: boolean;
}

/** 真理値表の生成結果 */
export interface TruthTableResult {
  /** 変数リスト（アルファベット昇順） */
  variables: string[];
  /** 正規化された式文字列 */
  expression: string;
  /** 真理値表の全行 */
  rows: TruthTableRow[];
}

// ---------------------------------------------------------------------------
// 字句解析（Lexer）
// ---------------------------------------------------------------------------

/**
 * 論理式をトークン列に変換する
 * @param expr 論理式文字列
 * @returns トークン列（末尾にEOFトークンあり）
 * @throws 不明な文字が含まれる場合
 */
export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    // 空白・タブ・改行をスキップ
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // アルファベット始まり: キーワード or 変数
    if (/[A-Za-z]/.test(ch)) {
      let word = "";
      while (i < expr.length && /[A-Za-z0-9_]/.test(expr[i])) {
        word += expr[i++];
      }
      const upper = word.toUpperCase();
      switch (upper) {
        case "AND":
          tokens.push({ kind: "AND", value: "AND" });
          break;
        case "OR":
          tokens.push({ kind: "OR", value: "OR" });
          break;
        case "NOT":
          tokens.push({ kind: "NOT", value: "NOT" });
          break;
        case "XOR":
          tokens.push({ kind: "XOR", value: "XOR" });
          break;
        case "NAND":
          tokens.push({ kind: "NAND", value: "NAND" });
          break;
        case "NOR":
          tokens.push({ kind: "NOR", value: "NOR" });
          break;
        case "XNOR":
          tokens.push({ kind: "XNOR", value: "XNOR" });
          break;
        default:
          // 1文字ずつ変数として扱う
          for (const c of upper) {
            if (/[A-Z]/.test(c)) {
              tokens.push({ kind: "VAR", value: c });
            }
          }
      }
      continue;
    }

    // 記号演算子
    switch (ch) {
      case "(":
        tokens.push({ kind: "LPAREN", value: "(" });
        i++;
        break;
      case ")":
        tokens.push({ kind: "RPAREN", value: ")" });
        i++;
        break;
      case "!":
      case "~":
      case "¬":
        tokens.push({ kind: "NOT", value: "!" });
        i++;
        break;
      case "&":
        if (expr[i + 1] === "&") {
          tokens.push({ kind: "AND", value: "&&" });
          i += 2;
        } else {
          tokens.push({ kind: "AND", value: "&" });
          i++;
        }
        break;
      case "∧":
      case "·":
      case "*":
        tokens.push({ kind: "AND", value: ch });
        i++;
        break;
      case "|":
        if (expr[i + 1] === "|") {
          tokens.push({ kind: "OR", value: "||" });
          i += 2;
        } else {
          tokens.push({ kind: "OR", value: "|" });
          i++;
        }
        break;
      case "∨":
      case "+":
        tokens.push({ kind: "OR", value: ch });
        i++;
        break;
      case "^":
      case "⊕":
        tokens.push({ kind: "XOR", value: ch });
        i++;
        break;
      default:
        throw new Error(`不明な文字: "${ch}"`);
    }
  }

  tokens.push({ kind: "EOF", value: "" });
  return tokens;
}

// ---------------------------------------------------------------------------
// 構文解析（Parser）
// ---------------------------------------------------------------------------

/**
 * 再帰下降パーサー
 *
 * 演算子優先順位（低→高）:
 *   OR / NOR / XOR / XNOR  >  AND / NAND  >  NOT（単項）
 */
class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  /** 式全体をパース（OR 優先度が最低） */
  parseExpr(): ASTNode {
    return this.parseOr();
  }

  /** OR / NOR / XOR / XNOR */
  private parseOr(): ASTNode {
    let left = this.parseAnd();

    while (true) {
      const t = this.peek();
      if (t.kind === "OR") {
        this.consume();
        left = { op: "OR", left, right: this.parseAnd() };
      } else if (t.kind === "XOR") {
        this.consume();
        left = { op: "XOR", left, right: this.parseAnd() };
      } else if (t.kind === "NOR") {
        this.consume();
        left = { op: "NOR", left, right: this.parseAnd() };
      } else if (t.kind === "XNOR") {
        this.consume();
        left = { op: "XNOR", left, right: this.parseAnd() };
      } else {
        break;
      }
    }
    return left;
  }

  /** AND / NAND */
  private parseAnd(): ASTNode {
    let left = this.parseNot();

    while (true) {
      const t = this.peek();
      if (t.kind === "AND") {
        this.consume();
        left = { op: "AND", left, right: this.parseNot() };
      } else if (t.kind === "NAND") {
        this.consume();
        left = { op: "NAND", left, right: this.parseNot() };
      } else {
        break;
      }
    }
    return left;
  }

  /** NOT（単項・右結合） */
  private parseNot(): ASTNode {
    if (this.peek().kind === "NOT") {
      this.consume();
      return { op: "NOT", operand: this.parseNot() };
    }
    return this.parsePrimary();
  }

  /** 変数または括弧式 */
  private parsePrimary(): ASTNode {
    const t = this.peek();

    if (t.kind === "VAR") {
      this.consume();
      return { op: "VAR", name: t.value };
    }

    if (t.kind === "LPAREN") {
      this.consume();
      const expr = this.parseExpr();
      if (this.peek().kind !== "RPAREN") {
        throw new Error('閉じ括弧 ")" が見つかりません');
      }
      this.consume();
      return expr;
    }

    const got = t.value || t.kind;
    throw new Error(`予期しないトークン: "${got}"`);
  }
}

// ---------------------------------------------------------------------------
// AST 評価
// ---------------------------------------------------------------------------

/**
 * 変数名の集合を収集する（アルファベット昇順）
 * @param node ASTノード
 * @returns ソート済み変数名配列
 */
export function collectVariables(node: ASTNode): string[] {
  const vars = new Set<string>();

  function walk(n: ASTNode): void {
    if (n.op === "VAR") {
      vars.add(n.name);
    } else if (n.op === "NOT") {
      walk(n.operand);
    } else {
      walk(n.left);
      walk(n.right);
    }
  }

  walk(node);
  return [...vars].sort();
}

/**
 * 変数の値を与えてASTを評価する
 * @param node ASTノード
 * @param env 変数名→真偽値のマップ
 * @returns 評価結果
 */
function evaluate(node: ASTNode, env: Record<string, boolean>): boolean {
  switch (node.op) {
    case "VAR":
      return env[node.name] ?? false;
    case "NOT":
      return !evaluate(node.operand, env);
    case "AND":
      return evaluate(node.left, env) && evaluate(node.right, env);
    case "OR":
      return evaluate(node.left, env) || evaluate(node.right, env);
    case "XOR":
      return evaluate(node.left, env) !== evaluate(node.right, env);
    case "NAND":
      return !(evaluate(node.left, env) && evaluate(node.right, env));
    case "NOR":
      return !(evaluate(node.left, env) || evaluate(node.right, env));
    case "XNOR":
      return evaluate(node.left, env) === evaluate(node.right, env);
  }
}

/**
 * ASTを正規化された文字列に変換する
 * @param node ASTノード
 * @returns 正規化された論理式文字列
 */
function astToString(node: ASTNode): string {
  switch (node.op) {
    case "VAR":
      return node.name;
    case "NOT":
      if (node.operand.op === "VAR") {
        return `¬${node.operand.name}`;
      }
      return `¬(${astToString(node.operand)})`;
    case "AND":
      return `(${astToString(node.left)} ∧ ${astToString(node.right)})`;
    case "OR":
      return `(${astToString(node.left)} ∨ ${astToString(node.right)})`;
    case "XOR":
      return `(${astToString(node.left)} ⊕ ${astToString(node.right)})`;
    case "NAND":
      return `(${astToString(node.left)} NAND ${astToString(node.right)})`;
    case "NOR":
      return `(${astToString(node.left)} NOR ${astToString(node.right)})`;
    case "XNOR":
      return `(${astToString(node.left)} XNOR ${astToString(node.right)})`;
  }
}

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

/**
 * 論理式を解析して真理値表を生成する
 * @param expr 論理式文字列
 * @returns 真理値表の結果
 * @throws 式が不正な場合、または変数が5つを超える場合
 */
export function generateTruthTable(expr: string): TruthTableResult {
  if (!expr.trim()) {
    throw new Error("式を入力してください");
  }

  const tokens = tokenize(expr);
  const parser = new Parser(tokens);
  const ast = parser.parseExpr();

  const variables = collectVariables(ast);

  if (variables.length === 0) {
    throw new Error("変数が見つかりません。A, B, C などの変数を使用してください");
  }

  if (variables.length > 5) {
    throw new Error(
      `変数が多すぎます（${variables.length} 個）。最大 5 変数まで対応しています（32 行）`,
    );
  }

  const rowCount = 1 << variables.length; // 2^n
  const rows: TruthTableRow[] = [];

  for (let i = 0; i < rowCount; i++) {
    const inputs: Record<string, boolean> = {};
    for (let j = 0; j < variables.length; j++) {
      // MSB から割り当て（A=最上位ビット）
      inputs[variables[j]] = Boolean((i >> (variables.length - 1 - j)) & 1);
    }
    rows.push({ inputs, output: evaluate(ast, inputs) });
  }

  return {
    variables,
    expression: astToString(ast),
    rows,
  };
}

/**
 * 真理値表を CSV 形式に変換する
 * @param result 真理値表の結果
 * @returns CSV 文字列（ヘッダー行あり）
 */
export function exportTruthTableCSV(result: TruthTableResult): string {
  const header = [...result.variables, result.expression].join(",");
  const dataRows = result.rows.map((row) => {
    const inputValues = result.variables.map((v) => (row.inputs[v] ? "1" : "0"));
    return [...inputValues, row.output ? "1" : "0"].join(",");
  });
  return [header, ...dataRows].join("\n");
}
