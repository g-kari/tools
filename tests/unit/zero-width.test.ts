import { describe, it, expect } from "vite-plus/test";
import {
  detectZeroWidthChars,
  removeZeroWidthChars,
  formatCodePoint,
  ZERO_WIDTH_CHARS,
} from "../../app/utils/zero-width";

describe("detectZeroWidthChars", () => {
  it("ゼロ幅文字がないテキストでは hasZeroWidthChars が false", () => {
    const result = detectZeroWidthChars("Hello, World!");
    expect(result.hasZeroWidthChars).toBe(false);
    expect(result.totalCount).toBe(0);
    expect(result.detected).toHaveLength(0);
  });

  it("空文字列では hasZeroWidthChars が false", () => {
    const result = detectZeroWidthChars("");
    expect(result.hasZeroWidthChars).toBe(false);
    expect(result.totalCount).toBe(0);
  });

  it("ZERO WIDTH SPACE (U+200B) を検出できる", () => {
    const result = detectZeroWidthChars("Hello\u200BWorld");
    expect(result.hasZeroWidthChars).toBe(true);
    expect(result.totalCount).toBe(1);
    expect(result.detected).toHaveLength(1);
    expect(result.detected[0].def.codePoint).toBe(0x200b);
    expect(result.detected[0].count).toBe(1);
    expect(result.detected[0].positions).toEqual([5]);
  });

  it("複数種類のゼロ幅文字を検出できる", () => {
    const text = "A\u200BB\u200CC\u200DD";
    const result = detectZeroWidthChars(text);
    expect(result.hasZeroWidthChars).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.detected).toHaveLength(3);
  });

  it("同じゼロ幅文字が複数ある場合にカウントされる", () => {
    const text = "\u200B\u200B\u200B";
    const result = detectZeroWidthChars(text);
    expect(result.totalCount).toBe(3);
    expect(result.detected[0].count).toBe(3);
    expect(result.detected[0].positions).toEqual([0, 1, 2]);
  });

  it("BOM (U+FEFF) を検出できる", () => {
    const result = detectZeroWidthChars("\uFEFFtest");
    expect(result.hasZeroWidthChars).toBe(true);
    expect(result.detected[0].def.codePoint).toBe(0xfeff);
    expect(result.detected[0].positions).toEqual([0]);
  });

  it("ZWJ (U+200D) を検出できる", () => {
    const result = detectZeroWidthChars("A\u200DB");
    expect(result.hasZeroWidthChars).toBe(true);
    expect(result.detected[0].def.codePoint).toBe(0x200d);
  });

  it("LTR マーク (U+200E) を検出できる", () => {
    const result = detectZeroWidthChars("text\u200Emore");
    expect(result.hasZeroWidthChars).toBe(true);
    expect(result.detected.some((d) => d.def.codePoint === 0x200e)).toBe(true);
  });

  it("input フィールドに元のテキストが保持される", () => {
    const text = "Hello\u200BWorld";
    const result = detectZeroWidthChars(text);
    expect(result.input).toBe(text);
  });

  it("検出結果がコードポイント順にソートされる", () => {
    const text = "\u200D\u200B\u200C";
    const result = detectZeroWidthChars(text);
    const codePoints = result.detected.map((d) => d.def.codePoint);
    const sorted = [...codePoints].sort((a, b) => a - b);
    expect(codePoints).toEqual(sorted);
  });
});

describe("removeZeroWidthChars", () => {
  it("ゼロ幅文字がないテキストはそのまま返す", () => {
    const text = "Hello, World!";
    expect(removeZeroWidthChars(text)).toBe(text);
  });

  it("ZERO WIDTH SPACE を除去できる", () => {
    expect(removeZeroWidthChars("Hello\u200BWorld")).toBe("HelloWorld");
  });

  it("複数種類のゼロ幅文字をまとめて除去できる", () => {
    const input = "A\u200BB\u200CC\u200DD\uFEFF";
    expect(removeZeroWidthChars(input)).toBe("ABCD");
  });

  it("複数の同種ゼロ幅文字を全て除去できる", () => {
    expect(removeZeroWidthChars("\u200B\u200B\u200B")).toBe("");
  });

  it("BOM を除去できる", () => {
    expect(removeZeroWidthChars("\uFEFFtest")).toBe("test");
  });

  it("通常の日本語テキストは変更しない", () => {
    const text = "こんにちは世界！";
    expect(removeZeroWidthChars(text)).toBe(text);
  });

  it("空文字列を渡すと空文字列を返す", () => {
    expect(removeZeroWidthChars("")).toBe("");
  });
});

describe("formatCodePoint", () => {
  it("4桁の16進数フォーマットで返す", () => {
    expect(formatCodePoint(0x200b)).toBe("U+200B");
  });

  it("4桁未満の場合はゼロ埋めされる", () => {
    expect(formatCodePoint(0xad)).toBe("U+00AD");
  });

  it("4桁以上のコードポイントはそのまま16進数で返す", () => {
    expect(formatCodePoint(0x1f600)).toBe("U+1F600");
  });
});

describe("ZERO_WIDTH_CHARS 定義", () => {
  it("必要な文字が全て定義されている", () => {
    const codePoints = ZERO_WIDTH_CHARS.map((c) => c.codePoint);
    expect(codePoints).toContain(0x200b); // ZERO WIDTH SPACE
    expect(codePoints).toContain(0x200c); // ZERO WIDTH NON-JOINER
    expect(codePoints).toContain(0x200d); // ZERO WIDTH JOINER
    expect(codePoints).toContain(0xfeff); // BOM
    expect(codePoints).toContain(0x2060); // WORD JOINER
    expect(codePoints).toContain(0x00ad); // SOFT HYPHEN
  });

  it("各定義に name・unicodeName・description が設定されている", () => {
    for (const def of ZERO_WIDTH_CHARS) {
      expect(def.name).toBeTruthy();
      expect(def.unicodeName).toBeTruthy();
      expect(def.description).toBeTruthy();
    }
  });

  it("コードポイントに重複がない", () => {
    const codePoints = ZERO_WIDTH_CHARS.map((c) => c.codePoint);
    const unique = new Set(codePoints);
    expect(unique.size).toBe(codePoints.length);
  });
});
