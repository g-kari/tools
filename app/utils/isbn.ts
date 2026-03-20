/**
 * ISBNバリデーション・変換ユーティリティ
 * ISBN-10 / ISBN-13 の検証、変換、フォーマットに使用する
 */

/** ISBN検証・解析の結果 */
export interface IsbnResult {
  /** 入力から数字（またはX）のみ抽出した文字列 */
  raw: string;
  /** ISBN種別（10桁 or 13桁） */
  type: 'ISBN-10' | 'ISBN-13' | null;
  /** チェックサムの有効性 */
  isValid: boolean;
  /** 桁数の有効性 */
  isValidLength: boolean;
  /** フォーマット済み文字列（ハイフンなし） */
  formatted: string;
  /** フォーマット済み文字列（ハイフンあり） */
  formattedWithHyphens: string;
  /** ISBN-10形式（変換可能な場合） */
  isbn10: string | null;
  /** ISBN-13形式 */
  isbn13: string | null;
  /** チェックデジット */
  checkDigit: string;
  /** エラーメッセージ（無効な場合） */
  error: string | null;
}

/**
 * ISBN-10のチェックデジットを計算する
 * @param digits - チェックデジットを除いた9桁の数字文字列
 * @returns チェックデジット（0-9またはX）
 * @example calcIsbn10Check('030640615') // 'X'
 */
export function calcIsbn10Check(digits: string): string {
  if (digits.length !== 9) return '';
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = parseInt(digits[i], 10);
    if (isNaN(d)) return '';
    sum += d * (10 - i);
  }
  const remainder = sum % 11;
  const check = 11 - remainder;
  if (check === 10) return 'X';
  if (check === 11) return '0';
  return check.toString();
}

/**
 * ISBN-13のチェックデジットを計算する
 * @param digits - チェックデジットを除いた12桁の数字文字列
 * @returns チェックデジット（0-9）
 * @example calcIsbn13Check('978030640615') // '7'
 */
export function calcIsbn13Check(digits: string): string {
  if (digits.length !== 12) return '';
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(digits[i], 10);
    if (isNaN(d)) return '';
    sum += d * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check.toString();
}

/**
 * ISBN-10の文字列を検証する
 * @param digits - 数字とX（末尾のみ）の10文字文字列
 * @returns 有効な場合 true
 */
export function validateIsbn10(digits: string): boolean {
  if (digits.length !== 10) return false;
  const body = digits.slice(0, 9);
  const given = digits[9].toUpperCase();
  if (!/^\d{9}$/.test(body)) return false;
  if (!/^[\dX]$/.test(given)) return false;
  const expected = calcIsbn10Check(body);
  return expected === given;
}

/**
 * ISBN-13の文字列を検証する
 * @param digits - 13桁の数字文字列
 * @returns 有効な場合 true
 */
export function validateIsbn13(digits: string): boolean {
  if (digits.length !== 13) return false;
  if (!/^\d{13}$/.test(digits)) return false;
  const body = digits.slice(0, 12);
  const given = digits[12];
  const expected = calcIsbn13Check(body);
  return expected === given;
}

/**
 * ISBN-10をISBN-13に変換する
 * @param isbn10 - 有効なISBN-10文字列（10桁）
 * @returns ISBN-13文字列（失敗時はnull）
 */
export function isbn10ToIsbn13(isbn10: string): string | null {
  const digits = isbn10.toUpperCase();
  if (!validateIsbn10(digits)) return null;
  const body = '978' + digits.slice(0, 9);
  const check = calcIsbn13Check(body);
  return body + check;
}

/**
 * ISBN-13をISBN-10に変換する（978プレフィックスのみ対応）
 * @param isbn13 - 有効なISBN-13文字列（13桁）
 * @returns ISBN-10文字列（978以外のプレフィックスの場合はnull）
 */
export function isbn13ToIsbn10(isbn13: string): string | null {
  if (!validateIsbn13(isbn13)) return null;
  if (!isbn13.startsWith('978')) return null;
  const body = isbn13.slice(3, 12);
  const check = calcIsbn10Check(body);
  return body + check;
}

/**
 * ISBN文字列からハイフン区切りのフォーマット済み文字列を生成する
 * 簡易的なグループ区切り（詳細なグループ分けはISBN登録グループごとに異なるため概略）
 * @param isbn - 数字のみのISBN文字列（10桁または13桁）
 * @returns ハイフン区切り文字列
 */
export function formatIsbnWithHyphens(isbn: string): string {
  const upper = isbn.toUpperCase();
  if (upper.length === 10) {
    // ISBN-10: 単純に X-XXXXX-XXXX-X 形式（登録者グループは可変だが簡易表示）
    return `${upper[0]}-${upper.slice(1, 7)}-${upper.slice(7, 9)}-${upper[9]}`;
  }
  if (upper.length === 13) {
    // ISBN-13: 978/979-X-XXXXX-XXXX-X 形式
    return `${upper.slice(0, 3)}-${upper[3]}-${upper.slice(4, 10)}-${upper.slice(10, 12)}-${upper[12]}`;
  }
  return upper;
}

/**
 * 入力文字列からISBNとして使える文字を抽出する
 * @param input - 任意の入力文字列
 * @returns 数字とX（末尾のみ許可）のみの文字列
 */
export function extractIsbnDigits(input: string): string {
  // ハイフン・スペース・ダッシュを除去して数字とXのみ残す
  return input.replace(/[\s\-–—]/g, '').toUpperCase();
}

/**
 * ISBN文字列の総合検証・変換を行う
 * @param input - 入力文字列（ハイフン・スペース含む場合も可）
 * @returns 検証・変換結果オブジェクト
 */
export function validateIsbn(input: string): IsbnResult {
  const raw = extractIsbnDigits(input);

  if (raw.length === 0) {
    return {
      raw: '',
      type: null,
      isValid: false,
      isValidLength: false,
      formatted: '',
      formattedWithHyphens: '',
      isbn10: null,
      isbn13: null,
      checkDigit: '',
      error: 'ISBNを入力してください',
    };
  }

  // X が末尾以外にある場合はエラー
  const xPositions = [...raw].reduce<number[]>((acc, c, i) => {
    if (c === 'X') acc.push(i);
    return acc;
  }, []);
  if (xPositions.some((pos) => pos !== raw.length - 1)) {
    return {
      raw,
      type: null,
      isValid: false,
      isValidLength: false,
      formatted: raw,
      formattedWithHyphens: raw,
      isbn10: null,
      isbn13: null,
      checkDigit: '',
      error: 'X（チェックデジット）はISBN-10の末尾にのみ使用できます',
    };
  }

  // 数字以外（Xを除く）が含まれる場合はエラー
  if (!/^[\dX]+$/.test(raw)) {
    return {
      raw,
      type: null,
      isValid: false,
      isValidLength: false,
      formatted: raw,
      formattedWithHyphens: raw,
      isbn10: null,
      isbn13: null,
      checkDigit: '',
      error: '数字（0-9）またはX（ISBN-10のチェックデジット）のみ入力できます',
    };
  }

  const len = raw.length;
  const isValidLength = len === 10 || len === 13;

  if (!isValidLength) {
    return {
      raw,
      type: null,
      isValid: false,
      isValidLength: false,
      formatted: raw,
      formattedWithHyphens: raw,
      isbn10: null,
      isbn13: null,
      checkDigit: raw[raw.length - 1] ?? '',
      error: `桁数が不正です（${len}桁）。ISBN-10は10桁、ISBN-13は13桁である必要があります`,
    };
  }

  if (len === 10) {
    const isValid = validateIsbn10(raw);
    const isbn13 = isValid ? isbn10ToIsbn13(raw) : null;
    const expectedCheck = calcIsbn10Check(raw.slice(0, 9));
    return {
      raw,
      type: 'ISBN-10',
      isValid,
      isValidLength: true,
      formatted: raw.toUpperCase(),
      formattedWithHyphens: formatIsbnWithHyphens(raw),
      isbn10: raw.toUpperCase(),
      isbn13,
      checkDigit: raw[9].toUpperCase(),
      error: isValid
        ? null
        : `チェックデジットが不正です（入力: ${raw[9].toUpperCase()}, 正解: ${expectedCheck}）`,
    };
  }

  // len === 13
  const isValid = validateIsbn13(raw);
  const isbn10 = isValid ? isbn13ToIsbn10(raw) : null;
  const expectedCheck = calcIsbn13Check(raw.slice(0, 12));
  return {
    raw,
    type: 'ISBN-13',
    isValid,
    isValidLength: true,
    formatted: raw,
    formattedWithHyphens: formatIsbnWithHyphens(raw),
    isbn10,
    isbn13: raw,
    checkDigit: raw[12],
    error: isValid
      ? null
      : `チェックデジットが不正です（入力: ${raw[12]}, 正解: ${expectedCheck}）`,
  };
}

/** サンプルISBNリスト（テスト用） */
export const SAMPLE_ISBNS: ReadonlyArray<{
  label: string;
  isbn: string;
  note: string;
}> = [
  {
    label: 'ISBN-13（有効）',
    isbn: '9784873119038',
    note: 'プログラミングTypeScript（オライリー）',
  },
  {
    label: 'ISBN-13（有効）',
    isbn: '9784621303252',
    note: 'Clean Code（丸善出版）',
  },
  {
    label: 'ISBN-10（有効）',
    isbn: '4873119030',
    note: 'プログラミングTypeScript（ISBN-10）',
  },
  {
    label: 'ISBN-10（X終端）',
    isbn: '097522980X',
    note: 'チェックデジットがXの例（The Pragmatic Programmer）',
  },
];
