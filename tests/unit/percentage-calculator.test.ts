import { describe, it, expect } from "vitest";
import {
  calcWhatPercent,
  calcPercentOf,
  calcPercentChange,
  calcPercentIncrease,
  formatResult,
} from "../../app/utils/percentage";

describe("calcWhatPercent", () => {
  it("50はの100の50%", () => {
    expect(calcWhatPercent(50, 100)).toBe(50);
  });

  it("25は200の12.5%", () => {
    expect(calcWhatPercent(25, 200)).toBe(12.5);
  });

  it("100は100の100%", () => {
    expect(calcWhatPercent(100, 100)).toBe(100);
  });

  it("0は100の0%", () => {
    expect(calcWhatPercent(0, 100)).toBe(0);
  });

  it("200は100の200%", () => {
    expect(calcWhatPercent(200, 100)).toBe(200);
  });

  it("分母がゼロの場合はnullを返す", () => {
    expect(calcWhatPercent(50, 0)).toBeNull();
  });

  it("負の値でも計算される", () => {
    expect(calcWhatPercent(-50, 100)).toBe(-50);
  });

  it("小数の計算が正しく行われる", () => {
    expect(calcWhatPercent(1, 3)).toBeCloseTo(33.33, 1);
  });
});

describe("calcPercentOf", () => {
  it("100の50%は50", () => {
    expect(calcPercentOf(100, 50)).toBe(50);
  });

  it("200の25%は50", () => {
    expect(calcPercentOf(200, 25)).toBe(50);
  });

  it("100の100%は100", () => {
    expect(calcPercentOf(100, 100)).toBe(100);
  });

  it("100の0%は0", () => {
    expect(calcPercentOf(100, 0)).toBe(0);
  });

  it("100の150%は150", () => {
    expect(calcPercentOf(100, 150)).toBe(150);
  });

  it("0のY%は常に0", () => {
    expect(calcPercentOf(0, 50)).toBe(0);
  });

  it("小数のパーセンテージが正しく計算される", () => {
    expect(calcPercentOf(100, 33.33)).toBeCloseTo(33.33, 1);
  });

  it("負のベース値に対しても計算される", () => {
    expect(calcPercentOf(-100, 50)).toBe(-50);
  });
});

describe("calcPercentChange", () => {
  it("100から200への変化率は100%", () => {
    expect(calcPercentChange(100, 200)).toBe(100);
  });

  it("100から50への変化率は-50%", () => {
    expect(calcPercentChange(100, 50)).toBe(-50);
  });

  it("100から100への変化率は0%", () => {
    expect(calcPercentChange(100, 100)).toBe(0);
  });

  it("100から0への変化率は-100%", () => {
    expect(calcPercentChange(100, 0)).toBe(-100);
  });

  it("元の値がゼロの場合はnullを返す", () => {
    expect(calcPercentChange(0, 100)).toBeNull();
  });

  it("負の値から正への変化率が計算される", () => {
    // -100 → 0: ((0-(-100)) / |-100|) * 100 = 100
    expect(calcPercentChange(-100, 0)).toBe(100);
  });

  it("小数の変化率が正しく計算される", () => {
    expect(calcPercentChange(200, 250)).toBe(25);
  });
});

describe("calcPercentIncrease", () => {
  it("100を50%増加させると150", () => {
    expect(calcPercentIncrease(100, 50)).toBe(150);
  });

  it("100を100%増加させると200", () => {
    expect(calcPercentIncrease(100, 100)).toBe(200);
  });

  it("100を0%変化させると100のまま", () => {
    expect(calcPercentIncrease(100, 0)).toBe(100);
  });

  it("100を50%減少させると50（負のパーセント）", () => {
    expect(calcPercentIncrease(100, -50)).toBe(50);
  });

  it("100を100%減少させると0", () => {
    expect(calcPercentIncrease(100, -100)).toBe(0);
  });

  it("200を25%増加させると250", () => {
    expect(calcPercentIncrease(200, 25)).toBe(250);
  });

  it("負のベース値でも計算される", () => {
    expect(calcPercentIncrease(-100, 50)).toBe(-150);
  });
});

describe("formatResult", () => {
  it("整数は末尾ゼロなしでフォーマットされる", () => {
    const result = formatResult(100);
    expect(result).not.toContain(".0");
  });

  it("小数は末尾ゼロが除去される", () => {
    const result = formatResult(33.3333333333);
    expect(result).not.toMatch(/0+$/);
  });

  it("Infinityは「計算不能」を返す", () => {
    expect(formatResult(Infinity)).toBe("計算不能");
  });

  it("-Infinityは「計算不能」を返す", () => {
    expect(formatResult(-Infinity)).toBe("計算不能");
  });

  it("NaNは「計算不能」を返す", () => {
    expect(formatResult(NaN)).toBe("計算不能");
  });

  it("maxDecimalsを指定して丸めが行われる", () => {
    // 小数点以下2桁に制限
    const result = formatResult(1.23456789, 2);
    // ja-JPロケールでは1.23のような形式になる
    expect(result).toContain("1.23");
    expect(result).not.toContain("1.234");
  });

  it("ゼロは0としてフォーマットされる", () => {
    const result = formatResult(0);
    expect(result).toBe("0");
  });

  it("1000単位の区切り文字が含まれる（ja-JPロケール）", () => {
    const result = formatResult(1000000);
    // ja-JPロケールでは 1,000,000 のようになる
    expect(result).toContain(",");
  });
});
