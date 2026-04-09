/**
 * アトバシュ暗号ユーティリティ
 * ヘブライ語起源の換字式暗号。アルファベットを逆順にマッピングする（A↔Z, B↔Y, ...）
 */

/**
 * アトバシュ暗号変換（自己逆関数：エンコードとデコードが同一）
 * @param text 変換するテキスト
 * @returns アトバシュ変換後のテキスト（非アルファベット文字はそのまま）
 */
export function atbash(text: string): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= "a" ? 97 : 65;
    return String.fromCharCode(25 - (char.charCodeAt(0) - base) + base);
  });
}

/**
 * アトバシュ暗号のマッピングテーブルを生成する
 * @returns 各大文字→変換後文字のマッピング配列
 */
export function getAtbashTable(): Array<{ original: string; mapped: string }> {
  return Array.from({ length: 26 }, (_, i) => ({
    original: String.fromCharCode(65 + i),
    mapped: String.fromCharCode(90 - i),
  }));
}
