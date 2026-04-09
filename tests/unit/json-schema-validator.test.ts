import { describe, it, expect } from "vite-plus/test";
import {
  validateJsonAgainstSchema,
  getSampleJsonData,
  getSampleSchema,
} from "../../app/utils/json-schema-validator";

// ヘルパー関数
function validate(json: unknown, schema: unknown) {
  return validateJsonAgainstSchema(
    JSON.stringify(json),
    JSON.stringify(schema)
  );
}

describe("validateJsonAgainstSchema", () => {
  describe("入力バリデーション", () => {
    it("空のJSONデータはエラーを返す", () => {
      const result = validateJsonAgainstSchema("", '{"type": "string"}');
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("input");
    });

    it("空のJSON Schemaはエラーを返す", () => {
      const result = validateJsonAgainstSchema('"hello"', "");
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("input");
    });

    it("不正なJSONデータはパースエラーを返す", () => {
      const result = validateJsonAgainstSchema(
        "{invalid}",
        '{"type": "object"}'
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("parse");
    });

    it("不正なJSON SchemaはパースエラーをW返す", () => {
      const result = validateJsonAgainstSchema('"hello"', "{invalid schema}");
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("parse");
    });
  });

  describe("type キーワード", () => {
    it("文字列型: 成功", () => {
      const result = validate("hello", { type: "string" });
      expect(result.valid).toBe(true);
    });

    it("文字列型: 数値は失敗", () => {
      const result = validate(42, { type: "string" });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("type");
    });

    it("integer型: 整数は成功", () => {
      const result = validate(42, { type: "integer" });
      expect(result.valid).toBe(true);
    });

    it("integer型: 小数は失敗", () => {
      const result = validate(3.14, { type: "integer" });
      expect(result.valid).toBe(false);
    });

    it("number型: 整数も成功", () => {
      const result = validate(42, { type: "number" });
      expect(result.valid).toBe(true);
    });

    it("number型: 小数も成功", () => {
      const result = validate(3.14, { type: "number" });
      expect(result.valid).toBe(true);
    });

    it("boolean型: 成功", () => {
      const result = validate(true, { type: "boolean" });
      expect(result.valid).toBe(true);
    });

    it("null型: 成功", () => {
      const result = validate(null, { type: "null" });
      expect(result.valid).toBe(true);
    });

    it("array型: 成功", () => {
      const result = validate([1, 2, 3], { type: "array" });
      expect(result.valid).toBe(true);
    });

    it("object型: 成功", () => {
      const result = validate({ key: "value" }, { type: "object" });
      expect(result.valid).toBe(true);
    });

    it("複数型: string|null は成功", () => {
      expect(validate("hello", { type: ["string", "null"] }).valid).toBe(true);
      expect(validate(null, { type: ["string", "null"] }).valid).toBe(true);
      expect(validate(42, { type: ["string", "null"] }).valid).toBe(false);
    });
  });

  describe("enum キーワード", () => {
    it("列挙値に含まれる場合は成功", () => {
      const result = validate("a", { enum: ["a", "b", "c"] });
      expect(result.valid).toBe(true);
    });

    it("列挙値に含まれない場合は失敗", () => {
      const result = validate("d", { enum: ["a", "b", "c"] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("enum");
    });

    it("混合型の enum: 成功", () => {
      expect(validate(1, { enum: [1, "a", null] }).valid).toBe(true);
      expect(validate(null, { enum: [1, "a", null] }).valid).toBe(true);
    });
  });

  describe("const キーワード", () => {
    it("const値と一致する場合は成功", () => {
      const result = validate("hello", { const: "hello" });
      expect(result.valid).toBe(true);
    });

    it("const値と一致しない場合は失敗", () => {
      const result = validate("world", { const: "hello" });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("const");
    });
  });

  describe("string キーワード", () => {
    it("minLength: 成功", () => {
      expect(validate("hello", { type: "string", minLength: 3 }).valid).toBe(
        true
      );
    });

    it("minLength: 失敗", () => {
      const result = validate("ab", { type: "string", minLength: 3 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("minLength");
    });

    it("maxLength: 成功", () => {
      expect(validate("hi", { type: "string", maxLength: 5 }).valid).toBe(true);
    });

    it("maxLength: 失敗", () => {
      const result = validate("toolong", { type: "string", maxLength: 5 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("maxLength");
    });

    it("pattern: 成功", () => {
      expect(
        validate("hello@example.com", {
          type: "string",
          pattern: "^[^@]+@[^@]+$",
        }).valid
      ).toBe(true);
    });

    it("pattern: 失敗", () => {
      const result = validate("invalid-email", {
        type: "string",
        pattern: "^[^@]+@[^@]+$",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("pattern");
    });
  });

  describe("number キーワード", () => {
    it("minimum: 成功", () => {
      expect(validate(5, { type: "number", minimum: 5 }).valid).toBe(true);
    });

    it("minimum: 失敗", () => {
      const result = validate(4, { type: "number", minimum: 5 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("minimum");
    });

    it("maximum: 成功", () => {
      expect(validate(10, { type: "number", maximum: 10 }).valid).toBe(true);
    });

    it("maximum: 失敗", () => {
      const result = validate(11, { type: "number", maximum: 10 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("maximum");
    });

    it("exclusiveMinimum: 成功", () => {
      expect(
        validate(6, { type: "number", exclusiveMinimum: 5 }).valid
      ).toBe(true);
    });

    it("exclusiveMinimum: 境界値は失敗", () => {
      const result = validate(5, { type: "number", exclusiveMinimum: 5 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("exclusiveMinimum");
    });

    it("exclusiveMaximum: 成功", () => {
      expect(
        validate(9, { type: "number", exclusiveMaximum: 10 }).valid
      ).toBe(true);
    });

    it("exclusiveMaximum: 境界値は失敗", () => {
      const result = validate(10, { type: "number", exclusiveMaximum: 10 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("exclusiveMaximum");
    });

    it("multipleOf: 成功", () => {
      expect(validate(10, { type: "number", multipleOf: 5 }).valid).toBe(true);
    });

    it("multipleOf: 失敗", () => {
      const result = validate(7, { type: "number", multipleOf: 5 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("multipleOf");
    });
  });

  describe("array キーワード", () => {
    it("minItems: 成功", () => {
      expect(validate([1, 2, 3], { type: "array", minItems: 2 }).valid).toBe(
        true
      );
    });

    it("minItems: 失敗", () => {
      const result = validate([1], { type: "array", minItems: 2 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("minItems");
    });

    it("maxItems: 成功", () => {
      expect(validate([1, 2], { type: "array", maxItems: 3 }).valid).toBe(true);
    });

    it("maxItems: 失敗", () => {
      const result = validate([1, 2, 3, 4], { type: "array", maxItems: 3 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("maxItems");
    });

    it("uniqueItems: 一意の場合は成功", () => {
      expect(
        validate([1, 2, 3], { type: "array", uniqueItems: true }).valid
      ).toBe(true);
    });

    it("uniqueItems: 重複ある場合は失敗", () => {
      const result = validate([1, 2, 1], { type: "array", uniqueItems: true });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("uniqueItems");
    });

    it("items（単一スキーマ）: 成功", () => {
      expect(
        validate([1, 2, 3], { type: "array", items: { type: "number" } }).valid
      ).toBe(true);
    });

    it("items（単一スキーマ）: 型違反は失敗", () => {
      const result = validate([1, "a", 3], {
        type: "array",
        items: { type: "number" },
      });
      expect(result.valid).toBe(false);
    });

    it("items（タプル形式）: 成功", () => {
      const result = validate([1, "hello"], {
        type: "array",
        items: [{ type: "integer" }, { type: "string" }],
      });
      expect(result.valid).toBe(true);
    });

    it("contains: 一致する要素がある場合は成功", () => {
      const result = validate([1, "hello", 3], {
        type: "array",
        contains: { type: "string" },
      });
      expect(result.valid).toBe(true);
    });

    it("contains: 一致する要素がない場合は失敗", () => {
      const result = validate([1, 2, 3], {
        type: "array",
        contains: { type: "string" },
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("contains");
    });
  });

  describe("object キーワード", () => {
    it("required: 必須プロパティが存在する場合は成功", () => {
      const result = validate(
        { name: "Alice", age: 30 },
        { type: "object", required: ["name", "age"] }
      );
      expect(result.valid).toBe(true);
    });

    it("required: 必須プロパティが欠けている場合は失敗", () => {
      const result = validate(
        { name: "Alice" },
        { type: "object", required: ["name", "age"] }
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("required");
      expect(result.errors[0].message).toContain("age");
    });

    it("properties: ネストされたバリデーション成功", () => {
      const result = validate(
        { name: "Alice", age: 30 },
        {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "integer", minimum: 0 },
          },
        }
      );
      expect(result.valid).toBe(true);
    });

    it("properties: ネストされたバリデーション失敗", () => {
      const result = validate(
        { name: "Alice", age: -1 },
        {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "integer", minimum: 0 },
          },
        }
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0].path).toBe("/age");
    });

    it("additionalProperties: false の場合、追加プロパティは失敗", () => {
      const result = validate(
        { name: "Alice", extra: "value" },
        {
          type: "object",
          properties: { name: { type: "string" } },
          additionalProperties: false,
        }
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("additionalProperties");
    });

    it("additionalProperties: true の場合、追加プロパティは成功", () => {
      const result = validate(
        { name: "Alice", extra: "value" },
        {
          type: "object",
          properties: { name: { type: "string" } },
          additionalProperties: true,
        }
      );
      expect(result.valid).toBe(true);
    });

    it("minProperties: 成功", () => {
      expect(
        validate(
          { a: 1, b: 2 },
          { type: "object", minProperties: 2 }
        ).valid
      ).toBe(true);
    });

    it("minProperties: 失敗", () => {
      const result = validate(
        { a: 1 },
        { type: "object", minProperties: 2 }
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("minProperties");
    });

    it("maxProperties: 成功", () => {
      expect(
        validate(
          { a: 1 },
          { type: "object", maxProperties: 2 }
        ).valid
      ).toBe(true);
    });

    it("maxProperties: 失敗", () => {
      const result = validate(
        { a: 1, b: 2, c: 3 },
        { type: "object", maxProperties: 2 }
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("maxProperties");
    });
  });

  describe("combining キーワード", () => {
    it("allOf: 全スキーマに一致する場合は成功", () => {
      const result = validate(
        { name: "Alice", age: 30 },
        {
          allOf: [
            { type: "object", required: ["name"] },
            { type: "object", required: ["age"] },
          ],
        }
      );
      expect(result.valid).toBe(true);
    });

    it("allOf: 一部スキーマに違反する場合は失敗", () => {
      const result = validate(
        { name: "Alice" },
        {
          allOf: [
            { type: "object", required: ["name"] },
            { type: "object", required: ["age"] },
          ],
        }
      );
      expect(result.valid).toBe(false);
    });

    it("anyOf: いずれかのスキーマに一致する場合は成功", () => {
      expect(
        validate("hello", { anyOf: [{ type: "string" }, { type: "number" }] })
          .valid
      ).toBe(true);
      expect(
        validate(42, { anyOf: [{ type: "string" }, { type: "number" }] }).valid
      ).toBe(true);
    });

    it("anyOf: どのスキーマにも一致しない場合は失敗", () => {
      const result = validate(true, {
        anyOf: [{ type: "string" }, { type: "number" }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("anyOf");
    });

    it("oneOf: 正確に1つのスキーマに一致する場合は成功", () => {
      const result = validate(1, {
        oneOf: [
          { type: "integer", minimum: 0 },
          { type: "string" },
        ],
      });
      expect(result.valid).toBe(true);
    });

    it("oneOf: 複数のスキーマに一致する場合は失敗", () => {
      const result = validate(1, {
        oneOf: [
          { type: "integer" },
          { type: "number" },
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("oneOf");
    });

    it("not: スキーマに一致しない場合は成功", () => {
      const result = validate("hello", { not: { type: "number" } });
      expect(result.valid).toBe(true);
    });

    it("not: スキーマに一致する場合は失敗", () => {
      const result = validate(42, { not: { type: "number" } });
      expect(result.valid).toBe(false);
      expect(result.errors[0].keyword).toBe("not");
    });
  });

  describe("複合バリデーション", () => {
    it("サンプルデータがサンプルスキーマに対してバリデーション成功", () => {
      const result = validateJsonAgainstSchema(
        getSampleJsonData(),
        getSampleSchema()
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("ネストされたオブジェクトのエラーパスが正しい", () => {
      const result = validate(
        { user: { name: 123 } },
        {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
          },
        }
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0].path).toBe("/user/name");
    });

    it("配列要素のエラーパスが正しい", () => {
      const result = validate(
        [1, "a", 3],
        { type: "array", items: { type: "integer" } }
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0].path).toBe("/1");
    });
  });
});

describe("getSampleJsonData", () => {
  it("有効なJSON文字列を返す", () => {
    const sample = getSampleJsonData();
    expect(() => JSON.parse(sample)).not.toThrow();
  });
});

describe("getSampleSchema", () => {
  it("有効なJSON文字列を返す", () => {
    const schema = getSampleSchema();
    expect(() => JSON.parse(schema)).not.toThrow();
  });

  it("$schema フィールドを含む", () => {
    const schema = JSON.parse(getSampleSchema());
    expect(schema.$schema).toBeDefined();
  });
});
