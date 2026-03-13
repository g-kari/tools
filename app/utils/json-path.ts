/**
 * JSONPath評価ユーティリティ
 * @module json-path
 */
import { JSONPath } from 'jsonpath-plus';

/**
 * JSONPath式を評価して結果を返す
 * @param jsonText - JSON文字列
 * @param path - JSONPath式
 * @returns マッチした値の配列
 * @throws {Error} 無効なJSONまたはJSONPath式の場合
 */
export function evaluateJsonPath(jsonText: string, path: string): unknown[] {
  if (!jsonText.trim()) {
    throw new Error('JSONを入力してください');
  }
  if (!path.trim()) {
    throw new Error('JSONPath式を入力してください');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('無効なJSON形式です');
  }

  try {
    const result = JSONPath({ path, json: parsed as object });
    return Array.isArray(result) ? result : [result];
  } catch (e) {
    throw new Error(`JSONPath式が無効です: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * JSONを整形する
 * @param jsonText - JSON文字列
 * @param indent - インデントスペース数
 * @returns 整形されたJSON文字列
 * @throws {Error} 無効なJSONの場合
 */
export function formatJson(jsonText: string, indent: number = 2): string {
  try {
    return JSON.stringify(JSON.parse(jsonText), null, indent);
  } catch {
    throw new Error('無効なJSON形式です');
  }
}

/**
 * JSONPath評価結果を文字列に変換する
 * @param results - 評価結果の配列
 * @returns 文字列化された結果
 */
export function formatResults(results: unknown[]): string {
  if (results.length === 0) {
    return '一致する値がありません';
  }
  if (results.length === 1) {
    return JSON.stringify(results[0], null, 2);
  }
  return JSON.stringify(results, null, 2);
}

/**
 * サンプルJSONデータを返す
 * @returns サンプルJSON文字列
 */
export function getSampleJson(): string {
  return JSON.stringify({
    store: {
      book: [
        {
          category: "reference",
          author: "Nigel Rees",
          title: "Sayings of the Century",
          price: 8.95
        },
        {
          category: "fiction",
          author: "Evelyn Waugh",
          title: "Sword of Honour",
          price: 12.99
        },
        {
          category: "fiction",
          author: "Herman Melville",
          title: "Moby Dick",
          isbn: "0-553-21311-3",
          price: 8.99
        }
      ],
      bicycle: {
        color: "red",
        price: 19.95
      }
    }
  }, null, 2);
}
