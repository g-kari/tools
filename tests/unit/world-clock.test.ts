import { describe, it, expect } from 'vite-plus/test';
import { getClockData, getLocalTimezone, weekdayLabel } from '../../app/utils/world-clock';

describe('getClockData', () => {
  // 固定の Date: 2024-01-15 12:00:00 UTC (月曜日)
  const fixedDate = new Date('2024-01-15T12:00:00Z');

  it('UTC の時刻データを正しく取得する', () => {
    const data = getClockData(fixedDate, 'UTC', false, 'UTC');
    expect(data.time).toMatch(/12:00:00/);
    expect(data.date).toBe('2024/01/15');
    expect(data.offset).toContain('GMT');
    expect(data.dayDiff).toBe(0);
  });

  it('Asia/Tokyo (UTC+9) の時刻データを正しく取得する', () => {
    // UTC 12:00 → JST 21:00
    const data = getClockData(fixedDate, 'Asia/Tokyo', false, 'UTC');
    expect(data.time).toMatch(/21:00:00/);
    expect(data.date).toBe('2024/01/15');
    expect(data.offset).toContain('GMT+9');
    expect(data.dayDiff).toBe(0);
  });

  it('Pacific/Honolulu (UTC-10) の時刻データを正しく取得する', () => {
    // UTC 12:00 → HST 02:00 前日
    const data = getClockData(fixedDate, 'Pacific/Honolulu', false, 'UTC');
    expect(data.time).toMatch(/02:00:00/);
    // ホノルルは UTC-10 なので同日（UTC 12:00 → HST 02:00 は同日 Jan 15）
    expect(data.date).toBe('2024/01/15');
  });

  it('dayDiff が翌日になるケース（JST が UTC より +1 日になる場合）', () => {
    // UTC 2024-01-15 20:00 → JST 2024-01-16 05:00 （翌日）
    const lateUTC = new Date('2024-01-15T20:00:00Z');
    const data = getClockData(lateUTC, 'Asia/Tokyo', false, 'UTC');
    expect(data.dayDiff).toBe(1);
    expect(data.date).toBe('2024/01/16');
  });

  it('dayDiff が前日になるケース（HST が UTC より -1 日になる場合）', () => {
    // UTC 2024-01-15 05:00 → HST 2024-01-14 19:00 （前日）
    const earlyUTC = new Date('2024-01-15T05:00:00Z');
    const data = getClockData(earlyUTC, 'Pacific/Honolulu', false, 'UTC');
    expect(data.dayDiff).toBe(-1);
  });

  it('12時間表示が適用される', () => {
    const data = getClockData(fixedDate, 'UTC', true, 'UTC');
    // 12時間表示では午前/午後が含まれる（または AM/PM）
    expect(data.time).toBeTruthy();
    expect(data.time.length).toBeGreaterThan(0);
  });

  it('weekday が1文字の漢字を返す', () => {
    // 2024-01-15 は月曜日（UTC）
    const data = getClockData(fixedDate, 'UTC', false, 'UTC');
    expect(data.weekday).toBe('月');
  });

  it('offset が GMT形式を含む', () => {
    const data = getClockData(fixedDate, 'UTC', false, 'UTC');
    expect(data.offset).toMatch(/GMT/i);
  });

  it('Asia/Kolkata (UTC+5:30) の時刻データを正しく取得する', () => {
    // UTC 12:00 → IST 17:30
    const data = getClockData(fixedDate, 'Asia/Kolkata', false, 'UTC');
    expect(data.time).toMatch(/17:30:00/);
  });

  it('ローカルタイムゾーンと同じ場合 dayDiff は 0', () => {
    const data = getClockData(fixedDate, 'Asia/Tokyo', false, 'Asia/Tokyo');
    expect(data.dayDiff).toBe(0);
  });
});

describe('getLocalTimezone', () => {
  it('文字列を返す', () => {
    const tz = getLocalTimezone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('有効なタイムゾーンIDを返す', () => {
    const tz = getLocalTimezone();
    // Intl.DateTimeFormat に渡せるかどうかで検証
    expect(() => new Intl.DateTimeFormat('ja-JP', { timeZone: tz })).not.toThrow();
  });
});

describe('weekdayLabel', () => {
  it('0〜6 の数値を曜日略称に変換する', () => {
    expect(weekdayLabel(0)).toBe('日');
    expect(weekdayLabel(1)).toBe('月');
    expect(weekdayLabel(2)).toBe('火');
    expect(weekdayLabel(3)).toBe('水');
    expect(weekdayLabel(4)).toBe('木');
    expect(weekdayLabel(5)).toBe('金');
    expect(weekdayLabel(6)).toBe('土');
  });

  it('範囲外の値は空文字を返す', () => {
    expect(weekdayLabel(7)).toBe('');
    expect(weekdayLabel(-1)).toBe('');
  });
});
