/**
 * ローン計算ユーティリティ
 *
 * 元利均等返済（毎月の返済額が一定）と
 * 元金均等返済（元金部分が一定）の2方式に対応。
 */

/** 返済方式 */
export type RepaymentType = "equal-payment" | "equal-principal";

/** ローン計算パラメータ */
export interface LoanParams {
  /** 借入金額（円） */
  principal: number;
  /** 年利率（%） */
  annualRate: number;
  /** 返済期間（年） */
  termYears: number;
  /** 返済方式 */
  type: RepaymentType;
}

/** 月次返済スケジュール */
export interface PaymentSchedule {
  /** 月番号（1始まり） */
  month: number;
  /** 返済額（円） */
  payment: number;
  /** うち元金（円） */
  principalPart: number;
  /** うち利息（円） */
  interestPart: number;
  /** 残高（円） */
  balance: number;
}

/** ローン計算結果 */
export interface LoanResult {
  /** 月次返済額（元利均等の場合は毎月一定） */
  monthlyPayment: number;
  /** 総返済額（円） */
  totalPayment: number;
  /** 総利息（円） */
  totalInterest: number;
  /** 返済スケジュール */
  schedule: PaymentSchedule[];
}

/**
 * 入力値の検証
 * @param params - ローン計算パラメータ
 * @returns エラーメッセージ（問題なければ null）
 */
export function validateLoanParams(params: LoanParams): string | null {
  if (!isFinite(params.principal) || params.principal <= 0) {
    return "借入金額は 0 より大きい数値を入力してください";
  }
  if (!isFinite(params.annualRate) || params.annualRate < 0) {
    return "年利率は 0 以上の数値を入力してください";
  }
  if (params.annualRate > 100) {
    return "年利率は 100% 以下にしてください";
  }
  if (
    !isFinite(params.termYears) ||
    params.termYears <= 0 ||
    !Number.isInteger(params.termYears)
  ) {
    return "返済期間は 1 年以上の整数を入力してください";
  }
  if (params.termYears > 50) {
    return "返済期間は 50 年以内にしてください";
  }
  return null;
}

/**
 * 元利均等返済の月次返済額を計算する
 * 公式: M = P × r × (1+r)^n / ((1+r)^n - 1)
 * @param principal - 借入金額
 * @param monthlyRate - 月利率（年利 / 12）
 * @param totalMonths - 返済総月数
 * @returns 月次返済額
 */
export function calcEqualPaymentMonthly(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  if (monthlyRate === 0) {
    return principal / totalMonths;
  }
  const r = monthlyRate;
  const n = totalMonths;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * 元利均等返済の返済スケジュールを生成する
 * @param params - ローン計算パラメータ
 * @returns 月次スケジュール配列
 */
function buildEqualPaymentSchedule(params: LoanParams): PaymentSchedule[] {
  const totalMonths = params.termYears * 12;
  const monthlyRate = params.annualRate / 100 / 12;
  const monthlyPayment = calcEqualPaymentMonthly(
    params.principal,
    monthlyRate,
    totalMonths
  );

  const schedule: PaymentSchedule[] = [];
  let balance = params.principal;

  for (let month = 1; month <= totalMonths; month++) {
    const interestPart = balance * monthlyRate;
    let principalPart = monthlyPayment - interestPart;
    let payment = monthlyPayment;

    // 最終月は端数調整
    if (month === totalMonths) {
      principalPart = balance;
      payment = balance + interestPart;
    }

    balance = Math.max(0, balance - principalPart);

    schedule.push({
      month,
      payment: Math.round(payment),
      principalPart: Math.round(principalPart),
      interestPart: Math.round(interestPart),
      balance: Math.round(balance),
    });
  }

  return schedule;
}

/**
 * 元金均等返済の返済スケジュールを生成する
 * 毎月の元金返済額 = 借入金額 / 返済月数（一定）
 * 利息 = 残高 × 月利率
 * @param params - ローン計算パラメータ
 * @returns 月次スケジュール配列
 */
function buildEqualPrincipalSchedule(params: LoanParams): PaymentSchedule[] {
  const totalMonths = params.termYears * 12;
  const monthlyRate = params.annualRate / 100 / 12;
  const monthlyPrincipal = params.principal / totalMonths;

  const schedule: PaymentSchedule[] = [];
  let balance = params.principal;

  for (let month = 1; month <= totalMonths; month++) {
    const interestPart = balance * monthlyRate;
    const principalPart =
      month === totalMonths ? balance : monthlyPrincipal;
    const payment = principalPart + interestPart;

    balance = Math.max(0, balance - principalPart);

    schedule.push({
      month,
      payment: Math.round(payment),
      principalPart: Math.round(principalPart),
      interestPart: Math.round(interestPart),
      balance: Math.round(balance),
    });
  }

  return schedule;
}

/**
 * ローン計算を実行する
 * @param params - ローン計算パラメータ
 * @returns 計算結果（バリデーションエラーの場合は null）
 */
export function calcLoan(params: LoanParams): LoanResult | null {
  const error = validateLoanParams(params);
  if (error) return null;

  const schedule =
    params.type === "equal-payment"
      ? buildEqualPaymentSchedule(params)
      : buildEqualPrincipalSchedule(params);

  const totalPayment = schedule.reduce((sum, row) => sum + row.payment, 0);
  const totalInterest = totalPayment - params.principal;
  const monthlyPayment = schedule[0]?.payment ?? 0;

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    schedule,
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
