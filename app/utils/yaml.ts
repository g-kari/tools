import * as yaml from "js-yaml";

/**
 * YAML文字列を整形（インデント付き）する。
 * @param yamlStr - 整形対象のYAML文字列
 * @param indent - インデントのスペース数（デフォルト: 2）
 * @param sortKeys - キーをアルファベット順にソートするか（デフォルト: false）
 * @returns 整形されたYAML文字列
 * @throws {Error} YAML文字列が空または不正な場合
 */
export function formatYaml(yamlStr: string, indent: number = 2, sortKeys: boolean = false): string {
  if (!yamlStr.trim()) {
    throw new Error("YAMLデータが空です");
  }
  const parsed = yaml.load(yamlStr);
  if (parsed === null || parsed === undefined) {
    throw new Error("YAMLデータが空です");
  }
  return yaml.dump(parsed, {
    indent,
    sortKeys,
    lineWidth: 120,
  });
}

/**
 * YAML文字列を圧縮（フロースタイル）する。
 * @param yamlStr - 圧縮対象のYAML文字列
 * @returns 圧縮されたYAML文字列（フロースタイル）
 * @throws {Error} YAML文字列が空または不正な場合
 */
export function minifyYaml(yamlStr: string): string {
  if (!yamlStr.trim()) {
    throw new Error("YAMLデータが空です");
  }
  const parsed = yaml.load(yamlStr);
  if (parsed === null || parsed === undefined) {
    throw new Error("YAMLデータが空です");
  }
  return yaml
    .dump(parsed, {
      flowLevel: 0,
      lineWidth: -1,
    })
    .trim();
}

/**
 * YAML文字列の構文を検証する。
 * @param yamlStr - 検証対象のYAML文字列
 * @returns 検証結果オブジェクト。validがtrueなら有効、falseならerrorにエラーメッセージを含む
 */
export function validateYaml(yamlStr: string): { valid: boolean; error?: string } {
  if (!yamlStr.trim()) {
    return { valid: false, error: "YAMLデータが空です" };
  }
  try {
    const parsed = yaml.load(yamlStr);
    if (parsed === null || parsed === undefined) {
      return { valid: false, error: "YAMLデータが空または内容がありません" };
    }
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "YAML解析エラーが発生しました",
    };
  }
}
