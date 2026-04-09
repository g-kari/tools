/**
 * JSON→GraphQLスキーマジェネレーターユーティリティ
 */

/**
 * GraphQLスキーマ生成のオプション
 */
export interface JsonToGraphQLOptions {
  /** ルート型名（デフォルト: "Root"） */
  rootTypeName: string;
  /** true=null以外のフィールドを Non-Null (!) にする */
  nonNull: boolean;
  /** true=type の代わりに interface を使用する */
  useInterface: boolean;
}

/**
 * 文字列をPascalCaseに変換する
 * @param key - 変換対象のキー文字列
 * @returns PascalCase文字列
 */
function toPascalCase(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * 数値が整数かどうかを判定する
 * @param value - 判定対象の数値
 * @returns 整数の場合 true
 */
function isInt(value: number): boolean {
  return Number.isInteger(value);
}

/**
 * JSON値からGraphQL型名を再帰的に推論し、
 * ネストオブジェクトを typeDefsMap に収集する
 * @param value - 型を推論する対象の値
 * @param typeName - このオブジェクトの型名（オブジェクト時に使用）
 * @param options - スキーマ生成オプション
 * @param typeDefsMap - 収集済み型定義のMap（型名 → フィールド定義行の配列）
 * @returns GraphQL型名文字列
 */
function inferGraphQLType(
  value: unknown,
  typeName: string,
  options: JsonToGraphQLOptions,
  typeDefsMap: Map<string, string[]>,
): string {
  if (value === null) {
    return "String";
  }

  if (typeof value === "string") {
    return "String";
  }

  if (typeof value === "number") {
    return isInt(value) ? "Int" : "Float";
  }

  if (typeof value === "boolean") {
    return "Boolean";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[String]";
    }
    const firstElem = value[0];
    const elemType = inferGraphQLType(firstElem, typeName, options, typeDefsMap);
    const nn = options.nonNull ? "!" : "";
    return `[${elemType}${nn}]`;
  }

  if (typeof value === "object" && value !== null) {
    // ネストされたオブジェクト → 新しい型として登録
    collectTypeDef(value as Record<string, unknown>, typeName, options, typeDefsMap);
    return typeName;
  }

  return "String";
}

/**
 * オブジェクトからGraphQL型定義を生成し typeDefsMap に収集する
 * @param obj - 型定義を生成するオブジェクト
 * @param typeName - 生成する型の名前
 * @param options - スキーマ生成オプション
 * @param typeDefsMap - 収集済み型定義のMap
 */
function collectTypeDef(
  obj: Record<string, unknown>,
  typeName: string,
  options: JsonToGraphQLOptions,
  typeDefsMap: Map<string, string[]>,
): void {
  if (typeDefsMap.has(typeName)) {
    return;
  }

  const fieldLines: string[] = [];

  for (const [key, val] of Object.entries(obj)) {
    const childTypeName = toPascalCase(key);
    let fieldType = inferGraphQLType(val, childTypeName, options, typeDefsMap);

    if (options.nonNull && val !== null) {
      fieldType = `${fieldType}!`;
    }

    fieldLines.push(`  ${key}: ${fieldType}`);
  }

  typeDefsMap.set(typeName, fieldLines);
}

/**
 * JSON文字列からGraphQLスキーマを生成する
 * @param json - 変換対象のJSON文字列
 * @param options - スキーマ生成オプション
 * @returns GraphQLスキーマ定義文字列（SDL形式）
 * @throws {Error} 空文字列または無効なJSON形式の場合にエラーをスローする
 */
export function generateGraphQLSchema(json: string, options: JsonToGraphQLOptions): string {
  if (!json.trim()) {
    throw new Error("JSONを入力してください");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("無効なJSON形式です");
  }

  const rootTypeName = options.rootTypeName || "Root";
  const keyword = options.useInterface ? "interface" : "type";
  const typeDefsMap = new Map<string, string[]>();

  // ルートが配列の場合は最初の要素を使う
  const rootValue = Array.isArray(parsed) ? (parsed.length > 0 ? parsed[0] : {}) : parsed;

  if (typeof rootValue !== "object" || rootValue === null) {
    // プリミティブなルートの場合
    const fieldType = inferGraphQLType(rootValue, "Value", options, typeDefsMap);
    const nn = options.nonNull ? "!" : "";
    return `${keyword} ${rootTypeName} {\n  value: ${fieldType}${nn}\n}`;
  }

  collectTypeDef(rootValue as Record<string, unknown>, rootTypeName, options, typeDefsMap);

  // ルート型を最後に出力するため、順序を整える
  const entries = Array.from(typeDefsMap.entries());
  // ルート型以外を先に、ルート型を最後に
  const dependentTypes = entries.filter(([name]) => name !== rootTypeName);
  const rootEntry = entries.find(([name]) => name === rootTypeName);

  const orderedEntries = rootEntry ? [...dependentTypes, rootEntry] : dependentTypes;

  const blocks = orderedEntries.map(([name, fields]) => {
    if (fields.length === 0) {
      return `${keyword} ${name} {\n  _empty: String\n}`;
    }
    return `${keyword} ${name} {\n${fields.join("\n")}\n}`;
  });

  return blocks.join("\n\n");
}

/**
 * JSON→GraphQLスキーマ生成のデモ用サンプルJSONを返す
 * ネストオブジェクト・配列・null・真偽値を含む複合型のデータ
 * @returns サンプルJSON文字列
 */
export function getSampleJson(): string {
  const sample = {
    id: 1,
    name: "山田太郎",
    email: "yamada@example.com",
    isActive: true,
    score: 98.5,
    nickname: null,
    address: {
      city: "東京",
      zipCode: "100-0001",
    },
    tags: ["developer", "typescript"],
    scores: [95, 87, 100],
    metadata: {
      createdAt: "2024-01-01",
      updatedAt: "2024-06-15",
    },
  };
  return JSON.stringify(sample, null, 2);
}
