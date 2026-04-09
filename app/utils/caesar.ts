/**
 * シーザー暗号ユーティリティ
 * テキストのシーザー暗号（ROT-N）エンコード/デコードを提供する
 */

/**
 * 英字1文字をシフトする（大文字・小文字を保持）
 * @param char 変換する文字（1文字）
 * @param shift シフト量（0-25）
 * @returns シフト後の文字
 */
function shiftChar(char: string, shift: number): string {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(((code - 65 + shift) % 26) + 65);
  } else if (code >= 97 && code <= 122) {
    return String.fromCharCode(((code - 97 + shift) % 26) + 97);
  }
  return char;
}

/**
 * テキストをシーザー暗号でエンコードする
 * 英字以外の文字（数字・記号・日本語など）はそのまま保持する
 * @param text 変換するテキスト
 * @param shift シフト量（任意の整数、正負どちらでも可）
 * @returns エンコードされたテキスト
 */
export function encodeCaesar(text: string, shift: number): string {
  const normalizedShift = ((shift % 26) + 26) % 26;
  return text
    .split("")
    .map((char) => shiftChar(char, normalizedShift))
    .join("");
}

/**
 * テキストをシーザー暗号でデコードする
 * @param text 変換するテキスト
 * @param shift エンコード時のシフト量
 * @returns デコードされたテキスト
 */
export function decodeCaesar(text: string, shift: number): string {
  return encodeCaesar(text, -shift);
}

/**
 * ROT13変換（シフト量13の特殊ケース、エンコード・デコードが同一）
 * @param text 変換するテキスト
 * @returns ROT13変換されたテキスト
 */
export function rot13(text: string): string {
  return encodeCaesar(text, 13);
}

/**
 * 全26シフトの総当たり解析結果を返す
 * 暗号解読（ブルートフォース）用
 * @param text 解析するテキスト
 * @returns 各シフト量でのデコード結果配列
 */
export function bruteForce(text: string): Array<{ shift: number; result: string }> {
  return Array.from({ length: 26 }, (_, i) => ({
    shift: i,
    result: decodeCaesar(text, i),
  }));
}
