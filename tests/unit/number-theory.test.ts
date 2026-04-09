import { describe, expect, it } from "vite-plus/test";
import {
  gcd,
  gcdMultiple,
  lcm,
  lcmMultiple,
  isPrime,
  primeFactors,
  primeFactorization,
  factorizationToString,
  eulerTotient,
  modPow,
  modInverse,
  parseBigInt,
} from "../../app/utils/number-theory";

describe("gcd", () => {
  it("2つの正の整数の GCD を正しく計算する", () => {
    expect(gcd(12n, 8n)).toBe(4n);
    expect(gcd(100n, 75n)).toBe(25n);
    expect(gcd(17n, 13n)).toBe(1n);
  });

  it("一方が0の場合はもう一方を返す", () => {
    expect(gcd(0n, 5n)).toBe(5n);
    expect(gcd(5n, 0n)).toBe(5n);
  });

  it("両方が同じ場合はその値を返す", () => {
    expect(gcd(7n, 7n)).toBe(7n);
  });

  it("負の数も正しく処理する", () => {
    expect(gcd(-12n, 8n)).toBe(4n);
    expect(gcd(12n, -8n)).toBe(4n);
  });

  it("GCD は常に非負", () => {
    expect(gcd(15n, 10n) > 0n).toBe(true);
  });
});

describe("gcdMultiple", () => {
  it("複数の整数の GCD を計算する", () => {
    expect(gcdMultiple([12n, 8n, 4n])).toBe(4n);
    expect(gcdMultiple([100n, 75n, 50n])).toBe(25n);
  });

  it("空配列の場合は 0 を返す", () => {
    expect(gcdMultiple([])).toBe(0n);
  });

  it("要素が1つの場合はその値を返す", () => {
    expect(gcdMultiple([7n])).toBe(7n);
  });
});

describe("lcm", () => {
  it("2つの正の整数の LCM を正しく計算する", () => {
    expect(lcm(4n, 6n)).toBe(12n);
    expect(lcm(3n, 5n)).toBe(15n);
    expect(lcm(12n, 8n)).toBe(24n);
  });

  it("一方が0の場合は0を返す", () => {
    expect(lcm(0n, 5n)).toBe(0n);
    expect(lcm(5n, 0n)).toBe(0n);
  });

  it("同じ数の LCM はその数自身", () => {
    expect(lcm(7n, 7n)).toBe(7n);
  });

  it("GCD × LCM = a × b (2数の場合)", () => {
    const a = 12n,
      b = 8n;
    expect(gcd(a, b) * lcm(a, b)).toBe(a * b);
  });
});

describe("lcmMultiple", () => {
  it("複数の整数の LCM を計算する", () => {
    expect(lcmMultiple([3n, 4n, 5n])).toBe(60n);
    expect(lcmMultiple([2n, 3n, 4n])).toBe(12n);
  });

  it("空配列の場合は 0 を返す", () => {
    expect(lcmMultiple([])).toBe(0n);
  });
});

describe("isPrime", () => {
  it("素数を正しく判定する", () => {
    expect(isPrime(2n)).toBe(true);
    expect(isPrime(3n)).toBe(true);
    expect(isPrime(5n)).toBe(true);
    expect(isPrime(7n)).toBe(true);
    expect(isPrime(11n)).toBe(true);
    expect(isPrime(13n)).toBe(true);
    expect(isPrime(97n)).toBe(true);
    expect(isPrime(9973n)).toBe(true);
  });

  it("合成数は素数でない", () => {
    expect(isPrime(1n)).toBe(false);
    expect(isPrime(4n)).toBe(false);
    expect(isPrime(6n)).toBe(false);
    expect(isPrime(9n)).toBe(false);
    expect(isPrime(100n)).toBe(false);
    expect(isPrime(1000n)).toBe(false);
  });

  it("0 と負の数は素数でない", () => {
    expect(isPrime(0n)).toBe(false);
    expect(isPrime(-1n)).toBe(false);
    expect(isPrime(-7n)).toBe(false);
  });
});

describe("primeFactors", () => {
  it("12 の素因数を返す", () => {
    expect(primeFactors(12n)).toEqual([2n, 2n, 3n]);
  });

  it("360 の素因数を返す", () => {
    expect(primeFactors(360n)).toEqual([2n, 2n, 2n, 3n, 3n, 5n]);
  });

  it("素数の素因数はその数自身のみ", () => {
    expect(primeFactors(7n)).toEqual([7n]);
    expect(primeFactors(13n)).toEqual([13n]);
  });

  it("1 は空配列を返す", () => {
    expect(primeFactors(1n)).toEqual([]);
  });

  it("0 は空配列を返す", () => {
    expect(primeFactors(0n)).toEqual([]);
  });
});

describe("primeFactorization", () => {
  it("12 = 2^2 × 3^1", () => {
    const result = primeFactorization(12n);
    expect(result.get(2n)).toBe(2);
    expect(result.get(3n)).toBe(1);
  });

  it("360 = 2^3 × 3^2 × 5^1", () => {
    const result = primeFactorization(360n);
    expect(result.get(2n)).toBe(3);
    expect(result.get(3n)).toBe(2);
    expect(result.get(5n)).toBe(1);
  });
});

describe("factorizationToString", () => {
  it('12 を "2² × 3" に変換する', () => {
    expect(factorizationToString(12n)).toBe("2² × 3");
  });

  it('360 を "2³ × 3² × 5" に変換する', () => {
    expect(factorizationToString(360n)).toBe("2³ × 3² × 5");
  });

  it("素数はそのまま返す", () => {
    expect(factorizationToString(7n)).toBe("7");
  });

  it('1 は "1" を返す', () => {
    expect(factorizationToString(1n)).toBe("1");
  });
});

describe("eulerTotient", () => {
  it("φ(1) = 1", () => {
    expect(eulerTotient(1n)).toBe(1n);
  });

  it("素数 p に対して φ(p) = p - 1", () => {
    expect(eulerTotient(7n)).toBe(6n);
    expect(eulerTotient(13n)).toBe(12n);
    expect(eulerTotient(17n)).toBe(16n);
  });

  it("φ(12) = 4", () => {
    expect(eulerTotient(12n)).toBe(4n);
  });

  it("φ(36) = 12", () => {
    expect(eulerTotient(36n)).toBe(12n);
  });

  it("φ(100) = 40", () => {
    expect(eulerTotient(100n)).toBe(40n);
  });

  it("非正の整数は 0 を返す", () => {
    expect(eulerTotient(0n)).toBe(0n);
    expect(eulerTotient(-1n)).toBe(0n);
  });
});

describe("modPow", () => {
  it("2^10 mod 1000 = 24", () => {
    expect(modPow(2n, 10n, 1000n)).toBe(24n);
  });

  it("3^4 mod 5 = 1", () => {
    expect(modPow(3n, 4n, 5n)).toBe(1n);
  });

  it("任意の数の 0 乗 mod m = 1（m > 1 の場合）", () => {
    expect(modPow(5n, 0n, 7n)).toBe(1n);
    expect(modPow(100n, 0n, 3n)).toBe(1n);
  });

  it("mod = 1 の場合は 0 を返す", () => {
    expect(modPow(5n, 3n, 1n)).toBe(0n);
  });

  it("負の底も正しく処理する", () => {
    expect(modPow(-3n, 2n, 10n)).toBe(9n);
  });

  it("大きな数でも正確に計算する", () => {
    // フェルマーの小定理: a^(p-1) ≡ 1 (mod p) for prime p, gcd(a,p)=1
    expect(modPow(2n, 16n, 17n)).toBe(1n);
  });
});

describe("modInverse", () => {
  it("3^{-1} mod 11 = 4（3 × 4 = 12 ≡ 1 mod 11）", () => {
    const inv = modInverse(3n, 11n);
    expect(inv).toBe(4n);
    expect((3n * 4n) % 11n).toBe(1n);
  });

  it("2^{-1} mod 5 = 3", () => {
    const inv = modInverse(2n, 5n);
    expect(inv).toBe(3n);
    expect((2n * 3n) % 5n).toBe(1n);
  });

  it("gcd(a, m) ≠ 1 の場合は null を返す", () => {
    expect(modInverse(2n, 4n)).toBeNull();
    expect(modInverse(6n, 9n)).toBeNull();
  });

  it("負の数も正しく処理する", () => {
    const inv = modInverse(-3n, 11n);
    expect(inv).not.toBeNull();
    if (inv !== null) {
      expect(((((-3n % 11n) + 11n) % 11n) * inv) % 11n).toBe(1n);
    }
  });
});

describe("parseBigInt", () => {
  it("正の整数を正しく変換する", () => {
    expect(parseBigInt("123")).toBe(123n);
    expect(parseBigInt("0")).toBe(0n);
  });

  it("負の整数を正しく変換する", () => {
    expect(parseBigInt("-5")).toBe(-5n);
  });

  it("前後のスペースを無視する", () => {
    expect(parseBigInt("  42  ")).toBe(42n);
  });

  it("不正な入力には null を返す", () => {
    expect(parseBigInt("")).toBeNull();
    expect(parseBigInt("abc")).toBeNull();
    expect(parseBigInt("1.5")).toBeNull();
    expect(parseBigInt("1e5")).toBeNull();
  });
});
