/**
 * 数値進数変換ユーティリティ
 */

/** 対応する基数の定義 */
export const BASES = [2, 8, 10, 16] as const;
export type Base = (typeof BASES)[number];

/** 基数のラベル */
export const BASE_LABELS: Record<Base, string> = {
  2: "2進数（Binary）",
  8: "8進数（Octal）",
  10: "10進数（Decimal）",
  16: "16進数（Hex）",
};

/** 基数のプレフィックス表示 */
export const BASE_PREFIXES: Record<Base, string> = {
  2: "0b",
  8: "0o",
  10: "",
  16: "0x",
};

/**
 * 文字列が指定した基数で有効かどうかを検証する
 * @param value - 検証する文字列
 * @param base - 基数
 * @returns 有効な場合はtrue
 */
export function isValidForBase(value: string, base: Base): boolean {
  if (value === "" || value === "-") return true;
  const normalized = value.startsWith("-") ? value.slice(1) : value;
  if (normalized === "") return false;
  const patterns: Record<Base, RegExp> = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9a-fA-F]+$/,
  };
  return patterns[base].test(normalized);
}

/**
 * 指定した基数の文字列を10進数の整数に変換する
 * @param value - 変換元の文字列
 * @param base - 基数
 * @returns 10進数の整数（無効な場合はnull）
 */
export function parseToDecimal(value: string, base: Base): number | null {
  if (!value || value === "-") return null;
  if (!isValidForBase(value, base)) return null;
  const parsed = parseInt(value, base);
  return isNaN(parsed) ? null : parsed;
}

/**
 * 10進数の整数を指定した基数の文字列に変換する
 * @param decimal - 10進数の整数
 * @param base - 変換先の基数
 * @returns 変換後の文字列（大文字16進数）
 */
export function decimalToBase(decimal: number, base: Base): string {
  if (!Number.isInteger(decimal)) return "";
  const isNegative = decimal < 0;
  const abs = Math.abs(decimal);
  const result = abs.toString(base).toUpperCase();
  return isNegative ? `-${result}` : result;
}

/**
 * あるいは基数から別の基数へ変換する
 * @param value - 変換元の文字列
 * @param fromBase - 変換元の基数
 * @param toBase - 変換先の基数
 * @returns 変換後の文字列（無効な場合はnull）
 */
export function convertBase(value: string, fromBase: Base, toBase: Base): string | null {
  const decimal = parseToDecimal(value, fromBase);
  if (decimal === null) return null;
  return decimalToBase(decimal, toBase);
}

/**
 * 数値が安全な整数範囲内かどうかを確認する
 * @param value - 確認する文字列
 * @param base - 基数
 * @returns 範囲内ならtrue、範囲外ならfalse
 */
export function isInSafeRange(value: string, base: Base): boolean {
  const decimal = parseToDecimal(value, base);
  if (decimal === null) return true;
  return Math.abs(decimal) <= Number.MAX_SAFE_INTEGER;
}
