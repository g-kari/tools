/**
 * 統計計算ユーティリティ関数
 * 記述統計（平均・中央値・最頻値・分散・標準偏差・四分位数など）を計算
 */

/** 統計計算結果 */
export interface StatisticsResult {
  /** データ件数 */
  count: number;
  /** 合計 */
  sum: number;
  /** 算術平均 */
  mean: number;
  /** 中央値 */
  median: number;
  /** 最頻値（複数の場合あり） */
  mode: number[];
  /** 最小値 */
  min: number;
  /** 最大値 */
  max: number;
  /** 範囲 (max - min) */
  range: number;
  /** 第1四分位数 (Q1) */
  q1: number;
  /** 第3四分位数 (Q3) */
  q3: number;
  /** 四分位範囲 (IQR = Q3 - Q1) */
  iqr: number;
  /** 標本分散 (n-1) */
  varianceSample: number;
  /** 母分散 (n) */
  variancePopulation: number;
  /** 標本標準偏差 (n-1) */
  stddevSample: number;
  /** 母標準偏差 (n) */
  stddevPopulation: number;
  /** 歪度 (Skewness) */
  skewness: number | null;
  /** 尖度 (Kurtosis, excess) */
  kurtosis: number | null;
  /** 変動係数 (CV = stddev / mean) */
  cv: number | null;
  /** 幾何平均 (正の値のみ) */
  geometricMean: number | null;
  /** 調和平均 (0 以外の値のみ) */
  harmonicMean: number | null;
}

/** 度数分布のビン */
export interface FrequencyBin {
  /** ビンの下限 */
  lower: number;
  /** ビンの上限 */
  upper: number;
  /** ラベル */
  label: string;
  /** 度数 */
  count: number;
  /** 相対度数 */
  relative: number;
  /** 累積度数 */
  cumulative: number;
  /** 累積相対度数 */
  cumulativeRelative: number;
}

/**
 * 数値の配列をパースする
 * カンマ・スペース・タブ・改行区切りに対応
 * @param input - 入力テキスト
 * @returns パースした数値配列（パース失敗した行は除外）
 */
export function parseNumbers(input: string): number[] {
  if (!input.trim()) return [];
  return input
    .split(/[\s,;\t\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => parseFloat(s))
    .filter((n) => !isNaN(n));
}

/**
 * ソート済み配列からパーセンタイル値を計算する (線形補間)
 * @param sorted - ソート済み数値配列
 * @param p - パーセンタイル (0-100)
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const frac = index - lower;
  return sorted[lower] * (1 - frac) + sorted[upper] * frac;
}

/**
 * 記述統計を計算する
 * @param numbers - 数値配列
 * @returns 統計結果、空配列の場合は null
 */
export function calculateStatistics(numbers: number[]): StatisticsResult | null {
  if (numbers.length === 0) return null;

  const n = numbers.length;
  const sorted = [...numbers].sort((a, b) => a - b);

  // 合計・平均
  const sum = numbers.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // 中央値
  const median = percentile(sorted, 50);

  // 最頻値
  const freq = new Map<number, number>();
  for (const v of numbers) {
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  const maxFreq = Math.max(...freq.values());
  const mode = [...freq.entries()]
    .filter(([, c]) => c === maxFreq)
    .map(([v]) => v)
    .sort((a, b) => a - b);

  // 最小・最大・範囲
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  // 四分位数
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;

  // 分散
  const meanDiffs = numbers.map((v) => v - mean);
  const sumSqDiffs = meanDiffs.reduce((acc, d) => acc + d * d, 0);
  const variancePopulation = sumSqDiffs / n;
  const varianceSample = n > 1 ? sumSqDiffs / (n - 1) : 0;
  const stddevPopulation = Math.sqrt(variancePopulation);
  const stddevSample = Math.sqrt(varianceSample);

  // 歪度 (Sample skewness)
  let skewness: number | null = null;
  if (n >= 3 && stddevSample > 0) {
    const cubedDiffs = meanDiffs.reduce((acc, d) => acc + d ** 3, 0);
    skewness =
      (n / ((n - 1) * (n - 2))) * (cubedDiffs / stddevSample ** 3);
  }

  // 尖度 (Excess kurtosis, sample)
  let kurtosis: number | null = null;
  if (n >= 4 && stddevSample > 0) {
    const fourthDiffs = meanDiffs.reduce((acc, d) => acc + d ** 4, 0);
    const k1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    const k2 = fourthDiffs / stddevSample ** 4;
    const k3 = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
    kurtosis = k1 * k2 - k3;
  }

  // 変動係数
  const cv = mean !== 0 ? (stddevSample / Math.abs(mean)) * 100 : null;

  // 幾何平均 (正の値のみ)
  let geometricMean: number | null = null;
  if (numbers.every((v) => v > 0)) {
    const logSum = numbers.reduce((acc, v) => acc + Math.log(v), 0);
    geometricMean = Math.exp(logSum / n);
  }

  // 調和平均 (0 以外のみ)
  let harmonicMean: number | null = null;
  if (numbers.every((v) => v !== 0)) {
    const reciprocalSum = numbers.reduce((acc, v) => acc + 1 / v, 0);
    harmonicMean = n / reciprocalSum;
  }

  return {
    count: n,
    sum,
    mean,
    median,
    mode,
    min,
    max,
    range,
    q1,
    q3,
    iqr,
    varianceSample,
    variancePopulation,
    stddevSample,
    stddevPopulation,
    skewness,
    kurtosis,
    cv,
    geometricMean,
    harmonicMean,
  };
}

/**
 * 度数分布を計算する (スタージェスの公式でビン数を決定)
 * @param numbers - 数値配列
 * @param bins - ビン数 (省略時はスタージェスの公式)
 * @returns 度数分布のビン配列
 */
export function calculateFrequencyDistribution(
  numbers: number[],
  bins?: number
): FrequencyBin[] {
  if (numbers.length === 0) return [];

  const sorted = [...numbers].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (min === max) {
    return [
      {
        lower: min,
        upper: max,
        label: String(min),
        count: numbers.length,
        relative: 1,
        cumulative: numbers.length,
        cumulativeRelative: 1,
      },
    ];
  }

  // スタージェスの公式: k = ceil(log2(n)) + 1
  const k = bins ?? Math.ceil(Math.log2(numbers.length)) + 1;
  const binWidth = (max - min) / k;

  const result: FrequencyBin[] = Array.from({ length: k }, (_, i) => {
    const lower = min + i * binWidth;
    const upper = min + (i + 1) * binWidth;
    return {
      lower,
      upper,
      label: `${formatNum(lower)} – ${formatNum(upper)}`,
      count: 0,
      relative: 0,
      cumulative: 0,
      cumulativeRelative: 0,
    };
  });

  // 各データをビンに割り当て
  for (const v of numbers) {
    const idx = Math.min(Math.floor((v - min) / binWidth), k - 1);
    result[idx].count++;
  }

  // 相対度数・累積度数を計算
  let cumulative = 0;
  for (const bin of result) {
    bin.relative = bin.count / numbers.length;
    cumulative += bin.count;
    bin.cumulative = cumulative;
    bin.cumulativeRelative = cumulative / numbers.length;
  }

  return result;
}

/**
 * 数値を見やすい形式にフォーマットする
 * @param v - 数値
 * @param digits - 小数点以下の桁数 (デフォルト: 4)
 */
export function formatNum(v: number, digits = 4): string {
  if (!isFinite(v)) return String(v);
  // 整数かチェック
  if (Number.isInteger(v)) return v.toLocaleString();
  return parseFloat(v.toFixed(digits)).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}
