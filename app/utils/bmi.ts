/**
 * BMI（体格指数）計算ユーティリティ
 */

/** BMI判定カテゴリの定義（WHO基準） */
export type BmiCategory =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese1"
  | "obese2"
  | "obese3";

/** BMI判定カテゴリのラベル */
export const BMI_CATEGORY_LABELS: Record<BmiCategory, string> = {
  underweight: "低体重（痩せ型）",
  normal: "普通体重",
  overweight: "前肥満",
  obese1: "肥満（1度）",
  obese2: "肥満（2度）",
  obese3: "肥満（3度以上）",
};

/** BMI判定カテゴリのBMI範囲 */
export const BMI_CATEGORY_RANGES: Record<
  BmiCategory,
  { min: number; max: number }
> = {
  underweight: { min: 0, max: 18.5 },
  normal: { min: 18.5, max: 25 },
  overweight: { min: 25, max: 30 },
  obese1: { min: 30, max: 35 },
  obese2: { min: 35, max: 40 },
  obese3: { min: 40, max: Infinity },
};

/**
 * BMIを計算する
 * @param weightKg - 体重（kg）
 * @param heightCm - 身長（cm）
 * @returns BMI値
 */
export function calcBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return NaN;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * BMI値からカテゴリを判定する（WHO基準）
 * @param bmi - BMI値（NaN や Infinity は "underweight" を返す）
 * @returns BMIカテゴリ
 */
export function getBmiCategory(bmi: number): BmiCategory {
  if (!isFinite(bmi)) return "underweight";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  if (bmi < 35) return "obese1";
  if (bmi < 40) return "obese2";
  return "obese3";
}

/**
 * 標準体重を計算する（BMI=22を基準）
 * @param heightCm - 身長（cm）
 * @returns 標準体重（kg）
 */
export function calcIdealWeight(heightCm: number): number {
  if (heightCm <= 0) return NaN;
  const heightM = heightCm / 100;
  return 22 * heightM * heightM;
}

/**
 * 標準体重との差分を計算する
 * @param weightKg - 現在の体重（kg）
 * @param heightCm - 身長（cm）
 * @returns 標準体重との差分（kg）。正の値は過体重、負の値は低体重を示す
 */
export function calcWeightDiff(weightKg: number, heightCm: number): number {
  const ideal = calcIdealWeight(heightCm);
  return weightKg - ideal;
}
