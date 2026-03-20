/**
 * 割り勘計算ユーティリティ
 */

/**
 * 割り勘計算の入力パラメータ
 */
export interface WarikanInput {
  /** 合計金額（税込） */
  totalAmount: number;
  /** 人数（2以上） */
  people: number;
  /** チップ率（%、0以上） */
  tipRate: number;
}

/**
 * 割り勘計算の結果
 */
export interface WarikanResult {
  /** チップ額 */
  tipAmount: number;
  /** チップ込み合計金額 */
  grandTotal: number;
  /** 一人あたりの金額（切り上げ） */
  perPersonCeil: number;
  /** 一人あたりの金額（切り捨て） */
  perPersonFloor: number;
  /** 切り上げ時の端数（誰かが払う余分な金額） */
  remainder: number;
}

/**
 * チップ額を計算する
 * @param total - 合計金額
 * @param tipRate - チップ率（%）
 * @returns チップ額
 */
export function calcTipAmount(total: number, tipRate: number): number {
  return total * (tipRate / 100);
}

/**
 * チップ込み合計金額を計算する
 * @param total - 合計金額
 * @param tipRate - チップ率（%）
 * @returns チップ込み合計金額
 */
export function calcGrandTotal(total: number, tipRate: number): number {
  return total + calcTipAmount(total, tipRate);
}

/**
 * 一人あたりの金額（切り上げ）を計算する
 * @param grandTotal - チップ込み合計金額
 * @param people - 人数
 * @returns 一人あたりの金額（切り上げ）
 */
export function calcPerPersonCeil(grandTotal: number, people: number): number {
  return Math.ceil(grandTotal / people);
}

/**
 * 一人あたりの金額（切り捨て）を計算する
 * @param grandTotal - チップ込み合計金額
 * @param people - 人数
 * @returns 一人あたりの金額（切り捨て）
 */
export function calcPerPersonFloor(grandTotal: number, people: number): number {
  return Math.floor(grandTotal / people);
}

/**
 * 切り上げ時の端数（誰かが払う余分な金額）を計算する
 * @param grandTotal - チップ込み合計金額
 * @param people - 人数
 * @returns 端数の金額
 */
export function calcRemainder(grandTotal: number, people: number): number {
  const floor = calcPerPersonFloor(grandTotal, people);
  return Math.round(grandTotal - floor * people);
}

/**
 * 割り勘を計算する
 * @param input - 計算パラメータ
 * @returns 計算結果、または無効な入力の場合は null
 */
export function calcWarikan(input: WarikanInput): WarikanResult | null {
  const { totalAmount, people, tipRate } = input;

  if (
    !isFinite(totalAmount) ||
    totalAmount < 0 ||
    !isFinite(people) ||
    people < 2 ||
    !isFinite(tipRate) ||
    tipRate < 0
  ) {
    return null;
  }

  const tipAmount = calcTipAmount(totalAmount, tipRate);
  const grandTotal = totalAmount + tipAmount;
  const perPersonCeil = calcPerPersonCeil(grandTotal, people);
  const perPersonFloor = calcPerPersonFloor(grandTotal, people);
  const remainder = calcRemainder(grandTotal, people);

  return {
    tipAmount,
    grandTotal,
    perPersonCeil,
    perPersonFloor,
    remainder,
  };
}

/**
 * 数値を円単位で整形する
 * @param value - 整形対象の数値
 * @returns 整形された文字列
 */
export function formatYenWarikan(value: number): string {
  if (!isFinite(value)) return "計算不能";
  return Math.round(value).toLocaleString("ja-JP");
}
