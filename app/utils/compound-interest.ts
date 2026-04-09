/**
 * 複利計算ユーティリティ
 *
 * 追加積立に対応した複利計算（Compound Interest）を行う。
 * 複利計算頻度（毎月・四半期・半年・毎年）を選択可能。
 */

/** 複利計算頻度 */
export type CompoundFrequency = "monthly" | "quarterly" | "semi-annually" | "annually";

/** 複利計算パラメータ */
export interface CompoundInterestParams {
  /** 元本（円） */
  principal: number;
  /** 年利率（%） */
  annualRate: number;
  /** 運用期間（年） */
  termYears: number;
  /** 複利計算頻度 */
  frequency: CompoundFrequency;
  /** 追加積立金（円/期間） */
  additionalContribution: number;
}

/** 年次スナップショット */
export interface YearlySnapshot {
  /** 年（1始まり） */
  year: number;
  /** 期末残高（円） */
  balance: number;
  /** 元本累計（初期元本 + 積立累計） */
  principalTotal: number;
  /** 利息累計（円） */
  interestTotal: number;
  /** 当年発生利息（円） */
  yearlyInterest: number;
}

/** 複利計算結果 */
export interface CompoundInterestResult {
  /** 最終残高（円） */
  finalAmount: number;
  /** 初期元本（円） */
  initialPrincipal: number;
  /** 元本合計（初期元本 + 全積立金） */
  totalPrincipal: number;
  /** 総利息（円） */
  totalInterest: number;
  /** 積立金合計（円） */
  totalContribution: number;
  /** 年次スナップショット */
  yearlySnapshots: YearlySnapshot[];
}

/**
 * 複利計算頻度から年間期間数を返す
 * @param frequency - 複利計算頻度
 * @returns 年間期間数
 */
export function frequencyToPeriodsPerYear(frequency: CompoundFrequency): number {
  switch (frequency) {
    case "monthly":
      return 12;
    case "quarterly":
      return 4;
    case "semi-annually":
      return 2;
    case "annually":
      return 1;
  }
}

/**
 * 複利計算頻度の表示名を返す
 * @param frequency - 複利計算頻度
 * @returns 表示名
 */
export function frequencyLabel(frequency: CompoundFrequency): string {
  switch (frequency) {
    case "monthly":
      return "毎月";
    case "quarterly":
      return "四半期";
    case "semi-annually":
      return "半年";
    case "annually":
      return "毎年";
  }
}

/**
 * 入力値の検証
 * @param params - 複利計算パラメータ
 * @returns エラーメッセージ（問題なければ null）
 */
export function validateCompoundInterestParams(params: CompoundInterestParams): string | null {
  if (!isFinite(params.principal) || params.principal <= 0) {
    return "元本は 0 より大きい数値を入力してください";
  }
  if (!isFinite(params.annualRate) || params.annualRate < 0) {
    return "年利率は 0 以上の数値を入力してください";
  }
  if (params.annualRate > 100) {
    return "年利率は 100% 以下にしてください";
  }
  if (!isFinite(params.termYears) || params.termYears <= 0 || !Number.isInteger(params.termYears)) {
    return "運用期間は 1 年以上の整数を入力してください";
  }
  if (params.termYears > 100) {
    return "運用期間は 100 年以内にしてください";
  }
  if (!isFinite(params.additionalContribution) || params.additionalContribution < 0) {
    return "追加積立金は 0 以上の数値を入力してください";
  }
  return null;
}

/**
 * 複利計算を実行する
 *
 * 公式:
 * - 元本部分: P × (1 + r)^n
 * - 積立部分: C × ((1 + r)^n - 1) / r  (r > 0)
 * - 積立部分: C × n  (r = 0)
 * ここで r = 年利率 / 期間数、n = 期間数 × 年数
 *
 * @param params - 複利計算パラメータ
 * @returns 計算結果（バリデーションエラーの場合は null）
 */
export function calcCompoundInterest(
  params: CompoundInterestParams,
): CompoundInterestResult | null {
  const error = validateCompoundInterestParams(params);
  if (error) return null;

  const periodsPerYear = frequencyToPeriodsPerYear(params.frequency);
  const r = params.annualRate / 100 / periodsPerYear;
  const { principal, termYears, additionalContribution } = params;

  const yearlySnapshots: YearlySnapshot[] = [];
  let prevBalance = principal;
  let cumulativeContribution = 0;

  for (let year = 1; year <= termYears; year++) {
    const n = periodsPerYear * year;
    const rn = Math.pow(1 + r, n);

    // 元本部分
    const principalPart = principal * rn;

    // 積立部分
    const contributionPart =
      r === 0 ? additionalContribution * n : (additionalContribution * (rn - 1)) / r;

    const balance = Math.round(principalPart + contributionPart);
    cumulativeContribution = additionalContribution * n;
    const principalTotal = Math.round(principal + cumulativeContribution);
    const interestTotal = balance - principalTotal;
    const yearlyInterest =
      balance - Math.round(prevBalance + additionalContribution * periodsPerYear);

    yearlySnapshots.push({
      year,
      balance,
      principalTotal,
      interestTotal,
      yearlyInterest: Math.round(yearlyInterest),
    });

    prevBalance = balance;
  }

  const lastSnapshot = yearlySnapshots[yearlySnapshots.length - 1];
  const finalAmount = lastSnapshot?.balance ?? principal;
  const totalContribution = Math.round(additionalContribution * periodsPerYear * termYears);
  const totalPrincipal = Math.round(principal + totalContribution);
  const totalInterest = finalAmount - totalPrincipal;

  return {
    finalAmount,
    initialPrincipal: Math.round(principal),
    totalPrincipal,
    totalInterest,
    totalContribution,
    yearlySnapshots,
  };
}

/**
 * 金額を日本語ロケールでフォーマットする
 * @param amount - 金額（円）
 * @returns フォーマット済み文字列（例: "123,456 円"）
 */
export function formatYen(amount: number): string {
  return (
    amount.toLocaleString("ja-JP", {
      maximumFractionDigits: 0,
    }) + " 円"
  );
}
