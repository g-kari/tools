import { describe, it, expect } from "vite-plus/test";
import {
  mergeJsonStrings,
  getSampleJsonPair,
  DEFAULT_MERGE_OPTIONS,
  type MergeOptions,
} from "../../app/utils/json-merge";

describe("mergeJsonStrings", () => {
  const deepMerge: MergeOptions = { deep: true, arrayStrategy: "replace" };
  const shallowMerge: MergeOptions = { deep: false, arrayStrategy: "replace" };

  describe("ディープマージ", () => {
    it("フラットなオブジェクトをマージできる", () => {
      const result = mergeJsonStrings(
        ['{"a": 1, "b": 2}', '{"b": 3, "c": 4}'],
        deepMerge
      );
      expect(JSON.parse(result)).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("ネストされたオブジェクトをディープマージできる", () => {
      const result = mergeJsonStrings(
        [
          '{"user": {"name": "太郎", "age": 30}}',
          '{"user": {"age": 31, "email": "taro@example.com"}}',
        ],
        deepMerge
      );
      expect(JSON.parse(result)).toEqual({
        user: { name: "太郎", age: 31, email: "taro@example.com" },
      });
    });

    it("3つ以上のJSONをマージできる", () => {
      const result = mergeJsonStrings(
        ['{"a": 1}', '{"b": 2}', '{"c": 3}'],
        deepMerge
      );
      expect(JSON.parse(result)).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("右側が左側を上書きする", () => {
      const result = mergeJsonStrings(
        ['{"key": "old"}', '{"key": "new"}'],
        deepMerge
      );
      expect(JSON.parse(result)).toEqual({ key: "new" });
    });

    it("nullを値として保持する", () => {
      const result = mergeJsonStrings(
        ['{"a": 1}', '{"a": null}'],
        deepMerge
      );
      expect(JSON.parse(result)).toEqual({ a: null });
    });

    it("booleanを正しく処理する", () => {
      const result = mergeJsonStrings(
        ['{"active": true}', '{"active": false, "deleted": true}'],
        deepMerge
      );
      expect(JSON.parse(result)).toEqual({ active: false, deleted: true });
    });
  });

  describe("シャローマージ", () => {
    it("トップレベルキーのみをマージする", () => {
      const result = mergeJsonStrings(
        [
          '{"user": {"name": "太郎", "age": 30}}',
          '{"user": {"name": "次郎"}}',
        ],
        shallowMerge
      );
      expect(JSON.parse(result)).toEqual({ user: { name: "次郎" } });
    });

    it("フラットなオブジェクトはディープと同じ結果", () => {
      const result = mergeJsonStrings(
        ['{"a": 1, "b": 2}', '{"b": 3, "c": 4}'],
        shallowMerge
      );
      expect(JSON.parse(result)).toEqual({ a: 1, b: 3, c: 4 });
    });
  });

  describe("配列マージ戦略", () => {
    it("replace: 右側の配列で置き換える", () => {
      const result = mergeJsonStrings(
        ['{"tags": ["a", "b"]}', '{"tags": ["c", "d"]}'],
        { deep: true, arrayStrategy: "replace" }
      );
      expect(JSON.parse(result)).toEqual({ tags: ["c", "d"] });
    });

    it("concat: 配列を連結する", () => {
      const result = mergeJsonStrings(
        ['{"tags": ["a", "b"]}', '{"tags": ["c", "d"]}'],
        { deep: true, arrayStrategy: "concat" }
      );
      expect(JSON.parse(result)).toEqual({ tags: ["a", "b", "c", "d"] });
    });

    it("unique: 重複を排除して連結する", () => {
      const result = mergeJsonStrings(
        ['{"tags": ["a", "b", "c"]}', '{"tags": ["b", "c", "d"]}'],
        { deep: true, arrayStrategy: "unique" }
      );
      expect(JSON.parse(result)).toEqual({ tags: ["a", "b", "c", "d"] });
    });

    it("unique: 重複のないオブジェクトはconcatと同じ", () => {
      const result = mergeJsonStrings(
        ['{"ids": [1, 2]}', '{"ids": [3, 4]}'],
        { deep: true, arrayStrategy: "unique" }
      );
      expect(JSON.parse(result)).toEqual({ ids: [1, 2, 3, 4] });
    });
  });

  describe("エラーハンドリング", () => {
    it("無効なJSONでエラーをスローする", () => {
      expect(() =>
        mergeJsonStrings(["invalid", '{"b": 2}'], deepMerge)
      ).toThrow();
    });

    it("空文字でエラーをスローする", () => {
      expect(() =>
        mergeJsonStrings(["", '{"b": 2}'], deepMerge)
      ).toThrow();
    });

    it("空の配列でエラーをスローする", () => {
      expect(() => mergeJsonStrings([], deepMerge)).toThrow();
    });
  });

  describe("デフォルトオプション", () => {
    it("デフォルトオプションでマージできる", () => {
      const result = mergeJsonStrings(
        ['{"a": 1}', '{"b": 2}']
      );
      expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
    });

    it("DEFAULT_MERGE_OPTIONSがディープマージ+replaceである", () => {
      expect(DEFAULT_MERGE_OPTIONS.deep).toBe(true);
      expect(DEFAULT_MERGE_OPTIONS.arrayStrategy).toBe("replace");
    });
  });

  describe("出力フォーマット", () => {
    it("2スペースインデントでフォーマットされる", () => {
      const result = mergeJsonStrings(['{"a": 1}', '{"b": 2}'], deepMerge);
      expect(result).toContain("\n");
      expect(result).toContain("  ");
    });
  });
});

describe("getSampleJsonPair", () => {
  it("2つのJSON文字列を返す", () => {
    const pair = getSampleJsonPair();
    expect(pair).toHaveLength(2);
  });

  it("両方が有効なJSONである", () => {
    const [s1, s2] = getSampleJsonPair();
    expect(() => JSON.parse(s1)).not.toThrow();
    expect(() => JSON.parse(s2)).not.toThrow();
  });

  it("マージ可能なオブジェクトを返す", () => {
    const [s1, s2] = getSampleJsonPair();
    expect(() => mergeJsonStrings([s1, s2])).not.toThrow();
  });
});
