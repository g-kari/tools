import { describe, it, expect } from "vitest";
import {
  calcTipAmount,
  calcGrandTotal,
  calcPerPersonCeil,
  calcPerPersonFloor,
  calcRemainder,
  calcWarikan,
  formatYenWarikan,
} from "../../app/utils/warikan";

describe("calcTipAmount", () => {
  it("チップ10%の金額を計算する", () => {
    expect(calcTipAmount(10000, 10)).toBe(1000);
  });

  it("チップ0%の金額は0円", () => {
    expect(calcTipAmount(10000, 0)).toBe(0);
  });

  it("チップ15%の金額を計算する", () => {
    expect(calcTipAmount(20000, 15)).toBe(3000);
  });

  it("0円のチップは0円", () => {
    expect(calcTipAmount(0, 10)).toBe(0);
  });
});

describe("calcGrandTotal", () => {
  it("チップ10%で合計金額を計算する", () => {
    expect(calcGrandTotal(10000, 10)).toBe(11000);
  });

  it("チップ0%の合計金額は元の金額と同じ", () => {
    expect(calcGrandTotal(10000, 0)).toBe(10000);
  });

  it("チップ20%で合計金額を計算する", () => {
    expect(calcGrandTotal(5000, 20)).toBe(6000);
  });
});

describe("calcPerPersonCeil", () => {
  it("4人で15,000円を割り勘する（切り上げ）", () => {
    expect(calcPerPersonCeil(15000, 4)).toBe(3750);
  });

  it("割り切れない場合は切り上げる", () => {
    expect(calcPerPersonCeil(10001, 3)).toBe(3334);
  });

  it("2人で1,000円を割り勘する", () => {
    expect(calcPerPersonCeil(1000, 2)).toBe(500);
  });

  it("3人で1,000円を割り勘する（切り上げ）", () => {
    expect(calcPerPersonCeil(1000, 3)).toBe(334);
  });
});

describe("calcPerPersonFloor", () => {
  it("4人で15,000円を割り勘する（切り捨て）", () => {
    expect(calcPerPersonFloor(15000, 4)).toBe(3750);
  });

  it("割り切れない場合は切り捨てる", () => {
    expect(calcPerPersonFloor(10001, 3)).toBe(3333);
  });

  it("3人で1,000円を割り勘する（切り捨て）", () => {
    expect(calcPerPersonFloor(1000, 3)).toBe(333);
  });
});

describe("calcRemainder", () => {
  it("割り切れる場合は端数なし", () => {
    expect(calcRemainder(15000, 4)).toBe(0);
  });

  it("端数1円の計算", () => {
    expect(calcRemainder(10, 3)).toBe(1);
  });

  it("端数2円の計算", () => {
    expect(calcRemainder(11, 3)).toBe(2);
  });
});

describe("calcWarikan", () => {
  it("基本的な割り勘を計算する", () => {
    const result = calcWarikan({ totalAmount: 15000, people: 4, tipRate: 0 });
    expect(result).not.toBeNull();
    expect(result!.grandTotal).toBe(15000);
    expect(result!.tipAmount).toBe(0);
    expect(result!.perPersonCeil).toBe(3750);
    expect(result!.perPersonFloor).toBe(3750);
  });

  it("チップありの割り勘を計算する", () => {
    const result = calcWarikan({ totalAmount: 10000, people: 2, tipRate: 10 });
    expect(result).not.toBeNull();
    expect(result!.grandTotal).toBe(11000);
    expect(result!.tipAmount).toBe(1000);
    expect(result!.perPersonCeil).toBe(5500);
  });

  it("割り切れない割り勘を計算する", () => {
    const result = calcWarikan({ totalAmount: 10000, people: 3, tipRate: 0 });
    expect(result).not.toBeNull();
    expect(result!.perPersonCeil).toBe(3334);
    expect(result!.perPersonFloor).toBe(3333);
    expect(result!.remainder).toBe(1);
  });

  it("合計金額が0の場合は0円", () => {
    const result = calcWarikan({ totalAmount: 0, people: 3, tipRate: 0 });
    expect(result).not.toBeNull();
    expect(result!.perPersonCeil).toBe(0);
    expect(result!.grandTotal).toBe(0);
  });

  it("人数が2未満の場合はnullを返す", () => {
    expect(calcWarikan({ totalAmount: 1000, people: 1, tipRate: 0 })).toBeNull();
  });

  it("合計金額が負の場合はnullを返す", () => {
    expect(calcWarikan({ totalAmount: -100, people: 3, tipRate: 0 })).toBeNull();
  });

  it("チップ率が負の場合はnullを返す", () => {
    expect(calcWarikan({ totalAmount: 1000, people: 3, tipRate: -5 })).toBeNull();
  });

  it("NaNの入力はnullを返す", () => {
    expect(
      calcWarikan({ totalAmount: NaN, people: 3, tipRate: 0 })
    ).toBeNull();
  });
});

describe("formatYenWarikan", () => {
  it("1000を「1,000」と整形する", () => {
    expect(formatYenWarikan(1000)).toBe("1,000");
  });

  it("0を「0」と整形する", () => {
    expect(formatYenWarikan(0)).toBe("0");
  });

  it("1234567を「1,234,567」と整形する", () => {
    expect(formatYenWarikan(1234567)).toBe("1,234,567");
  });

  it("Infinityは「計算不能」を返す", () => {
    expect(formatYenWarikan(Infinity)).toBe("計算不能");
  });

  it("NaNは「計算不能」を返す", () => {
    expect(formatYenWarikan(NaN)).toBe("計算不能");
  });
});
