import { describe, expect, it } from "vite-plus/test";
import {
  validateLoanParams,
  calcEqualPaymentMonthly,
  calcLoan,
  formatYen,
  type LoanParams,
} from "../../app/utils/loan";

describe("validateLoanParams", () => {
  const validParams: LoanParams = {
    principal: 3000000,
    annualRate: 3,
    termYears: 10,
    type: "equal-payment",
  };

  it("正常なパラメータは null を返す", () => {
    expect(validateLoanParams(validParams)).toBeNull();
  });

  describe("借入金額の検証", () => {
    it("借入金額が 0 のときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, principal: 0 })).not.toBeNull();
    });

    it("借入金額が負のときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, principal: -100000 })).not.toBeNull();
    });

    it("借入金額が Infinity のときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, principal: Infinity })).not.toBeNull();
    });

    it("借入金額が NaN のときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, principal: NaN })).not.toBeNull();
    });
  });

  describe("年利率の検証", () => {
    it("年利率が 0 のときは正常", () => {
      expect(validateLoanParams({ ...validParams, annualRate: 0 })).toBeNull();
    });

    it("年利率が 100 のときは正常", () => {
      expect(validateLoanParams({ ...validParams, annualRate: 100 })).toBeNull();
    });

    it("年利率が 100 を超えるときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, annualRate: 101 })).not.toBeNull();
    });

    it("年利率が負のときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, annualRate: -1 })).not.toBeNull();
    });

    it("年利率が NaN のときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, annualRate: NaN })).not.toBeNull();
    });
  });

  describe("返済期間の検証", () => {
    it("返済期間が 1 年のときは正常", () => {
      expect(validateLoanParams({ ...validParams, termYears: 1 })).toBeNull();
    });

    it("返済期間が 50 年のときは正常", () => {
      expect(validateLoanParams({ ...validParams, termYears: 50 })).toBeNull();
    });

    it("返済期間が 51 年のときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, termYears: 51 })).not.toBeNull();
    });

    it("返済期間が 0 のときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, termYears: 0 })).not.toBeNull();
    });

    it("返済期間が小数のときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, termYears: 1.5 })).not.toBeNull();
    });

    it("返済期間が負のときエラーを返す", () => {
      expect(validateLoanParams({ ...validParams, termYears: -1 })).not.toBeNull();
    });
  });
});

describe("calcEqualPaymentMonthly", () => {
  it("月利率 0（無利息）のとき元金を均等割した金額を返す", () => {
    const result = calcEqualPaymentMonthly(1200000, 0, 12);
    expect(result).toBeCloseTo(100000, 0);
  });

  it("月利率が正のとき元金より大きい金額を返す", () => {
    const monthlyRate = 0.03 / 12;
    const result = calcEqualPaymentMonthly(1200000, monthlyRate, 12);
    expect(result).toBeGreaterThan(1200000 / 12);
  });

  it("返済月数が増えると月次返済額が減る", () => {
    const monthlyRate = 0.03 / 12;
    const short = calcEqualPaymentMonthly(1200000, monthlyRate, 12);
    const long = calcEqualPaymentMonthly(1200000, monthlyRate, 120);
    expect(long).toBeLessThan(short);
  });

  it("公式による既知の値と一致する（300万円、年利3%、10年）", () => {
    const monthlyRate = 0.03 / 12;
    const result = calcEqualPaymentMonthly(3000000, monthlyRate, 120);
    // 期待値: 約 28,968 円
    expect(result).toBeCloseTo(28968, -1);
  });
});

describe("calcLoan", () => {
  describe("元利均等返済", () => {
    const params: LoanParams = {
      principal: 3000000,
      annualRate: 3,
      termYears: 10,
      type: "equal-payment",
    };

    it("有効なパラメータで null 以外を返す", () => {
      expect(calcLoan(params)).not.toBeNull();
    });

    it("返済スケジュールの件数が termYears × 12 と一致する", () => {
      const result = calcLoan(params)!;
      expect(result.schedule).toHaveLength(120);
    });

    it("月次返済額が毎月ほぼ一定である（元利均等）", () => {
      const result = calcLoan(params)!;
      const payments = result.schedule.slice(0, -1).map((s) => s.payment);
      const first = payments[0];
      for (const p of payments) {
        expect(Math.abs(p - first)).toBeLessThanOrEqual(1);
      }
    });

    it("総返済額 = 総利息 + 借入金額", () => {
      const result = calcLoan(params)!;
      expect(result.totalPayment).toBeCloseTo(result.totalInterest + params.principal, -1);
    });

    it("最終月の残高が 0 になる", () => {
      const result = calcLoan(params)!;
      expect(result.schedule[result.schedule.length - 1].balance).toBe(0);
    });

    it("各月の返済額 = 元金 + 利息（端数丸め内）", () => {
      const result = calcLoan(params)!;
      for (const row of result.schedule) {
        const diff = Math.abs(row.payment - (row.principalPart + row.interestPart));
        expect(diff).toBeLessThanOrEqual(1);
      }
    });

    it("利息は残高が減るに従って減少傾向にある", () => {
      const result = calcLoan(params)!;
      const first = result.schedule[0].interestPart;
      const last = result.schedule[result.schedule.length - 2].interestPart;
      expect(last).toBeLessThan(first);
    });
  });

  describe("元金均等返済", () => {
    const params: LoanParams = {
      principal: 3000000,
      annualRate: 3,
      termYears: 10,
      type: "equal-principal",
    };

    it("有効なパラメータで null 以外を返す", () => {
      expect(calcLoan(params)).not.toBeNull();
    });

    it("返済スケジュールの件数が termYears × 12 と一致する", () => {
      const result = calcLoan(params)!;
      expect(result.schedule).toHaveLength(120);
    });

    it("元金部分が毎月ほぼ一定である（元金均等）", () => {
      const result = calcLoan(params)!;
      const principals = result.schedule.slice(0, -1).map((s) => s.principalPart);
      const first = principals[0];
      for (const p of principals) {
        expect(Math.abs(p - first)).toBeLessThanOrEqual(1);
      }
    });

    it("返済額は月が進むにつれ減少する（利息分が減るため）", () => {
      const result = calcLoan(params)!;
      const payments = result.schedule.map((s) => s.payment);
      expect(payments[0]).toBeGreaterThanOrEqual(payments[payments.length - 1]);
    });

    it("最終月の残高が 0 になる", () => {
      const result = calcLoan(params)!;
      expect(result.schedule[result.schedule.length - 1].balance).toBe(0);
    });

    it("総返済額 = 総利息 + 借入金額", () => {
      const result = calcLoan(params)!;
      expect(result.totalPayment).toBeCloseTo(result.totalInterest + params.principal, -1);
    });
  });

  describe("無利息ケース", () => {
    it("年利 0% のとき総返済額が借入金額と一致する", () => {
      const params: LoanParams = {
        principal: 1200000,
        annualRate: 0,
        termYears: 1,
        type: "equal-payment",
      };
      const result = calcLoan(params)!;
      expect(result.totalInterest).toBe(0);
      expect(result.totalPayment).toBeCloseTo(params.principal, -1);
    });
  });

  describe("バリデーションエラー", () => {
    it("不正なパラメータで null を返す", () => {
      const invalid: LoanParams = {
        principal: 0,
        annualRate: 3,
        termYears: 10,
        type: "equal-payment",
      };
      expect(calcLoan(invalid)).toBeNull();
    });
  });

  describe("monthlyPayment フィールド", () => {
    it("元利均等返済の monthlyPayment は1ヶ月目の payment と一致する", () => {
      const params: LoanParams = {
        principal: 3000000,
        annualRate: 3,
        termYears: 10,
        type: "equal-payment",
      };
      const result = calcLoan(params)!;
      expect(result.monthlyPayment).toBe(result.schedule[0].payment);
    });
  });
});

describe("formatYen", () => {
  it("1000円未満はカンマなし", () => {
    expect(formatYen(999)).toBe("999 円");
  });

  it("1000円以上はカンマ区切り", () => {
    expect(formatYen(1000)).toBe("1,000 円");
  });

  it("1000000円を正しくフォーマット", () => {
    expect(formatYen(1000000)).toBe("1,000,000 円");
  });

  it("0円を正しくフォーマット", () => {
    expect(formatYen(0)).toBe("0 円");
  });

  it("小数点以下は切り捨て", () => {
    expect(formatYen(1234.56)).toBe("1,235 円");
  });
});
