/**
 * JSON→TypeScript型定義ジェネレーターユーティリティ
 */

/**
 * TypeScript型生成のオプション
 */
export interface JsonToTsOptions {
  /** ルート型名（デフォルト: "Root"） */
  rootName: string;
  /** true=interface, false=type */
  useInterface: boolean;
  /** true=全プロパティをオプショナルにする */
  optional: boolean;
  /** true=null値を含む場合 "Type | null" を生成 */
  includeNull: boolean;
}

/** 生成された型定義を保持する内部構造 */
interface GeneratedType {
  name: string;
  body: string;
}

/**
 * 文字列をPascalCaseに変換する
 * @param str - 変換対象の文字列
 * @returns PascalCaseに変換された文字列
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

/**
 * 型名の重複を避けるためにユニークな名前を生成する
 * @param name - 希望する型名
 * @param usedNames - 使用済みの型名セット
 * @returns ユニークな型名
 */
function getUniqueName(name: string, usedNames: Set<string>): string {
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }
  let counter = 2;
  while (usedNames.has(`${name}${counter}`)) {
    counter++;
  }
  const uniqueName = `${name}${counter}`;
  usedNames.add(uniqueName);
  return uniqueName;
}

/**
 * 値からTypeScript型文字列を推論する（内部実装）
 * @param value - 型を推論する対象の値
 * @param typeName - この値に割り当てる型名
 * @param options - 型生成オプション
 * @param generatedTypes - 生成された型定義の配列（副作用で追加される）
 * @param usedNames - 使用済み型名のセット
 * @returns TypeScript型文字列
 */
function inferType(
  value: unknown,
  typeName: string,
  options: JsonToTsOptions,
  generatedTypes: GeneratedType[],
  usedNames: Set<string>,
): string {
  if (value === null) {
    return options.includeNull ? "null" : "unknown";
  }

  if (typeof value === "string") {
    return "string";
  }

  if (typeof value === "number") {
    return "number";
  }

  if (typeof value === "boolean") {
    return "boolean";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "unknown[]";
    }

    // 各プリミティブ型を収集しつつ、オブジェクト型は最初の要素のみで推論する
    const primitiveTypes = new Set<string>();
    let objectTypeName: string | null = null;

    for (const item of value) {
      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        // オブジェクト要素は最初の1つだけを代表として型推論する
        if (objectTypeName === null) {
          objectTypeName = inferType(item, `${typeName}Item`, options, generatedTypes, usedNames);
        }
      } else {
        primitiveTypes.add(inferType(item, `${typeName}Item`, options, generatedTypes, usedNames));
      }
    }

    const uniqueTypes: string[] = [];
    if (objectTypeName !== null) uniqueTypes.push(objectTypeName);
    uniqueTypes.push(...primitiveTypes);

    if (uniqueTypes.length === 1) {
      return `${uniqueTypes[0]}[]`;
    }

    return `(${uniqueTypes.join(" | ")})[]`;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return "Record<string, never>";
    }

    const actualName = getUniqueName(typeName, usedNames);
    const optionalMark = options.optional ? "?" : "";

    const properties = keys.map((key) => {
      const childTypeName = toPascalCase(key);
      const childType = inferType(obj[key], childTypeName, options, generatedTypes, usedNames);

      return `  ${key}${optionalMark}: ${childType};`;
    });

    const body = properties.join("\n");

    if (options.useInterface) {
      generatedTypes.push({
        name: actualName,
        body: `interface ${actualName} {\n${body}\n}`,
      });
    } else {
      generatedTypes.push({
        name: actualName,
        body: `type ${actualName} = {\n${body}\n};`,
      });
    }

    return actualName;
  }

  return "unknown";
}

/**
 * JSON文字列をTypeScript型定義に変換する
 * @param json - 変換対象のJSON文字列
 * @param options - 型生成オプション
 * @returns TypeScript型定義文字列
 * @throws {Error} 空文字列または無効なJSON形式の場合にエラーをスローする
 */
export function generateTypeScript(json: string, options: JsonToTsOptions): string {
  if (!json.trim()) {
    throw new Error("JSONを入力してください");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("無効なJSON形式です");
  }

  const generatedTypes: GeneratedType[] = [];
  const usedNames = new Set<string>();

  const rootType = inferType(parsed, options.rootName, options, generatedTypes, usedNames);

  // ルート値がプリミティブの場合
  if (generatedTypes.length === 0) {
    return `type ${options.rootName} = ${rootType};`;
  }

  // 依存型を先に並べる
  const parts = generatedTypes.map((t) => t.body);

  // ルート型がオブジェクト（自身をgeneratedTypesに登録済み）でない場合、
  // 配列やunion型などのルートエイリアスを末尾に追加する
  if (rootType !== options.rootName) {
    parts.push(`type ${options.rootName} = ${rootType};`);
  }

  return parts.join("\n\n");
}

/**
 * JSON→TypeScript型変換のデモ用サンプルJSONを返す
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
