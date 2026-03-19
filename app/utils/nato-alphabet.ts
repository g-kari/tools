/**
 * NATOフォネティックアルファベット変換ユーティリティ
 * テキストをNATO/ICAO標準のフォネティックアルファベットに変換する
 */

/**
 * NATOフォネティックアルファベットのマッピングテーブル
 * アルファベット A-Z および数字 0-9 をサポート
 */
export const NATO_ALPHABET_MAP: Record<string, string> = {
  A: 'Alpha',
  B: 'Bravo',
  C: 'Charlie',
  D: 'Delta',
  E: 'Echo',
  F: 'Foxtrot',
  G: 'Golf',
  H: 'Hotel',
  I: 'India',
  J: 'Juliet',
  K: 'Kilo',
  L: 'Lima',
  M: 'Mike',
  N: 'November',
  O: 'Oscar',
  P: 'Papa',
  Q: 'Quebec',
  R: 'Romeo',
  S: 'Sierra',
  T: 'Tango',
  U: 'Uniform',
  V: 'Victor',
  W: 'Whiskey',
  X: 'X-ray',
  Y: 'Yankee',
  Z: 'Zulu',
  '0': 'Zero',
  '1': 'One',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
};

/** 変換結果の1文字分の型 */
export interface NatoCharResult {
  /** 元の文字 */
  char: string;
  /** フォネティック表現（未対応文字は null） */
  phonetic: string | null;
  /** スペースかどうか */
  isSpace: boolean;
}

/**
 * テキストをNATOフォネティックアルファベットに変換する
 * @param text 変換するテキスト
 * @returns 各文字の変換結果の配列
 */
export function textToNato(text: string): NatoCharResult[] {
  if (!text) return [];

  return text.split('').map((char) => {
    if (char === ' ') {
      return { char, phonetic: null, isSpace: true };
    }
    const upper = char.toUpperCase();
    const phonetic = NATO_ALPHABET_MAP[upper] ?? null;
    return { char, phonetic, isSpace: false };
  });
}

/**
 * テキストをフォネティックアルファベットのシンプルな文字列に変換する
 * @param text 変換するテキスト
 * @param separator 各フォネティック語の区切り文字（デフォルト: ' - '）
 * @returns フォネティックアルファベット文字列
 */
export function textToNatoString(text: string, separator = ' - '): string {
  if (!text) return '';
  const results = textToNato(text);
  const parts: string[] = [];

  for (const result of results) {
    if (result.isSpace) {
      parts.push('(space)');
    } else if (result.phonetic !== null) {
      parts.push(result.phonetic);
    } else {
      parts.push(`[${result.char}]`);
    }
  }

  return parts.join(separator);
}
