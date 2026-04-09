import { describe, expect, it } from "vite-plus/test";
import {
  levenshteinDistance,
  levenshteinSimilarity,
  jaroSimilarity,
  jaroWinklerSimilarity,
  cosineSimilarity,
  hammingDistance,
  hammingSimilarity,
  calculateSimilarity,
} from "../../app/utils/string-similarity";

describe("levenshteinDistance", () => {
  it("同一文字列は距離 0", () => {
    expect(levenshteinDistance("abc", "abc")).toBe(0);
    expect(levenshteinDistance("", "")).toBe(0);
  });

  it("一方が空文字列の場合は他方の長さ", () => {
    expect(levenshteinDistance("", "abc")).toBe(3);
    expect(levenshteinDistance("abc", "")).toBe(3);
  });

  it("kitten → sitting は 3", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });

  it("saturday → sunday は 3", () => {
    expect(levenshteinDistance("saturday", "sunday")).toBe(3);
  });

  it("1文字置換は 1", () => {
    expect(levenshteinDistance("cat", "bat")).toBe(1);
  });

  it("1文字挿入は 1", () => {
    expect(levenshteinDistance("cat", "cats")).toBe(1);
  });

  it("1文字削除は 1", () => {
    expect(levenshteinDistance("cats", "cat")).toBe(1);
  });

  it("完全に異なる文字列は最大長", () => {
    expect(levenshteinDistance("abc", "xyz")).toBe(3);
  });
});

describe("levenshteinSimilarity", () => {
  it("同一文字列は 1", () => {
    expect(levenshteinSimilarity("abc", "abc")).toBe(1);
  });

  it("空文字列同士は 1", () => {
    expect(levenshteinSimilarity("", "")).toBe(1);
  });

  it("完全不一致は 0", () => {
    expect(levenshteinSimilarity("abc", "xyz")).toBe(0);
  });

  it("kitten と sitting の類似度は 0.5714... 以上", () => {
    const sim = levenshteinSimilarity("kitten", "sitting");
    // 距離3, max長7 → 1 - 3/7 ≈ 0.571
    expect(sim).toBeCloseTo(0.5714, 3);
  });

  it("類似度は 0〜1 の範囲", () => {
    const pairs = [
      ["hello", "world"],
      ["abc", "abcd"],
      ["test", ""],
    ] as const;
    for (const [a, b] of pairs) {
      const sim = levenshteinSimilarity(a, b);
      expect(sim).toBeGreaterThanOrEqual(0);
      expect(sim).toBeLessThanOrEqual(1);
    }
  });
});

describe("jaroSimilarity", () => {
  it("同一文字列は 1", () => {
    expect(jaroSimilarity("abc", "abc")).toBe(1);
  });

  it("空文字列同士は 0", () => {
    expect(jaroSimilarity("", "")).toBe(0);
  });

  it("一方が空文字列は 0", () => {
    expect(jaroSimilarity("abc", "")).toBe(0);
    expect(jaroSimilarity("", "abc")).toBe(0);
  });

  it("MARTHA と MARHTA の Jaro 類似度は約 0.944", () => {
    const sim = jaroSimilarity("MARTHA", "MARHTA");
    expect(sim).toBeCloseTo(0.9444, 3);
  });

  it("結果は 0〜1 の範囲", () => {
    const sim = jaroSimilarity("hello", "world");
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });
});

describe("jaroWinklerSimilarity", () => {
  it("同一文字列は 1", () => {
    expect(jaroWinklerSimilarity("abc", "abc")).toBe(1);
  });

  it("空文字列同士は 0", () => {
    expect(jaroWinklerSimilarity("", "")).toBe(0);
  });

  it("共通プレフィックスがある場合、Jaro より高い値", () => {
    const jaro = jaroSimilarity("MARTHA", "MARHTA");
    const jaroWinkler = jaroWinklerSimilarity("MARTHA", "MARHTA");
    expect(jaroWinkler).toBeGreaterThan(jaro);
  });

  it("プレフィックスなし場合、Jaro と同値", () => {
    const a = "xyz";
    const b = "abc";
    // 共通プレフィックスがない場合は同値
    expect(jaroWinklerSimilarity(a, b)).toBeCloseTo(jaroSimilarity(a, b), 10);
  });

  it("結果は 0〜1 の範囲", () => {
    const sim = jaroWinklerSimilarity("hello", "world");
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });
});

describe("cosineSimilarity", () => {
  it("同一文字列は 1", () => {
    expect(cosineSimilarity("abc", "abc")).toBe(1);
  });

  it("空文字列同士は 0", () => {
    expect(cosineSimilarity("", "")).toBe(0);
  });

  it("一方が空文字列は 0", () => {
    expect(cosineSimilarity("abc", "")).toBe(0);
    expect(cosineSimilarity("", "abc")).toBe(0);
  });

  it("全く異なる bigram を持つ文字列は 0", () => {
    // 'ab' と 'xy' は bigram が全く異なる
    expect(cosineSimilarity("ab", "xy")).toBe(0);
  });

  it("bigram が部分的に重なる場合は 0〜1 の値", () => {
    const sim = cosineSimilarity("abc", "bcd");
    // {ab, bc} と {bc, cd} → 共通は {bc}
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  it("結果は 0〜1 の範囲", () => {
    const sim = cosineSimilarity("hello world", "world hello");
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });
});

describe("hammingDistance", () => {
  it("同一文字列は 0", () => {
    expect(hammingDistance("abc", "abc")).toBe(0);
    expect(hammingDistance("", "")).toBe(0);
  });

  it("1文字異なる場合は 1", () => {
    expect(hammingDistance("abc", "axc")).toBe(1);
  });

  it("全文字異なる場合は文字列長", () => {
    expect(hammingDistance("abc", "xyz")).toBe(3);
  });

  it("長さが異なる場合は null", () => {
    expect(hammingDistance("abc", "ab")).toBeNull();
    expect(hammingDistance("ab", "abc")).toBeNull();
  });

  it("ABCDE と ABXYE の距離は 2", () => {
    expect(hammingDistance("ABCDE", "ABXYE")).toBe(2);
  });
});

describe("hammingSimilarity", () => {
  it("同一文字列は 1", () => {
    expect(hammingSimilarity("abc", "abc")).toBe(1);
  });

  it("空文字列同士は 1", () => {
    expect(hammingSimilarity("", "")).toBe(1);
  });

  it("長さが異なる場合は null", () => {
    expect(hammingSimilarity("abc", "ab")).toBeNull();
  });

  it("全文字異なる場合は 0", () => {
    expect(hammingSimilarity("abc", "xyz")).toBe(0);
  });

  it("1文字異なる 3文字列は 約 0.666", () => {
    const sim = hammingSimilarity("abc", "axc");
    expect(sim).toBeCloseTo(2 / 3, 5);
  });
});

describe("calculateSimilarity", () => {
  it("同一文字列で全指標が最大値", () => {
    const r = calculateSimilarity("hello", "hello");
    expect(r.levenshteinDistance).toBe(0);
    expect(r.levenshteinSimilarity).toBe(1);
    expect(r.jaroWinkler).toBe(1);
    expect(r.cosine).toBe(1);
    expect(r.hammingDistance).toBe(0);
    expect(r.hammingSimilarity).toBe(1);
  });

  it("長さの異なる文字列で Hamming 系は null", () => {
    const r = calculateSimilarity("hello", "hi");
    expect(r.hammingDistance).toBeNull();
    expect(r.hammingSimilarity).toBeNull();
  });

  it("空文字列同士", () => {
    const r = calculateSimilarity("", "");
    expect(r.levenshteinDistance).toBe(0);
    expect(r.levenshteinSimilarity).toBe(1);
  });

  it("全指標が 0〜1 の範囲（距離系除く）", () => {
    const r = calculateSimilarity("kitten", "sitting");
    expect(r.levenshteinSimilarity).toBeGreaterThanOrEqual(0);
    expect(r.levenshteinSimilarity).toBeLessThanOrEqual(1);
    expect(r.jaroWinkler).toBeGreaterThanOrEqual(0);
    expect(r.jaroWinkler).toBeLessThanOrEqual(1);
    expect(r.cosine).toBeGreaterThanOrEqual(0);
    expect(r.cosine).toBeLessThanOrEqual(1);
  });
});
