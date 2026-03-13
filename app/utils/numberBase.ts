/**
 * 数値進数変換ユーティリティ
 */

/**
 * BigIntの値を指定した進数の文字列に変換する
 * @param value - 変換するBigInt値
 * @param base - 変換先の進数
 * @returns 変換後の文字列（16進数は大文字）
 */
export function bigIntToBase(value: bigint, base: number): string {
  if (value === 0n) return "0";
  return value.toString(base).toUpperCase();
}

/**
 * 文字列をBigIntに変換する
 * @param str - 変換する文字列
 * @param base - 進数
 * @returns 変換後のBigInt値、変換失敗時はnull
 */
export function parseStringToBigInt(str: string, base: number): bigint | null {
  if (!str || str.trim() === "") return null;
  const trimmed = str.trim().toUpperCase();
  if (trimmed === "") return null;

  // 文字ごとにチェック
  const digitSet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, base);
  for (const ch of trimmed) {
    if (!digitSet.includes(ch)) return null;
  }

  try {
    let result = 0n;
    const bigBase = BigInt(base);
    for (const ch of trimmed) {
      const digit = BigInt(parseInt(ch, base));
      result = result * bigBase + digit;
    }
    return result;
  } catch {
    return null;
  }
}
