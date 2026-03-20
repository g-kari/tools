import { describe, it, expect } from "vitest";
import { calcEntropy, getEntropyLevel } from "../../app/routes/entropy";

describe("calcEntropy", () => {
  it("空文字列の場合は null を返す", () => {
    expect(calcEntropy("")).toBeNull();
  });

  it("1文字のテキストはエントロピー 0 になる", () => {
    const result = calcEntropy("a");
    expect(result).not.toBeNull();
    expect(result!.entropy).toBe(0);
    expect(result!.charCount).toBe(1);
    expect(result!.uniqueChars).toBe(1);
    expect(result!.totalBits).toBe(0);
  });

  it("すべて同じ文字ならエントロピー 0 になる", () => {
    const result = calcEntropy("aaaa");
    expect(result).not.toBeNull();
    expect(result!.entropy).toBe(0);
    expect(result!.charCount).toBe(4);
    expect(result!.uniqueChars).toBe(1);
  });

  it("2種類の文字が均等に出現するとエントロピーは 1 になる", () => {
    const result = calcEntropy("abab");
    expect(result).not.toBeNull();
    expect(result!.entropy).toBeCloseTo(1.0, 5);
    expect(result!.uniqueChars).toBe(2);
    expect(result!.maxEntropy).toBeCloseTo(1.0, 5);
    expect(result!.normalized).toBeCloseTo(1.0, 5);
  });

  it("4種類均等 → エントロピーは log2(4) = 2 になる", () => {
    const result = calcEntropy("abcd");
    expect(result).not.toBeNull();
    expect(result!.entropy).toBeCloseTo(2.0, 5);
    expect(result!.uniqueChars).toBe(4);
    expect(result!.maxEntropy).toBeCloseTo(2.0, 5);
    expect(result!.normalized).toBeCloseTo(1.0, 5);
  });

  it("charCount が入力長と一致する", () => {
    const text = "hello world";
    const result = calcEntropy(text);
    expect(result!.charCount).toBe(text.length);
  });

  it("totalBits = entropy × charCount になる", () => {
    const result = calcEntropy("hello");
    expect(result).not.toBeNull();
    expect(result!.totalBits).toBeCloseTo(result!.entropy * result!.charCount, 10);
  });

  it("frequencies は出現回数の多い順にソートされる", () => {
    const result = calcEntropy("aaabbc");
    expect(result).not.toBeNull();
    const counts = result!.frequencies.map((f) => f.count);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i - 1]).toBeGreaterThanOrEqual(counts[i]);
    }
  });

  it("frequencies の probability の合計は 1 になる", () => {
    const result = calcEntropy("hello world");
    expect(result).not.toBeNull();
    const sum = result!.frequencies.reduce((acc, f) => acc + f.probability, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it("日本語文字列でも正しく計算できる", () => {
    const result = calcEntropy("あいうえお");
    expect(result).not.toBeNull();
    expect(result!.charCount).toBe(5);
    expect(result!.uniqueChars).toBe(5);
    expect(result!.entropy).toBeCloseTo(Math.log2(5), 5);
  });

  it("正規化エントロピーは 0〜1 の範囲になる", () => {
    const texts = ["aaaa", "abcd", "hello world", "1234567890"];
    for (const text of texts) {
      const result = calcEntropy(text);
      expect(result!.normalized).toBeGreaterThanOrEqual(0);
      expect(result!.normalized).toBeLessThanOrEqual(1 + 1e-10);
    }
  });

  it("各文字の bits = -log2(probability) になる", () => {
    const result = calcEntropy("aabb");
    expect(result).not.toBeNull();
    for (const freq of result!.frequencies) {
      const expected = -Math.log2(freq.probability);
      expect(freq.bits).toBeCloseTo(expected, 10);
    }
  });
});

describe("getEntropyLevel", () => {
  it("normalized >= 0.8 は高レベル", () => {
    expect(getEntropyLevel(0.8).cls).toBe("entropy-level--high");
    expect(getEntropyLevel(1.0).cls).toBe("entropy-level--high");
    expect(getEntropyLevel(0.95).label).toContain("高");
  });

  it("0.5 <= normalized < 0.8 は中レベル", () => {
    expect(getEntropyLevel(0.5).cls).toBe("entropy-level--medium");
    expect(getEntropyLevel(0.79).cls).toBe("entropy-level--medium");
    expect(getEntropyLevel(0.6).label).toContain("中");
  });

  it("normalized < 0.5 は低レベル", () => {
    expect(getEntropyLevel(0.0).cls).toBe("entropy-level--low");
    expect(getEntropyLevel(0.49).cls).toBe("entropy-level--low");
    expect(getEntropyLevel(0.1).label).toContain("低");
  });
});
