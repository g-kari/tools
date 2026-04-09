import { describe, it, expect } from "vite-plus/test";
import {
  replaceText,
  findMatches,
  buildRegex,
  escapeRegex,
  type ReplaceOptions,
} from "../../app/utils/text-replace";

const defaultOptions: ReplaceOptions = {
  useRegex: false,
  caseSensitive: false,
  replaceAll: true,
  multiline: false,
};

describe("escapeRegex", () => {
  it("正規表現の特殊文字をエスケープする", () => {
    expect(escapeRegex("a.b")).toBe("a\\.b");
    expect(escapeRegex("a+b")).toBe("a\\+b");
    expect(escapeRegex("a*b?c")).toBe("a\\*b\\?c");
    expect(escapeRegex("(foo)")).toBe("\\(foo\\)");
    expect(escapeRegex("[abc]")).toBe("\\[abc\\]");
    expect(escapeRegex("{1,3}")).toBe("\\{1,3\\}");
    expect(escapeRegex("a|b")).toBe("a\\|b");
    expect(escapeRegex("a^b$")).toBe("a\\^b\\$");
  });

  it("特殊文字がない場合はそのまま返す", () => {
    expect(escapeRegex("hello")).toBe("hello");
    expect(escapeRegex("abc 123")).toBe("abc 123");
  });
});

describe("buildRegex", () => {
  it("リテラルモードで正規表現を構築する", () => {
    const regex = buildRegex("hello", defaultOptions);
    expect(regex.source).toBe("hello");
    expect(regex.flags).toContain("g");
    expect(regex.flags).toContain("i");
  });

  it("正規表現モードでパターンを使用する", () => {
    const regex = buildRegex("\\d+", { ...defaultOptions, useRegex: true });
    expect(regex.source).toBe("\\d+");
  });

  it("大文字小文字区別フラグを設定する", () => {
    const regex = buildRegex("hello", { ...defaultOptions, caseSensitive: true });
    expect(regex.flags).not.toContain("i");
  });

  it("replaceAllがfalseの場合gフラグなし", () => {
    const regex = buildRegex("hello", { ...defaultOptions, replaceAll: false });
    expect(regex.flags).not.toContain("g");
  });

  it("multilineフラグを設定する", () => {
    const regex = buildRegex("^", { ...defaultOptions, multiline: true });
    expect(regex.flags).toContain("m");
  });
});

describe("findMatches", () => {
  it("基本的なリテラル検索でマッチを返す", () => {
    const { matches } = findMatches("hello world hello", "hello", defaultOptions);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toEqual({ start: 0, end: 5 });
    expect(matches[1]).toEqual({ start: 12, end: 17 });
  });

  it("マッチなしの場合は空配列を返す", () => {
    const { matches } = findMatches("hello world", "xyz", defaultOptions);
    expect(matches).toHaveLength(0);
  });

  it("空の検索文字列は空配列を返す", () => {
    const { matches } = findMatches("hello world", "", defaultOptions);
    expect(matches).toHaveLength(0);
  });

  it("空のテキストは空配列を返す", () => {
    const { matches } = findMatches("", "hello", defaultOptions);
    expect(matches).toHaveLength(0);
  });

  it("大文字小文字を区別しない検索", () => {
    const { matches } = findMatches("Hello HELLO hello", "hello", defaultOptions);
    expect(matches).toHaveLength(3);
  });

  it("大文字小文字を区別する検索", () => {
    const { matches } = findMatches("Hello HELLO hello", "hello", {
      ...defaultOptions,
      caseSensitive: true,
    });
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ start: 12, end: 17 });
  });

  it("正規表現モードでマッチを返す", () => {
    const { matches } = findMatches("foo123bar456baz", "\\d+", {
      ...defaultOptions,
      useRegex: true,
    });
    expect(matches).toHaveLength(2);
    expect(matches[0]).toEqual({ start: 3, end: 6 });
    expect(matches[1]).toEqual({ start: 9, end: 12 });
  });

  it("無効な正規表現はエラーを返す", () => {
    const { matches, error } = findMatches("test", "[invalid", {
      ...defaultOptions,
      useRegex: true,
    });
    expect(matches).toHaveLength(0);
    expect(error).toBeDefined();
  });

  it("replaceAllがfalseの場合は最初の1件のみ返す", () => {
    const { matches } = findMatches("abc abc abc", "abc", {
      ...defaultOptions,
      replaceAll: false,
    });
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ start: 0, end: 3 });
  });

  it("複数行モードで^が行先頭にマッチする", () => {
    const { matches } = findMatches("foo\nbar\nbaz", "^", {
      ...defaultOptions,
      useRegex: true,
      multiline: true,
    });
    expect(matches).toHaveLength(3);
  });
});

describe("replaceText", () => {
  it("基本的なリテラル置換", () => {
    const result = replaceText("hello world", "hello", "hi", defaultOptions);
    expect(result.output).toBe("hi world");
    expect(result.matchCount).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it("全件置換", () => {
    const result = replaceText("foo foo foo", "foo", "bar", defaultOptions);
    expect(result.output).toBe("bar bar bar");
    expect(result.matchCount).toBe(3);
  });

  it("最初の1件のみ置換", () => {
    const result = replaceText("foo foo foo", "foo", "bar", {
      ...defaultOptions,
      replaceAll: false,
    });
    expect(result.output).toBe("bar foo foo");
    expect(result.matchCount).toBe(1);
  });

  it("マッチなしの場合は元テキストをそのまま返す", () => {
    const result = replaceText("hello world", "xyz", "abc", defaultOptions);
    expect(result.output).toBe("hello world");
    expect(result.matchCount).toBe(0);
  });

  it("空の置換文字列で削除", () => {
    const result = replaceText("hello world", "world", "", defaultOptions);
    expect(result.output).toBe("hello ");
    expect(result.matchCount).toBe(1);
  });

  it("空の検索文字列はそのまま返す", () => {
    const result = replaceText("hello world", "", "x", defaultOptions);
    expect(result.output).toBe("hello world");
    expect(result.matchCount).toBe(0);
  });

  it("正規表現バックリファレンスを使った置換", () => {
    const result = replaceText("2024-01-15", "(\\d{4})-(\\d{2})-(\\d{2})", "$3/$2/$1", {
      ...defaultOptions,
      useRegex: true,
    });
    expect(result.output).toBe("15/01/2024");
    expect(result.matchCount).toBe(1);
  });

  it("大文字小文字を区別しない置換", () => {
    const result = replaceText("Hello WORLD hello", "hello", "hi", defaultOptions);
    expect(result.output).toBe("hi WORLD hi");
    expect(result.matchCount).toBe(2);
  });

  it("大文字小文字を区別する置換", () => {
    const result = replaceText("Hello hello HELLO", "hello", "hi", {
      ...defaultOptions,
      caseSensitive: true,
    });
    expect(result.output).toBe("Hello hi HELLO");
    expect(result.matchCount).toBe(1);
  });

  it("無効な正規表現はエラーを返す", () => {
    const result = replaceText("test", "[invalid", "x", {
      ...defaultOptions,
      useRegex: true,
    });
    expect(result.error).toBeDefined();
    expect(result.output).toBe("test");
    expect(result.matchCount).toBe(0);
  });

  it("日本語テキストの置換", () => {
    const result = replaceText("こんにちは世界こんにちは", "こんにちは", "やあ", defaultOptions);
    expect(result.output).toBe("やあ世界やあ");
    expect(result.matchCount).toBe(2);
  });

  it("複数行テキストの置換", () => {
    const result = replaceText("line1\nline2\nline3", "line", "row", defaultOptions);
    expect(result.output).toBe("row1\nrow2\nrow3");
    expect(result.matchCount).toBe(3);
  });

  it("特殊文字を含むリテラル置換（ドット等）", () => {
    const result = replaceText("1.2.3", ".", ":", {
      ...defaultOptions,
      useRegex: false,
    });
    expect(result.output).toBe("1:2:3");
    expect(result.matchCount).toBe(2);
  });
});
