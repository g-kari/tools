/**
 * Luhnアルゴリズムおよびクレジットカード検証ユーティリティ
 * クレジットカード番号の検証・カード種別判定・テスト番号生成に使用する
 */

/** カード種別の定義 */
export interface CardType {
  /** カード名称 */
  name: string;
  /** ブランド識別子 */
  brand: string;
  /** 先頭桁のパターン（正規表現） */
  pattern: RegExp;
  /** 有効な桁数 */
  lengths: number[];
  /** 表示用フォーマット（グループ区切り） */
  format: number[];
}

/** 対応するカード種別リスト */
export const CARD_TYPES: readonly CardType[] = [
  {
    name: "American Express",
    brand: "amex",
    pattern: /^3[47]/,
    lengths: [15],
    format: [4, 6, 5],
  },
  {
    name: "Diners Club",
    brand: "diners",
    pattern: /^3(?:0[0-5]|[68])/,
    lengths: [14],
    format: [4, 6, 4],
  },
  {
    name: "Discover",
    brand: "discover",
    pattern: /^6(?:011|5[0-9]{2})/,
    lengths: [16, 19],
    format: [4, 4, 4, 4],
  },
  {
    name: "JCB",
    brand: "jcb",
    pattern: /^(?:2131|1800|35\d{3})/,
    lengths: [16],
    format: [4, 4, 4, 4],
  },
  {
    name: "Mastercard",
    brand: "mastercard",
    pattern: /^(?:5[1-5]|2[2-7])/,
    lengths: [16],
    format: [4, 4, 4, 4],
  },
  {
    name: "UnionPay",
    brand: "unionpay",
    pattern: /^62/,
    lengths: [16, 17, 18, 19],
    format: [4, 4, 4, 4],
  },
  {
    name: "Visa",
    brand: "visa",
    pattern: /^4/,
    lengths: [13, 16, 19],
    format: [4, 4, 4, 4],
  },
];

/** Luhn検証の結果 */
export interface LuhnResult {
  /** 入力された数字のみの文字列 */
  digits: string;
  /** Luhnアルゴリズムによる有効性 */
  isValid: boolean;
  /** 検出されたカード種別（null=不明） */
  cardType: CardType | null;
  /** 桁数が有効かどうか */
  isValidLength: boolean;
  /** フォーマット済み表示文字列 */
  formatted: string;
  /** チェックディジット */
  checkDigit: number;
}

/**
 * Luhnアルゴリズムで数字文字列を検証する
 * @param digits - 数字のみの文字列
 * @returns 有効な場合 true
 * @example luhnCheck('4532015112830366') // true
 */
export function luhnCheck(digits: string): boolean {
  if (!digits || digits.length < 2) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isNaN(digit)) return false;

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * 数字文字列からカード種別を検出する
 * @param digits - 数字のみの文字列
 * @returns 検出されたカード種別（不明の場合 null）
 */
export function detectCardType(digits: string): CardType | null {
  if (!digits) return null;
  return CARD_TYPES.find((card) => card.pattern.test(digits)) ?? null;
}

/**
 * カード番号をフォーマット済み文字列に変換する
 * @param digits - 数字のみの文字列
 * @param format - グループ区切り配列（例: [4, 4, 4, 4]）
 * @returns フォーマット済み文字列
 * @example formatCardNumber('4532015112830366', [4,4,4,4]) // '4532 0151 1283 0366'
 */
export function formatCardNumber(digits: string, format: number[]): string {
  let result = "";
  let pos = 0;

  for (let i = 0; i < format.length; i++) {
    const chunk = digits.slice(pos, pos + format[i]);
    if (!chunk) break;
    result += (i > 0 ? " " : "") + chunk;
    pos += format[i];
  }

  const remaining = digits.slice(pos);
  if (remaining) result += " " + remaining;

  return result.trim();
}

/**
 * クレジットカード番号の総合検証を行う
 * @param input - 入力文字列（スペース・ハイフン含む場合も可）
 * @returns 検証結果オブジェクト
 */
export function validateCard(input: string): LuhnResult {
  const digits = input.replace(/[\s-]/g, "");
  const cardType = detectCardType(digits);
  const isValid = digits.length >= 2 && luhnCheck(digits);
  const isValidLength = cardType
    ? cardType.lengths.includes(digits.length)
    : digits.length >= 13 && digits.length <= 19;

  const format = cardType?.format ?? [4, 4, 4, 4];
  const formatted = formatCardNumber(digits, format);

  const checkDigit = digits.length > 0 ? parseInt(digits[digits.length - 1], 10) : 0;

  return {
    digits,
    isValid,
    cardType,
    isValidLength,
    formatted,
    checkDigit,
  };
}

/** テスト用カード番号リスト */
export const TEST_CARD_NUMBERS: ReadonlyArray<{
  brand: string;
  name: string;
  number: string;
  note: string;
}> = [
  {
    brand: "visa",
    name: "Visa",
    number: "4532015112830366",
    note: "16桁・標準",
  },
  {
    brand: "visa",
    name: "Visa",
    number: "4111111111111111",
    note: "16桁・よく使われるテスト番号",
  },
  {
    brand: "mastercard",
    name: "Mastercard",
    number: "5500005555555559",
    note: "16桁・標準",
  },
  {
    brand: "mastercard",
    name: "Mastercard",
    number: "2223000048400011",
    note: "16桁・2-series",
  },
  {
    brand: "amex",
    name: "American Express",
    number: "378282246310005",
    note: "15桁・標準",
  },
  {
    brand: "amex",
    name: "American Express",
    number: "371449635398431",
    note: "15桁・標準",
  },
  {
    brand: "discover",
    name: "Discover",
    number: "6011111111111117",
    note: "16桁・標準",
  },
  {
    brand: "jcb",
    name: "JCB",
    number: "3530111333300000",
    note: "16桁・標準",
  },
];
