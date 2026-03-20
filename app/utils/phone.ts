/**
 * 日本の電話番号フォーマット・バリデーションユーティリティ
 * 全角文字の正規化、番号種別の判定、各種フォーマット変換を提供する
 */

/** 電話番号の種別 */
export type PhoneType =
  | "mobile"
  | "ip_phone"
  | "freephone"
  | "navi_dial"
  | "emergency"
  | "landline"
  | "unknown";

/** 電話番号解析の結果 */
export interface PhoneResult {
  /** 正規化後の数字のみ文字列 */
  normalized: string;
  /** ハイフン区切りフォーマット (例: 03-1234-5678) */
  hyphenated: string | null;
  /** 国際表記フォーマット (例: +81 3-1234-5678) */
  international: string | null;
  /** E.164フォーマット (例: +8131234578) */
  e164: string | null;
  /** 番号種別 */
  type: PhoneType;
  /** 種別の日本語ラベル */
  typeLabel: string;
  /** バリデーション通過フラグ */
  isValid: boolean;
  /** エラーメッセージ (エラーがない場合はnull) */
  errorMessage: string | null;
}

/** サンプル電話番号 */
export interface SamplePhone {
  /** 種別ラベル */
  label: string;
  /** 電話番号 */
  number: string;
  /** 補足説明 */
  note: string;
}

/**
 * 全角数字・記号を半角に正規化し、数字以外を除去する
 * @param input - 任意のユーザー入力文字列
 * @returns 半角数字のみの文字列
 * @example normalizePhone('０９０－1234－5678') // '09012345678'
 */
export function normalizePhone(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^\d]/g, "");
}

/**
 * 正規化済み数字列から電話番号種別を判定する
 * @param digits - 数字のみの文字列（先頭の0は保持）
 * @returns PhoneType
 * @example classifyPhone('09012345678') // 'mobile'
 */
export function classifyPhone(digits: string): PhoneType {
  if (/^(110|119|118)$/.test(digits)) return "emergency";
  if (/^(0120|0800)/.test(digits)) return "freephone";
  if (/^0570/.test(digits)) return "navi_dial";
  if (/^050/.test(digits)) return "ip_phone";
  if (/^0[789]0/.test(digits)) return "mobile";
  if (/^0/.test(digits)) return "landline";
  return "unknown";
}

const TYPE_LABELS: Record<PhoneType, string> = {
  mobile: "携帯電話",
  ip_phone: "IP電話",
  freephone: "フリーダイヤル",
  navi_dial: "ナビダイヤル",
  emergency: "緊急電話",
  landline: "固定電話",
  unknown: "不明",
};

/**
 * 正規化済み数字列からハイフン区切りフォーマットを生成する
 * @param digits - 数字のみの文字列
 * @param type - 番号種別
 * @returns ハイフン区切り文字列（フォーマット不可の場合はnull）
 * @example formatHyphenated('09012345678', 'mobile') // '090-1234-5678'
 */
export function formatHyphenated(digits: string, type: PhoneType): string | null {
  switch (type) {
    case "emergency":
      return digits;
    case "mobile":
    case "ip_phone":
      if (digits.length === 11) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
      }
      return null;
    case "freephone":
      if (digits.startsWith("0120") && digits.length === 10) {
        return `0120-${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
      if (digits.startsWith("0800") && digits.length === 11) {
        return `0800-${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
      return null;
    case "navi_dial":
      if (digits.length === 10) {
        return `0570-${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
      return null;
    case "landline":
      if (digits.length === 10) {
        if (/^0[36]/.test(digits)) {
          return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
        }
        if (/^0(11|22|43|45|52|72|75|78|92)/.test(digits)) {
          return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
        }
        return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
      if (digits.length === 11) {
        return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
      }
      return null;
    default:
      return null;
  }
}

/**
 * 日本の電話番号文字列を解析してPhoneResultを返す
 * @param input - ユーザー入力（全角・ハイフン・スペース含む可）
 * @returns PhoneResult
 * @example parsePhone('090-1234-5678') // { type: 'mobile', isValid: true, ... }
 */
export function parsePhone(input: string): PhoneResult {
  const digits = normalizePhone(input);
  const type = classifyPhone(digits);
  const typeLabel = TYPE_LABELS[type];

  if (digits.length === 0) {
    return {
      normalized: digits,
      hyphenated: null,
      international: null,
      e164: null,
      type: "unknown",
      typeLabel: TYPE_LABELS["unknown"],
      isValid: false,
      errorMessage: "電話番号を入力してください",
    };
  }

  if (type === "unknown") {
    return {
      normalized: digits,
      hyphenated: null,
      international: null,
      e164: null,
      type,
      typeLabel,
      isValid: false,
      errorMessage: "認識できない番号形式です（0から始まる番号を入力してください）",
    };
  }

  if (type === "emergency") {
    return {
      normalized: digits,
      hyphenated: digits,
      international: null,
      e164: null,
      type,
      typeLabel,
      isValid: true,
      errorMessage: null,
    };
  }

  const validLengths: Record<PhoneType, number[]> = {
    mobile: [11],
    ip_phone: [11],
    freephone: [10, 11],
    navi_dial: [10],
    landline: [10, 11],
    emergency: [3],
    unknown: [],
  };
  const expectedLengths = validLengths[type];
  if (!expectedLengths.includes(digits.length)) {
    return {
      normalized: digits,
      hyphenated: null,
      international: null,
      e164: null,
      type,
      typeLabel,
      isValid: false,
      errorMessage: `桁数が正しくありません（${expectedLengths.join("または")}桁必要）`,
    };
  }

  const hyphenated = formatHyphenated(digits, type);
  const e164 = `+81${digits.slice(1)}`;
  const international = hyphenated ? `+81 ${hyphenated.slice(1)}` : null;

  return {
    normalized: digits,
    hyphenated,
    international,
    e164,
    type,
    typeLabel,
    isValid: hyphenated !== null,
    errorMessage: null,
  };
}

/** テスト・サンプル用電話番号リスト */
export const SAMPLE_PHONE_NUMBERS: ReadonlyArray<SamplePhone> = [
  { label: "携帯電話 (090)", number: "09012345678", note: "11桁" },
  { label: "携帯電話 (080)", number: "08012345678", note: "11桁" },
  { label: "携帯電話 (070)", number: "07012345678", note: "11桁" },
  { label: "IP電話 (050)", number: "05012345678", note: "11桁" },
  { label: "東京 (03)", number: "0312345678", note: "10桁" },
  { label: "大阪 (06)", number: "0612345678", note: "10桁" },
  { label: "横浜 (045)", number: "0451234567", note: "10桁" },
  { label: "フリーダイヤル (0120)", number: "0120123456", note: "10桁" },
  { label: "フリーダイヤル (0800)", number: "08001234567", note: "11桁" },
  { label: "ナビダイヤル (0570)", number: "0570123456", note: "10桁" },
  { label: "警察 (110)", number: "110", note: "緊急" },
  { label: "救急・消防 (119)", number: "119", note: "緊急" },
];
