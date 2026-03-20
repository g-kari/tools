/**
 * ショートコードジェネレーター ユーティリティ
 *
 * チケット番号・バウチャーコード・ライセンスキーなど
 * 人間が読み書きしやすい短いコードを生成するユーティリティ。
 * - 視覚的に紛らわしい文字を除外するオプション
 * - セグメント区切り（例: XXXX-XXXX-XXXX）に対応
 * - Luhn チェックディジット付与オプション
 * - crypto.getRandomValues による暗号論的乱数使用
 */

/** 文字セット定義 */
export const CHARSETS = {
  alphanumeric: {
    label: "英数字（A–Z, 0–9）",
    value: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  },
  nolookalike: {
    label: "紛らわしい文字を除外（推奨）",
    value: "ACDEFGHJKLMNPQRTUVWXY34679",
  },
  uppercase: {
    label: "大文字アルファベットのみ",
    value: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  },
  lowercase: {
    label: "小文字アルファベットのみ",
    value: "abcdefghijklmnopqrstuvwxyz",
  },
  numbers: {
    label: "数字のみ（0–9）",
    value: "0123456789",
  },
  hex: {
    label: "16 進数（0–9A–F）",
    value: "0123456789ABCDEF",
  },
} as const;

export type CharsetKey = keyof typeof CHARSETS;

/** フォーマットプリセット定義 */
export const FORMAT_PRESETS = {
  ticket: {
    label: "チケット番号（例: ACDF-3479）",
    segmentLength: 4,
    segmentCount: 2,
    separator: "-",
    charsetKey: "nolookalike" as CharsetKey,
  },
  voucher: {
    label: "バウチャーコード（例: ABCD-EFGH-1234）",
    segmentLength: 4,
    segmentCount: 3,
    separator: "-",
    charsetKey: "nolookalike" as CharsetKey,
  },
  license: {
    label: "ライセンスキー（例: XXXX-XXXX-XXXX-XXXX）",
    segmentLength: 4,
    segmentCount: 4,
    separator: "-",
    charsetKey: "nolookalike" as CharsetKey,
  },
  pin: {
    label: "PIN コード（例: 481396）",
    segmentLength: 6,
    segmentCount: 1,
    separator: "",
    charsetKey: "numbers" as CharsetKey,
  },
  short: {
    label: "短い招待コード（例: A3D9）",
    segmentLength: 4,
    segmentCount: 1,
    separator: "",
    charsetKey: "nolookalike" as CharsetKey,
  },
  custom: {
    label: "カスタム",
    segmentLength: 4,
    segmentCount: 2,
    separator: "-",
    charsetKey: "nolookalike" as CharsetKey,
  },
} as const;

export type FormatPresetKey = keyof typeof FORMAT_PRESETS;

/**
 * 指定された文字セットと長さでランダムセグメントを生成する
 * @param length - セグメントの文字数
 * @param alphabet - 使用する文字セット
 * @returns ランダムなセグメント文字列
 */
function generateSegment(length: number, alphabet: string): string {
  if (alphabet.length === 0) {
    throw new Error("文字セットを 1 文字以上指定してください");
  }
  const bytes = new Uint8Array(length * 4);
  crypto.getRandomValues(bytes);
  let result = "";
  let byteIndex = 0;
  while (result.length < length) {
    if (byteIndex >= bytes.length) {
      const extra = new Uint8Array(length * 4);
      crypto.getRandomValues(extra);
      bytes.set(extra);
      byteIndex = 0;
    }
    const byte = bytes[byteIndex++];
    const charIndex = byte % alphabet.length;
    result += alphabet[charIndex];
  }
  return result;
}

/**
 * Luhn アルゴリズムに基づくチェックディジットを計算する
 * 数字のみのコードに対して使用する
 * @param code - チェックディジットを付与する数字文字列
 * @returns チェックディジット（0–9の数字）
 */
export function calculateLuhnDigit(code: string): string {
  const digits = code.split("").map(Number);
  let sum = 0;
  let isDouble = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (isDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isDouble = !isDouble;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return String(checkDigit);
}

/**
 * Luhn チェックディジットを検証する
 * @param code - チェックディジットを含む数字文字列
 * @returns 検証結果（true: 有効、false: 無効）
 */
export function verifyLuhn(code: string): boolean {
  if (!/^\d+$/.test(code)) return false;
  const digits = code.split("").map(Number);
  let sum = 0;
  let isDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (isDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isDouble = !isDouble;
  }
  return sum % 10 === 0;
}

/** ショートコード生成オプション */
export interface ShortCodeOptions {
  /** 各セグメントの文字数 */
  segmentLength: number;
  /** セグメントの数 */
  segmentCount: number;
  /** セグメント間の区切り文字 */
  separator: string;
  /** 使用する文字セット */
  alphabet: string;
  /** Luhn チェックディジットを末尾に付与するか（数字のみの場合） */
  addLuhn: boolean;
}

/**
 * ショートコードを生成する
 * @param options - 生成オプション
 * @returns 生成されたショートコード
 */
export function generateShortCode(options: ShortCodeOptions): string {
  const { segmentLength, segmentCount, separator, alphabet, addLuhn } = options;

  if (segmentLength < 1 || segmentLength > 20) {
    throw new Error("セグメント長は 1 〜 20 の範囲で指定してください");
  }
  if (segmentCount < 1 || segmentCount > 8) {
    throw new Error("セグメント数は 1 〜 8 の範囲で指定してください");
  }

  const segments = Array.from({ length: segmentCount }, () =>
    generateSegment(segmentLength, alphabet)
  );

  let code = segments.join(separator);

  if (addLuhn && /^\d+$/.test(code.replace(new RegExp(`\\${separator}`, "g"), ""))) {
    const digits = code.replace(new RegExp(`\\${separator}`, "g"), "");
    const checkDigit = calculateLuhnDigit(digits);
    code = code + separator.replace(/./g, "") + checkDigit;
  }

  return code;
}

/**
 * 複数のショートコードを一括生成する
 * @param options - 生成オプション
 * @param count - 生成する数（1 〜 100）
 * @returns 生成されたショートコードの配列
 */
export function generateShortCodes(
  options: ShortCodeOptions,
  count: number
): string[] {
  const clampedCount = Math.max(1, Math.min(100, count));
  return Array.from({ length: clampedCount }, () => generateShortCode(options));
}

/**
 * コードのエントロピー（ビット）を計算する
 * @param segmentLength - セグメント長
 * @param segmentCount - セグメント数
 * @param alphabetSize - 文字セットのサイズ
 * @returns エントロピー（ビット）
 */
export function calculateEntropy(
  segmentLength: number,
  segmentCount: number,
  alphabetSize: number
): number {
  return Math.log2(alphabetSize) * segmentLength * segmentCount;
}
