/**
 * 数値テキスト変換ユーティリティ
 * 整数を英語（基数詞・序数詞）および日本語（漢数字・読み仮名）に変換する
 */

// ===== 英語 =====

/** 英語: 1〜19の単語 */
const EN_ONES: readonly string[] = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

/** 英語: 十の位 */
const EN_TENS: readonly string[] = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

/** 英語: 3桁ごとのスケール */
const EN_SCALES: readonly string[] = [
  '',
  'thousand',
  'million',
  'billion',
  'trillion',
  'quadrillion',
];

/** サポートする最大値（999兆 = Number.MAX_SAFE_INTEGER 内に収まる安全な上限） */
export const NUMBER_WORDS_MAX = 999_999_999_999_999;

/**
 * 3桁以下の整数を英語に変換する（内部用）
 * @param n - 0〜999 の整数
 */
function chunkToEnglish(n: number): string {
  if (n === 0) return '';

  let result = '';
  let remaining = n;

  if (remaining >= 100) {
    result += EN_ONES[Math.floor(remaining / 100)] + ' hundred';
    remaining %= 100;
    if (remaining > 0) result += ' ';
  }

  if (remaining >= 20) {
    result += EN_TENS[Math.floor(remaining / 10)];
    if (remaining % 10 > 0) result += '-' + EN_ONES[remaining % 10];
  } else if (remaining > 0) {
    result += EN_ONES[remaining];
  }

  return result;
}

/**
 * 整数を英語の基数詞に変換する
 * @param n - 変換する整数（-999999999999999999〜999999999999999999）
 * @returns 英語テキスト、範囲外または無効な場合は null
 * @example toWordsEnglish(123) // "one hundred twenty-three"
 */
export function toWordsEnglish(n: number): string | null {
  if (!Number.isInteger(n)) return null;
  if (n === 0) return 'zero';
  if (Math.abs(n) > NUMBER_WORDS_MAX) return null;

  const negative = n < 0;
  let abs = Math.abs(n);

  const chunks: number[] = [];
  while (abs > 0) {
    chunks.push(abs % 1000);
    abs = Math.floor(abs / 1000);
  }

  const parts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    if (chunks[i] === 0) continue;
    const text = chunkToEnglish(chunks[i]);
    if (EN_SCALES[i]) {
      parts.push(text + ' ' + EN_SCALES[i]);
    } else {
      parts.push(text);
    }
  }

  const result = parts.join(', ');
  return negative ? 'negative ' + result : result;
}

/**
 * 整数を英語の序数詞に変換する
 * @param n - 変換する正の整数
 * @returns 英語序数テキスト、範囲外または無効な場合は null
 * @example toWordsEnglishOrdinal(21) // "twenty-first"
 */
export function toWordsEnglishOrdinal(n: number): string | null {
  if (!Number.isInteger(n) || n <= 0) return null;
  const cardinal = toWordsEnglish(n);
  if (!cardinal) return null;

  // 序数変換ルール: 最後の単語を変換
  const ordinalMap: Array<[RegExp, string]> = [
    [/twelve$/, 'twelfth'],
    [/one$/, 'first'],
    [/two$/, 'second'],
    [/three$/, 'third'],
    [/five$/, 'fifth'],
    [/eight$/, 'eighth'],
    [/nine$/, 'ninth'],
    [/ty$/, 'tieth'],
  ];

  for (const [pattern, replacement] of ordinalMap) {
    if (pattern.test(cardinal)) {
      return cardinal.replace(pattern, replacement);
    }
  }

  return cardinal + 'th';
}

// ===== 日本語 =====

/** 日本語: 漢数字 */
const JA_KANJI: readonly string[] = [
  '〇',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
];

/** 日本語: 数字の読み（基本） */
const JA_DIGIT_READINGS: readonly string[] = [
  'れい',
  'いち',
  'に',
  'さん',
  'よん',
  'ご',
  'ろく',
  'なな',
  'はち',
  'きゅう',
];

/** 日本語: 百の位の読み（連濁・音便変化あり） */
const JA_HYAKU_READINGS: Record<number, string> = {
  1: 'ひゃく',
  2: 'にひゃく',
  3: 'さんびゃく',
  4: 'よんひゃく',
  5: 'ごひゃく',
  6: 'ろっぴゃく',
  7: 'ななひゃく',
  8: 'はっぴゃく',
  9: 'きゅうひゃく',
};

/** 日本語: 千の位の読み（音便変化あり） */
const JA_SEN_READINGS: Record<number, string> = {
  1: 'せん',
  2: 'にせん',
  3: 'さんぜん',
  4: 'よんせん',
  5: 'ごせん',
  6: 'ろくせん',
  7: 'ななせん',
  8: 'はっせん',
  9: 'きゅうせん',
};

/** 日本語: 万以上のスケール定義 */
const JA_SCALES: ReadonlyArray<{
  value: number;
  kanji: string;
  reading: string;
}> = [
  { value: 1e16, kanji: '京', reading: 'けい' },
  { value: 1e12, kanji: '兆', reading: 'ちょう' },
  { value: 1e8, kanji: '億', reading: 'おく' },
  { value: 1e4, kanji: '万', reading: 'まん' },
];

/** サポートする日本語変換の最大値（999兆、英語と統一） */
export const JA_MAX = 999_999_999_999_999;

/**
 * 1〜9999 の整数を日本語漢数字に変換する（内部用）
 * @param n - 1〜9999 の整数
 */
function chunkToJapaneseKanji(n: number): string {
  if (n === 0) return '';
  let result = '';
  let remaining = n;

  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    result += (thousands === 1 ? '' : JA_KANJI[thousands]) + '千';
    remaining %= 1000;
  }
  const hundreds = Math.floor(remaining / 100);
  if (hundreds > 0) {
    result += (hundreds === 1 ? '' : JA_KANJI[hundreds]) + '百';
    remaining %= 100;
  }
  const tens = Math.floor(remaining / 10);
  if (tens > 0) {
    result += (tens === 1 ? '' : JA_KANJI[tens]) + '十';
    remaining %= 10;
  }
  if (remaining > 0) {
    result += JA_KANJI[remaining];
  }

  return result;
}

/**
 * 1〜9999 の整数を日本語読み仮名に変換する（内部用）
 * @param n - 1〜9999 の整数
 */
function chunkToJapaneseReading(n: number): string {
  if (n === 0) return '';
  let result = '';
  let remaining = n;

  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    result += JA_SEN_READINGS[thousands];
    remaining %= 1000;
  }
  const hundreds = Math.floor(remaining / 100);
  if (hundreds > 0) {
    result += JA_HYAKU_READINGS[hundreds];
    remaining %= 100;
  }
  const tens = Math.floor(remaining / 10);
  if (tens > 0) {
    result += (tens === 1 ? '' : JA_DIGIT_READINGS[tens]) + 'じゅう';
    remaining %= 10;
  }
  if (remaining > 0) {
    result += JA_DIGIT_READINGS[remaining];
  }

  return result;
}

/**
 * 整数を日本語漢数字に変換する
 * @param n - 変換する非負整数（0〜MAX_SAFE_INTEGER）
 * @returns 漢数字テキスト、範囲外または無効な場合は null
 * @example toWordsJapanese(12345) // "一万二千三百四十五"
 */
export function toWordsJapanese(n: number): string | null {
  if (!Number.isInteger(n)) return null;
  if (n === 0) return '零';
  if (n < 0 || n > NUMBER_WORDS_MAX) return null;

  let result = '';
  let remaining = n;

  for (const scale of JA_SCALES) {
    if (remaining >= scale.value) {
      const chunk = Math.floor(remaining / scale.value);
      result += chunkToJapaneseKanji(chunk) + scale.kanji;
      remaining %= scale.value;
    }
  }

  if (remaining > 0) {
    result += chunkToJapaneseKanji(remaining);
  }

  return result;
}

/**
 * 整数を日本語の読み仮名（ひらがな）に変換する
 * 百・千の音便変化（さんびゃく・はっせん等）に対応。
 * @param n - 変換する非負整数（0〜MAX_SAFE_INTEGER）
 * @returns ひらがなテキスト、範囲外または無効な場合は null
 * @example toWordsJapaneseReading(300) // "さんびゃく"
 */
export function toWordsJapaneseReading(n: number): string | null {
  if (!Number.isInteger(n)) return null;
  if (n === 0) return 'れい';
  if (n < 0 || n > NUMBER_WORDS_MAX) return null;

  let result = '';
  let remaining = n;

  for (const scale of JA_SCALES) {
    if (remaining >= scale.value) {
      const chunk = Math.floor(remaining / scale.value);
      result += chunkToJapaneseReading(chunk) + scale.reading;
      remaining %= scale.value;
    }
  }

  if (remaining > 0) {
    result += chunkToJapaneseReading(remaining);
  }

  return result;
}
