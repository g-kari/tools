/**
 * @fileoverview Unicodeコードポイント検査ユーティリティ
 * テキストの各文字のUnicodeプロパティを解析・取得するための関数群
 */

/**
 * 文字のUnicodeカテゴリ
 */
export type UnicodeCategory =
  | 'Letter'
  | 'Digit'
  | 'Punctuation'
  | 'Symbol'
  | 'Separator'
  | 'Control'
  | 'Surrogate'
  | 'Other';

/**
 * 1つのUnicode文字（コードポイント）の検査結果
 */
export interface CharInfo {
  /** 表示用の文字列（サロゲートペアを含む場合あり） */
  char: string;
  /** Unicodeコードポイント（10進数） */
  codePoint: number;
  /** コードポイントの16進数表記（例: "U+0041"） */
  codePointHex: string;
  /** UTF-8バイト列（hex文字列の配列、例: ["0x41"]） */
  utf8Bytes: string[];
  /** UTF-16コードユニット（hex文字列の配列、例: ["0x0041"]） */
  utf16Units: string[];
  /** 数値参照HTML エンティティ（例: "&#65;"） */
  numericEntity: string;
  /** 名前付きHTMLエンティティ（例: "&amp;"、なければ null） */
  namedEntity: string | null;
  /** Unicodeカテゴリ */
  category: UnicodeCategory;
  /** カテゴリの日本語ラベル */
  categoryLabel: string;
  /** サロゲートペアか */
  isSurrogatePair: boolean;
}

/**
 * よく使われるHTML名前付きエンティティのマッピング
 */
const NAMED_ENTITIES: ReadonlyMap<number, string> = new Map([
  [0x22, '&quot;'],
  [0x26, '&amp;'],
  [0x27, '&apos;'],
  [0x3c, '&lt;'],
  [0x3e, '&gt;'],
  [0xa0, '&nbsp;'],
  [0xa9, '&copy;'],
  [0xae, '&reg;'],
  [0xb0, '&deg;'],
  [0xb1, '&plusmn;'],
  [0xb7, '&middot;'],
  [0xd7, '&times;'],
  [0xf7, '&divide;'],
  [0x2013, '&ndash;'],
  [0x2014, '&mdash;'],
  [0x2018, '&lsquo;'],
  [0x2019, '&rsquo;'],
  [0x201c, '&ldquo;'],
  [0x201d, '&rdquo;'],
  [0x2026, '&hellip;'],
  [0x2022, '&bull;'],
  [0x2192, '&rarr;'],
  [0x2190, '&larr;'],
  [0x2194, '&harr;'],
  [0x21d2, '&rArr;'],
  [0x2260, '&ne;'],
  [0x2264, '&le;'],
  [0x2265, '&ge;'],
  [0x2122, '&trade;'],
  [0x20ac, '&euro;'],
  [0xa3, '&pound;'],
  [0xa5, '&yen;'],
]);

/**
 * Unicodeカテゴリを判定する
 *
 * @param codePoint - Unicodeコードポイント
 * @returns カテゴリ
 */
export function getCategory(codePoint: number): UnicodeCategory {
  // サロゲート領域
  if (codePoint >= 0xd800 && codePoint <= 0xdfff) return 'Surrogate';

  // 制御文字
  if (codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f))
    return 'Control';

  const char = String.fromCodePoint(codePoint);

  // Unicode プロパティエスケープを使用してカテゴリを判定
  if (/^\p{L}/u.test(char)) return 'Letter';
  if (/^\p{N}/u.test(char)) return 'Digit';
  if (/^\p{P}/u.test(char)) return 'Punctuation';
  if (/^\p{S}/u.test(char)) return 'Symbol';
  if (/^\p{Z}/u.test(char)) return 'Separator';
  if (/^\p{C}/u.test(char)) return 'Control';

  return 'Other';
}

/**
 * カテゴリの日本語ラベルを取得する
 *
 * @param category - Unicodeカテゴリ
 * @returns 日本語ラベル
 */
export function getCategoryLabel(category: UnicodeCategory): string {
  const labels: Record<UnicodeCategory, string> = {
    Letter: '文字',
    Digit: '数字',
    Punctuation: '句読点',
    Symbol: '記号',
    Separator: '区切り',
    Control: '制御',
    Surrogate: 'サロゲート',
    Other: 'その他',
  };
  return labels[category];
}

/**
 * コードポイントのUTF-8バイト列を取得する
 *
 * @param codePoint - Unicodeコードポイント
 * @returns UTF-8バイト列（hex文字列の配列）
 */
export function getUtf8Bytes(codePoint: number): string[] {
  try {
    const char = String.fromCodePoint(codePoint);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(char);
    return Array.from(bytes).map(
      (b) => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`
    );
  } catch {
    return ['—'];
  }
}

/**
 * コードポイントのUTF-16コードユニットを取得する
 *
 * @param char - 1文字（またはサロゲートペア）
 * @returns UTF-16コードユニット（hex文字列の配列）
 */
export function getUtf16Units(char: string): string[] {
  const units: string[] = [];
  for (let i = 0; i < char.length; i++) {
    const code = char.charCodeAt(i);
    units.push(`0x${code.toString(16).toUpperCase().padStart(4, '0')}`);
  }
  return units;
}

/**
 * 1文字のUnicode情報を取得する
 *
 * @param char - 1文字（サロゲートペアの場合は2コードユニット）
 * @param codePoint - Unicodeコードポイント
 * @returns 文字情報
 */
export function getCharInfo(char: string, codePoint: number): CharInfo {
  const isSurrogatePair = char.length === 2;
  const codePointHex = `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
  const utf8Bytes = getUtf8Bytes(codePoint);
  const utf16Units = getUtf16Units(char);
  const numericEntity = `&#${codePoint};`;
  const namedEntity = NAMED_ENTITIES.get(codePoint) ?? null;
  const category = getCategory(codePoint);
  const categoryLabel = getCategoryLabel(category);

  return {
    char,
    codePoint,
    codePointHex,
    utf8Bytes,
    utf16Units,
    numericEntity,
    namedEntity,
    category,
    categoryLabel,
    isSurrogatePair,
  };
}

/**
 * テキスト全体をUnicode文字単位で解析する
 *
 * サロゲートペア（絵文字など）も正しく処理します。
 *
 * @param text - 解析対象のテキスト
 * @returns 各文字の情報配列
 */
export function analyzeText(text: string): CharInfo[] {
  const result: CharInfo[] = [];
  // スプレッド演算子でコードポイント単位に分割（サロゲートペア対応）
  const chars = [...text];
  for (const char of chars) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined) {
      result.push(getCharInfo(char, codePoint));
    }
  }
  return result;
}

/**
 * カテゴリ別の文字数カウントを取得する
 *
 * @param chars - 文字情報配列
 * @returns カテゴリ→件数のマップ
 */
export function countByCategory(chars: CharInfo[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const char of chars) {
    const label = char.categoryLabel;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return counts;
}

/**
 * コードポイントを16進数文字列で検索する（例: "0041" または "U+0041"）
 *
 * @param text - テキスト
 * @param query - 検索クエリ（文字、コードポイント16進数、カテゴリラベル）
 * @returns フィルタリング後の文字情報配列
 */
export function filterChars(chars: CharInfo[], query: string): CharInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return chars;

  return chars.filter((c) => {
    // 文字で検索
    if (c.char.toLowerCase().includes(q)) return true;
    // コードポイント（U+XXXX）で検索
    if (c.codePointHex.toLowerCase().includes(q)) return true;
    // カテゴリラベルで検索
    if (c.categoryLabel.includes(q)) return true;
    // 10進数コードポイントで検索
    if (String(c.codePoint).includes(q)) return true;
    return false;
  });
}
