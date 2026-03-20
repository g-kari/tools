import { describe, it, expect } from "vitest";
import {
  calcTaxIncluded,
  calcTaxAmount,
  calcTaxExcluded,
  calcTaxAmountFromIncluded,
  formatYen,
} from "../../app/utils/tax-calculator";

describe("calcTaxIncluded", () => {
  it("税率10%で税込価格を計算する", () => {
    expect(calcTaxIncluded(1000, 10)).toBe(1100);
  });

  it("税率8%で税込価格を計算する", () => {
    expect(calcTaxIncluded(1000, 8)).toBe(1080);
  });

  it("0円の税込価格は0円", () => {
    expect(calcTaxIncluded(0, 10)).toBe(0);
  });

  it("小数点を含む価格を計算する", () => {
    expect(calcTaxIncluded(100.5, 10)).toBeCloseTo(110.55, 5);
  });

  it("大きな金額でも正確に計算する", () => {
    expect(calcTaxIncluded(100000, 10)).toBeCloseTo(110000, 5);
  });
});

describe("calcTaxAmount", () => {
  it("税率10%の消費税額を計算する", () => {
    expect(calcTaxAmount(1000, 10)).toBe(100);
  });

  it("税率8%の消費税額を計算する", () => {
    expect(calcTaxAmount(1000, 8)).toBe(80);
  });

  it("0円の消費税額は0円", () => {
    expect(calcTaxAmount(0, 10)).toBe(0);
  });

  it("50円の10%消費税額は5円", () => {
    expect(calcTaxAmount(50, 10)).toBe(5);
  });

  it("3円の8%消費税額を計算する", () => {
    expect(calcTaxAmount(3, 8)).toBeCloseTo(0.24, 5);
  });
});

describe("calcTaxExcluded", () => {
  it("税率10%で税抜価格を計算する", () => {
    expect(calcTaxExcluded(1100, 10)).toBeCloseTo(1000, 5);
  });

  it("税率8%で税抜価格を計算する", () => {
    expect(calcTaxExcluded(1080, 8)).toBeCloseTo(1000, 5);
  });

  it("0円の税抜価格は0円", () => {
    expect(calcTaxExcluded(0, 10)).toBe(0);
  });

  it("税込2,200円（10%）の税抜価格は2,000円", () => {
    expect(calcTaxExcluded(2200, 10)).toBeCloseTo(2000, 5);
  });

  it("税込2,160円（8%）の税抜価格は2,000円", () => {
    expect(calcTaxExcluded(2160, 8)).toBeCloseTo(2000, 5);
  });
});

describe("calcTaxAmountFromIncluded", () => {
  it("税率10%の税込価格から消費税額を計算する", () => {
    expect(calcTaxAmountFromIncluded(1100, 10)).toBeCloseTo(100, 5);
  });

  it("税率8%の税込価格から消費税額を計算する", () => {
    expect(calcTaxAmountFromIncluded(1080, 8)).toBeCloseTo(80, 5);
  });

  it("0円の内税消費税額は0円", () => {
    expect(calcTaxAmountFromIncluded(0, 10)).toBe(0);
  });

  it("税込2,200円（10%）の消費税額は200円", () => {
    expect(calcTaxAmountFromIncluded(2200, 10)).toBeCloseTo(200, 5);
  });
});

describe("formatYen", () => {
  it("1000を「1,000」と整形する", () => {
    expect(formatYen(1000)).toBe("1,000");
  });

  it("1234567を「1,234,567」と整形する", () => {
    expect(formatYen(1234567)).toBe("1,234,567");
  });

  it("0を「0」と整形する", () => {
    expect(formatYen(0)).toBe("0");
  });

  it("小数点以下を指定桁数で整形する", () => {
    expect(formatYen(100.5, 1)).toBe("100.5");
  });

  it("Infinityは「計算不能」を返す", () => {
    expect(formatYen(Infinity)).toBe("計算不能");
  });

  it("NaNは「計算不能」を返す", () => {
    expect(formatYen(NaN)).toBe("計算不能");
  });
});
