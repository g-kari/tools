import { describe, expect, it } from "vite-plus/test";
import {
  generateAsciiArt,
  getAvailableFonts,
  isConvertible,
  getFontLineCount,
  type AsciiFont,
} from "../../app/utils/ascii-art";

describe("getAvailableFonts", () => {
  it("5種類のフォントを返す", () => {
    const fonts = getAvailableFonts();
    expect(fonts).toHaveLength(5);
  });

  it("全フォントにkey、label、descriptionが含まれる", () => {
    const fonts = getAvailableFonts();
    for (const font of fonts) {
      expect(font).toHaveProperty("key");
      expect(font).toHaveProperty("label");
      expect(font).toHaveProperty("description");
    }
  });

  it("期待するフォントキーがすべて含まれる", () => {
    const fonts = getAvailableFonts();
    const keys = fonts.map((f) => f.key);
    expect(keys).toContain("standard");
    expect(keys).toContain("block");
    expect(keys).toContain("banner");
    expect(keys).toContain("dots");
    expect(keys).toContain("thin");
  });

  it("各フォントのlabelが空でない", () => {
    const fonts = getAvailableFonts();
    for (const font of fonts) {
      expect(font.label.length).toBeGreaterThan(0);
    }
  });
});

describe("getFontLineCount", () => {
  it("bannerフォントは7行を返す", () => {
    expect(getFontLineCount("banner")).toBe(7);
  });

  it("standardフォントは5行を返す", () => {
    expect(getFontLineCount("standard")).toBe(5);
  });

  it("blockフォントは5行を返す", () => {
    expect(getFontLineCount("block")).toBe(5);
  });

  it("dotsフォントは5行を返す", () => {
    expect(getFontLineCount("dots")).toBe(5);
  });

  it("thinフォントは5行を返す", () => {
    expect(getFontLineCount("thin")).toBe(5);
  });
});

describe("generateAsciiArt", () => {
  it("空文字列を渡すと空の結果を返す", () => {
    const result = generateAsciiArt("", "standard");
    expect(result.text).toBe("");
    expect(result.lineCount).toBe(0);
    expect(result.charCount).toBe(0);
  });

  it("スペースのみを渡すと空の結果を返す", () => {
    const result = generateAsciiArt("   ", "standard");
    expect(result.text).toBe("");
    expect(result.lineCount).toBe(0);
    expect(result.charCount).toBe(0);
  });

  it("standardフォントでASCIIアートを生成する", () => {
    const result = generateAsciiArt("A", "standard");
    expect(result.text).toBeTruthy();
    expect(result.lineCount).toBe(5);
  });

  it("blockフォントでASCIIアートを生成する", () => {
    const result = generateAsciiArt("A", "block");
    expect(result.text).toBeTruthy();
    expect(result.lineCount).toBe(5);
  });

  it("bannerフォントでASCIIアートを生成する（7行）", () => {
    const result = generateAsciiArt("A", "banner");
    expect(result.text).toBeTruthy();
    expect(result.lineCount).toBe(7);
  });

  it("dotsフォントでASCIIアートを生成する", () => {
    const result = generateAsciiArt("A", "dots");
    expect(result.text).toBeTruthy();
    expect(result.lineCount).toBe(5);
  });

  it("thinフォントでASCIIアートを生成する", () => {
    const result = generateAsciiArt("A", "thin");
    expect(result.text).toBeTruthy();
    expect(result.lineCount).toBe(5);
  });

  it("小文字入力が大文字と同じ結果を生成する", () => {
    const lower = generateAsciiArt("hello", "standard");
    const upper = generateAsciiArt("HELLO", "standard");
    expect(lower.text).toBe(upper.text);
  });

  it("生成結果のlineCountが改行数+1と一致する", () => {
    const result = generateAsciiArt("A", "standard");
    const actualLines = result.text.split("\n").length;
    expect(actualLines).toBe(result.lineCount);
  });

  it("生成結果のcharCountがtext.lengthと一致する", () => {
    const result = generateAsciiArt("A", "standard");
    expect(result.charCount).toBe(result.text.length);
  });

  it("複数文字の入力でASCIIアートを生成する", () => {
    const result = generateAsciiArt("AB", "standard");
    expect(result.text).toBeTruthy();
    expect(result.lineCount).toBe(5);
  });

  it("数字を含む入力でASCIIアートを生成する", () => {
    const result = generateAsciiArt("123", "standard");
    expect(result.text).toBeTruthy();
    expect(result.lineCount).toBe(5);
  });

  it("スペースを含む入力を正しく処理する", () => {
    const withSpace = generateAsciiArt("A B", "standard");
    expect(withSpace.text).toBeTruthy();
    expect(withSpace.lineCount).toBe(5);
  });

  it("bannerフォントの生成結果の行数が7", () => {
    const result = generateAsciiArt("HELLO", "banner");
    const actualLines = result.text.split("\n").length;
    expect(actualLines).toBe(7);
  });

  it("記号を含む入力を処理する", () => {
    const result = generateAsciiArt("!", "standard");
    expect(result.text).toBeTruthy();
    expect(result.lineCount).toBe(5);
  });

  it("全フォントで同じ文字から生成されるlineCountが正しい", () => {
    const fonts: AsciiFont[] = ["standard", "block", "banner", "dots", "thin"];
    for (const font of fonts) {
      const result = generateAsciiArt("A", font);
      const expected = getFontLineCount(font);
      expect(result.lineCount).toBe(expected);
    }
  });
});

describe("isConvertible", () => {
  it("通常のアルファベット文字列はtrueを返す", () => {
    expect(isConvertible("HELLO")).toBe(true);
  });

  it("小文字文字列もtrueを返す", () => {
    expect(isConvertible("hello")).toBe(true);
  });

  it("数字文字列はtrueを返す", () => {
    expect(isConvertible("12345")).toBe(true);
  });

  it("空文字列はfalseを返す", () => {
    expect(isConvertible("")).toBe(false);
  });

  it("スペースのみはfalseを返す", () => {
    expect(isConvertible("   ")).toBe(false);
  });

  it("20文字以下の文字列はtrueを返す", () => {
    expect(isConvertible("A".repeat(20))).toBe(true);
  });

  it("21文字以上の文字列はfalseを返す", () => {
    expect(isConvertible("A".repeat(21))).toBe(false);
  });

  it("1文字の入力はtrueを返す", () => {
    expect(isConvertible("A")).toBe(true);
  });

  it("スペースを含む20文字以内の文字列はtrueを返す", () => {
    expect(isConvertible("HELLO WORLD")).toBe(true);
  });
});
