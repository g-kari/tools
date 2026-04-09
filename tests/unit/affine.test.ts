import { describe, expect, it } from "vite-plus/test";
import {
  encodeAffine,
  decodeAffine,
  bruteForceAffine,
  isValidA,
  VALID_A_VALUES,
} from "../../app/utils/affine";

describe("isValidA", () => {
  it("有効な a 値を正しく判定する", () => {
    for (const a of VALID_A_VALUES) {
      expect(isValidA(a)).toBe(true);
    }
  });

  it("無効な a 値を正しく判定する", () => {
    expect(isValidA(0)).toBe(false);
    expect(isValidA(2)).toBe(false);
    expect(isValidA(4)).toBe(false);
    expect(isValidA(13)).toBe(false);
    expect(isValidA(26)).toBe(false);
  });
});

describe("encodeAffine", () => {
  it("基本的なエンコードが動作する（a=5, b=8）", () => {
    // 'A'(0) -> (5*0+8)%26 = 8 -> 'I'
    // 'B'(1) -> (5*1+8)%26 = 13 -> 'N'
    expect(encodeAffine("AB", 5, 8)).toBe("IN");
  });

  it("a=1 のときはシーザー暗号と同等になる", () => {
    // a=1, b=3 は ROT-3 と同等
    const text = "Hello World";
    const result = encodeAffine(text, 1, 3);
    expect(result).toBe("Khoor Zruog");
  });

  it("大文字・小文字を独立して変換する", () => {
    const result = encodeAffine("aAbBzZ", 5, 8);
    // 'a'(0) -> 'i', 'A'(0) -> 'I', 'b'(1) -> 'n', 'B'(1) -> 'N'
    // 'z'(25) -> (5*25+8)%26 = (125+8)%26 = 133%26 = 3 -> 'd'
    // 'Z'(25) -> 'D'
    expect(result).toBe("iInNdD");
  });

  it("英字以外の文字はそのまま保持する", () => {
    expect(encodeAffine("Hello, World! 123", 5, 8)).toContain(",");
    expect(encodeAffine("Hello, World! 123", 5, 8)).toContain("!");
    expect(encodeAffine("Hello, World! 123", 5, 8)).toContain("123");
  });

  it("空文字列を正しく処理する", () => {
    expect(encodeAffine("", 5, 8)).toBe("");
  });

  it("無効な a 値の場合は元のテキストを返す", () => {
    expect(encodeAffine("Hello", 2, 5)).toBe("Hello");
  });

  it("b が 25 を超えた場合も正規化して処理する", () => {
    // b=26 は b=0 と同等
    expect(encodeAffine("A", 1, 26)).toBe(encodeAffine("A", 1, 0));
  });
});

describe("decodeAffine", () => {
  it("エンコードの逆変換として動作する", () => {
    const original = "Hello World";
    const encoded = encodeAffine(original, 5, 8);
    const decoded = decodeAffine(encoded, 5, 8);
    expect(decoded).toBe(original);
  });

  it("全ての有効な a 値でエンコード・デコードが可逆となる", () => {
    const text = "The Quick Brown Fox";
    for (const a of VALID_A_VALUES) {
      for (const b of [0, 5, 13, 25]) {
        const encoded = encodeAffine(text, a, b);
        const decoded = decodeAffine(encoded, a, b);
        expect(decoded).toBe(text);
      }
    }
  });

  it("英字以外の文字はそのまま保持する", () => {
    const text = "Hi! 2025年";
    const encoded = encodeAffine(text, 7, 3);
    const decoded = decodeAffine(encoded, 7, 3);
    expect(decoded).toBe(text);
  });

  it("空文字列を正しく処理する", () => {
    expect(decodeAffine("", 5, 8)).toBe("");
  });
});

describe("bruteForceAffine", () => {
  it("312通りの結果を返す（12種の a × 26種の b）", () => {
    const results = bruteForceAffine("Test");
    expect(results).toHaveLength(312);
  });

  it("各要素に a, b, result プロパティが含まれる", () => {
    const results = bruteForceAffine("AB");
    for (const item of results) {
      expect(item).toHaveProperty("a");
      expect(item).toHaveProperty("b");
      expect(item).toHaveProperty("result");
      expect(typeof item.a).toBe("number");
      expect(typeof item.b).toBe("number");
      expect(typeof item.result).toBe("string");
    }
  });

  it("空文字列でも正しく動作する", () => {
    const results = bruteForceAffine("");
    expect(results).toHaveLength(312);
    expect(results.every((r) => r.result === "")).toBe(true);
  });

  it("有効な a 値のみが結果に含まれる", () => {
    const results = bruteForceAffine("Hello");
    const uniqueA = [...new Set(results.map((r) => r.a))].sort((a, b) => a - b);
    expect(uniqueA).toEqual([...VALID_A_VALUES].sort((a, b) => a - b));
  });

  it("元のテキストをエンコードしたものをブルートフォースすると元のテキストが含まれる", () => {
    const original = "HELLO";
    const encoded = encodeAffine(original, 7, 10);
    const results = bruteForceAffine(encoded);
    const match = results.find((r) => r.result === original);
    expect(match).toBeDefined();
    expect(match?.a).toBe(7);
    expect(match?.b).toBe(10);
  });
});
