/**
 * 順列・組合せ計算ユーティリティ
 * BigInt を使用して大きな数値も正確に計算する
 */

/** 計算結果 */
export interface CombinatoricsResult {
  /** n の値 */
  n: number;
  /** r の値 */
  r: number;
  /** nPr (順列) */
  permutation: bigint;
  /** nCr (組合せ) */
  combination: bigint;
  /** n! */
  nFactorial: bigint;
  /** r! */
  rFactorial: bigint;
  /** (n-r)! */
  nMinusRFactorial: bigint;
}

/** 計算ステップ */
export interface CalculationStep {
  /** ステップのラベル */
  label: string;
  /** ステップの式 */
  formula: string;
  /** ステップの結果 */
  result: string;
}

/** パスカルの三角形の行データ */
export interface PascalRow {
  /** 行番号 (0始まり) */
  rowIndex: number;
  /** 行の値 */
  values: bigint[];
}

/** 最大許容 n 値（計算が現実的な範囲） */
export const MAX_N = 170;

/** パスカルの三角形の最大表示行数 */
export const PASCAL_MAX_ROWS = 15;

/**
 * 非負整数の階乗を計算する (BigInt)
 * @param n - 非負整数
 * @returns n! (BigInt)
 * @throws n が負または MAX_N より大きい場合
 */
export function factorial(n: number): bigint {
  if (n < 0) throw new RangeError(`n must be >= 0, got ${n}`);
  if (n > MAX_N) throw new RangeError(`n must be <= ${MAX_N}, got ${n}`);
  let result = 1n;
  for (let i = 2; i <= n; i++) {
    result *= BigInt(i);
  }
  return result;
}

/**
 * 順列 nPr を計算する
 * nPr = n! / (n-r)!
 * @param n - 全体の数
 * @param r - 選ぶ数
 * @returns nPr (BigInt)
 */
export function permutation(n: number, r: number): bigint {
  if (n < 0 || r < 0) throw new RangeError("n and r must be >= 0");
  if (r > n) return 0n;
  if (r === 0) return 1n;
  // n * (n-1) * ... * (n-r+1)
  let result = 1n;
  for (let i = n; i > n - r; i--) {
    result *= BigInt(i);
  }
  return result;
}

/**
 * 組合せ nCr を計算する (二項係数)
 * nCr = n! / (r! * (n-r)!)
 * @param n - 全体の数
 * @param r - 選ぶ数
 * @returns nCr (BigInt)
 */
export function combination(n: number, r: number): bigint {
  if (n < 0 || r < 0) throw new RangeError("n and r must be >= 0");
  if (r > n) return 0n;
  if (r === 0 || r === n) return 1n;
  // 対称性: nCr = nC(n-r) を利用して計算量を削減
  const k = r > n - r ? n - r : r;
  let result = 1n;
  for (let i = 0; i < k; i++) {
    result = (result * BigInt(n - i)) / BigInt(i + 1);
  }
  return result;
}

/**
 * 順列・組合せの計算結果と詳細を返す
 * @param n - 全体の数
 * @param r - 選ぶ数
 * @returns 計算結果
 */
export function calculateCombinatorics(n: number, r: number): CombinatoricsResult {
  const nFact = factorial(n);
  const rFact = factorial(r);
  const nMinusRFact = factorial(n - r);
  const perm = permutation(n, r);
  const comb = combination(n, r);

  return {
    n,
    r,
    permutation: perm,
    combination: comb,
    nFactorial: nFact,
    rFactorial: rFact,
    nMinusRFactorial: nMinusRFact,
  };
}

/**
 * 順列計算のステップ説明を生成する
 * @param n - 全体の数
 * @param r - 選ぶ数
 * @returns ステップ説明の配列
 */
export function permutationSteps(n: number, r: number): CalculationStep[] {
  const steps: CalculationStep[] = [];
  const perm = permutation(n, r);
  const nFact = factorial(n);
  const nMinusRFact = factorial(n - r);

  steps.push({
    label: "公式",
    formula: `ₙPᵣ = n! / (n − r)!`,
    result: `₍${n}₎P₍${r}₎ = ${n}! / (${n} − ${r})!`,
  });

  steps.push({
    label: "n! を展開",
    formula: `${n}! = ${n === 0 ? "1" : Array.from({ length: n }, (_, i) => n - i).join(" × ")}`,
    result: formatBigInt(nFact),
  });

  if (n - r > 0) {
    steps.push({
      label: "(n − r)! を展開",
      formula: `(${n} − ${r})! = ${n - r}! = ${n - r === 0 ? "1" : Array.from({ length: n - r }, (_, i) => n - r - i).join(" × ")}`,
      result: formatBigInt(nMinusRFact),
    });
  }

  steps.push({
    label: "除算",
    formula: `${formatBigInt(nFact)} ÷ ${formatBigInt(nMinusRFact)}`,
    result: formatBigInt(perm),
  });

  return steps;
}

/**
 * 組合せ計算のステップ説明を生成する
 * @param n - 全体の数
 * @param r - 選ぶ数
 * @returns ステップ説明の配列
 */
export function combinationSteps(n: number, r: number): CalculationStep[] {
  const steps: CalculationStep[] = [];
  const comb = combination(n, r);
  const nFact = factorial(n);
  const rFact = factorial(r);
  const nMinusRFact = factorial(n - r);

  steps.push({
    label: "公式",
    formula: `ₙCᵣ = n! / (r! × (n − r)!)`,
    result: `₍${n}₎C₍${r}₎ = ${n}! / (${r}! × (${n} − ${r})!)`,
  });

  steps.push({
    label: "n! を計算",
    formula: `${n}!`,
    result: formatBigInt(nFact),
  });

  steps.push({
    label: "r! を計算",
    formula: `${r}!`,
    result: formatBigInt(rFact),
  });

  steps.push({
    label: "(n − r)! を計算",
    formula: `(${n} − ${r})! = ${n - r}!`,
    result: formatBigInt(nMinusRFact),
  });

  steps.push({
    label: "分母を計算",
    formula: `${formatBigInt(rFact)} × ${formatBigInt(nMinusRFact)}`,
    result: formatBigInt(rFact * nMinusRFact),
  });

  steps.push({
    label: "除算",
    formula: `${formatBigInt(nFact)} ÷ ${formatBigInt(rFact * nMinusRFact)}`,
    result: formatBigInt(comb),
  });

  return steps;
}

/**
 * パスカルの三角形を生成する
 * @param rows - 生成する行数（0始まり）
 * @returns パスカルの三角形の各行
 */
export function generatePascalTriangle(rows: number): PascalRow[] {
  const result: PascalRow[] = [];
  for (let i = 0; i < rows; i++) {
    const values: bigint[] = [];
    for (let j = 0; j <= i; j++) {
      values.push(combination(i, j));
    }
    result.push({ rowIndex: i, values });
  }
  return result;
}

/**
 * BigInt を読みやすい文字列にフォーマットする
 * 大きな数値は省略表示する
 * @param value - BigInt 値
 * @param maxLength - 最大表示桁数（デフォルト: 20）
 */
export function formatBigInt(value: bigint, maxLength = 20): string {
  const str = value.toString();
  if (str.length <= maxLength) {
    // 3桁区切りのカンマを付与
    return value.toLocaleString();
  }
  // 指数表記で省略表示
  const exp = str.length - 1;
  const mantissa = `${str[0]}.${str.slice(1, 5)}`;
  return `${mantissa}×10^${exp}`;
}

/**
 * 入力値のバリデーション
 * @param n - 全体の数
 * @param r - 選ぶ数
 * @returns エラーメッセージ、問題なければ null
 */
export function validateInputs(n: number, r: number): string | null {
  if (!Number.isInteger(n) || !Number.isInteger(r)) {
    return "n と r は整数で入力してください";
  }
  if (n < 0 || r < 0) {
    return "n と r は 0 以上の整数で入力してください";
  }
  if (r > n) {
    return "r は n 以下である必要があります（r ≤ n）";
  }
  if (n > MAX_N) {
    return `n は ${MAX_N} 以下で入力してください`;
  }
  return null;
}
