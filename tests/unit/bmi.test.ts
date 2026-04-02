import { describe, it, expect } from "vitest";
import {
  calcBmi,
  getBmiCategory,
  calcIdealWeight,
  calcWeightDiff,
  BMI_CATEGORY_LABELS,
  BMI_CATEGORY_RANGES,
} from "../../app/utils/bmi";

describe("calcBmi", () => {
  it("正常な値でBMIが計算される", () => {
    // 身長170cm、体重70kgの場合: 70 / (1.7^2) ≈ 24.22
    const bmi = calcBmi(70, 170);
    expect(bmi).toBeCloseTo(24.22, 1);
  });

  it("身長150cm、体重50kgのBMIが計算される", () => {
    // 50 / (1.5^2) ≈ 22.22
    const bmi = calcBmi(50, 150);
    expect(bmi).toBeCloseTo(22.22, 1);
  });

  it("体重がゼロの場合はNaNを返す", () => {
    expect(calcBmi(0, 170)).toBeNaN();
  });

  it("身長がゼロの場合はNaNを返す", () => {
    expect(calcBmi(70, 0)).toBeNaN();
  });

  it("負の体重はNaNを返す", () => {
    expect(calcBmi(-10, 170)).toBeNaN();
  });

  it("負の身長はNaNを返す", () => {
    expect(calcBmi(70, -170)).toBeNaN();
  });

  it("標準体重（BMI=22）になる組み合わせが正しく計算される", () => {
    // 身長160cm → 標準体重 = 22 * 1.6^2 = 56.32kg
    const bmi = calcBmi(56.32, 160);
    expect(bmi).toBeCloseTo(22, 1);
  });
});

describe("getBmiCategory", () => {
  it("BMI 17 → underweight", () => {
    expect(getBmiCategory(17)).toBe("underweight");
  });

  it("BMI 18.4 → underweight（境界値）", () => {
    expect(getBmiCategory(18.4)).toBe("underweight");
  });

  it("BMI 18.5 → normal（下限境界値）", () => {
    expect(getBmiCategory(18.5)).toBe("normal");
  });

  it("BMI 22 → normal", () => {
    expect(getBmiCategory(22)).toBe("normal");
  });

  it("BMI 24.9 → normal（上限境界値近傍）", () => {
    expect(getBmiCategory(24.9)).toBe("normal");
  });

  it("BMI 25 → overweight（下限境界値）", () => {
    expect(getBmiCategory(25)).toBe("overweight");
  });

  it("BMI 27 → overweight", () => {
    expect(getBmiCategory(27)).toBe("overweight");
  });

  it("BMI 30 → obese1（下限境界値）", () => {
    expect(getBmiCategory(30)).toBe("obese1");
  });

  it("BMI 32 → obese1", () => {
    expect(getBmiCategory(32)).toBe("obese1");
  });

  it("BMI 35 → obese2（下限境界値）", () => {
    expect(getBmiCategory(35)).toBe("obese2");
  });

  it("BMI 37 → obese2", () => {
    expect(getBmiCategory(37)).toBe("obese2");
  });

  it("BMI 40 → obese3（下限境界値）", () => {
    expect(getBmiCategory(40)).toBe("obese3");
  });

  it("BMI 50 → obese3", () => {
    expect(getBmiCategory(50)).toBe("obese3");
  });

  it("Infinityはunderweightを返す", () => {
    expect(getBmiCategory(Infinity)).toBe("underweight");
  });

  it("NaNの場合はunderweightを返す", () => {
    expect(getBmiCategory(NaN)).toBe("underweight");
  });
});

describe("calcIdealWeight", () => {
  it("身長170cmの標準体重はBMI=22で計算される", () => {
    // 22 * (1.7)^2 = 22 * 2.89 = 63.58
    expect(calcIdealWeight(170)).toBeCloseTo(63.58, 1);
  });

  it("身長160cmの標準体重が計算される", () => {
    // 22 * (1.6)^2 = 22 * 2.56 = 56.32
    expect(calcIdealWeight(160)).toBeCloseTo(56.32, 1);
  });

  it("身長180cmの標準体重が計算される", () => {
    // 22 * (1.8)^2 = 22 * 3.24 = 71.28
    expect(calcIdealWeight(180)).toBeCloseTo(71.28, 1);
  });

  it("身長がゼロの場合はNaNを返す", () => {
    expect(calcIdealWeight(0)).toBeNaN();
  });

  it("負の身長はNaNを返す", () => {
    expect(calcIdealWeight(-100)).toBeNaN();
  });
});

describe("calcWeightDiff", () => {
  it("標準体重ちょうどの場合は差分がゼロに近い", () => {
    const ideal = calcIdealWeight(170);
    const diff = calcWeightDiff(ideal, 170);
    expect(diff).toBeCloseTo(0, 5);
  });

  it("体重が標準より多い場合は正の差分を返す", () => {
    const diff = calcWeightDiff(80, 170);
    expect(diff).toBeGreaterThan(0);
  });

  it("体重が標準より少ない場合は負の差分を返す", () => {
    const diff = calcWeightDiff(50, 170);
    expect(diff).toBeLessThan(0);
  });

  it("差分の絶対値が体重と標準体重の差と一致する", () => {
    const ideal = calcIdealWeight(170);
    const weight = 80;
    const diff = calcWeightDiff(weight, 170);
    expect(diff).toBeCloseTo(weight - ideal, 5);
  });
});

describe("BMI_CATEGORY_LABELS", () => {
  it("全カテゴリのラベルが定義されている", () => {
    expect(BMI_CATEGORY_LABELS.underweight).toBe("低体重（痩せ型）");
    expect(BMI_CATEGORY_LABELS.normal).toBe("普通体重");
    expect(BMI_CATEGORY_LABELS.overweight).toBe("前肥満");
    expect(BMI_CATEGORY_LABELS.obese1).toBe("肥満（1度）");
    expect(BMI_CATEGORY_LABELS.obese2).toBe("肥満（2度）");
    expect(BMI_CATEGORY_LABELS.obese3).toBe("肥満（3度以上）");
  });
});

describe("BMI_CATEGORY_RANGES", () => {
  it("underweightの範囲が0〜18.5", () => {
    expect(BMI_CATEGORY_RANGES.underweight.min).toBe(0);
    expect(BMI_CATEGORY_RANGES.underweight.max).toBe(18.5);
  });

  it("normalの範囲が18.5〜25", () => {
    expect(BMI_CATEGORY_RANGES.normal.min).toBe(18.5);
    expect(BMI_CATEGORY_RANGES.normal.max).toBe(25);
  });

  it("obese3の上限はInfinity", () => {
    expect(BMI_CATEGORY_RANGES.obese3.max).toBe(Infinity);
  });
});
