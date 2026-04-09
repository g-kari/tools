/**
 * 転送速度・転送時間計算ユーティリティ
 */

/** ファイルサイズ単位 */
export type SizeUnit = "B" | "KB" | "MB" | "GB" | "TB";

/** 転送速度単位 */
export type SpeedUnit = "bps" | "Kbps" | "Mbps" | "Gbps" | "KBps" | "MBps" | "GBps";

/** 計算モード */
export type CalcMode = "time" | "speed";

/** 転送速度プリセット */
export interface SpeedPreset {
  name: string;
  bps: number;
  category: string;
}

/** 転送時間計算結果 */
export interface TransferResult {
  seconds: number;
  formatted: string;
  breakdown: { days: number; hours: number; minutes: number; seconds: number };
}

/** 転送速度計算結果 */
export interface SpeedResult {
  bps: number;
  kbps: number;
  mbps: number;
  gbps: number;
  kBps: number;
  mBps: number;
  gBps: number;
}

/** ファイルサイズ単位のバイト数 */
const SIZE_UNIT_BYTES: Record<SizeUnit, number> = {
  B: 1,
  KB: 1_024,
  MB: 1_024 ** 2,
  GB: 1_024 ** 3,
  TB: 1_024 ** 4,
};

/** 転送速度単位の bps 換算 */
const SPEED_UNIT_BPS: Record<SpeedUnit, number> = {
  bps: 1,
  Kbps: 1_000,
  Mbps: 1_000_000,
  Gbps: 1_000_000_000,
  KBps: 8_000,
  MBps: 8_000_000,
  GBps: 8_000_000_000,
};

/** 転送速度プリセット一覧 */
export const SPEED_PRESETS: SpeedPreset[] = [
  // モバイル回線
  { name: "2G (EDGE)", bps: 384_000, category: "モバイル" },
  { name: "3G (HSPA)", bps: 7_200_000, category: "モバイル" },
  { name: "4G LTE", bps: 150_000_000, category: "モバイル" },
  { name: "5G (Sub-6)", bps: 1_000_000_000, category: "モバイル" },
  // Wi-Fi
  { name: "Wi-Fi 4 (802.11n, 2.4GHz)", bps: 150_000_000, category: "Wi-Fi" },
  { name: "Wi-Fi 5 (802.11ac, 5GHz)", bps: 433_000_000, category: "Wi-Fi" },
  { name: "Wi-Fi 6 (802.11ax)", bps: 1_200_000_000, category: "Wi-Fi" },
  // 有線LAN
  { name: "Fast Ethernet (100Mbps)", bps: 100_000_000, category: "有線LAN" },
  { name: "Gigabit Ethernet (1Gbps)", bps: 1_000_000_000, category: "有線LAN" },
  { name: "10G Ethernet", bps: 10_000_000_000, category: "有線LAN" },
  // USB
  { name: "USB 2.0 (480Mbps)", bps: 480_000_000, category: "USB" },
  { name: "USB 3.0 (5Gbps)", bps: 5_000_000_000, category: "USB" },
  { name: "USB 3.2 Gen2 (10Gbps)", bps: 10_000_000_000, category: "USB" },
  // その他
  { name: "ADSL (下り)", bps: 8_000_000, category: "その他" },
  { name: "FTTH/光回線 (100Mbps)", bps: 100_000_000, category: "その他" },
  { name: "FTTH/光回線 (1Gbps)", bps: 1_000_000_000, category: "その他" },
];

/**
 * ファイルサイズをバイトに変換する
 * @param size - サイズの数値
 * @param unit - サイズ単位
 * @returns バイト数
 */
export function fileSizeToBytes(size: number, unit: SizeUnit): number {
  return size * SIZE_UNIT_BYTES[unit];
}

/**
 * 転送速度を bps に変換する
 * @param speed - 速度の数値
 * @param unit - 速度単位
 * @returns bps 値
 */
export function speedToBps(speed: number, unit: SpeedUnit): number {
  return speed * SPEED_UNIT_BPS[unit];
}

/**
 * 秒数を時分秒に分解する
 * @param totalSeconds - 合計秒数
 */
function breakdownSeconds(totalSeconds: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return { days, hours, minutes, seconds };
}

/**
 * 秒数を人間が読みやすい形式にフォーマットする
 * @param totalSeconds - 合計秒数
 * @returns フォーマット済み文字列
 */
export function formatTransferTime(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return "—";
  if (totalSeconds < 1) {
    return `${(totalSeconds * 1000).toFixed(1)} ミリ秒`;
  }
  const { days, hours, minutes, seconds } = breakdownSeconds(totalSeconds);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} 日`);
  if (hours > 0) parts.push(`${hours} 時間`);
  if (minutes > 0) parts.push(`${minutes} 分`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} 秒`);
  return parts.join(" ");
}

/**
 * bps を適切な単位にフォーマットする
 * @param bps - bps 値
 * @returns フォーマット済み文字列
 */
export function formatSpeed(bps: number): string {
  if (bps >= 1_000_000_000) {
    return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  } else if (bps >= 1_000_000) {
    return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  } else if (bps >= 1_000) {
    return `${(bps / 1_000).toFixed(2)} Kbps`;
  }
  return `${bps.toFixed(0)} bps`;
}

/**
 * ファイルサイズと転送速度から転送時間を計算する
 * @param bytes - ファイルサイズ（バイト）
 * @param bps - 転送速度（bps）
 * @returns 転送時間計算結果、無効な入力の場合は null
 */
export function calcTransferTime(bytes: number, bps: number): TransferResult | null {
  if (!isFinite(bytes) || bytes <= 0) return null;
  if (!isFinite(bps) || bps <= 0) return null;

  const bits = bytes * 8;
  const seconds = bits / bps;
  const formatted = formatTransferTime(seconds);
  const breakdown = breakdownSeconds(seconds);

  return { seconds, formatted, breakdown };
}

/**
 * ファイルサイズと目標時間から必要な転送速度を計算する
 * @param bytes - ファイルサイズ（バイト）
 * @param seconds - 目標時間（秒）
 * @returns 必要な転送速度計算結果、無効な入力の場合は null
 */
export function calcRequiredSpeed(bytes: number, seconds: number): SpeedResult | null {
  if (!isFinite(bytes) || bytes <= 0) return null;
  if (!isFinite(seconds) || seconds <= 0) return null;

  const bits = bytes * 8;
  const bps = bits / seconds;

  return {
    bps,
    kbps: bps / 1_000,
    mbps: bps / 1_000_000,
    gbps: bps / 1_000_000_000,
    kBps: bps / 8_000,
    mBps: bps / 8_000_000,
    gBps: bps / 8_000_000_000,
  };
}

/**
 * ファイルサイズを人間が読みやすい形式にフォーマットする
 * @param bytes - バイト数
 * @returns フォーマット済み文字列
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1_024 ** 4) return `${(bytes / 1_024 ** 4).toFixed(2)} TB`;
  if (bytes >= 1_024 ** 3) return `${(bytes / 1_024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1_024 ** 2) return `${(bytes / 1_024 ** 2).toFixed(2)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(2)} KB`;
  return `${bytes.toFixed(0)} B`;
}
