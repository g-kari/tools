import { describe, it, expect } from "vitest";
import {
  calculateDateDiff,
  addDuration,
  getDateInfo,
  formatDateJa,
  toDatetimeLocalString,
} from "../../app/utils/date-calc";

describe("calculateDateDiff", () => {
  it("同じ日付の差は全て0", () => {
    const d = new Date("2024-01-15T12:00:00");
    const result = calculateDateDiff(d, d);
    expect(result.totalDays).toBe(0);
    expect(result.years).toBe(0);
    expect(result.months).toBe(0);
    expect(result.days).toBe(0);
    expect(result.isNegative).toBe(false);
  });

  it("1年の差を正しく計算する", () => {
    const d1 = new Date("2023-01-01T00:00:00");
    const d2 = new Date("2024-01-01T00:00:00");
    const result = calculateDateDiff(d1, d2);
    expect(result.years).toBe(1);
    expect(result.months).toBe(0);
    expect(result.days).toBe(0);
    expect(result.totalDays).toBe(365);
    expect(result.isNegative).toBe(false);
  });

  it("閏年を含む1年の差を正しく計算する", () => {
    const d1 = new Date("2024-01-01T00:00:00");
    const d2 = new Date("2025-01-01T00:00:00");
    const result = calculateDateDiff(d1, d2);
    expect(result.years).toBe(1);
    expect(result.totalDays).toBe(366);
  });

  it("1ヶ月の差を正しく計算する", () => {
    const d1 = new Date("2024-03-01T00:00:00");
    const d2 = new Date("2024-04-01T00:00:00");
    const result = calculateDateDiff(d1, d2);
    expect(result.years).toBe(0);
    expect(result.months).toBe(1);
    expect(result.days).toBe(0);
    expect(result.totalDays).toBe(31);
  });

  it("逆順（date2 < date1）の場合は isNegative が true", () => {
    const d1 = new Date("2024-06-01T00:00:00");
    const d2 = new Date("2024-01-01T00:00:00");
    const result = calculateDateDiff(d1, d2);
    expect(result.isNegative).toBe(true);
    expect(result.totalDays).toBeGreaterThan(0);
  });

  it("時・分・秒の差を正しく計算する", () => {
    const d1 = new Date("2024-01-01T10:30:15");
    const d2 = new Date("2024-01-01T12:45:50");
    const result = calculateDateDiff(d1, d2);
    expect(result.hours).toBe(2);
    expect(result.minutes).toBe(15);
    expect(result.seconds).toBe(35);
    expect(result.days).toBe(0);
  });

  it("合計秒数を正しく計算する", () => {
    const d1 = new Date("2024-01-01T00:00:00");
    const d2 = new Date("2024-01-02T00:00:00");
    const result = calculateDateDiff(d1, d2);
    expect(result.totalSeconds).toBe(86400);
    expect(result.totalMinutes).toBe(1440);
    expect(result.totalHours).toBe(24);
  });
});

describe("addDuration", () => {
  const base = new Date("2024-01-15T12:00:00");

  it("日を加算できる", () => {
    const result = addDuration(base, 7, "days", "add");
    expect(result.getDate()).toBe(22);
    expect(result.getMonth()).toBe(0);
    expect(result.getFullYear()).toBe(2024);
  });

  it("日を減算できる", () => {
    const result = addDuration(base, 7, "days", "subtract");
    expect(result.getDate()).toBe(8);
  });

  it("週を加算できる", () => {
    const result = addDuration(base, 2, "weeks", "add");
    expect(result.getDate()).toBe(29);
  });

  it("ヶ月を加算できる", () => {
    const result = addDuration(base, 3, "months", "add");
    expect(result.getMonth()).toBe(3); // April
    expect(result.getFullYear()).toBe(2024);
  });

  it("年を加算できる", () => {
    const result = addDuration(base, 1, "years", "add");
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
  });

  it("時間を加算できる", () => {
    const result = addDuration(base, 5, "hours", "add");
    expect(result.getHours()).toBe(17);
  });

  it("分を加算できる", () => {
    const result = addDuration(base, 90, "minutes", "add");
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(30);
  });

  it("元の日付を変更しない（イミュータブル）", () => {
    const original = new Date(base);
    addDuration(base, 30, "days", "add");
    expect(base.getTime()).toBe(original.getTime());
  });
});

describe("getDateInfo", () => {
  it("曜日を正しく返す", () => {
    const d = new Date("2024-01-01T00:00:00"); // 月曜日
    const info = getDateInfo(d);
    expect(info.dayOfWeek).toBe("月曜日");
    expect(info.dayOfWeekEn).toBe("Monday");
  });

  it("年の最初の日は1日目", () => {
    const d = new Date("2024-01-01T00:00:00");
    const info = getDateInfo(d);
    expect(info.dayOfYear).toBe(1);
  });

  it("四半期を正しく返す", () => {
    expect(getDateInfo(new Date("2024-01-01")).quarter).toBe(1);
    expect(getDateInfo(new Date("2024-04-01")).quarter).toBe(2);
    expect(getDateInfo(new Date("2024-07-01")).quarter).toBe(3);
    expect(getDateInfo(new Date("2024-10-01")).quarter).toBe(4);
  });

  it("閏年を正しく判定する", () => {
    expect(getDateInfo(new Date("2024-06-15")).isLeapYear).toBe(true);
    expect(getDateInfo(new Date("2023-06-15")).isLeapYear).toBe(false);
    expect(getDateInfo(new Date("2100-06-15")).isLeapYear).toBe(false);
    expect(getDateInfo(new Date("2000-06-15")).isLeapYear).toBe(true);
  });

  it("月の日数を正しく返す", () => {
    expect(getDateInfo(new Date("2024-01-15")).daysInMonth).toBe(31);
    expect(getDateInfo(new Date("2024-02-15")).daysInMonth).toBe(29); // 閏年
    expect(getDateInfo(new Date("2023-02-15")).daysInMonth).toBe(28); // 平年
    expect(getDateInfo(new Date("2024-04-15")).daysInMonth).toBe(30);
  });

  it("Unixタイムスタンプを返す", () => {
    const d = new Date("2024-01-01T00:00:00Z");
    const info = getDateInfo(d);
    // UTC基準で1704067200
    expect(info.unixTimestamp).toBeTypeOf("number");
    expect(info.unixTimestamp).toBeGreaterThan(0);
  });
});

describe("formatDateJa", () => {
  it("日本語形式にフォーマットする", () => {
    const d = new Date("2024-03-15T10:30:45");
    const result = formatDateJa(d);
    expect(result).toContain("2024年");
    expect(result).toContain("03月");
    expect(result).toContain("15日");
    expect(result).toContain("10:30:45");
  });

  it("ゼロパディングが正しい", () => {
    const d = new Date("2024-01-05T09:05:03");
    const result = formatDateJa(d);
    expect(result).toContain("01月");
    expect(result).toContain("05日");
    expect(result).toContain("09:05:03");
  });
});

describe("toDatetimeLocalString", () => {
  it("datetime-local 形式の文字列を返す", () => {
    const d = new Date("2024-03-15T10:30:00");
    const result = toDatetimeLocalString(d);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(result).toContain("2024-03-15T10:30");
  });
});
