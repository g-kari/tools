import { describe, it, expect } from "vite-plus/test";
import {
  gcd,
  simplifyFraction,
  toMixedNumber,
  decimalToFraction,
  fractionToDecimal,
} from "../../app/routes/fraction";

describe("gcd - 最大公約数", () => {
  it("基本的なケースを正しく計算する", () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(15, 10)).toBe(5);
    expect(gcd(7, 3)).toBe(1);
    expect(gcd(100, 75)).toBe(25);
  });

  it("同じ値の場合は自分自身を返す", () => {
    expect(gcd(6, 6)).toBe(6);
    expect(gcd(1, 1)).toBe(1);
  });

  it("一方が0の場合", () => {
    expect(gcd(5, 0)).toBe(5);
    expect(gcd(0, 5)).toBe(5);
  });

  it("負の値も正しく処理する", () => {
    expect(gcd(-12, 8)).toBe(4);
    expect(gcd(12, -8)).toBe(4);
  });
});

describe("simplifyFraction - 分数の約分", () => {
  it("2/4 → 1/2 に約分する", () => {
    const result = simplifyFraction(2, 4);
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(2);
  });

  it("6/9 → 2/3 に約分する", () => {
    const result = simplifyFraction(6, 9);
    expect(result.numerator).toBe(2);
    expect(result.denominator).toBe(3);
  });

  it("既約分数はそのまま返す", () => {
    const result = simplifyFraction(3, 7);
    expect(result.numerator).toBe(3);
    expect(result.denominator).toBe(7);
  });

  it("負の分子を正しく処理する", () => {
    const result = simplifyFraction(-3, 6);
    expect(result.numerator).toBe(-1);
    expect(result.denominator).toBe(2);
  });

  it("負の分母を正しく処理する", () => {
    const result = simplifyFraction(3, -6);
    expect(result.numerator).toBe(-1);
    expect(result.denominator).toBe(2);
  });

  it("分母が0の場合はエラーを投げる", () => {
    expect(() => simplifyFraction(1, 0)).toThrow("分母は0にできません");
  });

  it("分子が0の場合", () => {
    const result = simplifyFraction(0, 5);
    expect(result.numerator).toBe(0);
    expect(result.denominator).toBe(1);
  });
});

describe("toMixedNumber - 帯分数変換", () => {
  it("7/4 → 1 と 3/4 に変換する", () => {
    const result = toMixedNumber(7, 4);
    expect(result).not.toBeNull();
    expect(result!.whole).toBe(1);
    expect(result!.numerator).toBe(3);
    expect(result!.denominator).toBe(4);
  });

  it("3/2 → 1 と 1/2 に変換する", () => {
    const result = toMixedNumber(3, 2);
    expect(result).not.toBeNull();
    expect(result!.whole).toBe(1);
    expect(result!.numerator).toBe(1);
    expect(result!.denominator).toBe(2);
  });

  it("真分数（分子 < 分母）は null を返す", () => {
    expect(toMixedNumber(1, 3)).toBeNull();
    expect(toMixedNumber(3, 4)).toBeNull();
  });

  it("分母が0の場合は null を返す", () => {
    expect(toMixedNumber(1, 0)).toBeNull();
  });

  it("整数（余りなし）は numerator=0 を返す", () => {
    const result = toMixedNumber(6, 3);
    expect(result).not.toBeNull();
    expect(result!.whole).toBe(2);
    expect(result!.numerator).toBe(0);
  });
});

describe("decimalToFraction - 小数→分数変換", () => {
  it("0.5 → 1/2", () => {
    const result = decimalToFraction(0.5);
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(2);
  });

  it("0.75 → 3/4", () => {
    const result = decimalToFraction(0.75);
    expect(result.numerator).toBe(3);
    expect(result.denominator).toBe(4);
  });

  it("0.25 → 1/4", () => {
    const result = decimalToFraction(0.25);
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(4);
  });

  it("0.2 → 1/5", () => {
    const result = decimalToFraction(0.2);
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(5);
  });

  it("0.1 → 1/10", () => {
    const result = decimalToFraction(0.1);
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(10);
  });

  it("0.333... → 1/3 の近似", () => {
    const result = decimalToFraction(1 / 3);
    const decimal = result.numerator / result.denominator;
    expect(Math.abs(decimal - 1 / 3)).toBeLessThan(1e-9);
  });

  it("整数は分母1として返す", () => {
    const result = decimalToFraction(3);
    expect(result.numerator).toBe(3);
    expect(result.denominator).toBe(1);
  });

  it("負の小数を正しく変換する", () => {
    const result = decimalToFraction(-0.5);
    expect(result.numerator).toBe(-1);
    expect(result.denominator).toBe(2);
  });

  it("1.5 → 3/2", () => {
    const result = decimalToFraction(1.5);
    expect(result.numerator).toBe(3);
    expect(result.denominator).toBe(2);
  });

  it("0 を正しく変換する", () => {
    const result = decimalToFraction(0);
    expect(result.numerator).toBe(0);
    expect(result.denominator).toBe(1);
  });

  it("Infinity でエラーを投げる", () => {
    expect(() => decimalToFraction(Infinity)).toThrow();
  });
});

describe("fractionToDecimal - 分数→小数変換", () => {
  it("1/2 → 0.5", () => {
    expect(fractionToDecimal(1, 2)).toBe("0.5");
  });

  it("3/4 → 0.75", () => {
    expect(fractionToDecimal(3, 4)).toBe("0.75");
  });

  it("1/3 → 0.333... の近似", () => {
    const result = parseFloat(fractionToDecimal(1, 3));
    expect(Math.abs(result - 1 / 3)).toBeLessThan(1e-9);
  });

  it("整数の分数は整数文字列を返す", () => {
    expect(fractionToDecimal(6, 3)).toBe("2");
    expect(fractionToDecimal(4, 2)).toBe("2");
  });

  it("負の分数を正しく変換する", () => {
    expect(fractionToDecimal(-1, 2)).toBe("-0.5");
  });

  it("分母が0の場合はエラーを投げる", () => {
    expect(() => fractionToDecimal(1, 0)).toThrow("分母は0にできません");
  });

  it("0/5 → 0", () => {
    expect(fractionToDecimal(0, 5)).toBe("0");
  });
});
