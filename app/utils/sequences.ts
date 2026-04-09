/**
 * 数列ジェネレーター ユーティリティ関数
 * フィボナッチ・素数・等差・等比・Collatz など各種数列を生成
 */

/** 数列の種類 */
export type SequenceType =
  | "fibonacci"
  | "lucas"
  | "primes"
  | "triangular"
  | "square"
  | "cube"
  | "powers-of-2"
  | "arithmetic"
  | "geometric"
  | "collatz"
  | "padovan"
  | "catalan";

/** 数列の定義情報 */
export interface SequenceDefinition {
  id: SequenceType;
  label: string;
  description: string;
  formula: string;
  example: string;
  hasParams: boolean;
  paramLabels?: string[];
  paramDefaults?: number[];
  paramPlaceholders?: string[];
}

/** 数列の定義一覧 */
export const SEQUENCE_DEFINITIONS: SequenceDefinition[] = [
  {
    id: "fibonacci",
    label: "フィボナッチ数列",
    description: "前の2項の和が次の項になる数列。自然界の螺旋・黄金比に現れる。",
    formula: "F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)",
    example: "0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...",
    hasParams: false,
  },
  {
    id: "lucas",
    label: "リュカ数列",
    description: "フィボナッチと同じ漸化式だが初期値が異なる数列。",
    formula: "L(0)=2, L(1)=1, L(n)=L(n-1)+L(n-2)",
    example: "2, 1, 3, 4, 7, 11, 18, 29, 47, 76, ...",
    hasParams: false,
  },
  {
    id: "primes",
    label: "素数列",
    description: "1とその数自身でしか割り切れない正の整数の列。エラトステネスの篩で生成。",
    formula: "p(n) : n番目の素数",
    example: "2, 3, 5, 7, 11, 13, 17, 19, 23, 29, ...",
    hasParams: false,
  },
  {
    id: "triangular",
    label: "三角数",
    description: "等間隔に並べた点で三角形を作れる数の列。",
    formula: "T(n) = n*(n+1)/2",
    example: "1, 3, 6, 10, 15, 21, 28, 36, 45, 55, ...",
    hasParams: false,
  },
  {
    id: "square",
    label: "平方数",
    description: "整数の二乗からなる数列。",
    formula: "n²",
    example: "1, 4, 9, 16, 25, 36, 49, 64, 81, 100, ...",
    hasParams: false,
  },
  {
    id: "cube",
    label: "立方数",
    description: "整数の三乗からなる数列。",
    formula: "n³",
    example: "1, 8, 27, 64, 125, 216, 343, 512, 729, 1000, ...",
    hasParams: false,
  },
  {
    id: "powers-of-2",
    label: "2の冪乗",
    description: "2を繰り返し掛けた数の列。コンピュータのビット・バイト計算に頻出。",
    formula: "2^n",
    example: "1, 2, 4, 8, 16, 32, 64, 128, 256, 512, ...",
    hasParams: false,
  },
  {
    id: "catalan",
    label: "カタラン数",
    description: "括弧の組み合わせ・二分木・凸多角形の三角分割など組合せ論に現れる数列。",
    formula: "C(n) = (2n)! / ((n+1)! * n!)",
    example: "1, 1, 2, 5, 14, 42, 132, 429, 1430, 4862, ...",
    hasParams: false,
  },
  {
    id: "padovan",
    label: "パドヴァン数列",
    description: "3項前と2項前の和が次の項になる数列。螺旋状の幾何学的性質を持つ。",
    formula: "P(0)=P(1)=P(2)=1, P(n)=P(n-2)+P(n-3)",
    example: "1, 1, 1, 2, 2, 3, 4, 5, 7, 9, 12, 16, 21, ...",
    hasParams: false,
  },
  {
    id: "arithmetic",
    label: "等差数列",
    description: "隣接する項の差が一定の数列。",
    formula: "a(n) = a + (n-1)*d",
    example: "初項: 1, 公差: 3 → 1, 4, 7, 10, 13, ...",
    hasParams: true,
    paramLabels: ["初項 (a)", "公差 (d)"],
    paramDefaults: [1, 2],
    paramPlaceholders: ["例: 1", "例: 2"],
  },
  {
    id: "geometric",
    label: "等比数列",
    description: "隣接する項の比が一定の数列。",
    formula: "a(n) = a * r^(n-1)",
    example: "初項: 1, 公比: 3 → 1, 3, 9, 27, 81, ...",
    hasParams: true,
    paramLabels: ["初項 (a)", "公比 (r)"],
    paramDefaults: [1, 2],
    paramPlaceholders: ["例: 1", "例: 2"],
  },
  {
    id: "collatz",
    label: "コラッツ数列",
    description: "偶数なら÷2、奇数なら×3+1を繰り返す。必ず1に収束すると予想されている（未証明）。",
    formula: "n→n/2 (偶数), n→3n+1 (奇数)",
    example: "6 → 3, 10, 5, 16, 8, 4, 2, 1",
    hasParams: true,
    paramLabels: ["開始値 (n)"],
    paramDefaults: [27],
    paramPlaceholders: ["例: 27"],
  },
];

/**
 * フィボナッチ数列の最初 n 項を生成する
 * @param count - 生成する項数
 * @returns フィボナッチ数列
 */
export function generateFibonacci(count: number): bigint[] {
  if (count <= 0) return [];
  if (count === 1) return [0n];
  const seq: bigint[] = [0n, 1n];
  for (let i = 2; i < count; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq.slice(0, count);
}

/**
 * リュカ数列の最初 n 項を生成する
 * @param count - 生成する項数
 * @returns リュカ数列
 */
export function generateLucas(count: number): bigint[] {
  if (count <= 0) return [];
  if (count === 1) return [2n];
  const seq: bigint[] = [2n, 1n];
  for (let i = 2; i < count; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq.slice(0, count);
}

/**
 * エラトステネスの篩で素数を n 個生成する
 * @param count - 生成する素数の個数
 * @returns 素数列
 */
export function generatePrimes(count: number): number[] {
  if (count <= 0) return [];
  const primes: number[] = [];
  // 上限を大まかに見積もる (素数定理: p(n) ≈ n*ln(n))
  const limit =
    count < 6 ? 15 : Math.ceil(count * (Math.log(count) + Math.log(Math.log(count))) * 1.3);
  const sieve = new Uint8Array(limit + 1);
  sieve[0] = sieve[1] = 1;
  for (let i = 2; i * i <= limit; i++) {
    if (!sieve[i]) {
      for (let j = i * i; j <= limit; j += i) {
        sieve[j] = 1;
      }
    }
  }
  for (let i = 2; i <= limit && primes.length < count; i++) {
    if (!sieve[i]) primes.push(i);
  }
  return primes.slice(0, count);
}

/**
 * 三角数を n 個生成する
 * @param count - 生成する項数
 * @returns 三角数列 (1から)
 */
export function generateTriangular(count: number): number[] {
  const result: number[] = [];
  for (let n = 1; n <= count; n++) {
    result.push((n * (n + 1)) / 2);
  }
  return result;
}

/**
 * 平方数を n 個生成する
 * @param count - 生成する項数
 * @returns 平方数列 (1から)
 */
export function generateSquare(count: number): number[] {
  const result: number[] = [];
  for (let n = 1; n <= count; n++) {
    result.push(n * n);
  }
  return result;
}

/**
 * 立方数を n 個生成する
 * @param count - 生成する項数
 * @returns 立方数列 (1から)
 */
export function generateCube(count: number): number[] {
  const result: number[] = [];
  for (let n = 1; n <= count; n++) {
    result.push(n * n * n);
  }
  return result;
}

/**
 * 2の冪乗を n 個生成する (2^0 から)
 * @param count - 生成する項数
 * @returns 2の冪乗列
 */
export function generatePowersOf2(count: number): bigint[] {
  const result: bigint[] = [];
  let val = 1n;
  for (let i = 0; i < count; i++) {
    result.push(val);
    val *= 2n;
  }
  return result;
}

/**
 * カタラン数を n 個生成する
 * @param count - 生成する項数
 * @returns カタラン数列 (C(0) から)
 */
export function generateCatalan(count: number): bigint[] {
  if (count <= 0) return [];
  const result: bigint[] = [1n];
  for (let n = 1; n < count; n++) {
    // C(n) = C(n-1) * 2*(2n-1) / (n+1)
    const prev = result[n - 1];
    result.push((prev * BigInt(2 * (2 * n - 1))) / BigInt(n + 1));
  }
  return result;
}

/**
 * パドヴァン数列を n 個生成する
 * @param count - 生成する項数
 * @returns パドヴァン数列
 */
export function generatePadovan(count: number): bigint[] {
  if (count <= 0) return [];
  if (count === 1) return [1n];
  if (count === 2) return [1n, 1n];
  if (count === 3) return [1n, 1n, 1n];
  const seq: bigint[] = [1n, 1n, 1n];
  for (let i = 3; i < count; i++) {
    seq.push(seq[i - 2] + seq[i - 3]);
  }
  return seq.slice(0, count);
}

/**
 * 等差数列を n 項生成する
 * @param first - 初項
 * @param diff - 公差
 * @param count - 項数
 * @returns 等差数列
 */
export function generateArithmetic(first: number, diff: number, count: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(first + i * diff);
  }
  return result;
}

/**
 * 等比数列を n 項生成する
 * @param first - 初項
 * @param ratio - 公比
 * @param count - 項数
 * @returns 等比数列
 */
export function generateGeometric(first: number, ratio: number, count: number): number[] {
  const result: number[] = [];
  let val = first;
  for (let i = 0; i < count; i++) {
    result.push(val);
    val *= ratio;
  }
  return result;
}

/**
 * コラッツ数列を生成する（1に到達するまで、または maxSteps を超えるまで）
 * @param start - 開始値 (正の整数)
 * @param maxSteps - 最大ステップ数 (デフォルト: 10000)
 * @returns コラッツ数列
 */
export function generateCollatz(start: number, maxSteps = 10000): bigint[] {
  if (start <= 0 || !Number.isInteger(start)) return [];
  const seq: bigint[] = [BigInt(start)];
  let n = BigInt(start);
  let steps = 0;
  while (n !== 1n && steps < maxSteps) {
    if (n % 2n === 0n) {
      n = n / 2n;
    } else {
      n = 3n * n + 1n;
    }
    seq.push(n);
    steps++;
  }
  return seq;
}

/**
 * 数列を生成する統合関数
 * @param type - 数列の種類
 * @param count - 生成する項数 (Collatz の場合は開始値)
 * @param params - パラメーター (等差・等比・Collatz に使用)
 * @returns 生成された数列 (文字列配列)
 */
export function generateSequence(
  type: SequenceType,
  count: number,
  params: number[] = [],
): string[] {
  let result: (number | bigint)[];
  switch (type) {
    case "fibonacci":
      result = generateFibonacci(count);
      break;
    case "lucas":
      result = generateLucas(count);
      break;
    case "primes":
      result = generatePrimes(count);
      break;
    case "triangular":
      result = generateTriangular(count);
      break;
    case "square":
      result = generateSquare(count);
      break;
    case "cube":
      result = generateCube(count);
      break;
    case "powers-of-2":
      result = generatePowersOf2(count);
      break;
    case "catalan":
      result = generateCatalan(count);
      break;
    case "padovan":
      result = generatePadovan(count);
      break;
    case "arithmetic": {
      const [first = 1, diff = 2] = params;
      result = generateArithmetic(first, diff, count);
      break;
    }
    case "geometric": {
      const [first = 1, ratio = 2] = params;
      result = generateGeometric(first, ratio, count);
      break;
    }
    case "collatz": {
      const [start = 27] = params;
      result = generateCollatz(start);
      break;
    }
    default:
      result = [];
  }
  return result.map((n) => n.toString());
}
