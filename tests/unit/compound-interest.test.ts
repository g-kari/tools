import { describe, it, expect } from "vite-plus/test";
import {
  validateCompoundInterestParams,
  calcCompoundInterest,
  frequencyToPeriodsPerYear,
  formatYen,
  type CompoundInterestParams,
} from "../../app/utils/compound-interest";

const baseParams: CompoundInterestParams = {
  principal: 1_000_000,
  annualRate: 5,
  termYears: 10,
  frequency: "monthly",
  additionalContribution: 0,
};

describe("frequencyToPeriodsPerYear", () => {
  it("毎月は12を返す", () => {
    expect(frequencyToPeriodsPerYear("monthly")).toBe(12);
  });

  it("四半期は4を返す", () => {
    expect(frequencyToPeriodsPerYear("quarterly")).toBe(4);
  });

  it("半年は2を返す", () => {
    expect(frequencyToPeriodsPerYear("semi-annually")).toBe(2);
  });

  it("毎年は1を返す", () => {
    expect(frequencyToPeriodsPerYear("annually")).toBe(1);
  });
});

describe("validateCompoundInterestParams", () => {
  it("正常なパラメータは null を返す", () => {
    expect(validateCompoundInterestParams(baseParams)).toBeNull();
  });

  it("元本が0の場合はエラーを返す", () => {
    expect(validateCompoundInterestParams({ ...baseParams, principal: 0 })).not.toBeNull();
  });

  it("元本が負の場合はエラーを返す", () => {
    expect(validateCompoundInterestParams({ ...baseParams, principal: -1 })).not.toBeNull();
  });

  it("元本がNaNの場合はエラーを返す", () => {
    expect(validateCompoundInterestParams({ ...baseParams, principal: NaN })).not.toBeNull();
  });

  it("年利率が負の場合はエラーを返す", () => {
    expect(validateCompoundInterestParams({ ...baseParams, annualRate: -0.1 })).not.toBeNull();
  });

  it("年利率が100%超の場合はエラーを返す", () => {
    expect(validateCompoundInterestParams({ ...baseParams, annualRate: 101 })).not.toBeNull();
  });

  it("年利率が0は有効", () => {
    expect(validateCompoundInterestParams({ ...baseParams, annualRate: 0 })).toBeNull();
  });

  it("運用期間が0の場合はエラーを返す", () => {
    expect(validateCompoundInterestParams({ ...baseParams, termYears: 0 })).not.toBeNull();
  });

  it("運用期間が小数の場合はエラーを返す", () => {
    expect(validateCompoundInterestParams({ ...baseParams, termYears: 1.5 })).not.toBeNull();
  });

  it("運用期間が101年の場合はエラーを返す", () => {
    expect(validateCompoundInterestParams({ ...baseParams, termYears: 101 })).not.toBeNull();
  });

  it("運用期間が100年は有効", () => {
    expect(validateCompoundInterestParams({ ...baseParams, termYears: 100 })).toBeNull();
  });

  it("追加積立金が負の場合はエラーを返す", () => {
    expect(
      validateCompoundInterestParams({ ...baseParams, additionalContribution: -1 }),
    ).not.toBeNull();
  });

  it("追加積立金が0は有効", () => {
    expect(validateCompoundInterestParams({ ...baseParams, additionalContribution: 0 })).toBeNull();
  });
});

describe("calcCompoundInterest - 基本計算", () => {
  it("バリデーションエラーがある場合は null を返す", () => {
    expect(calcCompoundInterest({ ...baseParams, principal: 0 })).toBeNull();
  });

  it("年利0%の場合は元本のみ（追加積立なし）", () => {
    const result = calcCompoundInterest({ ...baseParams, annualRate: 0 });
    expect(result).not.toBeNull();
    expect(result!.finalAmount).toBe(baseParams.principal);
    expect(result!.totalInterest).toBe(0);
  });

  it("結果の整合性: finalAmount = totalPrincipal + totalInterest", () => {
    const result = calcCompoundInterest(baseParams);
    expect(result).not.toBeNull();
    expect(result!.finalAmount).toBeCloseTo(result!.totalPrincipal + result!.totalInterest, -1);
  });

  it("元本100万円・年利5%・10年（毎月複利）の最終残高が概算値に近い", () => {
    const result = calcCompoundInterest(baseParams);
    expect(result).not.toBeNull();
    // 100万円 × (1 + 0.05/12)^120 ≈ 164,700円
    expect(result!.finalAmount).toBeGreaterThan(1_640_000);
    expect(result!.finalAmount).toBeLessThan(1_660_000);
  });

  it("追加積立ありは積立なしより最終残高が大きい", () => {
    const noContrib = calcCompoundInterest(baseParams);
    const withContrib = calcCompoundInterest({
      ...baseParams,
      additionalContribution: 10_000,
    });
    expect(withContrib).not.toBeNull();
    expect(noContrib).not.toBeNull();
    expect(withContrib!.finalAmount).toBeGreaterThan(noContrib!.finalAmount);
  });

  it("積立金合計は additionalContribution × 期間数 × 年数", () => {
    const contribution = 10_000;
    const result = calcCompoundInterest({
      ...baseParams,
      additionalContribution: contribution,
    });
    expect(result).not.toBeNull();
    const expected = contribution * 12 * baseParams.termYears;
    expect(result!.totalContribution).toBe(expected);
  });

  it("initialPrincipal が元本と一致する", () => {
    const result = calcCompoundInterest(baseParams);
    expect(result!.initialPrincipal).toBe(baseParams.principal);
  });
});

describe("calcCompoundInterest - 年次スナップショット", () => {
  it("スナップショット数が運用期間（年）と一致する", () => {
    const result = calcCompoundInterest(baseParams);
    expect(result!.yearlySnapshots).toHaveLength(baseParams.termYears);
  });

  it("スナップショットの年番号が1始まりで連続している", () => {
    const result = calcCompoundInterest(baseParams);
    result!.yearlySnapshots.forEach((snap, i) => {
      expect(snap.year).toBe(i + 1);
    });
  });

  it("最終年のスナップショット残高が finalAmount と一致する", () => {
    const result = calcCompoundInterest(baseParams);
    const lastSnap = result!.yearlySnapshots[result!.yearlySnapshots.length - 1];
    expect(lastSnap.balance).toBe(result!.finalAmount);
  });

  it("スナップショットの残高は単調増加（年利 > 0 かつ追加積立 >= 0）", () => {
    const result = calcCompoundInterest(baseParams);
    const snapshots = result!.yearlySnapshots;
    for (let i = 1; i < snapshots.length; i++) {
      expect(snapshots[i].balance).toBeGreaterThan(snapshots[i - 1].balance);
    }
  });

  it("年利0%・積立なしではスナップショットの残高が一定", () => {
    const result = calcCompoundInterest({ ...baseParams, annualRate: 0 });
    result!.yearlySnapshots.forEach((snap) => {
      expect(snap.balance).toBe(baseParams.principal);
    });
  });
});

describe("calcCompoundInterest - 複利頻度比較", () => {
  it("毎月複利 > 四半期複利 > 半年複利 > 年複利（年利 > 0）", () => {
    const freqs = ["monthly", "quarterly", "semi-annually", "annually"] as const;
    const results = freqs.map(
      (f) => calcCompoundInterest({ ...baseParams, frequency: f })!.finalAmount,
    );
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i]).toBeGreaterThanOrEqual(results[i + 1]);
    }
  });
});

describe("formatYen", () => {
  it("金額をフォーマットする", () => {
    expect(formatYen(1_000_000)).toBe("1,000,000 円");
  });

  it("小数点以下を切り捨てる", () => {
    expect(formatYen(1234.9)).toBe("1,235 円");
  });

  it("0円をフォーマットする", () => {
    expect(formatYen(0)).toBe("0 円");
  });
});
