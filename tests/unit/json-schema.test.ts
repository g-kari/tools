import { describe, it, expect } from "vitest";
import { generateJsonSchema, getSampleJson } from "../../app/utils/json-schema";

describe("JSON Schema Generator", () => {
  describe("generateJsonSchema", () => {
    it("should generate schema for string primitive", () => {
      const result = JSON.parse(generateJsonSchema('{"name":"test"}'));
      expect(result.properties.name.type).toBe("string");
    });

    it("should generate schema for integer", () => {
      const result = JSON.parse(generateJsonSchema('{"count":42}'));
      expect(result.properties.count.type).toBe("integer");
    });

    it("should generate schema for float number", () => {
      const result = JSON.parse(generateJsonSchema('{"price":3.14}'));
      expect(result.properties.price.type).toBe("number");
    });

    it("should generate schema for boolean", () => {
      const result = JSON.parse(generateJsonSchema('{"active":true}'));
      expect(result.properties.active.type).toBe("boolean");
    });

    it("should generate schema for null", () => {
      const result = JSON.parse(generateJsonSchema('{"data":null}'));
      expect(result.properties.data.type).toBe("null");
    });

    it("should generate schema for empty object", () => {
      const result = JSON.parse(generateJsonSchema("{}"));
      expect(result.type).toBe("object");
      expect(result.properties).toEqual({});
    });

    it("should generate schema for object with properties", () => {
      const result = JSON.parse(
        generateJsonSchema('{"name":"Alice","age":30}')
      );
      expect(result.type).toBe("object");
      expect(result.properties.name.type).toBe("string");
      expect(result.properties.age.type).toBe("integer");
    });

    it("should generate schema for nested object", () => {
      const result = JSON.parse(
        generateJsonSchema('{"user":{"name":"Bob","score":9.5}}')
      );
      expect(result.properties.user.type).toBe("object");
      expect(result.properties.user.properties.name.type).toBe("string");
      expect(result.properties.user.properties.score.type).toBe("number");
    });

    it("should generate schema for empty array", () => {
      const result = JSON.parse(generateJsonSchema("[]"));
      expect(result.type).toBe("array");
      expect(result.items).toEqual({});
    });

    it("should generate schema for string array", () => {
      const result = JSON.parse(generateJsonSchema('["a","b","c"]'));
      expect(result.type).toBe("array");
      expect(result.items.type).toBe("string");
    });

    it("should generate schema for object array", () => {
      const result = JSON.parse(
        generateJsonSchema('[{"id":1},{"id":2}]')
      );
      expect(result.type).toBe("array");
      expect(result.items.type).toBe("object");
    });

    it("should mark all object properties as required", () => {
      const result = JSON.parse(
        generateJsonSchema('{"name":"Alice","age":30,"active":true}')
      );
      expect(result.required).toContain("name");
      expect(result.required).toContain("age");
      expect(result.required).toContain("active");
    });

    it("should set additionalProperties to false", () => {
      const result = JSON.parse(generateJsonSchema('{"name":"Alice"}'));
      expect(result.additionalProperties).toBe(false);
    });

    it("should include $schema field", () => {
      const result = JSON.parse(generateJsonSchema('{"x":1}'));
      expect(result.$schema).toBe("http://json-schema.org/draft-07/schema#");
    });

    it("should return valid JSON string", () => {
      expect(() => JSON.parse(generateJsonSchema('{"name":"test"}'))).not.toThrow();
    });

    it("should throw error for empty input", () => {
      expect(() => generateJsonSchema("")).toThrow("JSONを入力してください");
    });

    it("should throw error for invalid JSON", () => {
      expect(() => generateJsonSchema("invalid")).toThrow("無効なJSON形式です");
    });

    it("should throw error for whitespace-only input", () => {
      expect(() => generateJsonSchema("   ")).toThrow();
    });
  });

  describe("getSampleJson", () => {
    it("should return valid JSON string", () => {
      expect(() => JSON.parse(getSampleJson())).not.toThrow();
    });

    it("should contain nested object structure", () => {
      const parsed = JSON.parse(getSampleJson());
      // ネストされたオブジェクトが存在することを確認
      expect(typeof parsed).toBe("object");
      expect(parsed).not.toBeNull();
      const values = Object.values(parsed);
      const hasNested = values.some(
        (v) => typeof v === "object" && v !== null && !Array.isArray(v)
      );
      expect(hasNested).toBe(true);
    });

    it("should contain array value", () => {
      const parsed = JSON.parse(getSampleJson());
      const allValues = JSON.stringify(parsed);
      // 配列が含まれることをJSON文字列で確認
      expect(allValues).toMatch(/\[/);
    });

    it("should contain boolean value", () => {
      const allValues = JSON.stringify(JSON.parse(getSampleJson()));
      expect(allValues).toMatch(/true|false/);
    });

    it("should contain null value", () => {
      const allValues = JSON.stringify(JSON.parse(getSampleJson()));
      expect(allValues).toMatch(/null/);
    });
  });
});
