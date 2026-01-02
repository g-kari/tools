/**
 * 単位変換ユーティリティ
 * 各種単位の相互変換機能を提供
 */

/** 単位カテゴリの型定義 */
export type UnitCategory =
  | "length"
  | "weight"
  | "temperature"
  | "dataSize"
  | "area"
  | "volume"
  | "speed"
  | "time";

/** 単位の定義 */
export interface UnitDefinition {
  /** 単位のID */
  id: string;
  /** 表示名 */
  name: string;
  /** 略称 */
  symbol: string;
  /** 基準単位への変換係数（基準単位を1とした場合の値） */
  toBase: number;
  /** 加算オフセット（温度変換用） */
  offset?: number;
}

/** カテゴリの定義 */
export interface CategoryDefinition {
  /** カテゴリID */
  id: UnitCategory;
  /** 表示名 */
  name: string;
  /** 基準単位のID */
  baseUnit: string;
  /** 単位一覧 */
  units: UnitDefinition[];
}

/**
 * 長さの単位定義
 * 基準単位: メートル (m)
 */
const lengthUnits: UnitDefinition[] = [
  { id: "m", name: "メートル", symbol: "m", toBase: 1 },
  { id: "km", name: "キロメートル", symbol: "km", toBase: 1000 },
  { id: "cm", name: "センチメートル", symbol: "cm", toBase: 0.01 },
  { id: "mm", name: "ミリメートル", symbol: "mm", toBase: 0.001 },
  { id: "mi", name: "マイル", symbol: "mi", toBase: 1609.344 },
  { id: "yd", name: "ヤード", symbol: "yd", toBase: 0.9144 },
  { id: "ft", name: "フィート", symbol: "ft", toBase: 0.3048 },
  { id: "in", name: "インチ", symbol: "in", toBase: 0.0254 },
];

/**
 * 重さの単位定義
 * 基準単位: グラム (g)
 */
const weightUnits: UnitDefinition[] = [
  { id: "g", name: "グラム", symbol: "g", toBase: 1 },
  { id: "kg", name: "キログラム", symbol: "kg", toBase: 1000 },
  { id: "t", name: "トン", symbol: "t", toBase: 1000000 },
  { id: "lb", name: "ポンド", symbol: "lb", toBase: 453.59237 },
  { id: "oz", name: "オンス", symbol: "oz", toBase: 28.349523125 },
];

/**
 * 温度の単位定義
 * 基準単位: 摂氏 (°C)
 * 温度変換は特殊で、係数とオフセットを使用
 * fromBase: (baseValue * toBase) + offset = targetValue
 * toBase: (targetValue - offset) / toBase = baseValue
 */
const temperatureUnits: UnitDefinition[] = [
  { id: "c", name: "摂氏", symbol: "°C", toBase: 1, offset: 0 },
  { id: "f", name: "華氏", symbol: "°F", toBase: 1.8, offset: 32 },
  { id: "k", name: "ケルビン", symbol: "K", toBase: 1, offset: 273.15 },
];

/**
 * データサイズの単位定義（1024進数）
 * 基準単位: バイト (B)
 */
const dataSizeUnits: UnitDefinition[] = [
  { id: "b", name: "バイト", symbol: "B", toBase: 1 },
  { id: "kb", name: "キロバイト", symbol: "KB", toBase: 1024 },
  { id: "mb", name: "メガバイト", symbol: "MB", toBase: 1024 ** 2 },
  { id: "gb", name: "ギガバイト", symbol: "GB", toBase: 1024 ** 3 },
  { id: "tb", name: "テラバイト", symbol: "TB", toBase: 1024 ** 4 },
  { id: "pb", name: "ペタバイト", symbol: "PB", toBase: 1024 ** 5 },
  { id: "kib", name: "キビバイト (KiB)", symbol: "KiB", toBase: 1024 },
  { id: "mib", name: "メビバイト (MiB)", symbol: "MiB", toBase: 1024 ** 2 },
  { id: "gib", name: "ギビバイト (GiB)", symbol: "GiB", toBase: 1024 ** 3 },
  { id: "tib", name: "テビバイト (TiB)", symbol: "TiB", toBase: 1024 ** 4 },
  { id: "kb1000", name: "キロバイト (1000)", symbol: "kB", toBase: 1000 },
  { id: "mb1000", name: "メガバイト (1000)", symbol: "MB", toBase: 1000 ** 2 },
  { id: "gb1000", name: "ギガバイト (1000)", symbol: "GB", toBase: 1000 ** 3 },
  { id: "tb1000", name: "テラバイト (1000)", symbol: "TB", toBase: 1000 ** 4 },
];

/**
 * 面積の単位定義
 * 基準単位: 平方メートル (m²)
 */
const areaUnits: UnitDefinition[] = [
  { id: "sqm", name: "平方メートル", symbol: "m²", toBase: 1 },
  { id: "sqkm", name: "平方キロメートル", symbol: "km²", toBase: 1000000 },
  { id: "ha", name: "ヘクタール", symbol: "ha", toBase: 10000 },
  { id: "a", name: "アール", symbol: "a", toBase: 100 },
  { id: "tsubo", name: "坪", symbol: "坪", toBase: 3.305785 },
  { id: "jo", name: "畳", symbol: "畳", toBase: 1.6529 },
  { id: "sqft", name: "平方フィート", symbol: "ft²", toBase: 0.092903 },
  { id: "sqin", name: "平方インチ", symbol: "in²", toBase: 0.00064516 },
  { id: "acre", name: "エーカー", symbol: "acre", toBase: 4046.8564224 },
];

/**
 * 体積の単位定義
 * 基準単位: リットル (L)
 */
const volumeUnits: UnitDefinition[] = [
  { id: "l", name: "リットル", symbol: "L", toBase: 1 },
  { id: "ml", name: "ミリリットル", symbol: "mL", toBase: 0.001 },
  { id: "cbm", name: "立方メートル", symbol: "m³", toBase: 1000 },
  { id: "gal", name: "ガロン (US)", symbol: "gal", toBase: 3.785411784 },
  { id: "gal_uk", name: "ガロン (UK)", symbol: "gal", toBase: 4.54609 },
  { id: "cup", name: "カップ (US)", symbol: "cup", toBase: 0.2365882365 },
  { id: "floz", name: "液量オンス (US)", symbol: "fl oz", toBase: 0.0295735295625 },
  { id: "tbsp", name: "大さじ", symbol: "tbsp", toBase: 0.015 },
  { id: "tsp", name: "小さじ", symbol: "tsp", toBase: 0.005 },
];

/**
 * 速度の単位定義
 * 基準単位: メートル毎秒 (m/s)
 */
const speedUnits: UnitDefinition[] = [
  { id: "ms", name: "メートル毎秒", symbol: "m/s", toBase: 1 },
  { id: "kmh", name: "キロメートル毎時", symbol: "km/h", toBase: 1 / 3.6 },
  { id: "mph", name: "マイル毎時", symbol: "mph", toBase: 0.44704 },
  { id: "kt", name: "ノット", symbol: "kt", toBase: 0.514444 },
  { id: "fps", name: "フィート毎秒", symbol: "ft/s", toBase: 0.3048 },
];

/**
 * 時間の単位定義
 * 基準単位: 秒 (s)
 */
const timeUnits: UnitDefinition[] = [
  { id: "s", name: "秒", symbol: "s", toBase: 1 },
  { id: "ms", name: "ミリ秒", symbol: "ms", toBase: 0.001 },
  { id: "min", name: "分", symbol: "min", toBase: 60 },
  { id: "h", name: "時間", symbol: "h", toBase: 3600 },
  { id: "d", name: "日", symbol: "d", toBase: 86400 },
  { id: "w", name: "週", symbol: "w", toBase: 604800 },
  { id: "mo", name: "月 (30日)", symbol: "mo", toBase: 2592000 },
  { id: "y", name: "年 (365日)", symbol: "y", toBase: 31536000 },
];

/** 全カテゴリの定義 */
export const UNIT_CATEGORIES: CategoryDefinition[] = [
  { id: "length", name: "長さ", baseUnit: "m", units: lengthUnits },
  { id: "weight", name: "重さ", baseUnit: "g", units: weightUnits },
  { id: "temperature", name: "温度", baseUnit: "c", units: temperatureUnits },
  { id: "dataSize", name: "データサイズ", baseUnit: "b", units: dataSizeUnits },
  { id: "area", name: "面積", baseUnit: "sqm", units: areaUnits },
  { id: "volume", name: "体積", baseUnit: "l", units: volumeUnits },
  { id: "speed", name: "速度", baseUnit: "ms", units: speedUnits },
  { id: "time", name: "時間", baseUnit: "s", units: timeUnits },
];

/**
 * 指定されたカテゴリの単位一覧を取得
 * @param categoryId - カテゴリID
 * @returns 単位一覧、存在しない場合は空配列
 */
export function getUnitsForCategory(categoryId: UnitCategory): UnitDefinition[] {
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  return category?.units ?? [];
}

/**
 * 単位変換を実行
 * @param value - 変換する値
 * @param fromUnitId - 変換元の単位ID
 * @param toUnitId - 変換先の単位ID
 * @param categoryId - カテゴリID
 * @returns 変換後の値、変換できない場合はnull
 */
export function convertUnit(
  value: number,
  fromUnitId: string,
  toUnitId: string,
  categoryId: UnitCategory
): number | null {
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return null;

  const fromUnit = category.units.find((u) => u.id === fromUnitId);
  const toUnit = category.units.find((u) => u.id === toUnitId);

  if (!fromUnit || !toUnit) return null;

  // 温度の場合は特殊処理
  if (categoryId === "temperature") {
    return convertTemperature(value, fromUnit, toUnit);
  }

  // 一般的な変換: まず基準単位に変換し、その後目標単位に変換
  const baseValue = value * fromUnit.toBase;
  const result = baseValue / toUnit.toBase;

  return result;
}

/**
 * 温度変換を実行
 * @param value - 変換する値
 * @param fromUnit - 変換元の単位定義
 * @param toUnit - 変換先の単位定義
 * @returns 変換後の値
 */
function convertTemperature(
  value: number,
  fromUnit: UnitDefinition,
  toUnit: UnitDefinition
): number {
  // まず摂氏に変換
  let celsius: number;
  const fromOffset = fromUnit.offset ?? 0;
  const toOffset = toUnit.offset ?? 0;

  if (fromUnit.id === "c") {
    celsius = value;
  } else if (fromUnit.id === "f") {
    celsius = (value - fromOffset) / fromUnit.toBase;
  } else if (fromUnit.id === "k") {
    celsius = value - fromOffset;
  } else {
    celsius = (value - fromOffset) / fromUnit.toBase;
  }

  // 摂氏から目標単位に変換
  if (toUnit.id === "c") {
    return celsius;
  } else if (toUnit.id === "f") {
    return celsius * toUnit.toBase + toOffset;
  } else if (toUnit.id === "k") {
    return celsius + toOffset;
  } else {
    return celsius * toUnit.toBase + toOffset;
  }
}

/**
 * 数値を適切な精度でフォーマット
 * @param value - フォーマットする値
 * @param maxDecimals - 最大小数点以下桁数（デフォルト: 10）
 * @returns フォーマット済みの文字列
 */
export function formatNumber(value: number, maxDecimals: number = 10): string {
  if (!Number.isFinite(value)) {
    return "計算できません";
  }

  // 非常に大きいまたは小さい数値は指数表記
  if (Math.abs(value) >= 1e15 || (Math.abs(value) < 1e-10 && value !== 0)) {
    return value.toExponential(6);
  }

  // 小数点以下の桁数を動的に調整
  const rounded = parseFloat(value.toFixed(maxDecimals));

  // 整数の場合
  if (Number.isInteger(rounded)) {
    return rounded.toLocaleString("ja-JP");
  }

  // 小数の場合は不要な0を削除
  const formatted = rounded.toFixed(maxDecimals).replace(/\.?0+$/, "");

  // 整数部分にカンマを追加
  const [intPart, decPart] = formatted.split(".");
  const intFormatted = parseInt(intPart, 10).toLocaleString("ja-JP");

  return decPart ? `${intFormatted}.${decPart}` : intFormatted;
}

/**
 * 変換履歴のエントリ
 */
export interface ConversionHistoryEntry {
  /** エントリID */
  id: string;
  /** カテゴリID */
  categoryId: UnitCategory;
  /** 入力値 */
  inputValue: number;
  /** 変換元単位ID */
  fromUnitId: string;
  /** 変換先単位ID */
  toUnitId: string;
  /** 変換結果 */
  result: number;
  /** 変換日時 */
  timestamp: Date;
}

/**
 * 新しい履歴エントリを作成
 * @param categoryId - カテゴリID
 * @param inputValue - 入力値
 * @param fromUnitId - 変換元単位ID
 * @param toUnitId - 変換先単位ID
 * @param result - 変換結果
 * @returns 履歴エントリ
 */
export function createHistoryEntry(
  categoryId: UnitCategory,
  inputValue: number,
  fromUnitId: string,
  toUnitId: string,
  result: number
): ConversionHistoryEntry {
  return {
    id: crypto.randomUUID(),
    categoryId,
    inputValue,
    fromUnitId,
    toUnitId,
    result,
    timestamp: new Date(),
  };
}
