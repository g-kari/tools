/**
 * YAML ↔ TOML 変換ユーティリティ
 *
 * js-yaml と smol-toml を使用した相互変換。
 * JSON を経由しない直接変換で精度を確保する。
 */
import * as yaml from "js-yaml";
import * as TOML from "smol-toml";

// js-yaml 5 では !!timestamp がデフォルトのスキーマ（CORE_SCHEMA）から外れたが、
// v4 では YAML のタイムスタンプが Date に解決され、この変換はその前提で動いている。
// このモジュール専用に timestamp タグを戻したスキーマで読み取る。
// あわせて、js-yaml 5 の dumper が TOML のローカル時刻に対して出す
// !!timestamp '07:32:00.000' 形式（v4/v5 標準の timestamp タグでは読み戻せない）を、
// 明示タグの場合に限り TOML のローカル時刻として読み取る。
const LOCAL_TIME_PATTERN = /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?$/;

const timestampTag = yaml.defineScalarTag<Date>("tag:yaml.org,2002:timestamp", {
  implicit: true,
  implicitFirstChars: yaml.timestampTag.implicitFirstChars,
  resolve: (source, isExplicit) => {
    const resolved = yaml.timestampTag.resolve(source, isExplicit, "tag:yaml.org,2002:timestamp");
    if (resolved !== yaml.NOT_RESOLVED) return resolved;
    if (isExplicit && LOCAL_TIME_PATTERN.test(source)) {
      const time = new TOML.TomlDate(source);
      if (time.isValid()) return time;
    }
    return yaml.NOT_RESOLVED;
  },
  identify: (data) => data instanceof Date,
  represent: (data) => data.toISOString(),
});

const loadSchema = yaml.CORE_SCHEMA.withTags(timestampTag);

/**
 * YAML を TOML に変換する
 * @param yamlStr - 変換元の YAML 文字列
 * @returns TOML 文字列
 * @throws YAML 解析エラーまたは TOML 変換エラー
 */
export function yamlToToml(yamlStr: string): string {
  if (!yamlStr.trim()) throw new Error("YAML データが空です");
  const parsed = yaml.load(yamlStr, { schema: loadSchema });
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
