import { describe, test, expect } from "vite-plus/test";
import { generateZodSchema, getSampleJson } from "../../app/utils/json-to-zod";

const defaultOptions = {
  rootName: "schema",
  addImport: false,
  optional: false,
  nullable: false,
};

describe("generateZodSchema", () => {
  test("文字列プロパティが z.string() を生成する", () => {
    const result = generateZodSchema('{"name": "John"}', defaultOptions);
    expect(result).toContain("z.string()");
    expect(result).toContain("name:");
  });

  test("数値プロパティが z.number() を生成する", () => {
    const result = generateZodSchema('{"age": 30}', defaultOptions);
    expect(result).toContain("z.number()");
    expect(result).toContain("age:");
  });

  test("真偽値プロパティが z.boolean() を生成する", () => {
    const result = generateZodSchema('{"active": true}', defaultOptions);
    expect(result).toContain("z.boolean()");
    expect(result).toContain("active:");
  });

  test("nullプロパティが z.null() を生成する", () => {
    const result = generateZodSchema('{"value": null}', defaultOptions);
    expect(result).toContain("z.null()");
    expect(result).toContain("value:");
  });

  test("文字列配列が z.array(z.string()) を生成する", () => {
    const result = generateZodSchema('{"tags": ["a", "b"]}', defaultOptions);
    expect(result).toContain("z.array(z.string())");
    expect(result).toContain("tags:");
  });

  test("オブジェクト配列が z.array(z.object(...)) を生成する", () => {
    const result = generateZodSchema(
      '{"users": [{"name": "Alice"}]}',
      defaultOptions
    );
    expect(result).toContain("z.array(z.object(");
    expect(result).toContain("users:");
    expect(result).toContain("z.string()");
  });

  test("ネストされたオブジェクトが z.object() をネストして生成する", () => {
    const result = generateZodSchema(
      '{"address": {"city": "Tokyo"}}',
      defaultOptions
    );
    expect(result).toContain("address:");
    expect(result).toContain("z.object(");
    expect(result).toContain("city:");
    expect(result).toContain("z.string()");
  });

  test("addImport=true のときにimport文が含まれる", () => {
    const result = generateZodSchema('{"name": "John"}', {
      ...defaultOptions,
      addImport: true,
    });
    expect(result).toContain('import { z } from "zod"');
  });

  test("addImport=false のときにimport文が含まれない", () => {
    const result = generateZodSchema('{"name": "John"}', {
      ...defaultOptions,
      addImport: false,
    });
    expect(result).not.toContain("import");
  });

  test("optional=true のとき全フィールドに .optional() が付与される", () => {
    const result = generateZodSchema('{"name": "John", "age": 30}', {
      ...defaultOptions,
      optional: true,
    });
    expect(result).toContain(".optional()");
  });

  test("optional=false のとき .optional() が付与されない", () => {
    const result = generateZodSchema('{"name": "John"}', {
      ...defaultOptions,
      optional: false,
    });
    expect(result).not.toContain(".optional()");
  });

  test("nullable=true のとき null値が z.unknown().nullable() になる", () => {
    const result = generateZodSchema('{"value": null}', {
      ...defaultOptions,
      nullable: true,
    });
    expect(result).toContain("z.unknown().nullable()");
    expect(result).not.toContain("z.null()");
  });

  test("nullable=false のとき null値が z.null() になる", () => {
    const result = generateZodSchema('{"value": null}', {
      ...defaultOptions,
      nullable: false,
    });
    expect(result).toContain("z.null()");
    expect(result).not.toContain("nullable()");
  });

  test("ルートが配列の場合 z.array(...) を生成する", () => {
    const result = generateZodSchema('[{"name": "John"}]', defaultOptions);
    expect(result).toContain("z.array(");
    expect(result).toContain("z.object(");
    expect(result).toContain("z.string()");
  });

  test("無効なJSONでエラーをスローする", () => {
    expect(() => generateZodSchema("invalid json", defaultOptions)).toThrow(
      "無効なJSON形式です"
    );
  });

  test("空文字列でエラーをスローする", () => {
    expect(() => generateZodSchema("", defaultOptions)).toThrow(
      "JSONを入力してください"
    );
  });

  test("空白のみの文字列でエラーをスローする", () => {
    expect(() => generateZodSchema("   ", defaultOptions)).toThrow(
      "JSONを入力してください"
    );
  });

  test("カスタムルート変数名が出力に使用される", () => {
    const result = generateZodSchema('{"name": "John"}', {
      ...defaultOptions,
      rootName: "mySchema",
    });
    expect(result).toContain("export const mySchema =");
  });

  test("デフォルトのルート変数名 schema が使用される", () => {
    const result = generateZodSchema('{"name": "John"}', defaultOptions);
    expect(result).toContain("export const schema =");
  });

  test("空のオブジェクトが z.object({}) を生成する", () => {
    const result = generateZodSchema("{}", defaultOptions);
    expect(result).toContain("z.object({})");
  });

  test("空の配列が z.array(z.unknown()) を生成する", () => {
    const result = generateZodSchema("[]", defaultOptions);
    expect(result).toContain("z.array(z.unknown())");
  });

  test("プリミティブ値（文字列）のルートJSONを処理する", () => {
    const result = generateZodSchema('"hello"', defaultOptions);
    expect(result).toContain("z.string()");
  });

  test("プリミティブ値（数値）のルートJSONを処理する", () => {
    const result = generateZodSchema("42", defaultOptions);
    expect(result).toContain("z.number()");
  });

  test("複合的なネストオブジェクトを正しく処理する", () => {
    const json = JSON.stringify({
      name: "John",
      age: 30,
      active: true,
      tags: ["a", "b"],
      address: { city: "Tokyo" },
    });
    const result = generateZodSchema(json, defaultOptions);
    expect(result).toContain("z.string()");
    expect(result).toContain("z.number()");
    expect(result).toContain("z.boolean()");
    expect(result).toContain("z.array(z.string())");
    expect(result).toContain("z.object(");
  });
});

describe("getSampleJson", () => {
  test("有効なJSONを返す", () => {
    const sample = getSampleJson();
    expect(() => JSON.parse(sample)).not.toThrow();
  });

  test("null値を含む", () => {
    const sample = getSampleJson();
    const parsed = JSON.parse(sample) as Record<string, unknown>;
    const hasNull = Object.values(parsed).some((v) => v === null);
    expect(hasNull).toBe(true);
  });

  test("配列を含む", () => {
    const sample = getSampleJson();
    const parsed = JSON.parse(sample) as Record<string, unknown>;
    const hasArray = Object.values(parsed).some((v) => Array.isArray(v));
    expect(hasArray).toBe(true);
  });

  test("ネストされたオブジェクトを含む", () => {
    const sample = getSampleJson();
    const parsed = JSON.parse(sample) as Record<string, unknown>;
    const hasObject = Object.values(parsed).some(
      (v) => typeof v === "object" && v !== null && !Array.isArray(v)
    );
    expect(hasObject).toBe(true);
  });
});
