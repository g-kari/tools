/**
 * @fileoverview 数式評価ユーティリティ
 * 安全な再帰下降パーサーによる数式評価の純粋なJavaScript実装
 * eval/Functionを使用しない安全な実装、外部ライブラリ不要
 */

/** 評価結果の型 */
export interface EvalResult {
  value: number | null;
  formatted: string;
  error: string | null;
}

/** 計算履歴のエントリ */
export interface HistoryEntry {
  expression: string;
  result: string;
  timestamp: number;
}

/** サポートする数学関数 */
const MATH_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  atan2: (y, x) => Math.atan2(y, x),
  sinh: (x) => Math.sinh(x),
  cosh: (x) => Math.cosh(x),
  tanh: (x) => Math.tanh(x),
  sqrt: (x) => Math.sqrt(x),
  cbrt: (x) => Math.cbrt(x),
  abs: (x) => Math.abs(x),
  ceil: (x) => Math.ceil(x),
  floor: (x) => Math.floor(x),
  round: (x) => Math.round(x),
  trunc: (x) => Math.trunc(x),
  log: (x) => Math.log(x),
  log2: (x) => Math.log2(x),
  log10: (x) => Math.log10(x),
  exp: (x) => Math.exp(x),
  pow: (x, y) => Math.pow(x, y),
  max: (...args) => Math.max(...args),
  min: (...args) => Math.min(...args),
  sign: (x) => Math.sign(x),
  hypot: (...args) => Math.hypot(...args),
};

/** サポートする定数 */
const MATH_CONSTANTS: Record<string, number> = {
  PI: Math.PI,
  E: Math.E,
  LN2: Math.LN2,
  LN10: Math.LN10,
  LOG2E: Math.LOG2E,
  LOG10E: Math.LOG10E,
  SQRT2: Math.SQRT2,
  INF: Infinity,
};

// ---- トークナイザー ----

type TokenType =
  | "NUMBER"
  | "IDENT"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "PERCENT"
  | "CARET"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

/**
 * 数式をトークン列に変換する
 */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    const ch = input[pos];

    // 空白スキップ
    if (/\s/.test(ch)) {
      pos++;
      continue;
    }

    // 数字
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(input[pos + 1] ?? ""))) {
      let num = "";
      while (pos < input.length && /[0-9.]/.test(input[pos])) {
        num += input[pos++];
      }
      // 科学表記 e.g., 1e10, 1.5e-3
      if (pos < input.length && (input[pos] === "e" || input[pos] === "E")) {
        num += input[pos++];
        if (pos < input.length && (input[pos] === "+" || input[pos] === "-")) {
          num += input[pos++];
        }
        while (pos < input.length && /[0-9]/.test(input[pos])) {
          num += input[pos++];
        }
      }
      tokens.push({ type: "NUMBER", value: num, pos: pos - num.length });
      continue;
    }

    // 識別子（関数名・定数名）
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = "";
      const startPos = pos;
      while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos])) {
        ident += input[pos++];
      }
      tokens.push({ type: "IDENT", value: ident, pos: startPos });
      continue;
    }

    // 演算子と括弧
    const opMap: Record<string, TokenType> = {
      "+": "PLUS",
      "-": "MINUS",
      "*": "STAR",
      "/": "SLASH",
      "%": "PERCENT",
      "^": "CARET",
      "(": "LPAREN",
      ")": "RPAREN",
      ",": "COMMA",
    };

    if (ch in opMap) {
      tokens.push({ type: opMap[ch], value: ch, pos: pos++ });
      continue;
    }

    throw new Error(`位置 ${pos} に無効な文字: "${ch}"`);
  }

  tokens.push({ type: "EOF", value: "", pos: pos });
  return tokens;
}

// ---- 再帰下降パーサー ----

/**
 * パーサーの状態
 */
class Parser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    const tok = this.peek();
    if (tok.type !== type) {
      throw new Error(`位置 ${tok.pos}: "${type}" が期待されましたが "${tok.type}" でした`);
    }
    return this.consume();
  }

  /**
   * 式全体をパース
   * expr = additive
   */
  parseExpr(): number {
    const value = this.parseAdditive();
    if (this.peek().type !== "EOF") {
      throw new Error(`位置 ${this.peek().pos}: 予期しないトークン "${this.peek().value}"`);
    }
    return value;
  }

  /**
   * 加法・減法
   * additive = multiplicative (('+' | '-') multiplicative)*
   */
  private parseAdditive(): number {
    let left = this.parseMultiplicative();
    while (this.peek().type === "PLUS" || this.peek().type === "MINUS") {
      const op = this.consume().type;
      const right = this.parseMultiplicative();
      left = op === "PLUS" ? left + right : left - right;
    }
    return left;
  }

  /**
   * 乗法・除法・剰余
   * multiplicative = unary (('*' | '/' | '%') unary)*
   */
  private parseMultiplicative(): number {
    let left = this.parsePower();
    while (
      this.peek().type === "STAR" ||
      this.peek().type === "SLASH" ||
      this.peek().type === "PERCENT"
    ) {
      const op = this.consume().type;
      const right = this.parsePower();
      if (op === "STAR") left = left * right;
      else if (op === "SLASH") {
        if (right === 0) throw new Error("ゼロ除算エラー");
        left = left / right;
      } else {
        left = left % right;
      }
    }
    return left;
  }

  /**
   * べき乗（右結合）
   * power = unary ('^' power)?
   */
  private parsePower(): number {
    const base = this.parseUnary();
    if (this.peek().type === "CARET") {
      this.consume();
      const exp = this.parsePower(); // 右結合
      return Math.pow(base, exp);
    }
    return base;
  }

  /**
   * 単項演算子
   * unary = ('-' | '+')? primary
   */
  private parseUnary(): number {
    if (this.peek().type === "MINUS") {
      this.consume();
      return -this.parseUnary();
    }
    if (this.peek().type === "PLUS") {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  /**
   * 基本要素: 数値、識別子（定数/関数呼び出し）、括弧式
   */
  private parsePrimary(): number {
    const tok = this.peek();

    // 数値リテラル
    if (tok.type === "NUMBER") {
      this.consume();
      const v = parseFloat(tok.value);
      if (isNaN(v)) throw new Error(`無効な数値: "${tok.value}"`);
      return v;
    }

    // 識別子（定数または関数）
    if (tok.type === "IDENT") {
      this.consume();
      const name = tok.value;

      // 定数
      if (name in MATH_CONSTANTS) {
        return MATH_CONSTANTS[name];
      }

      // 関数呼び出し
      if (name in MATH_FUNCTIONS) {
        this.expect("LPAREN");
        const args: number[] = [];
        if (this.peek().type !== "RPAREN") {
          args.push(this.parseAdditive());
          while (this.peek().type === "COMMA") {
            this.consume();
            args.push(this.parseAdditive());
          }
        }
        this.expect("RPAREN");
        const fn = MATH_FUNCTIONS[name];
        return fn(...args);
      }

      throw new Error(`不明な関数または定数: "${name}"`);
    }

    // 括弧式
    if (tok.type === "LPAREN") {
      this.consume();
      const value = this.parseAdditive();
      this.expect("RPAREN");
      return value;
    }

    throw new Error(`位置 ${tok.pos}: 予期しないトークン "${tok.value}"`);
  }
}

/**
 * 数式を安全に評価する（再帰下降パーサーを使用）
 * @param expression 入力数式
 * @returns 評価結果
 */
export function evaluateExpression(expression: string): EvalResult {
  if (!expression || expression.trim() === "") {
    return { value: null, formatted: "", error: "数式を入力してください" };
  }

  if (expression.length > 500) {
    return { value: null, formatted: "", error: "数式が長すぎます（500文字以内）" };
  }

  try {
    const tokens = tokenize(expression);
    const parser = new Parser(tokens);
    const result = parser.parseExpr();

    if (isNaN(result)) {
      return { value: null, formatted: "", error: "計算結果が無効な数値です（NaN）" };
    }

    if (!isFinite(result)) {
      const formatted = result > 0 ? "∞" : "-∞";
      return { value: result, formatted, error: null };
    }

    const formatted = formatResult(result);
    return { value: result, formatted, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "評価エラー";
    return { value: null, formatted: "", error: message };
  }
}

/**
 * 数値を見やすい形式にフォーマットする
 * @param value 数値
 * @returns フォーマット済み文字列
 */
export function formatResult(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < 1e15) {
    return value.toLocaleString("ja-JP");
  }

  // 非常に大きい/小さい数は指数表記
  if (Math.abs(value) >= 1e15 || (Math.abs(value) < 1e-6 && value !== 0)) {
    return value.toExponential(6);
  }

  // 小数の場合は末尾ゼロを除去
  const str = parseFloat(value.toPrecision(12)).toString();
  return str;
}

/**
 * 利用可能な関数・定数の一覧を返す
 */
export function getSupportedFunctions(): string[] {
  return Object.keys(MATH_FUNCTIONS);
}

/**
 * 利用可能な定数の一覧を返す
 */
export function getSupportedConstants(): Record<string, number> {
  return { ...MATH_CONSTANTS };
}

/**
 * サンプル数式の一覧を返す
 */
export function getSampleExpressions(): { label: string; expression: string }[] {
  return [
    { label: "円周率", expression: "PI" },
    { label: "平方根", expression: "sqrt(2)" },
    { label: "三角関数", expression: "sin(PI / 6)" },
    { label: "対数", expression: "log10(1000)" },
    { label: "べき乗", expression: "2 ^ 10" },
    { label: "斜辺（3-4-5）", expression: "sqrt(3^2 + 4^2)" },
    { label: "円の面積（r=5）", expression: "PI * 5^2" },
    { label: "複利計算", expression: "1000 * (1 + 0.05) ^ 10" },
  ];
}

/**
 * 計算履歴に新しいエントリを追加する
 * @param history 既存の履歴
 * @param expression 数式
 * @param result 結果文字列
 * @param maxEntries 最大保持件数
 * @returns 更新された履歴
 */
export function addToHistory(
  history: HistoryEntry[],
  expression: string,
  result: string,
  maxEntries: number = 10,
): HistoryEntry[] {
  const entry: HistoryEntry = {
    expression,
    result,
    timestamp: Date.now(),
  };
  return [entry, ...history].slice(0, maxEntries);
}
