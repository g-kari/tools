import { describe, it, expect } from "vite-plus/test";
import { executeRegex } from "../../app/routes/regex-checker";

describe("executeRegex", () => {
  describe("基本的なマッチング（フラグなし）", () => {
    it("シンプルな文字列にマッチする", () => {
      const result = executeRegex("hello", "", "hello world");
      expect(result).toHaveLength(1);
      expect(result[0].fullMatch).toBe("hello");
      expect(result[0].index).toBe(0);
      expect(result[0].groups).toEqual([]);
    });

    it("マッチしない場合は空配列を返す", () => {
      const result = executeRegex("xyz", "", "hello world");
      expect(result).toHaveLength(0);
    });

    it("フラグなしは最初のマッチのみ返す", () => {
      const result = executeRegex("a", "", "abcabc");
      expect(result).toHaveLength(1);
      expect(result[0].index).toBe(0);
    });

    it("空文字列に対してマッチしない", () => {
      const result = executeRegex("hello", "", "");
      expect(result).toHaveLength(0);
    });
  });

  describe("グローバルフラグ (g)", () => {
    it("すべてのマッチを返す", () => {
      const result = executeRegex("a", "g", "abcabc");
      expect(result).toHaveLength(2);
      expect(result[0].index).toBe(0);
      expect(result[1].index).toBe(3);
    });

    it("電話番号パターンを複数マッチ", () => {
      const result = executeRegex("\\d{3}-\\d{4}", "g", "012-3456 と 789-0123");
      expect(result).toHaveLength(2);
      expect(result[0].fullMatch).toBe("012-3456");
      expect(result[1].fullMatch).toBe("789-0123");
    });

    it("マッチなしの場合は空配列を返す", () => {
      const result = executeRegex("z", "g", "abcabc");
      expect(result).toHaveLength(0);
    });
  });

  describe("大文字小文字を区別しないフラグ (i)", () => {
    it("大文字小文字を区別せずマッチ", () => {
      const result = executeRegex("hello", "i", "Hello World");
      expect(result).toHaveLength(1);
      expect(result[0].fullMatch).toBe("Hello");
    });

    it("gi フラグで大文字小文字を無視してすべてマッチ", () => {
      const result = executeRegex("abc", "gi", "ABC abc Abc");
      expect(result).toHaveLength(3);
    });
  });

  describe("キャプチャグループ", () => {
    it("キャプチャグループを返す", () => {
      const result = executeRegex("(\\d+)-(\\d+)", "", "03-1234");
      expect(result).toHaveLength(1);
      expect(result[0].fullMatch).toBe("03-1234");
      expect(result[0].groups).toEqual(["03", "1234"]);
    });

    it("グループなしの場合は空配列", () => {
      const result = executeRegex("\\d+", "", "123");
      expect(result).toHaveLength(1);
      expect(result[0].groups).toEqual([]);
    });

    it("グローバルフラグと複数キャプチャグループ", () => {
      const result = executeRegex("(\\w+)@(\\w+)", "g", "a@b c@d");
      expect(result).toHaveLength(2);
      expect(result[0].groups).toEqual(["a", "b"]);
      expect(result[1].groups).toEqual(["c", "d"]);
    });
  });

  describe("特殊パターン", () => {
    it("数字パターンにマッチ", () => {
      const result = executeRegex("\\d+", "g", "abc123def456");
      expect(result).toHaveLength(2);
      expect(result[0].fullMatch).toBe("123");
      expect(result[1].fullMatch).toBe("456");
    });

    it("行頭・行末パターン（m フラグ）", () => {
      const result = executeRegex("^\\w+", "gm", "foo\nbar\nbaz");
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.fullMatch)).toEqual(["foo", "bar", "baz"]);
    });

    it("日本語文字にマッチ", () => {
      const result = executeRegex("[あ-ん]+", "", "hello こんにちは world");
      expect(result).toHaveLength(1);
      expect(result[0].fullMatch).toBe("こんにちは");
    });

    it("メールアドレスパターン", () => {
      const result = executeRegex(
        "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
        "g",
        "連絡先: test@example.com または info@test.co.jp",
      );
      expect(result).toHaveLength(2);
      expect(result[0].fullMatch).toBe("test@example.com");
      expect(result[1].fullMatch).toBe("info@test.co.jp");
    });
  });

  describe("エラーハンドリング", () => {
    it("無効な正規表現はエラーをスロー", () => {
      expect(() => executeRegex("[invalid", "", "test")).toThrow();
    });

    it("無効なフラグはエラーをスロー", () => {
      expect(() => executeRegex("abc", "z", "test")).toThrow();
    });
  });

  describe("index（マッチ位置）", () => {
    it("先頭以外でのマッチ位置を正しく返す", () => {
      const result = executeRegex("world", "", "hello world");
      expect(result[0].index).toBe(6);
    });

    it("グローバルマッチの各 index が正しい", () => {
      const result = executeRegex("ab", "g", "xabxabx");
      expect(result[0].index).toBe(1);
      expect(result[1].index).toBe(4);
    });
  });
});
