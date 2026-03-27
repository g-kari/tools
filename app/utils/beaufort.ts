/**
 * ボーフォート暗号ユーティリティ
 * サー・フランシス・ボーフォート考案のポリアルファベット換字式暗号。
 * ヴィジュネル暗号の変形で、暗号化と復号化が同じ操作（自己逆関数）。
 */

/**
 * キーワードを正規化する（英字のみ残して大文字に変換）
 * @param key キーワード
 * @returns 正規化されたキーワード（英字のみ大文字）
 */
export function normalizeKey(key: string): string {
  return key.toUpperCase().replace(/[^A-Z]/g, "");
}

/**
 * ボーフォート暗号で変換する（暗号化・復号化とも同じ操作）
 * 変換式: C = (K - P + 26) % 26
 * 英字以外の文字（数字・記号・日本語など）はそのまま保持する
 * @param text 変換するテキスト
 * @param key キーワード（英字）
 * @returns 変換後のテキスト
 */
export function beaufort(text: string, key: string): string {
  const normalizedKey = normalizeKey(key);
  if (normalizedKey.length === 0) return text;

  let keyIndex = 0;
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const k = normalizedKey.charCodeAt(keyIndex % normalizedKey.length) - 65;
        keyIndex++;
        return String.fromCharCode(((k - (code - 65) + 26) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        const k = normalizedKey.charCodeAt(keyIndex % normalizedKey.length) - 65;
        keyIndex++;
        return String.fromCharCode(((k - (code - 97) + 26) % 26) + 97);
      }
      return char;
    })
    .join("");
}

/**
 * キーワードが有効かチェックする
 * @param key キーワード
 * @returns 有効なら true（英字を1文字以上含む）
 */
export function isValidKey(key: string): boolean {
  return normalizeKey(key).length > 0;
}
