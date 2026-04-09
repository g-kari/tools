/**
 * @fileoverview 関数グラフ描画ユーティリティ
 * x を変数とする数学関数のグラフデータを計算するロジック
 * eval/Functionを使用しない安全な再帰下降パーサー実装
 */

/** プロット関数の色一覧 */
export const PLOT_COLORS = ["#e53935", "#1976d2", "#388e3c", "#f57c00"] as const;
export type PlotColor = (typeof PLOT_COLORS)[number];

/** 関数プロット設定 */
export interface PlotFunction {
  expression: string;
  color: PlotColor;
  enabled: boolean;
}

/** グラフ表示範囲 */
export interface PlotRange {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/** プロット点（1サンプル） */
export interface PlotPoint {
  /** x座標 */
  x: number;
  /** y座標（validでない場合はNaN） */
  y: number;
  /** 有効な数値かどうか（NaN/Infinity除外） */
  valid: boolean;
}

/** プロットデータ（1関数分） */
export interface PlotData {
  points: PlotPoint[];
  expression: string;
  color: PlotColor;
  error: string | null;
}

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
}

/** サポート数学関数 */
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
  sign: (x) => Math.sign(x),
  log: (x) => Math.log(x),
  log2: (x) => Math.log2(x),
  log10: (x) => Math.log10(x),
  exp: (x) => Math.exp(x),
  pow: (x, y) => Math.pow(x, y),
  max: (...args) => Math.max(...args),
  min: (...args) => Math.min(...args),
  hypot: (...args) => Math.hypot(...args),
  mod: (x, y) => ((x % y) + y) % y,
};

/** サポート定数 */
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

/**
 * 数式をトークン列に変換する
 * @param input 入力文字列
 * @returns トークン配列
 */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    const ch = input[pos];

    if (/\s/.test(ch)) {
      pos++;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(input[pos + 1] ?? ""))) {
      let num = "";
      while (pos < input.length && /[0-9.]/.test(input[pos])) num += input[pos++];
      if (pos < input.length && (input[pos] === "e" || input[pos] === "E")) {
        num += input[pos++];
        if (pos < input.length && (input[pos] === "+" || input[pos] === "-")) num += input[pos++];
        while (pos < input.length && /[0-9]/.test(input[pos])) num += input[pos++];
      }
      tokens.push({ type: "NUMBER", value: num });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let ident = "";
      while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos])) ident += input[pos++];
      tokens.push({ type: "IDENT", value: ident });
      continue;
    }

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
      tokens.push({ type: opMap[ch], value: ch });
      pos++;
      continue;
    }

    throw new Error(`無効な文字: "${ch}" (位置 ${pos})`);
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

// ---- AST ノード ----

type ASTNode =
  | { type: "number"; value: number }
  | { type: "variable" }
  | { type: "constant"; value: number }
  | { type: "binop"; op: string; left: ASTNode; right: ASTNode }
  | { type: "unary"; operand: ASTNode }
  | { type: "func"; name: string; args: ASTNode[] };

// ---- AST パーサー ----

class ASTParser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    const tok = this.peek();
    if (tok.type !== type) throw new Error(`"${type}" が期待されましたが "${tok.type}" でした`);
    return this.consume();
  }

  /**
   * 式全体をパースしてASTを返す
   */
  parse(): ASTNode {
    const node = this.parseAdditive();
    if (this.peek().type !== "EOF") {
      throw new Error(`予期しないトークン: "${this.peek().value}"`);
    }
    return node;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();
    while (this.peek().type === "PLUS" || this.peek().type === "MINUS") {
      const op = this.consume().value;
      const right = this.parseMultiplicative();
      left = { type: "binop", op, left, right };
    }
    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary();
    while (["STAR", "SLASH", "PERCENT"].includes(this.peek().type)) {
      const op = this.consume().value;
      const right = this.parseUnary();
      left = { type: "binop", op, left, right };
    }
    return left;
  }

  // 単項マイナスはべき乗より低優先度（-x^2 = -(x^2) = -4）
  private parseUnary(): ASTNode {
    if (this.peek().type === "MINUS") {
      this.consume();
      return { type: "unary", operand: this.parseUnary() };
    }
    if (this.peek().type === "PLUS") {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePower();
  }

  private parsePower(): ASTNode {
    const base = this.parsePrimary();
    if (this.peek().type === "CARET") {
      this.consume();
      const exp = this.parseUnary(); // 右結合（-x^2^3 = -(x^(2^3))）
      return { type: "binop", op: "^", left: base, right: exp };
    }
    return base;
  }

  private parsePrimary(): ASTNode {
    const tok = this.peek();

    if (tok.type === "NUMBER") {
      this.consume();
      const v = parseFloat(tok.value);
      if (isNaN(v)) throw new Error(`無効な数値: "${tok.value}"`);
      return { type: "number", value: v };
    }

    if (tok.type === "IDENT") {
      this.consume();
      const name = tok.value;

      if (name === "x") return { type: "variable" };
      if (name in MATH_CONSTANTS) return { type: "constant", value: MATH_CONSTANTS[name] };

      if (name in MATH_FUNCTIONS) {
        this.expect("LPAREN");
        const args: ASTNode[] = [];
        if (this.peek().type !== "RPAREN") {
          args.push(this.parseAdditive());
          while (this.peek().type === "COMMA") {
            this.consume();
            args.push(this.parseAdditive());
          }
        }
        this.expect("RPAREN");
        return { type: "func", name, args };
      }

      throw new Error(`不明な関数または変数: "${name}"`);
    }

    if (tok.type === "LPAREN") {
      this.consume();
      const node = this.parseAdditive();
      this.expect("RPAREN");
      return node;
    }

    throw new Error(`予期しないトークン: "${tok.value}"`);
  }
}

// ---- ASTエバリュエーター ----

/**
 * ASTノードをx値で評価する
 */
function evalAST(node: ASTNode, x: number): number {
  switch (node.type) {
    case "number":
      return node.value;
    case "variable":
      return x;
    case "constant":
      return node.value;
    case "unary":
      return -evalAST(node.operand, x);
    case "func": {
      const fn = MATH_FUNCTIONS[node.name];
      const args = node.args.map((a) => evalAST(a, x));
      return fn(...args);
    }
    case "binop": {
      const left = evalAST(node.left, x);
      const right = evalAST(node.right, x);
      switch (node.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return right === 0 ? (left >= 0 ? Infinity : -Infinity) : left / right;
        case "%":
          return left % right;
        case "^":
          return Math.pow(left, right);
        default:
          throw new Error(`不明な演算子: "${node.op}"`);
      }
    }
  }
}

/**
 * 式文字列をコンパイルしてx→number関数を返す
 * @param expression 数式文字列（xを変数として使用可）
 * @returns {fn, error} コンパイル済み評価関数またはエラー
 */
export function compileExpression(expression: string): {
  fn: ((x: number) => number) | null;
  error: string | null;
} {
  if (!expression.trim()) {
    return { fn: null, error: "式を入力してください" };
  }
  try {
    const tokens = tokenize(expression.trim());
    const ast = new ASTParser(tokens).parse();
    const fn = (x: number) => evalAST(ast, x);
    return { fn, error: null };
  } catch (e) {
    return { fn: null, error: e instanceof Error ? e.message : "構文エラー" };
  }
}

/**
 * 指定範囲のプロット点を計算する
 * @param fn コンパイル済み評価関数
 * @param xMin x軸最小値
 * @param xMax x軸最大値
 * @param steps サンプル点数
 * @param yClipMin y値のクリップ下限
 * @param yClipMax y値のクリップ上限
 * @returns プロット点の配列
 */
export function computePlotPoints(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  steps = 500,
  yClipMin = -1e6,
  yClipMax = 1e6,
): PlotPoint[] {
  const points: PlotPoint[] = [];
  const dx = (xMax - xMin) / steps;

  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx;
    let y: number;
    try {
      y = fn(x);
    } catch {
      points.push({ x, y: NaN, valid: false });
      continue;
    }

    const valid = isFinite(y) && !isNaN(y) && y >= yClipMin && y <= yClipMax;
    points.push({ x, y: valid ? y : NaN, valid });
  }

  return points;
}

/**
 * 不連続点（y値の急変）を検出してセグメント分割する
 * @param points プロット点
 * @param threshold 不連続判定閾値（y範囲に対する倍率）
 * @returns セグメントの配列（各セグメントは連続プロット点の配列）
 */
export function splitIntoSegments(points: PlotPoint[], threshold = 10): PlotPoint[][] {
  if (points.length === 0) return [];

  const validYs = points.filter((p) => p.valid).map((p) => p.y);
  if (validYs.length === 0) return [];

  const yRange = Math.max(...validYs) - Math.min(...validYs);
  const jumpThreshold = yRange * threshold + 1;

  const segments: PlotPoint[][] = [];
  let current: PlotPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];

    if (!p.valid) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      continue;
    }

    if (current.length > 0) {
      const prev = current[current.length - 1];
      if (Math.abs(p.y - prev.y) > jumpThreshold) {
        segments.push(current);
        current = [];
      }
    }

    current.push(p);
  }

  if (current.length > 0) segments.push(current);

  return segments;
}

/**
 * 有効なプロット点からy軸の自動範囲を計算する
 * @param allData 全プロットデータ
 * @param fallback フォールバック範囲
 * @returns yMin, yMax
 */
export function autoYRange(
  allData: PlotData[],
  fallback: { yMin: number; yMax: number } = { yMin: -10, yMax: 10 },
): { yMin: number; yMax: number } {
  const validYs = allData
    .flatMap((d) => d.points)
    .filter((p) => p.valid)
    .map((p) => p.y);

  if (validYs.length === 0) return fallback;

  let yMin = Math.min(...validYs);
  let yMax = Math.max(...validYs);

  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }

  const margin = (yMax - yMin) * 0.08;
  return { yMin: yMin - margin, yMax: yMax + margin };
}

/**
 * グラフのグリッド線刻み幅を計算する（見栄えの良い値を選択）
 * @param range 表示範囲の幅
 * @param targetCount 目標グリッド線本数
 * @returns 刻み幅
 */
export function niceStep(range: number, targetCount = 8): number {
  const rawStep = range / targetCount;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;

  let step: number;
  if (norm < 1.5) step = 1;
  else if (norm < 3.5) step = 2;
  else if (norm < 7.5) step = 5;
  else step = 10;

  return step * mag;
}

/**
 * プロットデータ全体を計算する
 * @param functions 関数設定配列
 * @param xMin x軸最小値
 * @param xMax x軸最大値
 * @param steps サンプル点数
 * @returns プロットデータ配列
 */
export function buildAllPlotData(
  functions: PlotFunction[],
  xMin: number,
  xMax: number,
  steps = 500,
): PlotData[] {
  return functions
    .filter((f) => f.enabled && f.expression.trim())
    .map((f) => {
      const { fn, error } = compileExpression(f.expression);
      if (!fn) {
        return { points: [], expression: f.expression, color: f.color, error };
      }
      const points = computePlotPoints(fn, xMin, xMax, steps);
      return { points, expression: f.expression, color: f.color, error: null };
    });
}

/** サンプル関数リスト */
export interface SampleFunction {
  label: string;
  expression: string;
}

export const SAMPLE_FUNCTIONS: SampleFunction[] = [
  { label: "sin(x)", expression: "sin(x)" },
  { label: "cos(x)", expression: "cos(x)" },
  { label: "tan(x)", expression: "tan(x)" },
  { label: "x²", expression: "x^2" },
  { label: "x³", expression: "x^3" },
  { label: "|x|", expression: "abs(x)" },
  { label: "1/x", expression: "1/x" },
  { label: "log|x|", expression: "log(abs(x))" },
  { label: "exp(x)", expression: "exp(x/3)" },
  { label: "x³-x", expression: "x^3 - x" },
  { label: "√|x|", expression: "sqrt(abs(x))" },
  { label: "sinc", expression: "sin(x*PI)/x" },
];
