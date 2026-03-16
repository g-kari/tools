import { describe, it, expect } from "vitest";
import {
  analyzeText,
  getCategory,
  getUtf8Bytes,
  getUtf16Units,
  countByCategory,
  filterChars,
  type UnicodeCategory,
} from "../../app/utils/unicode-inspector";

describe("getCategory", () => {
  it("ラテン文字を Letter と判定する", () => {
    expect(getCategory(0x41)).toBe("Letter"); // A
    expect(getCategory(0x61)).toBe("Letter"); // a
  });

  it("ひらがなを Letter と判定する", () => {
    expect(getCategory(0x3042)).toBe("Letter"); // あ
  });

  it("ASCII 数字を Digit と判定する", () => {
    expect(getCategory(0x30)).toBe("Digit"); // 0
    expect(getCategory(0x39)).toBe("Digit"); // 9
  });

  it("制御文字を Control と判定する", () => {
    expect(getCategory(0x00)).toBe("Control"); // NUL
    expect(getCategory(0x0a)).toBe("Control"); // LF
    expect(getCategory(0x7f)).toBe("Control"); // DEL
  });

  it("サロゲート領域を Surrogate と判定する", () => {
    expect(getCategory(0xd800)).toBe("Surrogate");
    expect(getCategory(0xdfff)).toBe("Surrogate");
  });

  it("句読点を Punctuation と判定する", () => {
    expect(getCategory(0x21)).toBe("Punctuation"); // !
    expect(getCategory(0x2e)).toBe("Punctuation"); // .
  });
});

describe("getUtf8Bytes", () => {
  it("ASCII 文字 A の UTF-8 バイト列を返す", () => {
    const bytes = getUtf8Bytes(0x41);
    expect(bytes).toEqual(["0x41"]);
  });

  it("ひらがな「あ」の UTF-8 バイト列を返す（3バイト）", () => {
    const bytes = getUtf8Bytes(0x3042);
    expect(bytes).toHaveLength(3);
    expect(bytes[0]).toBe("0xE3");
    expect(bytes[1]).toBe("0x81");
    expect(bytes[2]).toBe("0x82");
  });

  it("スペースの UTF-8 バイト列を返す", () => {
    const bytes = getUtf8Bytes(0x20);
    expect(bytes).toEqual(["0x20"]);
  });
});

describe("getUtf16Units", () => {
  it("ASCII 文字 A の UTF-16 コードユニットを返す", () => {
    const units = getUtf16Units("A");
    expect(units).toEqual(["0x0041"]);
  });

  it("ひらがな「あ」の UTF-16 コードユニットを返す", () => {
    const units = getUtf16Units("あ");
    expect(units).toEqual(["0x3042"]);
  });

  it("絵文字（サロゲートペア）は 2 つのコードユニットを返す", () => {
    const emoji = "😀"; // U+1F600
    const units = getUtf16Units(emoji);
    expect(units).toHaveLength(2);
    expect(units[0]).toBe("0xD83D");
    expect(units[1]).toBe("0xDE00");
  });
});

describe("analyzeText", () => {
  it("空文字列を空配列に変換する", () => {
    expect(analyzeText("")).toHaveLength(0);
  });

  it("ASCII テキストを正しく解析する", () => {
    const chars = analyzeText("Hi");
    expect(chars).toHaveLength(2);
    expect(chars[0].char).toBe("H");
    expect(chars[0].codePoint).toBe(0x48);
    expect(chars[0].codePointHex).toBe("U+0048");
    expect(chars[1].char).toBe("i");
    expect(chars[1].codePoint).toBe(0x69);
  });

  it("日本語テキストを正しく解析する", () => {
    const chars = analyzeText("あ");
    expect(chars).toHaveLength(1);
    expect(chars[0].codePoint).toBe(0x3042);
    expect(chars[0].codePointHex).toBe("U+3042");
    expect(chars[0].utf8Bytes).toHaveLength(3);
  });

  it("絵文字をサロゲートペアとして正しく解析する", () => {
    const chars = analyzeText("😀");
    expect(chars).toHaveLength(1); // コードポイント単位で 1 文字
    expect(chars[0].codePoint).toBe(0x1f600);
    expect(chars[0].isSurrogatePair).toBe(true);
    expect(chars[0].utf16Units).toHaveLength(2);
  });

  it("名前付き HTML エンティティを持つ文字を検出する", () => {
    const chars = analyzeText("&");
    expect(chars[0].namedEntity).toBe("&amp;");
    expect(chars[0].numericEntity).toBe("&#38;");
  });

  it("名前付きエンティティがない文字は null を返す", () => {
    const chars = analyzeText("A");
    expect(chars[0].namedEntity).toBeNull();
    expect(chars[0].numericEntity).toBe("&#65;");
  });

  it("混合テキスト（英語・日本語・絵文字）を正しい文字数で解析する", () => {
    const text = "A日😀";
    const chars = analyzeText(text);
    // A(1) + 日(1) + 😀(サロゲートペア→1コードポイント) = 3
    expect(chars).toHaveLength(3);
  });
});

describe("countByCategory", () => {
  it("カテゴリ別の件数を正しく集計する", () => {
    const chars = analyzeText("A1!");
    const counts = countByCategory(chars);
    expect(counts.get("文字")).toBe(1);
    expect(counts.get("数字")).toBe(1);
    expect(counts.get("句読点")).toBe(1);
  });

  it("空の場合は空の Map を返す", () => {
    const counts = countByCategory([]);
    expect(counts.size).toBe(0);
  });
});

describe("filterChars", () => {
  it("クエリが空の場合は全件返す", () => {
    const chars = analyzeText("ABC");
    expect(filterChars(chars, "")).toHaveLength(3);
    expect(filterChars(chars, "  ")).toHaveLength(3);
  });

  it("文字で絞り込める", () => {
    const chars = analyzeText("ABC");
    const result = filterChars(chars, "A");
    expect(result).toHaveLength(1);
    expect(result[0].char).toBe("A");
  });

  it("コードポイント（U+XXXX）で絞り込める", () => {
    const chars = analyzeText("ABC");
    const result = filterChars(chars, "U+0041");
    expect(result).toHaveLength(1);
    expect(result[0].char).toBe("A");
  });

  it("カテゴリラベルで絞り込める", () => {
    const chars = analyzeText("A1");
    const result = filterChars(chars, "数字");
    expect(result).toHaveLength(1);
    expect(result[0].char).toBe("1");
  });

  it("一致しない場合は空配列を返す", () => {
    const chars = analyzeText("ABC");
    expect(filterChars(chars, "xyz")).toHaveLength(0);
  });
});
