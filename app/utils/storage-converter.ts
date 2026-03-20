/**
 * ストレージ単位変換ユーティリティ
 * SI単位（10の累乗・10進法）とIEC単位（2の累乗・2進法）の両方に対応
 */

/** ストレージ単位の定義 */
export interface StorageUnit {
  /** 単位ID */
  id: string;
  /** 日本語名称 */
  label: string;
  /** 略称 */
  abbr: string;
  /** 1単位あたりのバイト数 */
  bytesPerUnit: number;
  /** 単位グループ */
  group: "bits" | "decimal" | "binary";
}

/** すべてのストレージ単位 */
export const STORAGE_UNITS: StorageUnit[] = [
  // ビット
  {
    id: "bit",
    label: "ビット",
    abbr: "bit",
    bytesPerUnit: 0.125,
    group: "bits",
  },
  // SI単位 (10進法, IEC 80000-13)
  {
    id: "B",
    label: "バイト",
    abbr: "B",
    bytesPerUnit: 1,
    group: "decimal",
  },
  {
    id: "KB",
    label: "キロバイト",
    abbr: "KB",
    bytesPerUnit: 1_000,
    group: "decimal",
  },
  {
    id: "MB",
    label: "メガバイト",
    abbr: "MB",
    bytesPerUnit: 1_000_000,
    group: "decimal",
  },
  {
    id: "GB",
    label: "ギガバイト",
    abbr: "GB",
    bytesPerUnit: 1_000_000_000,
    group: "decimal",
  },
  {
    id: "TB",
    label: "テラバイト",
    abbr: "TB",
    bytesPerUnit: 1_000_000_000_000,
    group: "decimal",
  },
  {
    id: "PB",
    label: "ペタバイト",
    abbr: "PB",
    bytesPerUnit: 1_000_000_000_000_000,
    group: "decimal",
  },
  // IEC単位 (2進法, IEC 80000-13)
  {
    id: "KiB",
    label: "キビバイト",
    abbr: "KiB",
    bytesPerUnit: 1_024,
    group: "binary",
  },
  {
    id: "MiB",
    label: "メビバイト",
    abbr: "MiB",
    bytesPerUnit: 1_048_576,
    group: "binary",
  },
  {
    id: "GiB",
    label: "ギビバイト",
    abbr: "GiB",
    bytesPerUnit: 1_073_741_824,
    group: "binary",
  },
  {
    id: "TiB",
    label: "テビバイト",
    abbr: "TiB",
    bytesPerUnit: 1_099_511_627_776,
    group: "binary",
  },
  {
    id: "PiB",
    label: "ペビバイト",
    abbr: "PiB",
    bytesPerUnit: 1_125_899_906_842_624,
    group: "binary",
  },
];

/** 変換結果の1件 */
export interface StorageConversionResult {
  unitId: string;
  value: number;
}

/**
 * ストレージ値を全単位に変換する
 * @param value 入力値
 * @param fromUnitId 入力単位のID
 * @returns 各単位への変換結果
 */
export function convertStorage(
  value: number,
  fromUnitId: string
): StorageConversionResult[] {
  if (isNaN(value) || !isFinite(value) || value < 0) return [];

  const fromUnit = STORAGE_UNITS.find((u) => u.id === fromUnitId);
  if (!fromUnit) return [];

  const bytes = value * fromUnit.bytesPerUnit;

  return STORAGE_UNITS.map((unit) => ({
    unitId: unit.id,
    value: bytes / unit.bytesPerUnit,
  }));
}

/**
 * ストレージ値を読みやすい文字列にフォーマットする
 * @param value 数値
 * @returns フォーマット済み文字列
 */
export function formatStorageValue(value: number): string {
  if (!isFinite(value)) return "—";
  if (value === 0) return "0";

  const abs = Math.abs(value);

  // 極大値: 指数表記
  if (abs >= 1e18) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }

  // 整数
  if (Number.isInteger(value) && abs < 1e15) {
    return value.toString();
  }

  // 極小値: 指数表記
  if (abs < 1e-6 && abs > 0) {
    return value.toExponential(4).replace(/\.?0+e/, "e");
  }

  // 小数: 有効桁数10桁で表示
  return parseFloat(value.toPrecision(10)).toString();
}

/**
 * 単位IDから StorageUnit を取得する
 * @param id 単位ID
 * @returns StorageUnit または undefined
 */
export function getStorageUnit(id: string): StorageUnit | undefined {
  return STORAGE_UNITS.find((u) => u.id === id);
}

/** グループ別に単位を分類したマップ */
export const STORAGE_UNIT_GROUPS: Record<
  StorageUnit["group"],
  StorageUnit[]
> = {
  bits: STORAGE_UNITS.filter((u) => u.group === "bits"),
  decimal: STORAGE_UNITS.filter((u) => u.group === "decimal"),
  binary: STORAGE_UNITS.filter((u) => u.group === "binary"),
};

/** グループの表示名 */
export const GROUP_LABELS: Record<StorageUnit["group"], string> = {
  bits: "ビット",
  decimal: "SI単位 (10進法)",
  binary: "IEC単位 (2進法)",
};
