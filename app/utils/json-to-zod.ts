/**
 * JSON→Zodスキーマジェネレーターユーティリティ
 */

/**
 * Zodスキーマ生成のオプション
 */
export interface JsonToZodOptions {
  /** ルート変数名（デフォルト: "schema"） */
  rootName: string;
  /** true=import文を先頭に追加する */
  addImport: boolean;
  /** true=全プロパティをオプショナルにする */
  optional: boolean;
  /** true=null値を nullable() でラップする */
  nullable: boolean;
}

/**
 * JSON値からZodスキーマ文字列を再帰的に生成する（内部実装）
 * @param value - スキーマを生成する対象の値
 * @param options - スキーマ生成オプション
 * @param indent - インデントレベル（再帰呼び出し用）
 * @returns Zodスキーマ文字列
 */
function inferZodSchema(value: unknown, options: JsonToZodOptions, indent: number = 0): string {
  const pad = "  ".repeat(indent);
  const innerPad = "  ".repeat(indent + 1);

  if (value === null) {
    if (options.nullable) {
      return "z.unknown().nullable()";
    }
    return "z.null()";
  }

  if (typeof value === "string") {
    return "z.string()";
  }

  if (typeof value === "number") {
    return "z.number()";
  }

  if (typeof value === "boolean") {
    return "z.boolean()";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "z.array(z.unknown())";
    }

    // 配列要素の型を収集
    const elementSchemas = new Set<string>();
    for (const item of value) {
      elementSchemas.add(inferZodSchema(item, options, indent));
    }

    const uniqueSchemas = Array.from(elementSchemas);

    if (uniqueSchemas.length === 1) {
      // 全要素が同じ型
      const elementSchema = inferZodSchema(value[0], options, indent);
      return `z.array(${elementSchema})`;
    }

    // 複数の型が混在する場合
    if (uniqueSchemas.length === 2) {
      return `z.array(z.union([${uniqueSchemas.join(", ")}]))`;
    }

    return `z.array(z.union([${uniqueSchemas.join(", ")}]))`;
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return "z.object({})";
    }

    const properties = keys.map((key) => {
      const childSchema = inferZodSchema(obj[key], options, indent + 1);
      const optionalSuffix = options.optional ? ".optional()" : "";
      return `${innerPad}${key}: ${childSchema}${optionalSuffix},`;
    });

    return `z.object({\n${properties.join("\n")}\n${pad}})`;
  }

  return "z.unknown()";
}

/**
 * JSON文字列からZodスキーマを生成する
 * @param json - 変換対象のJSON文字列
 * @param options - スキーマ生成オプション
 * @returns Zodスキーマ文字列（TypeScript/JavaScript形式）
 * @throws {Error} 空文字列または無効なJSON形式の場合にエラーをスローする
 */
export function generateZodSchema(json: string, options: JsonToZodOptions): string {
  if (!json.trim()) {
    throw new Error("JSONを入力してください");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("無効なJSON形式です");
  }

  const rootName = options.rootName || "schema";
  const schema = inferZodSchema(parsed, options, 0);

  const parts: string[] = [];

  if (options.addImport) {
    parts.push('import { z } from "zod";');
    parts.push("");
  }

  parts.push(`export const ${rootName} = ${schema};`);

  return parts.join("\n");
}

/**
 * JSON→Zodスキーマ生成のデモ用サンプルJSONを返す
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
