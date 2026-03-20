/**
 * 消費税計算ユーティリティ
 */

/** 対応する税率の定義 */
export const TAX_RATES = [8, 10] as const;
export type TaxRate = (typeof TAX_RATES)[number];

/** 税率のラベル */
export const TAX_RATE_LABELS: Record<TaxRate, string> = {
  8: "軽減税率 8%（食料品・新聞など）",
  10: "標準税率 10%",
};

/**
 * 税抜価格から税込価格を計算する
 * @param price - 税抜価格
 * @param rate - 税率（%）
 * @returns 税込価格
 */
export function calcTaxIncluded(price: number, rate: TaxRate): number {
  return price * (1 + rate / 100);
}

/**
 * 税抜価格から消費税額を計算する
 * @param price - 税抜価格
 * @param rate - 税率（%）
 * @returns 消費税額
 */
export function calcTaxAmount(price: number, rate: TaxRate): number {
  return price * (rate / 100);
}

/**
 * 税込価格から税抜価格を計算する（内税計算）
 * @param price - 税込価格
 * @param rate - 税率（%）
 * @returns 税抜価格
 */
export function calcTaxExcluded(price: number, rate: TaxRate): number {
  return price / (1 + rate / 100);
}

/**
 * 税込価格に含まれる消費税額を計算する（内税計算）
 * @param price - 税込価格
 * @param rate - 税率（%）
 * @returns 税込価格に含まれる消費税額
 */
export function calcTaxAmountFromIncluded(price: number, rate: TaxRate): number {
  return price - calcTaxExcluded(price, rate);
}

/**
 * 数値を円単位で整形する（小数点以下を四捨五入）
 * @param value - 整形対象の数値
 * @param fractionDigits - 小数桁数（デフォルト: 0）
 * @returns 整形された文字列
 */
export function formatYen(value: number, fractionDigits = 0): string {
  if (!isFinite(value)) return "計算不能";
  return value.toLocaleString("ja-JP", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}
