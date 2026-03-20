/**
 * 点字（Braille）変換ユーティリティ
 * Grade 1 統一英語点字（UEB）に準拠したテキスト→点字変換を提供する
 */

/** 数字インジケーター ⠼ (U+283C, dots 3,4,5,6) */
export const NUMBER_INDICATOR = "\u283C";

/** 大文字インジケーター ⠠ (U+2820, dot 6) */
export const CAPITAL_INDICATOR = "\u2820";

/**
 * アルファベット（小文字）→点字 変換テーブル
 * Grade 1 UEB 標準に準拠
 */
export const LETTER_TO_BRAILLE: Record<string, string> = {
  a: "\u2801", // ⠁ dot 1
  b: "\u2803", // ⠃ dots 1,2
  c: "\u2809", // ⠉ dots 1,4
  d: "\u2819", // ⠙ dots 1,4,5
  e: "\u2811", // ⠑ dots 1,5
  f: "\u280B", // ⠋ dots 1,2,4
  g: "\u281B", // ⠛ dots 1,2,4,5
  h: "\u2813", // ⠓ dots 1,2,5
  i: "\u280A", // ⠊ dots 2,4
  j: "\u281A", // ⠚ dots 2,4,5
  k: "\u2805", // ⠅ dots 1,3
  l: "\u2807", // ⠇ dots 1,2,3
  m: "\u280D", // ⠍ dots 1,3,4
  n: "\u281D", // ⠝ dots 1,3,4,5
  o: "\u2815", // ⠕ dots 1,3,5
  p: "\u280F", // ⠏ dots 1,2,3,4
  q: "\u281F", // ⠟ dots 1,2,3,4,5
  r: "\u2817", // ⠗ dots 1,2,3,5
  s: "\u280E", // ⠎ dots 2,3,4
  t: "\u281E", // ⠞ dots 2,3,4,5
  u: "\u2825", // ⠥ dots 1,3,6
  v: "\u2827", // ⠧ dots 1,2,3,6
  w: "\u283A", // ⠺ dots 2,4,5,6
  x: "\u282D", // ⠭ dots 1,3,4,6
  y: "\u283D", // ⠽ dots 1,3,4,5,6
  z: "\u2835", // ⠵ dots 1,3,5,6
};

/**
 * 数字→点字 変換テーブル
 * 数字は1-9がA-Iと同じパターン、0はJと同じパターン
 * 実際の出力には NUMBER_INDICATOR を先頭に付加する
 */
export const DIGIT_TO_BRAILLE: Record<string, string> = {
  "1": "\u2801", // ⠁ (A と同じ)
  "2": "\u2803", // ⠃ (B と同じ)
  "3": "\u2809", // ⠉ (C と同じ)
  "4": "\u2819", // ⠙ (D と同じ)
  "5": "\u2811", // ⠑ (E と同じ)
  "6": "\u280B", // ⠋ (F と同じ)
  "7": "\u281B", // ⠛ (G と同じ)
  "8": "\u2813", // ⠓ (H と同じ)
  "9": "\u280A", // ⠊ (I と同じ)
  "0": "\u281A", // ⠚ (J と同じ)
};

/**
 * 記号→点字 変換テーブル
 */
export const PUNCTUATION_TO_BRAILLE: Record<string, string> = {
  " ": "\u2800", // ⠀ 空白
  ",": "\u2802", // ⠂ dot 2
  ";": "\u2806", // ⠆ dots 2,3
  ":": "\u2812", // ⠒ dots 2,5
  ".": "\u2832", // ⠲ dots 2,5,6
  "!": "\u2816", // ⠖ dots 2,3,5
  "?": "\u2826", // ⠦ dots 2,3,6
  "-": "\u2824", // ⠤ dots 3,6
  "'": "\u2804", // ⠄ dot 3
};

/**
 * テキストをGrade 1 点字（UEB）に変換する
 * 大文字には大文字インジケーター（⠠）を付加
 * 数字には数字インジケーター（⠼）を先頭に付加
 * @param text 変換するテキスト
 * @returns 点字Unicode文字列（変換不可文字は「?」）
 */
export function textToBraille(text: string): string {
  if (!text) return "";

  const result: string[] = [];
  let inNumberMode = false;

  for (const char of text) {
    const lower = char.toLowerCase();

    if (LETTER_TO_BRAILLE[lower] !== undefined) {
      // アルファベット
      inNumberMode = false;
      if (char >= "A" && char <= "Z") {
        result.push(CAPITAL_INDICATOR);
      }
      result.push(LETTER_TO_BRAILLE[lower]);
    } else if (DIGIT_TO_BRAILLE[char] !== undefined) {
      // 数字: 数字モードの最初にインジケーターを付加
      if (!inNumberMode) {
        result.push(NUMBER_INDICATOR);
        inNumberMode = true;
      }
      result.push(DIGIT_TO_BRAILLE[char]);
    } else if (char === " ") {
      inNumberMode = false;
      result.push(PUNCTUATION_TO_BRAILLE[" "]);
    } else if (PUNCTUATION_TO_BRAILLE[char] !== undefined) {
      inNumberMode = false;
      result.push(PUNCTUATION_TO_BRAILLE[char]);
    } else {
      inNumberMode = false;
      result.push("?");
    }
  }

  return result.join("");
}

/**
 * 点字文字の視覚的なドットパターン名を返す
 * @param brailleChar 点字1文字
 * @returns ドットパターンの説明（例: "dots 1,2"）
 */
export function getBrailleDotPattern(brailleChar: string): string {
  const code = brailleChar.codePointAt(0);
  if (code === undefined || code < 0x2800 || code > 0x28ff) return "";

  const bits = code - 0x2800;
  if (bits === 0) return "空白";

  const dots: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (bits & (1 << i)) {
      dots.push(i + 1);
    }
  }
  return `点 ${dots.join(",")}`;
}
