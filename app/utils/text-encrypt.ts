/**
 * テキスト暗号化・復号化ユーティリティ
 * ROT13、Caesar暗号、Vigenère暗号、Atbash暗号をサポート
 */

/**
 * 暗号方式の型定義
 */
export type CipherType = "rot13" | "caesar" | "vigenere" | "atbash";

/**
 * 暗号化オプションの型定義
 */
export interface CipherOptions {
  /** Caesar暗号のシフト数（1〜25） */
  shift?: number;
  /** Vigenère暗号のキーワード */
  key?: string;
}

/**
 * ROT13暗号化/復号化
 * アルファベットを13文字シフトする（自己逆関数）
 * @param text - 変換するテキスト
 * @returns ROT13変換後のテキスト（非アルファベット文字はそのまま）
 */
export function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= "a" ? 97 : 65;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}

/**
 * Caesar暗号で暗号化
 * アルファベットを指定したシフト数だけ後方にシフトする
 * @param text - 暗号化するテキスト
 * @param shift - シフト数（1〜25）
 * @returns 暗号化されたテキスト（非アルファベット文字はそのまま）
 */
export function caesarEncrypt(text: string, shift: number): string {
  const normalizedShift = ((shift % 26) + 26) % 26;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= "a" ? 97 : 65;
    return String.fromCharCode(((char.charCodeAt(0) - base + normalizedShift) % 26) + base);
  });
}

/**
 * Caesar暗号で復号化
 * caesarEncryptの逆変換
 * @param text - 復号化するテキスト
 * @param shift - シフト数（1〜25）
 * @returns 復号化されたテキスト
 */
export function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, -shift);
}

/**
 * Vigenère暗号で暗号化
 * キーワードに基づいて各文字をシフトする多表式暗号
 * @param text - 暗号化するテキスト
 * @param key - キーワード（アルファベットのみ有効、大文字小文字を問わない）
 * @returns 暗号化されたテキスト（キーが空の場合は元のテキストを返す）
 */
export function vigenereEncrypt(text: string, key: string): string {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!cleanKey) return text;

  let keyIndex = 0;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= "a" ? 97 : 65;
    const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
    keyIndex++;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
  });
}

/**
 * Vigenère暗号で復号化
 * vigenereEncryptの逆変換
 * @param text - 復号化するテキスト
 * @param key - キーワード（暗号化時と同じキーを使用）
 * @returns 復号化されたテキスト（キーが空の場合は元のテキストを返す）
 */
export function vigenereDecrypt(text: string, key: string): string {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!cleanKey) return text;

  let keyIndex = 0;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= "a" ? 97 : 65;
    const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
    keyIndex++;
    return String.fromCharCode(((char.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
}

/**
 * Atbash暗号化/復号化
 * アルファベットを逆順にマッピングする（A↔Z, B↔Y, ...）
 * ROT13と同様に自己逆関数であり、同じ操作で暗号化と復号化を行う
 * @param text - 変換するテキスト
 * @returns Atbash変換後のテキスト（非アルファベット文字はそのまま）
 */
export function atbash(text: string): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= "a" ? 97 : 65;
    return String.fromCharCode(25 - (char.charCodeAt(0) - base) + base);
  });
}

/**
 * 指定した暗号方式でテキストを暗号化する
 * @param text - 暗号化するテキスト
 * @param cipher - 使用する暗号方式
 * @param options - 追加オプション（shift: Caesar暗号のシフト数、key: Vigenère暗号のキー）
 * @returns 暗号化されたテキスト
 */
export function encryptText(text: string, cipher: CipherType, options: CipherOptions = {}): string {
  switch (cipher) {
    case "rot13":
      return rot13(text);
    case "caesar":
      return caesarEncrypt(text, options.shift ?? 3);
    case "vigenere":
      return vigenereEncrypt(text, options.key ?? "");
    case "atbash":
      return atbash(text);
  }
}

/**
 * 指定した暗号方式でテキストを復号化する
 * @param text - 復号化するテキスト
 * @param cipher - 使用した暗号方式
 * @param options - 追加オプション（shift: Caesar暗号のシフト数、key: Vigenère暗号のキー）
 * @returns 復号化されたテキスト
 */
export function decryptText(text: string, cipher: CipherType, options: CipherOptions = {}): string {
  switch (cipher) {
    case "rot13":
      return rot13(text);
    case "caesar":
      return caesarDecrypt(text, options.shift ?? 3);
    case "vigenere":
      return vigenereDecrypt(text, options.key ?? "");
    case "atbash":
      return atbash(text);
  }
}

/**
 * 暗号方式の表示名を返す
 * @param cipher - 暗号方式
 * @returns 日本語の表示名
 */
export function getCipherLabel(cipher: CipherType): string {
  const labels: Record<CipherType, string> = {
    rot13: "ROT13",
    caesar: "Caesar暗号",
    vigenere: "Vigenère暗号",
    atbash: "Atbash暗号",
  };
  return labels[cipher];
}

/**
 * 暗号方式の説明を返す
 * @param cipher - 暗号方式
 * @returns 日本語の説明
 */
export function getCipherDescription(cipher: CipherType): string {
  const descriptions: Record<CipherType, string> = {
    rot13: "アルファベットを13文字シフト（暗号化と復号化が同じ操作）",
    caesar: "任意のシフト数でアルファベットをシフト",
    vigenere: "キーワードを使った多表式換字暗号",
    atbash: "アルファベットを逆順にマッピング（A↔Z, B↔Y）",
  };
  return descriptions[cipher];
}
