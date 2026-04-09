/**
 * YAML ↔ TOML 変換ユーティリティ
 *
 * js-yaml と smol-toml を使用した相互変換。
 * JSON を経由しない直接変換で精度を確保する。
 */
import * as yaml from "js-yaml";
import * as TOML from "smol-toml";

/**
 * YAML を TOML に変換する
 * @param yamlStr - 変換元の YAML 文字列
 * @returns TOML 文字列
 * @throws YAML 解析エラーまたは TOML 変換エラー
 */
export function yamlToToml(yamlStr: string): string {
  if (!yamlStr.trim()) throw new Error("YAML データが空です");
  const parsed = yaml.load(yamlStr);
  if (parsed === null || parsed === undefined) throw new Error("YAML データが空です");
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      "TOML のルートはオブジェクト（{}）である必要があります。配列やプリミティブ値は変換できません",
    );
  }
  try {
    return TOML.stringify(parsed as Record<string, unknown>);
  } catch (err) {
    if (err instanceof TypeError && String(err.message).includes("null")) {
      throw new Error(
        "TOML は null 値をサポートしていません。null 値を除去してから変換してください",
      );
    }
    throw err;
  }
}

/**
 * TOML を YAML に変換する
 * @param tomlStr - 変換元の TOML 文字列
 * @returns YAML 文字列
 * @throws TOML 解析エラー
 */
export function tomlToYaml(tomlStr: string): string {
  if (!tomlStr.trim()) throw new Error("TOML データが空です");
  const parsed = TOML.parse(tomlStr);
  return yaml.dump(parsed, { indent: 2, lineWidth: -1 });
}
