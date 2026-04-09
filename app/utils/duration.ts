/**
 * 時間計算・変換ユーティリティ
 * 秒・HH:MM:SS・人間が読めるフォーマット・フレーム間の変換
 */

/** 時間の各コンポーネント */
export interface DurationComponents {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalSeconds: number;
  totalMilliseconds: number;
}

/** フレームレート一覧 */
export const FRAME_RATES = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 120] as const;
export type FrameRate = (typeof FRAME_RATES)[number];

/** 秒からコンポーネントを計算する */
export function secondsToComponents(totalSeconds: number): DurationComponents {
  const isNegative = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const totalMs = Math.round(abs * 1000);
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const secs = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const mins = totalMin % 60;
  const totalHours = Math.floor(totalMin / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  const sign = isNegative ? -1 : 1;
  return {
    days: sign * days,
    hours: sign * hours,
    minutes: sign * mins,
    seconds: sign * secs,
    milliseconds: sign * ms,
    totalSeconds: sign * totalSec,
    totalMilliseconds: sign * totalMs,
  };
}

/** HH:MM:SS[.mmm] 形式から秒数へ変換する（負の値対応） */
export function hmsToSeconds(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const negative = trimmed.startsWith("-");
  const abs = negative ? trimmed.slice(1) : trimmed;

  // コロンがない場合は純粋な秒数として解析
  if (!abs.includes(":")) {
    const n = Number(abs);
    if (isNaN(n) || n < 0) return null;
    return negative ? -n : n;
  }

  // HH:MM:SS.mmm / MM:SS.mmm
  const match = abs.match(/^(?:(\d+):)?(?:(\d+):)?(\d+)(?:[.,](\d{1,3}))?$/);
  if (!match) return null;

  const parts = [match[1], match[2], match[3]].filter((p) => p !== undefined);
  const ms = match[4] ? parseInt(match[4].padEnd(3, "0"), 10) : 0;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    seconds = parseInt(parts[2], 10);
  } else if (parts.length === 2) {
    minutes = parseInt(parts[0], 10);
    seconds = parseInt(parts[1], 10);
  } else {
    seconds = parseInt(parts[0], 10);
  }

  if (minutes >= 60 || seconds >= 60) return null;

  const total = hours * 3600 + minutes * 60 + seconds + ms / 1000;
  return negative ? -total : total;
}

/** 秒数から HH:MM:SS 形式の文字列へ変換する */
export function secondsToHms(totalSeconds: number, showMs = false): string {
  const c = secondsToComponents(totalSeconds);
  const sign = totalSeconds < 0 ? "-" : "";
  const h = Math.abs(c.days) * 24 + Math.abs(c.hours);
  const m = String(Math.abs(c.minutes)).padStart(2, "0");
  const s = String(Math.abs(c.seconds)).padStart(2, "0");
  const base = `${sign}${String(h).padStart(2, "0")}:${m}:${s}`;
  if (showMs) {
    const ms = String(Math.abs(c.milliseconds)).padStart(3, "0");
    return `${base}.${ms}`;
  }
  return base;
}

/** 秒数から人間が読めるフォーマットへ変換する（日本語） */
export function secondsToHuman(totalSeconds: number): string {
  if (totalSeconds === 0) return "0秒";

  const negative = totalSeconds < 0;
  const c = secondsToComponents(Math.abs(totalSeconds));
  const parts: string[] = [];

  if (c.days > 0) parts.push(`${c.days}日`);
  if (c.hours > 0) parts.push(`${c.hours}時間`);
  if (c.minutes > 0) parts.push(`${c.minutes}分`);
  if (c.seconds > 0) parts.push(`${c.seconds}秒`);
  if (c.milliseconds > 0 && c.days === 0) parts.push(`${c.milliseconds}ミリ秒`);

  return (negative ? "−" : "") + parts.join(" ");
}

/** 秒数からフレーム数へ変換する */
export function secondsToFrames(totalSeconds: number, fps: number): number {
  return Math.round(Math.abs(totalSeconds) * fps);
}

/** フレーム数から秒数へ変換する */
export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

/** フレーム数から HH:MM:SS:FF 形式の文字列へ変換する */
export function framesToTimecode(frames: number, fps: number): string {
  const totalFrames = Math.abs(Math.round(frames));
  const fpsRounded = Math.round(fps);
  const ff = totalFrames % fpsRounded;
  const totalSec = Math.floor(totalFrames / fpsRounded);
  const ss = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const mm = totalMin % 60;
  const hh = Math.floor(totalMin / 60);
  const sign = frames < 0 ? "-" : "";
  return `${sign}${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
}

/** 2つの秒数を加算する */
export function addDurations(a: number, b: number): number {
  return a + b;
}

/** 2つの秒数を減算する */
export function subtractDurations(a: number, b: number): number {
  return a - b;
}

/** 文字列を秒数として解析する（秒数 or HH:MM:SS 両対応） */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // コロンを含む場合は HH:MM:SS として解析
  if (trimmed.includes(":")) {
    return hmsToSeconds(trimmed);
  }

  // 数値として解析（秒数）
  const n = Number(trimmed);
  if (isNaN(n)) return null;
  return n;
}

/** 各単位を秒数へ変換する係数 */
export const UNIT_FACTORS = {
  milliseconds: 1 / 1000,
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
} as const;

export type DurationUnit = keyof typeof UNIT_FACTORS;

/** 単位から秒数へ変換する */
export function unitToSeconds(value: number, unit: DurationUnit): number {
  return value * UNIT_FACTORS[unit];
}

/** 秒数から単位へ変換する */
export function secondsToUnit(totalSeconds: number, unit: DurationUnit): number {
  return totalSeconds / UNIT_FACTORS[unit];
}
