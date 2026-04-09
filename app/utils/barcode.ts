/**
 * バーコード生成ユーティリティ関数
 *
 * 各種バーコード形式のバリデーション・ラベル・説明を提供します。
 */

/** 対応バーコード形式 */
export const BARCODE_FORMATS = [
  "CODE128",
  "EAN13",
  "EAN8",
  "UPC",
  "CODE39",
  "ITF14",
  "MSI",
  "codabar",
] as const;

/** バーコード形式の型 */
export type BarcodeFormat = (typeof BARCODE_FORMATS)[number];

/** バーコードの高さオプション（ピクセル） */
export const BARCODE_HEIGHTS = [50, 80, 100, 120, 150] as const;

/** バーコード高さの型 */
export type BarcodeHeight = (typeof BARCODE_HEIGHTS)[number];

/** EAN-13チェックディジットを計算する */
function calcEan13Check(digits: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

/** EAN-8チェックディジットを計算する */
function calcEan8Check(digits: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

/** UPC-Aチェックディジットを計算する */
function calcUpcCheck(digits: string): number {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * バーコード入力値を形式に応じてバリデーションする
 *
 * @param value - バリデーションする入力値
 * @param format - バーコード形式
 * @returns 入力値が有効な場合はtrue、無効な場合はfalse
 */
export function validateBarcodeInput(value: string, format: BarcodeFormat): boolean {
  if (value.length === 0) return false;

  switch (format) {
    case "EAN13": {
      // 12桁または13桁の数字
      if (!/^\d{12,13}$/.test(value)) return false;
      if (value.length === 13) {
        const check = calcEan13Check(value);
        return parseInt(value[12], 10) === check;
      }
      return true;
    }
    case "EAN8": {
      // 7桁または8桁の数字
      if (!/^\d{7,8}$/.test(value)) return false;
      if (value.length === 8) {
        const check = calcEan8Check(value);
        return parseInt(value[7], 10) === check;
      }
      return true;
    }
    case "UPC": {
      // 11桁または12桁の数字（UPC-A）
      if (!/^\d{11,12}$/.test(value)) return false;
      if (value.length === 12) {
        const check = calcUpcCheck(value);
        return parseInt(value[11], 10) === check;
      }
      return true;
    }
    case "CODE39": {
      // 大文字英数字とスペース・ハイフン・ドル・スラッシュ・プラス・パーセント
      return /^[A-Z0-9 \-$./+%]+$/.test(value);
    }
    case "ITF14": {
      // 14桁の偶数桁数字
      return /^\d{14}$/.test(value);
    }
    case "MSI": {
      // 数字のみ
      return /^\d+$/.test(value);
    }
    case "codabar": {
      // 数字と A-D と記号 + - : / .
      return /^[A-Da-d0-9+\-:/.]+$/.test(value);
    }
    case "CODE128": {
      // ASCII文字全般（最大80文字）
      if (value.length > 80) return false;
      // ASCII 0x20〜0x7E の範囲
      return /^[\x20-\x7E]+$/.test(value);
    }
    default:
      return false;
  }
}

/**
 * バーコード形式の表示名を返す
 *
 * @param format - バーコード形式
 * @returns 表示名文字列
 */
export function getFormatLabel(format: BarcodeFormat): string {
  const labels: Record<BarcodeFormat, string> = {
    CODE128: "CODE 128",
    EAN13: "EAN-13",
    EAN8: "EAN-8",
    UPC: "UPC-A",
    CODE39: "CODE 39",
    ITF14: "ITF-14",
    MSI: "MSI Plessey",
    codabar: "Codabar",
  };
  return labels[format];
}

/**
 * バーコード形式ごとのサンプル値（プレースホルダー）を返す
 *
 * @param format - バーコード形式
 * @returns プレースホルダー文字列
 */
export function getFormatPlaceholder(format: BarcodeFormat): string {
  const placeholders: Record<BarcodeFormat, string> = {
    CODE128: "Hello World",
    EAN13: "4901234567894",
    EAN8: "96385074",
    UPC: "012345678905",
    CODE39: "HELLO-WORLD",
    ITF14: "00012345678905",
    MSI: "1234567",
    codabar: "A1234A",
  };
  return placeholders[format];
}

/**
 * バーコード形式ごとの説明・制約を返す
 *
 * @param format - バーコード形式
 * @returns 説明文字列
 */
export function getFormatDescription(format: BarcodeFormat): string {
  const descriptions: Record<BarcodeFormat, string> = {
    CODE128: "ASCII文字全般（最大80文字）",
    EAN13: "12〜13桁の数字（チェックディジット自動検証）",
    EAN8: "7〜8桁の数字（チェックディジット自動検証）",
    UPC: "11〜12桁の数字（UPC-A形式）",
    CODE39: "大文字英数字とスペース・ハイフン・ドル・スラッシュ・プラス・パーセント",
    ITF14: "14桁の数字（物流用バーコード）",
    MSI: "数字のみ（桁数制限なし）",
    codabar: "数字と A–D・+ - : / . の組み合わせ",
  };
  return descriptions[format];
}
