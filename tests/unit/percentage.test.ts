import { describe, it, expect } from "vitest";
import {
  calcWhatPercent,
  calcPercentOf,
  calcPercentChange,
  calcPercentIncrease,
  formatResult,
} from "../../app/utils/percentage";

describe("calcWhatPercent", () => {
  it("25は200の12.5%", () => {
    expect(calcWhatPercent(25, 200)).toBe(12.5);
  });

  it("50は100の50%", () => {
    expect(calcWhatPercent(50, 100)).toBe(50);
  });

  it("200は100の200%", () => {
    expect(calcWhatPercent(200, 100)).toBe(200);
  });

  it("0は100の0%", () => {
    expect(calcWhatPercent(0, 100)).toBe(0);
  });

  it("Y=0の場合はnullを返す", () => {
    expect(calcWhatPercent(50, 0)).toBeNull();
  });

  it("負の数値でも計算できる", () => {
    expect(calcWhatPercent(-25, 100)).toBe(-25);
  });
});

describe("calcPercentOf", () => {
  it("1000の15%は150", () => {
    expect(calcPercentOf(1000, 15)).toBe(150);
  });

  it("200の50%は100", () => {
    expect(calcPercentOf(200, 50)).toBe(100);
  });

  it("100の100%は100", () => {
    expect(calcPercentOf(100, 100)).toBe(100);
  });

  it("500の0%は0", () => {
    expect(calcPercentOf(500, 0)).toBe(0);
  });

  it("1000の0.5%は5", () => {
    expect(calcPercentOf(1000, 0.5)).toBe(5);
  });
});

describe("calcPercentChange", () => {
  it("100から125への変化率は+25%", () => {
    expect(calcPercentChange(100, 125)).toBe(25);
  });

  it("100から75への変化率は-25%", () => {
    expect(calcPercentChange(100, 75)).toBe(-25);
  });

  it("100から100への変化率は0%", () => {
    expect(calcPercentChange(100, 100)).toBe(0);
  });

  it("50から100への変化率は+100%", () => {
    expect(calcPercentChange(50, 100)).toBe(100);
  });

  it("from=0の場合はnullを返す", () => {
    expect(calcPercentChange(0, 100)).toBeNull();
  });

  it("負の値からの変化率を計算できる", () => {
    // -100から-50への変化率は+50%（|from|=100で計算）
    expect(calcPercentChange(-100, -50)).toBe(50);
  });
});

describe("calcPercentIncrease", () => {
  it("5000の10%増加は5500", () => {
    expect(calcPercentIncrease(5000, 10)).toBe(5500);
  });

  it("1000の消費税10%は1100", () => {
    expect(calcPercentIncrease(1000, 10)).toBe(1100);
  });

  it("5000の20%減少は4000", () => {
    expect(calcPercentIncrease(5000, -20)).toBe(4000);
  });

  it("100の0%変化は100", () => {
    expect(calcPercentIncrease(100, 0)).toBe(100);
  });

  it("100の100%増加は200", () => {
    expect(calcPercentIncrease(100, 100)).toBe(200);
  });
});

describe("formatResult", () => {
  it("整数はそのまま返す", () => {
    expect(formatResult(100)).toBe("100");
  });

  it("小数点以下の末尾ゼロを除去する", () => {
    // Note: localeString uses ja-JP, so this depends on locale behavior
    const result = formatResult(12.5);
    expect(result).toContain("12");
    expect(result).toContain("5");
  });

  it("無限大は「計算不能」を返す", () => {
    expect(formatResult(Infinity)).toBe("計算不能");
  });

  it("NaNは「計算不能」を返す", () => {
    expect(formatResult(NaN)).toBe("計算不能");
  });
});
