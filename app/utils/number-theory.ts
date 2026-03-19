/**
 * 数論ツール ユーティリティ関数
 * GCD/LCM・素因数分解・素数判定・冪乗mod・モジュラー逆数・オイラー関数
 */

/** 上付き数字の対応表 */
const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

/**
 * 数値を上付き文字列に変換する
 * @param n - 変換する非負整数
 * @returns 上付き文字列
 */
function toSuperscript(n: number): string {
  return n.toString().split('').map(d => SUPERSCRIPTS[d] ?? d).join('');
}

/**
 * 2つの非負整数の最大公約数 (GCD) をユークリッドの互除法で計算する
 * @param a - 1つ目の整数
 * @param b - 2つ目の整数
 * @returns 最大公約数
 */
export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * 複数の整数の最大公約数を計算する
 * @param nums - 整数の配列
 * @returns 最大公約数
 */
export function gcdMultiple(nums: bigint[]): bigint {
  if (nums.length === 0) return 0n;
  return nums.reduce((acc, n) => gcd(acc, n));
}

/**
 * 2つの非負整数の最小公倍数 (LCM) を計算する
 * @param a - 1つ目の整数
 * @param b - 2つ目の整数
 * @returns 最小公倍数
 */
export function lcm(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  const absA = a < 0n ? -a : a;
  const absB = b < 0n ? -b : b;
  return (absA / gcd(absA, absB)) * absB;
}

/**
 * 複数の整数の最小公倍数を計算する
 * @param nums - 整数の配列
 * @returns 最小公倍数
 */
export function lcmMultiple(nums: bigint[]): bigint {
  if (nums.length === 0) return 0n;
  return nums.reduce((acc, n) => lcm(acc, n));
}

/**
 * 素数判定 (試し割り法)
 * @param n - 判定する整数
 * @returns 素数であれば true
 */
export function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  if (n === 2n) return true;
  if (n % 2n === 0n) return false;
  if (n === 3n) return true;
  if (n % 3n === 0n) return false;
  for (let i = 5n; i * i <= n; i += 6n) {
    if (n % i === 0n || n % (i + 2n) === 0n) return false;
  }
  return true;
}

/**
 * 素因数のリストを返す（昇順、重複あり）
 * @param n - 素因数分解する正の整数
 * @returns 素因数のリスト
 */
export function primeFactors(n: bigint): bigint[] {
  if (n <= 1n) return [];
  const factors: bigint[] = [];
  let d = 2n;
  while (d * d <= n) {
    while (n % d === 0n) {
      factors.push(d);
      n = n / d;
    }
    d += 1n;
  }
  if (n > 1n) factors.push(n);
  return factors;
}

/**
 * 素因数分解を {素因数 → 指数} の Map で返す
 * @param n - 素因数分解する正の整数
 * @returns 素因数とその指数のマップ
 */
export function primeFactorization(n: bigint): Map<bigint, number> {
  const factors = primeFactors(n);
  const map = new Map<bigint, number>();
  for (const f of factors) {
    map.set(f, (map.get(f) ?? 0) + 1);
  }
  return map;
}

/**
 * 素因数分解を数式文字列に変換する
 * 例: 12n → "2² × 3"
 * @param n - 変換する正の整数
 * @returns 素因数分解の数式文字列
 */
export function factorizationToString(n: bigint): string {
  if (n <= 1n) return n.toString();
  const factorization = primeFactorization(n);
  return [...factorization.entries()]
    .map(([p, e]) => e === 1 ? p.toString() : `${p}${toSuperscript(e)}`)
    .join(' × ');
}

/**
 * オイラーのトーシェント関数 φ(n)
 * n 以下で n と互いに素な正の整数の個数を返す
 * @param n - 正の整数
 * @returns φ(n) の値
 */
export function eulerTotient(n: bigint): bigint {
  if (n <= 0n) return 0n;
  if (n === 1n) return 1n;
  let result = n;
  const factorization = primeFactorization(n);
  for (const [p] of factorization) {
    result = (result / p) * (p - 1n);
  }
  return result;
}

/**
 * 冪乗モジュロ: base^exp mod m をバイナリ法で高速計算する
 * @param base - 底
 * @param exp - 指数（非負）
 * @param mod - 法（正の整数）
 * @returns base^exp mod m の値
 */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod === 1n) return 0n;
  let result = 1n;
  base = ((base % mod) + mod) % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

/**
 * 拡張ユークリッドの互除法
 * ax + by = gcd(a, b) となる (gcd, x, y) を返す
 * @param a - 1つ目の整数
 * @param b - 2つ目の整数
 * @returns [gcd, x, y]
 */
function extGcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = extGcd(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

/**
 * モジュラー逆数: a * x ≡ 1 (mod m) となる x を返す
 * gcd(a, m) ≠ 1 の場合は null を返す
 * @param a - 整数
 * @param m - 法（正の整数）
 * @returns モジュラー逆数、存在しない場合は null
 */
export function modInverse(a: bigint, m: bigint): bigint | null {
  const normalizedA = ((a % m) + m) % m;
  const [g, x] = extGcd(normalizedA, m);
  if (g !== 1n) return null;
  return ((x % m) + m) % m;
}

/**
 * 文字列を bigint に変換する（エラー時は null）
 * @param s - 変換する文字列
 * @returns bigint または null
 */
export function parseBigInt(s: string): bigint | null {
  const trimmed = s.trim();
  if (trimmed === '' || !/^-?\d+$/.test(trimmed)) return null;
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}
