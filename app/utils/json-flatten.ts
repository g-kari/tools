/**
 * JSONフラット化ユーティリティ
 * ネストされたJSONオブジェクトをフラット化し、フラットなJSONをネスト化する
 */

/** フラット化オプション */
export interface FlattenOptions {
  /** キーの区切り文字（デフォルト: "."） */
  delimiter?: string;
  /** 配列をフラット化するか（デフォルト: true） */
  flattenArrays?: boolean;
  /** 最大深さ（0は無制限、デフォルト: 0） */
  maxDepth?: number;
}

/** アンフラット化オプション */
export interface UnflattenOptions {
  /** キーの区切り文字（デフォルト: "."） */
  delimiter?: string;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * ネストされたJSONオブジェクトをフラットなオブジェクトに変換する
 * @param obj - フラット化するオブジェクト
 * @param options - フラット化オプション
 * @returns フラット化されたオブジェクト
 */
export function flattenJson(
  obj: JsonValue,
  options: FlattenOptions = {},
): Record<string, JsonValue> {
  const { delimiter = ".", flattenArrays = true, maxDepth = 0 } = options;
  const result: Record<string, JsonValue> = {};

  function recurse(current: JsonValue, prefix: string, depth: number): void {
    if (maxDepth > 0 && depth >= maxDepth) {
      result[prefix] = current;
      return;
    }

    if (current === null || typeof current !== "object") {
      result[prefix] = current;
      return;
    }

    if (Array.isArray(current)) {
      if (!flattenArrays) {
        result[prefix] = current;
        return;
      }
      if (current.length === 0) {
        result[prefix] = [];
        return;
      }
      current.forEach((item, index) => {
        const newKey = prefix ? `${prefix}${delimiter}${index}` : String(index);
        recurse(item, newKey, depth + 1);
      });
      return;
    }

    const keys = Object.keys(current as Record<string, JsonValue>);
    if (keys.length === 0) {
      result[prefix] = {};
      return;
    }

    keys.forEach((key) => {
      const newKey = prefix ? `${prefix}${delimiter}${key}` : key;
      recurse((current as Record<string, JsonValue>)[key], newKey, depth + 1);
    });
  }

  if (obj === null || typeof obj !== "object") {
    return { "": obj };
  }

  recurse(obj, "", 0);
  return result;
}

/**
 * フラットなオブジェクトをネストされたJSONオブジェクトに変換する
 * @param obj - アンフラット化するフラットオブジェクト
 * @param options - アンフラット化オプション
 * @returns ネスト化されたオブジェクト
 */
export function unflattenJson(
  obj: Record<string, JsonValue>,
  options: UnflattenOptions = {},
): JsonValue {
  const { delimiter = "." } = options;

  if (Object.keys(obj).length === 0) {
    return {};
  }

  const result: Record<string, JsonValue> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const parts = key.split(delimiter);
    let current: Record<string, JsonValue> = result;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = value;
      } else {
        const nextPart = parts[index + 1];
        const isNextNumeric = /^\d+$/.test(nextPart);

        if (!(part in current)) {
          current[part] = isNextNumeric ? [] : {};
        }

        if (Array.isArray(current[part])) {
          if (!isNextNumeric) {
            current[part] = Object.fromEntries(
              (current[part] as JsonValue[]).map((v, i) => [i, v]),
            );
          }
        } else if (typeof current[part] === "object" && current[part] !== null) {
          if (isNextNumeric && !Array.isArray(current[part])) {
            // keep as object
          }
        }

        current = current[part] as Record<string, JsonValue>;
      }
    });
  });

  return convertArrays(result);
}

/**
 * 数値インデックスオブジェクトを配列に変換する内部ヘルパー
 * @param obj - 変換するオブジェクト
 * @returns 変換されたオブジェクト
 */
function convertArrays(obj: Record<string, JsonValue>): JsonValue {
  const keys = Object.keys(obj);

  if (keys.length === 0) {
    return obj;
  }

  const allNumeric = keys.every((k) => /^\d+$/.test(k));

  if (allNumeric) {
    const maxIndex = Math.max(...keys.map(Number));
    const arr: JsonValue[] = Array.from({ length: maxIndex + 1 }, () => null);
    keys.forEach((k) => {
      const val = obj[k];
      arr[Number(k)] =
        val !== null && typeof val === "object" && !Array.isArray(val)
          ? convertArrays(val as Record<string, JsonValue>)
          : val;
    });
    return arr;
  }

  const result: Record<string, JsonValue> = {};
  keys.forEach((k) => {
    const val = obj[k];
    result[k] =
      val !== null && typeof val === "object" && !Array.isArray(val)
        ? convertArrays(val as Record<string, JsonValue>)
        : val;
  });
  return result;
}

/**
 * JSON文字列をフラット化する
 * @param jsonString - フラット化するJSON文字列
 * @param options - フラット化オプション
 * @returns フラット化されたJSON文字列
 * @throws {SyntaxError} 無効なJSONの場合
 */
export function flattenJsonString(jsonString: string, options: FlattenOptions = {}): string {
  const parsed = JSON.parse(jsonString) as JsonValue;
  const flattened = flattenJson(parsed, options);
  return JSON.stringify(flattened, null, 2);
}

/**
 * フラットなJSON文字列をアンフラット化する
 * @param jsonString - アンフラット化するJSON文字列
 * @param options - アンフラット化オプション
 * @returns アンフラット化されたJSON文字列
 * @throws {SyntaxError} 無効なJSONの場合
 */
export function unflattenJsonString(jsonString: string, options: UnflattenOptions = {}): string {
  const parsed = JSON.parse(jsonString) as Record<string, JsonValue>;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("フラット化されたJSONはオブジェクト形式である必要があります");
  }
  const unflattened = unflattenJson(parsed, options);
  return JSON.stringify(unflattened, null, 2);
}
