/**
 * JSON Schema (draft-07) ジェネレーターユーティリティ
 */

/** JSON Schemaの型名 */
type JsonSchemaTypeName =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "null"
  | "object"
  | "array";

/** JSON Schemaオブジェクト */
interface JsonSchemaObject {
  $schema?: string;
  type?: JsonSchemaTypeName | JsonSchemaTypeName[];
  properties?: Record<string, JsonSchemaObject>;
  required?: string[];
  additionalProperties?: boolean | JsonSchemaObject;
  items?: JsonSchemaObject | { oneOf: JsonSchemaObject[] };
  oneOf?: JsonSchemaObject[];
}

/**
 * 2つのスキーマが同一かどうかを判定する
 * @param a - 比較対象スキーマA
 * @param b - 比較対象スキーマB
 * @returns 同一の場合true
 */
function schemasEqual(a: JsonSchemaObject, b: JsonSchemaObject): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * スキーマの配列から重複を取り除く
 * @param schemas - 重複排除対象のスキーマ配列
 * @returns 重複のないスキーマ配列
 */
function deduplicateSchemas(schemas: JsonSchemaObject[]): JsonSchemaObject[] {
  return schemas.filter(
    (schema, index, self) =>
      self.findIndex((s) => schemasEqual(s, schema)) === index
  );
}

/**
 * 値からJSON Schemaを推論する（内部実装）
 * @param value - スキーマを推論する対象の値
 * @returns 推論されたJSON Schemaオブジェクト
 */
function inferSchema(value: unknown): JsonSchemaObject {
  if (value === null) {
    return { type: "null" };
  }

  if (typeof value === "boolean") {
    return { type: "boolean" };
  }

  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return { type: "integer" };
    }
    return { type: "number" };
  }

  if (typeof value === "string") {
    return { type: "string" };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: "array", items: {} };
    }

    const itemSchemas = value.map((item) => inferSchema(item));
    const dedupedSchemas = deduplicateSchemas(itemSchemas);

    if (dedupedSchemas.length === 1) {
      return { type: "array", items: dedupedSchemas[0] };
    }

    return { type: "array", items: { oneOf: dedupedSchemas } };
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      };
    }

    const properties: Record<string, JsonSchemaObject> = {};
    for (const key of keys) {
      properties[key] = inferSchema(obj[key]);
    }

    return {
      type: "object",
      properties,
      required: keys,
      additionalProperties: false,
    };
  }

  return {};
}

/**
 * JSON文字列からJSON Schema (draft-07) を生成する
 * @param jsonText - スキーマを生成する対象のJSON文字列
 * @returns JSON Schema文字列（整形済み）
 * @throws {Error} 空文字列または無効なJSON形式の場合にエラーをスローする
 */
export function generateJsonSchema(jsonText: string): string {
  if (!jsonText.trim()) {
    throw new Error("JSONを入力してください");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("無効なJSON形式です");
  }

  const schema = inferSchema(parsed);

  // $schema をルートの先頭に配置して返す
  const result: JsonSchemaObject = {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...schema,
  };

  return JSON.stringify(result, null, 2);
}

/**
 * JSON Schema生成のデモ用サンプルJSONを返す
 * ネストオブジェクト・配列・null・真偽値を含む複合型のデータ
 * @returns サンプルJSON文字列
 */
export function getSampleJson(): string {
  const sample = {
    user: {
      id: 1,
      name: "山田太郎",
      email: "yamada@example.com",
      age: 30,
      score: 98.5,
      isActive: true,
      nickname: null,
      address: {
        city: "東京",
        zipCode: "100-0001",
      },
      tags: ["developer", "typescript"],
      scores: [95, 87, 100],
    },
  };
  return JSON.stringify(sample, null, 2);
}
