/**
 * JSONマージユーティリティ
 * 複数のJSONオブジェクトを様々な戦略でマージする
 */

/** 配列のマージ戦略 */
export type ArrayMergeStrategy = "replace" | "concat" | "unique";

/** マージオプション */
export interface MergeOptions {
  /** 深いマージを行うか（falseの場合はシャローマージ） */
  deep: boolean;
  /** 配列のマージ戦略 */
  arrayStrategy: ArrayMergeStrategy;
}

/** デフォルトのマージオプション */
export const DEFAULT_MERGE_OPTIONS: MergeOptions = {
  deep: true,
  arrayStrategy: "replace",
};

/**
 * 値がプレーンオブジェクトかどうかを判定する
 * @param value - 判定する値
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 配列をマージ戦略に従ってマージする
 * @param target - マージ先の配列
 * @param source - マージ元の配列
 * @param strategy - マージ戦略
 */
function mergeArrays(
  target: unknown[],
  source: unknown[],
  strategy: ArrayMergeStrategy
): unknown[] {
  switch (strategy) {
    case "concat":
      return [...target, ...source];
    case "unique": {
      const merged = [...target, ...source];
      return merged.filter(
        (item, index) =>
          merged.findIndex(
            (other) => JSON.stringify(other) === JSON.stringify(item)
          ) === index
      );
    }
    case "replace":
    default:
      return source;
  }
}

/**
 * 2つの値をマージする（再帰的）
 * @param target - マージ先
 * @param source - マージ元
 * @param options - マージオプション
 */
function mergeValues(
  target: unknown,
  source: unknown,
  options: MergeOptions
): unknown {
  if (!options.deep) {
    if (isPlainObject(target) && isPlainObject(source)) {
      return { ...target, ...source };
    }
    return source;
  }

  if (Array.isArray(target) && Array.isArray(source)) {
    return mergeArrays(target, source, options.arrayStrategy);
  }

  if (isPlainObject(target) && isPlainObject(source)) {
    const result: Record<string, unknown> = { ...target };
    for (const key of Object.keys(source)) {
      if (key in target) {
        result[key] = mergeValues(target[key], source[key], options);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  return source;
}

/**
 * 複数のJSON文字列をマージする
 * @param jsonStrings - マージするJSON文字列の配列（左から右の順でマージ）
 * @param options - マージオプション
 * @returns マージ済みのJSON文字列（2スペースインデント）
 * @throws {SyntaxError} 無効なJSONが含まれている場合
 * @throws {Error} オブジェクト以外のJSONをマージしようとした場合
 */
export function mergeJsonStrings(
  jsonStrings: string[],
  options: MergeOptions = DEFAULT_MERGE_OPTIONS
): string {
  if (jsonStrings.length === 0) {
    throw new Error("マージするJSONを1つ以上入力してください");
  }

  const parsed = jsonStrings.map((s, i) => {
    const trimmed = s.trim();
    if (!trimmed) {
      throw new Error(`JSON ${i + 1} が空です`);
    }
    return JSON.parse(trimmed);
  });

  let result: unknown = parsed[0];
  for (let i = 1; i < parsed.length; i++) {
    result = mergeValues(result, parsed[i], options);
  }

  return JSON.stringify(result, null, 2);
}

/**
 * サンプルJSONペアを返す
 */
export function getSampleJsonPair(): [string, string] {
  return [
    JSON.stringify(
      {
        name: "田中太郎",
        age: 30,
        address: {
          city: "東京",
          zip: "100-0001",
        },
        hobbies: ["読書", "旅行"],
      },
      null,
      2
    ),
    JSON.stringify(
      {
        age: 31,
        email: "taro@example.com",
        address: {
          city: "大阪",
          country: "日本",
        },
        hobbies: ["料理", "旅行"],
      },
      null,
      2
    ),
  ];
}
