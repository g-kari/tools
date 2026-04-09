/**
 * 統計計算ユーティリティ テスト
 */
import { describe, it, expect } from "vite-plus/test";
import {
  parseNumbers,
  calculateStatistics,
  calculateFrequencyDistribution,
  formatNum,
} from "../../app/utils/statistics";

describe("parseNumbers", () => {
  it("カンマ区切りをパースする", () => {
    expect(parseNumbers("1, 2, 3")).toEqual([1, 2, 3]);
  });

  it("改行区切りをパースする", () => {
    expect(parseNumbers("1\n2\n3")).toEqual([1, 2, 3]);
  });

  it("スペース区切りをパースする", () => {
    expect(parseNumbers("1 2 3")).toEqual([1, 2, 3]);
  });

  it("タブ区切りをパースする", () => {
    expect(parseNumbers("1\t2\t3")).toEqual([1, 2, 3]);
  });

  it("混在区切りをパースする", () => {
    expect(parseNumbers("1, 2\n3\t4")).toEqual([1, 2, 3, 4]);
  });

  it("小数点を含む数値をパースする", () => {
    expect(parseNumbers("1.5, 2.7, 3.1")).toEqual([1.5, 2.7, 3.1]);
  });

  it("負の数をパースする", () => {
    expect(parseNumbers("-1, -2, 3")).toEqual([-1, -2, 3]);
  });

  it("空文字列は空配列を返す", () => {
    expect(parseNumbers("")).toEqual([]);
  });

  it("非数値を除外する", () => {
    expect(parseNumbers("1, abc, 3")).toEqual([1, 3]);
  });
});

describe("calculateStatistics", () => {
  it("空配列は null を返す", () => {
    expect(calculateStatistics([])).toBeNull();
  });

  it("1件のデータを計算する", () => {
    const r = calculateStatistics([5]);
    expect(r).not.toBeNull();
    expect(r!.count).toBe(1);
    expect(r!.mean).toBe(5);
    expect(r!.median).toBe(5);
    expect(r!.min).toBe(5);
    expect(r!.max).toBe(5);
    expect(r!.range).toBe(0);
    expect(r!.sum).toBe(5);
  });

  it("基本統計量を正しく計算する", () => {
    // Wikipedia の例: [2, 4, 4, 4, 5, 5, 7, 9]
    const r = calculateStatistics([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(r).not.toBeNull();
    expect(r!.count).toBe(8);
    expect(r!.mean).toBe(5);
    expect(r!.min).toBe(2);
    expect(r!.max).toBe(9);
    expect(r!.sum).toBe(40);
  });

  it("中央値を奇数個で計算する", () => {
    const r = calculateStatistics([1, 2, 3, 4, 5]);
    expect(r!.median).toBe(3);
  });

  it("中央値を偶数個で計算する", () => {
    const r = calculateStatistics([1, 2, 3, 4]);
    expect(r!.median).toBe(2.5);
  });

  it("最頻値を計算する", () => {
    const r = calculateStatistics([1, 2, 2, 3, 3, 3]);
    expect(r!.mode).toEqual([3]);
  });

  it("複数の最頻値を計算する", () => {
    const r = calculateStatistics([1, 1, 2, 2, 3]);
    expect(r!.mode).toEqual([1, 2]);
  });

  it("母標準偏差を計算する (Wikipedia 例)", () => {
    // [2, 4, 4, 4, 5, 5, 7, 9] → σ = 2
    const r = calculateStatistics([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(r!.stddevPopulation).toBeCloseTo(2, 5);
  });

  it("四分位数を計算する", () => {
    const r = calculateStatistics([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(r!.q1).toBeCloseTo(2.75, 2);
    expect(r!.q3).toBeCloseTo(6.25, 2);
  });

  it("IQR を計算する", () => {
    const r = calculateStatistics([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(r!.iqr).toBeCloseTo(r!.q3 - r!.q1, 10);
  });

  it("全値が同じ場合の範囲は 0", () => {
    const r = calculateStatistics([5, 5, 5, 5]);
    expect(r!.range).toBe(0);
    expect(r!.variancePopulation).toBe(0);
    expect(r!.stddevPopulation).toBe(0);
  });

  it("幾何平均を計算する", () => {
    // [1, 2, 4] → GM = 2
    const r = calculateStatistics([1, 2, 4]);
    expect(r!.geometricMean).toBeCloseTo(2, 5);
  });

  it("負の値を含む場合は幾何平均が null", () => {
    const r = calculateStatistics([-1, 2, 3]);
    expect(r!.geometricMean).toBeNull();
  });

  it("調和平均を計算する", () => {
    // [1, 2, 4] → HM = 12/7 ≈ 1.714
    const r = calculateStatistics([1, 2, 4]);
    expect(r!.harmonicMean).toBeCloseTo(12 / 7, 5);
  });

  it("0 を含む場合は調和平均が null", () => {
    const r = calculateStatistics([0, 1, 2]);
    expect(r!.harmonicMean).toBeNull();
  });

  it("変動係数を計算する", () => {
    const r = calculateStatistics([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(r!.cv).not.toBeNull();
    // CV = stddevSample / mean * 100
    expect(r!.cv).toBeCloseTo((r!.stddevSample / r!.mean) * 100, 5);
  });

  it("平均が 0 の場合は変動係数が null", () => {
    const r = calculateStatistics([-1, 0, 1]);
    expect(r!.cv).toBeNull();
  });

  it("標本分散を計算する (n-1 補正)", () => {
    // [2, 4, 4, 4, 5, 5, 7, 9] → sumSqDiffs=32, varianceSample=32/7
    const r = calculateStatistics([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(r!.varianceSample).toBeCloseTo(32 / 7, 5);
  });

  it("データが1件の場合は標本分散が 0", () => {
    const r = calculateStatistics([5]);
    expect(r!.varianceSample).toBe(0);
  });

  it("歪度を計算する", () => {
    // 右に裾の長い分布 [1, 1, 1, 2, 10] → 正の歪度
    const r = calculateStatistics([1, 1, 1, 2, 10]);
    expect(r!.skewness).not.toBeNull();
    expect(r!.skewness!).toBeGreaterThan(0);
  });

  it("対称分布は歪度が 0", () => {
    // [1, 2, 3, 4, 5] は対称 → skewness = 0
    const r = calculateStatistics([1, 2, 3, 4, 5]);
    expect(r!.skewness).not.toBeNull();
    expect(r!.skewness!).toBeCloseTo(0, 5);
  });

  it("データが 2 件以下の場合は歪度が null", () => {
    expect(calculateStatistics([1])!.skewness).toBeNull();
    expect(calculateStatistics([1, 2])!.skewness).toBeNull();
  });

  it("全値が同じ場合は歪度が null (stddevSample=0)", () => {
    const r = calculateStatistics([3, 3, 3, 3]);
    expect(r!.skewness).toBeNull();
  });

  it("尖度を計算する", () => {
    // [2, 4, 4, 4, 5, 5, 7, 9] の尖度を検証
    const r = calculateStatistics([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(r!.kurtosis).not.toBeNull();
    // k1 = (8*9)/(7*6*5), k2 = 356/(32/7)^2, k3 = (3*49)/(6*5)
    expect(r!.kurtosis!).toBeCloseTo(0.9406, 3);
  });

  it("データが 3 件以下の場合は尖度が null", () => {
    expect(calculateStatistics([1])!.kurtosis).toBeNull();
    expect(calculateStatistics([1, 2])!.kurtosis).toBeNull();
    expect(calculateStatistics([1, 2, 3])!.kurtosis).toBeNull();
  });

  it("全値が同じ場合は尖度が null (stddevSample=0)", () => {
    const r = calculateStatistics([5, 5, 5, 5]);
    expect(r!.kurtosis).toBeNull();
  });
});

describe("calculateFrequencyDistribution", () => {
  it("空配列は空配列を返す", () => {
    expect(calculateFrequencyDistribution([])).toEqual([]);
  });

  it("全値が同じ場合は 1 ビン", () => {
    const bins = calculateFrequencyDistribution([5, 5, 5]);
    expect(bins).toHaveLength(1);
    expect(bins[0].count).toBe(3);
  });

  it("累積相対度数の最終値が 1", () => {
    const bins = calculateFrequencyDistribution([1, 2, 3, 4, 5, 6, 7, 8]);
    const last = bins[bins.length - 1];
    expect(last.cumulativeRelative).toBeCloseTo(1, 5);
  });

  it("ビン数の合計がデータ件数と一致", () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const bins = calculateFrequencyDistribution(data);
    const total = bins.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(data.length);
  });
});

describe("formatNum", () => {
  it("整数をフォーマットする", () => {
    expect(formatNum(1000)).toBe("1,000");
  });

  it("小数をフォーマットする", () => {
    expect(formatNum(1.2345)).toBe("1.2345");
  });

  it("Infinity を文字列で返す", () => {
    expect(formatNum(Infinity)).toBe("Infinity");
  });

  it("NaN を文字列で返す", () => {
    expect(formatNum(NaN)).toBe("NaN");
  });
});
