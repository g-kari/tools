import { describe, it, expect } from "vitest";
import { generateTypeScript, getSampleJson } from "../../app/utils/json-to-ts";
import type { JsonToTsOptions } from "../../app/utils/json-to-ts";

const defaultOptions: JsonToTsOptions = {
  rootName: "Root",
  useInterface: true,
  optional: false,
  includeNull: true,
};

describe("JSON→TypeScript型変換", () => {
  describe("generateTypeScript", () => {
    it("文字列プロパティの型生成", () => {
      const result = generateTypeScript('{"name":"test"}', defaultOptions);
      expect(result).toContain("name: string;");
    });

    it("数値プロパティの型生成", () => {
      const result = generateTypeScript('{"count":42}', defaultOptions);
      expect(result).toContain("count: number;");
    });

    it("booleanプロパティの型生成", () => {
      const result = generateTypeScript('{"active":true}', defaultOptions);
      expect(result).toContain("active: boolean;");
    });

    it("nullプロパティの型生成（includeNull=true）", () => {
      const result = generateTypeScript('{"data":null}', {
        ...defaultOptions,
        includeNull: true,
      });
      expect(result).toContain("data: null;");
    });

    it("nullプロパティの型生成（includeNull=false）", () => {
      const result = generateTypeScript('{"data":null}', {
        ...defaultOptions,
        includeNull: false,
      });
      expect(result).toContain("data: unknown;");
    });

    it("ネストしたオブジェクトの型生成", () => {
      const result = generateTypeScript(
        '{"address":{"city":"Tokyo"}}',
        defaultOptions
      );
      expect(result).toContain("address: Address;");
      expect(result).toContain("city: string;");
      // Addressが別のinterface/typeとして定義されている
      expect(result).toMatch(/interface Address/);
    });

    it("文字列配列の型生成", () => {
      const result = generateTypeScript('{"tags":["a","b"]}', defaultOptions);
      expect(result).toContain("tags: string[];");
    });

    it("数値配列の型生成", () => {
      const result = generateTypeScript('{"scores":[1,2,3]}', defaultOptions);
      expect(result).toContain("scores: number[];");
    });

    it("オブジェクト配列の型生成", () => {
      const result = generateTypeScript(
        '{"items":[{"id":1},{"id":2}]}',
        defaultOptions
      );
      expect(result).toContain("items:");
      // 配列要素のオブジェクト型が生成される
      expect(result).toContain("id: number;");
    });

    it("同質なオブジェクト配列は重複型を生成しない", () => {
      const result = generateTypeScript(
        '[{"a":1},{"a":2},{"a":3}]',
        defaultOptions
      );
      // RootItem が1つだけ生成される（RootItem2, RootItem3 は不要）
      expect(result).toContain("interface RootItem");
      expect(result).not.toContain("RootItem2");
      expect(result).not.toContain("RootItem3");
      expect(result).toContain("type Root = RootItem[];");
    });

    it("空オブジェクト {} の型生成", () => {
      const result = generateTypeScript("{}", defaultOptions);
      expect(result).toContain("Record<string, never>");
    });

    it("空配列 [] の型生成", () => {
      const result = generateTypeScript("[]", defaultOptions);
      expect(result).toContain("unknown[]");
    });

    it("type構文（useInterface=false）の生成", () => {
      const result = generateTypeScript('{"name":"test"}', {
        ...defaultOptions,
        useInterface: false,
      });
      expect(result).toMatch(/type Root = \{/);
      expect(result).not.toMatch(/interface Root/);
    });

    it("optional=trueでプロパティが?付きになる", () => {
      const result = generateTypeScript('{"name":"test","age":30}', {
        ...defaultOptions,
        optional: true,
      });
      expect(result).toContain("name?: string;");
      expect(result).toContain("age?: number;");
    });

    it("rootNameが型名に反映される", () => {
      const result = generateTypeScript('{"name":"test"}', {
        ...defaultOptions,
        rootName: "User",
      });
      expect(result).toMatch(/interface User/);
    });

    it("複数ネストの深い構造", () => {
      const json = JSON.stringify({
        level1: {
          level2: {
            level3: {
              value: "deep",
            },
          },
        },
      });
      const result = generateTypeScript(json, defaultOptions);
      expect(result).toContain("value: string;");
      // 複数のinterface/typeが生成される
      expect((result.match(/interface/g) || []).length).toBeGreaterThanOrEqual(3);
    });

    it("混在型配列の型生成", () => {
      const result = generateTypeScript('{"mixed":[1,"text",true]}', defaultOptions);
      expect(result).toContain("mixed:");
      // union typeが生成される
      expect(result).toMatch(/number.*\|.*string.*\|.*boolean/);
    });

    it("不正なJSONでエラー（空文字列）", () => {
      expect(() => generateTypeScript("", defaultOptions)).toThrow(
        "JSONを入力してください"
      );
    });

    it("不正なJSONでエラー（不正JSON文字列）", () => {
      expect(() => generateTypeScript("invalid", defaultOptions)).toThrow(
        "無効なJSON形式です"
      );
    });

    it("空白のみの入力でエラー", () => {
      expect(() => generateTypeScript("   ", defaultOptions)).toThrow(
        "JSONを入力してください"
      );
    });

    it("プリミティブ値の型生成", () => {
      const result = generateTypeScript('"hello"', defaultOptions);
      expect(result).toContain("type Root = string;");
    });
  });

  describe("getSampleJson", () => {
    it("JSON文字列を返す", () => {
      const result = getSampleJson();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("有効なJSONである", () => {
      expect(() => JSON.parse(getSampleJson())).not.toThrow();
    });

    it("ネストしたオブジェクトを含む", () => {
      const parsed = JSON.parse(getSampleJson());
      const values = Object.values(parsed);
      const hasNested = values.some(
        (v) => typeof v === "object" && v !== null && !Array.isArray(v)
      );
      expect(hasNested).toBe(true);
    });

    it("配列を含む", () => {
      const allValues = JSON.stringify(JSON.parse(getSampleJson()));
      expect(allValues).toMatch(/\[/);
    });

    it("null値を含む", () => {
      const allValues = JSON.stringify(JSON.parse(getSampleJson()));
      expect(allValues).toMatch(/null/);
    });
  });
});
