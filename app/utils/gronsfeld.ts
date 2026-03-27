/**
 * グロンスフェルト暗号ユーティリティ
 * ヴィジュネル暗号の変形で、数字（0-9）をキーとして使用するポリアルファベット換字式暗号。
 * 17世紀にグロンスフェルト伯爵が考案したとされる。
 */

/**
 * 数字キーを正規化する（数字のみ残す）
 * @param key キー（数字文字列）
 * @returns 正規化されたキー（数字のみ）
 */
export function normalizeKey(key: string): string {
  return key.replace(/[^0-9]/g, "");
}

/**
 * キーが有効かチェックする
 * @param key キー
 * @returns 有効なら true（数字を1文字以上含む）
 */
export function isValidKey(key: string): boolean {
  return normalizeKey(key).length > 0;
}

/**
 * グロンスフェルト暗号で暗号化する
 * 変換式: C = (P + K) mod 26（K: キー数字の値, P: 平文文字の値, C: 暗号文字の値）
 * 英字以外の文字（数字・記号・日本語など）はそのまま保持する
 * @param text 暗号化するテキスト
 * @param key キー（数字のみ）
 * @returns 暗号化されたテキスト
 */
export function gronsfeldEncrypt(text: string, key: string): string {
  const normalizedKey = normalizeKey(key);
  if (normalizedKey.length === 0) return text;

  let keyIndex = 0;
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const k = parseInt(normalizedKey[keyIndex % normalizedKey.length], 10);
        keyIndex++;
        return String.fromCharCode(((code - 65 + k) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        const k = parseInt(normalizedKey[keyIndex % normalizedKey.length], 10);
        keyIndex++;
        return String.fromCharCode(((code - 97 + k) % 26) + 97);
      }
      return char;
    })
    .join("");
}

/**
 * グロンスフェルト暗号で復号化する
 * 変換式: P = (C - K + 26) mod 26
 * 英字以外の文字（数字・記号・日本語など）はそのまま保持する
 * @param text 復号化するテキスト
 * @param key キー（数字のみ）
 * @returns 復号化されたテキスト
 */
export function gronsfeldDecrypt(text: string, key: string): string {
  const normalizedKey = normalizeKey(key);
  if (normalizedKey.length === 0) return text;

  let keyIndex = 0;
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const k = parseInt(normalizedKey[keyIndex % normalizedKey.length], 10);
        keyIndex++;
        return String.fromCharCode(((code - 65 - k + 26) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        const k = parseInt(normalizedKey[keyIndex % normalizedKey.length], 10);
        keyIndex++;
        return String.fromCharCode(((code - 97 - k + 26) % 26) + 97);
      }
      return char;
    })
    .join("");
}
