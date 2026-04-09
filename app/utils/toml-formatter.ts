import * as TOML from "smol-toml";

/**
 * TOML文字列を整形する。
 * @param tomlStr - 整形対象のTOML文字列
 * @returns 整形されたTOML文字列
 * @throws {Error} TOML文字列が空または不正な場合
 */
export function formatToml(tomlStr: string): string {
  if (!tomlStr.trim()) {
    throw new Error("TOMLデータが空です");
  }
  const parsed = TOML.parse(tomlStr);
  return TOML.stringify(parsed);
}

/**
 * TOML文字列を圧縮（空白行除去）する。
 * @param tomlStr - 圧縮対象のTOML文字列
 * @returns 圧縮されたTOML文字列（空白行を除去した形式）
 * @throws {Error} TOML文字列が空または不正な場合
 */
export function minifyToml(tomlStr: string): string {
  if (!tomlStr.trim()) {
    throw new Error("TOMLデータが空です");
  }
  const parsed = TOML.parse(tomlStr);
  const stringified = TOML.stringify(parsed);
  return stringified
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n");
}

/**
 * TOML文字列の構文を検証する。
 * @param tomlStr - 検証対象のTOML文字列
 * @returns 検証結果オブジェクト。validがtrueなら有効、falseならerrorにエラーメッセージを含む
 */
export function validateToml(tomlStr: string): { valid: boolean; error?: string } {
  if (!tomlStr.trim()) {
    return { valid: false, error: "TOMLデータが空です" };
  }
  try {
    TOML.parse(tomlStr);
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "TOML解析エラーが発生しました",
    };
  }
}
