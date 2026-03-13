/**
 * Morse Code変換ユーティリティ
 * テキストとモールス符号の相互変換を提供する
 */

/**
 * テキスト→Morse Codeのマッピングテーブル
 * A-Z, 0-9, および基本的な記号をサポート
 */
export const MORSE_CODE_MAP: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
  // スペースは実際には textToMorse の特別ケース処理で "/" に変換される。
  // このエントリは REVERSE_MORSE_MAP の自動生成から除外されないが、
  // morseToText では "/" を単語区切りとして直接扱うため実質的に使われない。
  ' ': '/',
};

/**
 * Morse Code→テキストの逆マッピングテーブル
 * MORSE_CODE_MAPから自動生成
 */
export const REVERSE_MORSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE_MAP).map(([char, morse]) => [morse, char])
);

/**
 * テキストをMorse Codeに変換する
 * @param text 変換するテキスト
 * @returns Morse Code文字列（文字間はスペース、単語間は " / "）
 */
export function textToMorse(text: string): string {
  if (!text) return '';

  const upperText = text.toUpperCase();
  const result: string[] = [];

  for (let i = 0; i < upperText.length; i++) {
    const char = upperText[i];

    if (char === ' ') {
      // 単語区切りは "/"
      // 直前に既に文字が追加されている場合のみ追加
      if (result.length > 0 && result[result.length - 1] !== '/') {
        result.push('/');
      }
    } else {
      const morse = MORSE_CODE_MAP[char];
      if (morse !== undefined) {
        result.push(morse);
      } else {
        // 変換できない文字は "?" で表す
        result.push('?');
      }
    }
  }

  return result.join(' ');
}

/**
 * Morse Codeをテキストに変換する
 * @param morse 変換するMorse Code文字列
 * @returns テキスト文字列
 */
export function morseToText(morse: string): string {
  if (!morse.trim()) return '';

  // 単語区切り "/" で分割
  const words = morse.split(/\s*\/\s*/);
  const result: string[] = [];

  for (const word of words) {
    const trimmedWord = word.trim();
    if (!trimmedWord) continue;

    // 各単語内の文字（スペース区切り）を変換
    const chars = trimmedWord.split(/\s+/);
    const wordChars: string[] = [];

    for (const morseChar of chars) {
      if (!morseChar) continue;
      const char = REVERSE_MORSE_MAP[morseChar];
      if (char !== undefined) {
        wordChars.push(char);
      } else {
        // 変換できないモールス符号は "?" で表す
        wordChars.push('?');
      }
    }

    if (wordChars.length > 0) {
      result.push(wordChars.join(''));
    }
  }

  return result.join(' ');
}

/**
 * 入力文字列がMorse Codeとして有効かどうかを確認する
 * Morse Codeは . - / およびスペースのみで構成される
 * @param input チェックする文字列
 * @returns true if valid morse code format
 */
export function isMorseCode(input: string): boolean {
  if (!input.trim()) return false;
  // Morse Codeは . (ドット)、- (ダッシュ)、/ (スラッシュ)、スペースのみ
  return /^[.\-/ ]+$/.test(input);
}
