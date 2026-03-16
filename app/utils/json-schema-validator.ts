/**
 * JSON Schema (draft-07) バリデーターユーティリティ
 *
 * サポートするキーワード:
 * - type, enum, const
 * - Object: properties, required, additionalProperties, patternProperties, minProperties, maxProperties
 * - Array: items, additionalItems, minItems, maxItems, uniqueItems, contains
 * - String: minLength, maxLength, pattern
 * - Number: minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf
 * - Combining: allOf, anyOf, oneOf, not
 */

/** バリデーションエラー */
export interface ValidationError {
  /** エラーが発生したJSONパス (例: "/user/name") */
  path: string;
  /** エラーメッセージ */
  message: string;
  /** 違反したキーワード */
  keyword: string;
}

/** バリデーション結果 */
export interface ValidationResult {
  /** バリデーション成功かどうか */
  valid: boolean;
  /** バリデーションエラー一覧 */
  errors: ValidationError[];
}

/** JSON Schemaの型名 */
type JsonSchemaTypeName =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "null"
  | "array"
  | "object";

/** JSON Schemaオブジェクト */
interface JsonSchema {
  $schema?: string;
  type?: JsonSchemaTypeName | JsonSchemaTypeName[];
  enum?: unknown[];
  const?: unknown;

  // object keywords
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  patternProperties?: Record<string, JsonSchema>;
  minProperties?: number;
  maxProperties?: number;

  // array keywords
  items?: JsonSchema | JsonSchema[];
  additionalItems?: boolean | JsonSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  contains?: JsonSchema;

  // string keywords
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // number keywords
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;

  // combining keywords
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;

  // annotations
  title?: string;
  description?: string;
}

/**
 * 値のJSONスキーマ型名を返す
 * @param value - 型を判定する値
 * @returns JSON Schemaの型名
 */
function getType(value: unknown): JsonSchemaTypeName {
  if (value === null) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  if (typeof value === "string") return "string";
  if (Array.isArray(value)) return "array";
  return "object";
}

/**
 * 2つの値が深く等しいかどうかを判定する
 * @param a - 比較対象の値A
 * @param b - 比較対象の値B
 * @returns 等しい場合true
 */
function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * サブスキーマに対してバリデーションを実行し、エラーがないか確認する
 * @param value - バリデーション対象の値
 * @param schema - JSON Schema
 * @returns エラーがない場合true
 */
function isValid(value: unknown, schema: JsonSchema): boolean {
  const tempErrors: ValidationError[] = [];
  validateValue(value, schema, "", tempErrors);
  return tempErrors.length === 0;
}

/**
 * 再帰的にバリデーションを実行する
 * @param value - バリデーション対象の値
 * @param schema - JSON Schema
 * @param path - 現在のJSONパス (JSONPointer形式)
 * @param errors - エラー収集配列
 */
function validateValue(
  value: unknown,
  schema: JsonSchema,
  path: string,
  errors: ValidationError[]
): void {
  const actualType = getType(value);

  // type チェック
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const typeMatch = types.some((t) => {
      if (t === "integer") {
        return (
          actualType === "integer" ||
          (actualType === "number" && Number.isInteger(value as number))
        );
      }
      if (t === "number") {
        return actualType === "number" || actualType === "integer";
      }
      return t === actualType;
    });

    if (!typeMatch) {
      errors.push({
        path,
        keyword: "type",
        message: `型が一致しません。期待: ${types.join(" | ")}, 実際: ${actualType}`,
      });
      // 型が違う場合は他のキーワードのチェックはスキップ
      return;
    }
  }

  // const チェック
  if ("const" in schema) {
    if (!deepEqual(value, schema.const)) {
      errors.push({
        path,
        keyword: "const",
        message: `値は ${JSON.stringify(schema.const)} でなければなりません`,
      });
    }
    return;
  }

  // enum チェック
  if (schema.enum !== undefined) {
    const match = schema.enum.some((e) => deepEqual(value, e));
    if (!match) {
      const enumStr = schema.enum.map((e) => JSON.stringify(e)).join(", ");
      errors.push({
        path,
        keyword: "enum",
        message: `値は次のいずれかでなければなりません: ${enumStr}`,
      });
    }
  }

  // string バリデーション
  if (actualType === "string") {
    const str = value as string;

    if (schema.minLength !== undefined && str.length < schema.minLength) {
      errors.push({
        path,
        keyword: "minLength",
        message: `文字列の長さは ${schema.minLength} 文字以上である必要があります（現在: ${str.length} 文字）`,
      });
    }

    if (schema.maxLength !== undefined && str.length > schema.maxLength) {
      errors.push({
        path,
        keyword: "maxLength",
        message: `文字列の長さは ${schema.maxLength} 文字以下である必要があります（現在: ${str.length} 文字）`,
      });
    }

    if (schema.pattern !== undefined) {
      try {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(str)) {
          errors.push({
            path,
            keyword: "pattern",
            message: `文字列がパターン "${schema.pattern}" に一致しません`,
          });
        }
      } catch {
        errors.push({
          path,
          keyword: "pattern",
          message: `パターンが無効な正規表現です: ${schema.pattern}`,
        });
      }
    }
  }

  // number/integer バリデーション
  if (actualType === "number" || actualType === "integer") {
    const num = value as number;

    if (schema.minimum !== undefined && num < schema.minimum) {
      errors.push({
        path,
        keyword: "minimum",
        message: `値は ${schema.minimum} 以上である必要があります（現在: ${num}）`,
      });
    }

    if (schema.maximum !== undefined && num > schema.maximum) {
      errors.push({
        path,
        keyword: "maximum",
        message: `値は ${schema.maximum} 以下である必要があります（現在: ${num}）`,
      });
    }

    if (
      typeof schema.exclusiveMinimum === "number" &&
      num <= schema.exclusiveMinimum
    ) {
      errors.push({
        path,
        keyword: "exclusiveMinimum",
        message: `値は ${schema.exclusiveMinimum} より大きい必要があります（現在: ${num}）`,
      });
    }

    if (
      typeof schema.exclusiveMaximum === "number" &&
      num >= schema.exclusiveMaximum
    ) {
      errors.push({
        path,
        keyword: "exclusiveMaximum",
        message: `値は ${schema.exclusiveMaximum} より小さい必要があります（現在: ${num}）`,
      });
    }

    if (
      schema.multipleOf !== undefined &&
      schema.multipleOf > 0 &&
      num % schema.multipleOf !== 0
    ) {
      errors.push({
        path,
        keyword: "multipleOf",
        message: `値は ${schema.multipleOf} の倍数である必要があります（現在: ${num}）`,
      });
    }
  }

  // array バリデーション
  if (actualType === "array") {
    const arr = value as unknown[];

    if (schema.minItems !== undefined && arr.length < schema.minItems) {
      errors.push({
        path,
        keyword: "minItems",
        message: `配列の要素数は ${schema.minItems} 以上である必要があります（現在: ${arr.length}）`,
      });
    }

    if (schema.maxItems !== undefined && arr.length > schema.maxItems) {
      errors.push({
        path,
        keyword: "maxItems",
        message: `配列の要素数は ${schema.maxItems} 以下である必要があります（現在: ${arr.length}）`,
      });
    }

    if (schema.uniqueItems === true) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (deepEqual(arr[i], arr[j])) {
            errors.push({
              path,
              keyword: "uniqueItems",
              message: `配列の要素は一意である必要があります（インデックス ${i} と ${j} が重複）`,
            });
            break;
          }
        }
      }
    }

    if (schema.items !== undefined) {
      if (Array.isArray(schema.items)) {
        // タプル形式
        for (let i = 0; i < schema.items.length; i++) {
          if (i < arr.length) {
            validateValue(arr[i], schema.items[i], `${path}/${i}`, errors);
          }
        }
        // additionalItems
        if (
          schema.additionalItems === false &&
          arr.length > schema.items.length
        ) {
          errors.push({
            path,
            keyword: "additionalItems",
            message: `配列の要素数がスキーマの定義（${schema.items.length}）を超えています（現在: ${arr.length}）`,
          });
        } else if (
          schema.additionalItems !== undefined &&
          schema.additionalItems !== false &&
          typeof schema.additionalItems === "object"
        ) {
          for (let i = schema.items.length; i < arr.length; i++) {
            validateValue(
              arr[i],
              schema.additionalItems as JsonSchema,
              `${path}/${i}`,
              errors
            );
          }
        }
      } else {
        // 全要素が同じスキーマに従う
        for (let i = 0; i < arr.length; i++) {
          validateValue(arr[i], schema.items, `${path}/${i}`, errors);
        }
      }
    }

    if (schema.contains !== undefined) {
      const hasMatch = arr.some((item) => isValid(item, schema.contains!));
      if (!hasMatch) {
        errors.push({
          path,
          keyword: "contains",
          message: `配列には指定されたスキーマに一致する要素が少なくとも1つ必要です`,
        });
      }
    }
  }

  // object バリデーション
  if (actualType === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
      errors.push({
        path,
        keyword: "minProperties",
        message: `オブジェクトのプロパティ数は ${schema.minProperties} 以上である必要があります（現在: ${keys.length}）`,
      });
    }

    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) {
      errors.push({
        path,
        keyword: "maxProperties",
        message: `オブジェクトのプロパティ数は ${schema.maxProperties} 以下である必要があります（現在: ${keys.length}）`,
      });
    }

    // required
    if (schema.required !== undefined) {
      for (const req of schema.required) {
        if (!(req in obj)) {
          errors.push({
            path,
            keyword: "required",
            message: `必須プロパティ "${req}" が存在しません`,
          });
        }
      }
    }

    // properties
    if (schema.properties !== undefined) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          validateValue(obj[key], propSchema, `${path}/${key}`, errors);
        }
      }
    }

    // patternProperties
    if (schema.patternProperties !== undefined) {
      for (const [pattern, propSchema] of Object.entries(
        schema.patternProperties
      )) {
        try {
          const regex = new RegExp(pattern);
          for (const key of keys) {
            if (regex.test(key)) {
              validateValue(obj[key], propSchema, `${path}/${key}`, errors);
            }
          }
        } catch {
          // 無効なパターンはスキップ
        }
      }
    }

    // additionalProperties
    if (schema.additionalProperties !== undefined) {
      const definedKeys = new Set(Object.keys(schema.properties ?? {}));
      const patternMatchedKeys = new Set<string>();

      if (schema.patternProperties) {
        for (const pattern of Object.keys(schema.patternProperties)) {
          try {
            const regex = new RegExp(pattern);
            for (const key of keys) {
              if (regex.test(key)) {
                patternMatchedKeys.add(key);
              }
            }
          } catch {
            // 無効なパターンはスキップ
          }
        }
      }

      const additionalKeys = keys.filter(
        (k) => !definedKeys.has(k) && !patternMatchedKeys.has(k)
      );

      if (schema.additionalProperties === false) {
        for (const key of additionalKeys) {
          errors.push({
            path: `${path}/${key}`,
            keyword: "additionalProperties",
            message: `追加のプロパティ "${key}" は許可されていません`,
          });
        }
      } else if (
        typeof schema.additionalProperties === "object" &&
        schema.additionalProperties !== null
      ) {
        for (const key of additionalKeys) {
          validateValue(
            obj[key],
            schema.additionalProperties as JsonSchema,
            `${path}/${key}`,
            errors
          );
        }
      }
    }
  }

  // combining keywords

  // allOf
  if (schema.allOf !== undefined) {
    for (let i = 0; i < schema.allOf.length; i++) {
      const subErrors: ValidationError[] = [];
      validateValue(value, schema.allOf[i], path, subErrors);
      for (const err of subErrors) {
        errors.push({
          ...err,
          keyword: `allOf[${i}]/${err.keyword}`,
        });
      }
    }
  }

  // anyOf
  if (schema.anyOf !== undefined) {
    const anyMatch = schema.anyOf.some((s) => isValid(value, s));
    if (!anyMatch) {
      errors.push({
        path,
        keyword: "anyOf",
        message: `値は anyOf のいずれかのスキーマに一致する必要があります（${schema.anyOf.length} 個中0個が一致）`,
      });
    }
  }

  // oneOf
  if (schema.oneOf !== undefined) {
    const matchCount = schema.oneOf.filter((s) => isValid(value, s)).length;
    if (matchCount !== 1) {
      errors.push({
        path,
        keyword: "oneOf",
        message: `値は oneOf のスキーマのうち正確に1つに一致する必要があります（${schema.oneOf.length} 個中 ${matchCount} 個が一致）`,
      });
    }
  }

  // not
  if (schema.not !== undefined) {
    if (isValid(value, schema.not)) {
      errors.push({
        path,
        keyword: "not",
        message: `値は not スキーマに一致しないようにする必要があります`,
      });
    }
  }
}

/**
 * JSONデータをJSON Schemaに対してバリデーションする
 * @param jsonString - バリデーション対象のJSON文字列
 * @param schemaString - JSON Schema文字列
 * @returns バリデーション結果
 */
export function validateJsonAgainstSchema(
  jsonString: string,
  schemaString: string
): ValidationResult {
  if (!jsonString.trim()) {
    return {
      valid: false,
      errors: [
        {
          path: "",
          keyword: "input",
          message: "JSONデータを入力してください",
        },
      ],
    };
  }

  if (!schemaString.trim()) {
    return {
      valid: false,
      errors: [
        {
          path: "",
          keyword: "input",
          message: "JSON Schemaを入力してください",
        },
      ],
    };
  }

  let jsonData: unknown;
  try {
    jsonData = JSON.parse(jsonString);
  } catch (e) {
    return {
      valid: false,
      errors: [
        {
          path: "",
          keyword: "parse",
          message: `JSONデータのパースに失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`,
        },
      ],
    };
  }

  let schema: JsonSchema;
  try {
    schema = JSON.parse(schemaString) as JsonSchema;
  } catch (e) {
    return {
      valid: false,
      errors: [
        {
          path: "",
          keyword: "parse",
          message: `JSON Schemaのパースに失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`,
        },
      ],
    };
  }

  const errors: ValidationError[] = [];
  validateValue(jsonData, schema, "", errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * サンプルのJSONデータを返す（バリデーション成功例）
 * @returns JSON文字列
 */
export function getSampleJsonData(): string {
  return JSON.stringify(
    {
      id: 1,
      name: "山田太郎",
      email: "yamada@example.com",
      age: 25,
      isActive: true,
      tags: ["developer", "typescript"],
    },
    null,
    2
  );
}

/**
 * サンプルのJSON Schemaを返す
 * @returns JSON Schema文字列
 */
export function getSampleSchema(): string {
  return JSON.stringify(
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      required: ["id", "name", "email", "age"],
      properties: {
        id: {
          type: "integer",
          minimum: 1,
        },
        name: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        email: {
          type: "string",
          pattern: "^[^@]+@[^@]+\\.[^@]+$",
        },
        age: {
          type: "integer",
          minimum: 0,
          maximum: 150,
        },
        isActive: {
          type: "boolean",
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
          uniqueItems: true,
        },
      },
      additionalProperties: false,
    },
    null,
    2
  );
}
