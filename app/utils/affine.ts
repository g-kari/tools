/**
 * アフィン暗号ユーティリティ
 * テキストのアフィン暗号エンコード/デコードを提供する
 * 暗号化式: E(x) = (a*x + b) mod 26
 * 復号式: D(x) = a_inv * (x - b) mod 26
 */

/**
 * mod 26 において a の逆元となる値のマッピング
 * a は 26 と互いに素な値のみ有効
 */
const MODULAR_INVERSES: Readonly<Record<number, number>> = {
  1: 1,
  3: 9,
  5: 21,
  7: 15,
  9: 3,
  11: 19,
  15: 7,
  17: 23,
  19: 11,
  21: 5,
  23: 17,
  25: 25,
};

/**
 * mod 26 において有効な a の値一覧（26 と互いに素な値）
 */
export const VALID_A_VALUES: ReadonlyArray<number> = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

/**
 * a の値が有効かどうかを検証する（26 と互いに素かどうか）
 * @param a 検証する値
 * @returns 有効な場合 true
 */
export function isValidA(a: number): boolean {
  return a in MODULAR_INVERSES;
}

/**
 * 英字1文字をアフィン暗号でエンコードする（大文字・小文字を保持）
 * @param char 変換する文字（1文字）
 * @param a 乗数（26と互いに素な値）
 * @param b 加数（0-25）
 * @returns エンコード後の文字
 */
function encodeChar(char: string, a: number, b: number): string {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    const x = code - 65;
    return String.fromCharCode(((((a * x + b) % 26) + 26) % 26) + 65);
  } else if (code >= 97 && code <= 122) {
    const x = code - 97;
    return String.fromCharCode(((((a * x + b) % 26) + 26) % 26) + 97);
  }
  return char;
}

/**
 * 英字1文字をアフィン暗号でデコードする（大文字・小文字を保持）
 * @param char 変換する文字（1文字）
 * @param a 乗数（エンコード時と同じ値）
 * @param b 加数（エンコード時と同じ値）
 * @returns デコード後の文字
 */
function decodeChar(char: string, a: number, b: number): string {
  const aInv = MODULAR_INVERSES[a];
  if (aInv === undefined) return char;
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    const y = code - 65;
    return String.fromCharCode(((((aInv * (y - b)) % 26) + 26) % 26) + 65);
  } else if (code >= 97 && code <= 122) {
    const y = code - 97;
    return String.fromCharCode(((((aInv * (y - b)) % 26) + 26) % 26) + 97);
  }
  return char;
}

/**
 * テキストをアフィン暗号でエンコードする
 * 英字以外の文字（数字・記号・日本語など）はそのまま保持する
 * @param text 変換するテキスト
 * @param a 乗数（26と互いに素な値: 1,3,5,7,9,11,15,17,19,21,23,25）
 * @param b 加数（0-25）
 * @returns エンコードされたテキスト
 */
export function encodeAffine(text: string, a: number, b: number): string {
  if (!isValidA(a)) return text;
  const normalizedB = ((b % 26) + 26) % 26;
  return text
    .split("")
    .map((char) => encodeChar(char, a, normalizedB))
    .join("");
}

/**
 * テキストをアフィン暗号でデコードする
 * @param text 変換するテキスト
 * @param a エンコード時の乗数
 * @param b エンコード時の加数
 * @returns デコードされたテキスト
 */
export function decodeAffine(text: string, a: number, b: number): string {
  if (!isValidA(a)) return text;
  const normalizedB = ((b % 26) + 26) % 26;
  return text
    .split("")
    .map((char) => decodeChar(char, a, normalizedB))
    .join("");
}

/**
 * 有効な全 a 値 × b の全26パターン（計312通り）の総当たり解析結果を返す
 * @param text 解析するテキスト
 * @returns 各パラメータでのデコード結果配列
 */
export function bruteForceAffine(text: string): Array<{ a: number; b: number; result: string }> {
  const results: Array<{ a: number; b: number; result: string }> = [];
  for (const a of VALID_A_VALUES) {
    for (let b = 0; b < 26; b++) {
      results.push({ a, b, result: decodeAffine(text, a, b) });
    }
  }
  return results;
}
