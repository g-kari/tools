import { describe, it, expect } from "vite-plus/test";
import {
  calcLoan,
  validateLoanParams,
  calcEqualPaymentMonthly,
  formatYen,
  type LoanParams,
} from "../../app/utils/loan";

describe("validateLoanParams", () => {
  const base: LoanParams = {
    principal: 30_000_000,
    annualRate: 1.5,
    termYears: 35,
    type: "equal-payment",
  };

  it("正常なパラメータはnullを返す", () => {
    expect(validateLoanParams(base)).toBeNull();
  });

  it("borrowing amount が 0 以下はエラー", () => {
    expect(validateLoanParams({ ...base, principal: 0 })).toBeTruthy();
    expect(validateLoanParams({ ...base, principal: -1 })).toBeTruthy();
  });

  it("年利率が負はエラー", () => {
    expect(validateLoanParams({ ...base, annualRate: -0.1 })).toBeTruthy();
  });

  it("年利率が100超はエラー", () => {
    expect(validateLoanParams({ ...base, annualRate: 101 })).toBeTruthy();
  });

  it("年利率 0% は正常", () => {
    expect(validateLoanParams({ ...base, annualRate: 0 })).toBeNull();
  });

  it("返済期間が 0 以下はエラー", () => {
    expect(validateLoanParams({ ...base, termYears: 0 })).toBeTruthy();
    expect(validateLoanParams({ ...base, termYears: -1 })).toBeTruthy();
  });

  it("返済期間が 50 超はエラー", () => {
    expect(validateLoanParams({ ...base, termYears: 51 })).toBeTruthy();
  });

  it("返済期間が小数はエラー", () => {
    expect(validateLoanParams({ ...base, termYears: 1.5 })).toBeTruthy();
  });

  it("NaN の値はエラー", () => {
    expect(validateLoanParams({ ...base, principal: NaN })).toBeTruthy();
    expect(validateLoanParams({ ...base, annualRate: NaN })).toBeTruthy();
    expect(validateLoanParams({ ...base, termYears: NaN })).toBeTruthy();
  });
});

describe("calcEqualPaymentMonthly", () => {
  it("月利率 0 の場合は元本を月数で割った値", () => {
    const result = calcEqualPaymentMonthly(1_200_000, 0, 12);
    expect(result).toBe(100_000);
  });

  it("一般的な住宅ローンの月額を計算", () => {
    // 3000万円、年利1.5%、35年
    const monthlyRate = 0.015 / 12;
    const n = 35 * 12;
    const monthly = calcEqualPaymentMonthly(30_000_000, monthlyRate, n);
    // 約91,855円程度になるはず
    expect(monthly).toBeGreaterThan(90_000);
    expect(monthly).toBeLessThan(95_000);
  });
});

describe("calcLoan - 元利均等返済", () => {
  const params: LoanParams = {
    principal: 30_000_000,
    annualRate: 1.5,
    termYears: 35,
    type: "equal-payment",
  };

  it("nullを返さない（計算成功）", () => {
    expect(calcLoan(params)).not.toBeNull();
  });

  it("スケジュール行数が termYears × 12 と一致する", () => {
    const result = calcLoan(params)!;
    expect(result.schedule).toHaveLength(35 * 12);
  });

  it("最終残高がほぼ 0", () => {
    const result = calcLoan(params)!;
    const lastRow = result.schedule.at(-1)!;
    expect(lastRow.balance).toBe(0);
  });

  it("総返済額 = 借入金額 + 総利息", () => {
    const result = calcLoan(params)!;
    expect(Math.abs(result.totalPayment - (params.principal + result.totalInterest))).toBeLessThan(10);
  });

  it("月々の返済額が正の値", () => {
    const result = calcLoan(params)!;
    expect(result.monthlyPayment).toBeGreaterThan(0);
  });

  it("各月の返済額が一定（± 1円の許容）", () => {
    const result = calcLoan(params)!;
    const firstPayment = result.schedule[0].payment;
    // 最終月以外の全行で確認（最終月は端数調整があり得る）
    for (let i = 0; i < result.schedule.length - 1; i++) {
      expect(
        Math.abs(result.schedule[i].payment - firstPayment)
      ).toBeLessThanOrEqual(1);
    }
  });

  it("年利 0% でも計算可能（利息はほぼ0）", () => {
    const zeroRate: LoanParams = { ...params, annualRate: 0 };
    const result = calcLoan(zeroRate)!;
    expect(result).not.toBeNull();
    // 丸め誤差により厳密に0にはならない場合があるため、元本の0.01%未満を許容
    expect(result.totalInterest).toBeLessThan(params.principal * 0.0001);
  });
});

describe("calcLoan - 元金均等返済", () => {
  const params: LoanParams = {
    principal: 30_000_000,
    annualRate: 1.5,
    termYears: 35,
    type: "equal-principal",
  };

  it("スケジュール行数が termYears × 12 と一致する", () => {
    const result = calcLoan(params)!;
    expect(result.schedule).toHaveLength(35 * 12);
  });

  it("最終残高がほぼ 0", () => {
    const result = calcLoan(params)!;
    const lastRow = result.schedule.at(-1)!;
    expect(lastRow.balance).toBe(0);
  });

  it("各月の元金返済額が一定（± 1円）", () => {
    const result = calcLoan(params)!;
    const expectedPrincipal = Math.round(
      params.principal / (params.termYears * 12)
    );
    for (let i = 0; i < result.schedule.length - 1; i++) {
      expect(
        Math.abs(result.schedule[i].principalPart - expectedPrincipal)
      ).toBeLessThanOrEqual(1);
    }
  });

  it("元金均等の総利息 < 元利均等の総利息（同条件の場合）", () => {
    const equalPayment = calcLoan({ ...params, type: "equal-payment" })!;
    const equalPrincipal = calcLoan({ ...params, type: "equal-principal" })!;
    expect(equalPrincipal.totalInterest).toBeLessThan(
      equalPayment.totalInterest
    );
  });

  it("初回の返済額が最後の返済額より大きい（利息逓減のため）", () => {
    const result = calcLoan(params)!;
    expect(result.schedule[0].payment).toBeGreaterThan(
      result.schedule.at(-1)!.payment
    );
  });
});

describe("calcLoan - バリデーション", () => {
  it("無効なパラメータはnullを返す", () => {
    const invalid: LoanParams = {
      principal: -1000,
      annualRate: 1.5,
      termYears: 10,
      type: "equal-payment",
    };
    expect(calcLoan(invalid)).toBeNull();
  });
});

describe("formatYen", () => {
  it("金額を日本語フォーマットする", () => {
    expect(formatYen(1_234_567)).toBe("1,234,567 円");
  });

  it("0円のフォーマット", () => {
    expect(formatYen(0)).toBe("0 円");
  });

  it("小数は四捨五入されない（整数のみ渡す想定）", () => {
    expect(formatYen(100)).toBe("100 円");
  });
});
