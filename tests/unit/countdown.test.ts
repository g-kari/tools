import { describe, it, expect } from "vite-plus/test";
import { formatCountdown, parseTargetDate } from "../../app/routes/countdown";

describe("formatCountdown", () => {
  it("残り1日1時間1分1秒を正しく変換すること", () => {
    // 1日 + 1時間 + 1分 + 1秒 = 90061秒
    const ms = 90061 * 1000;
    const result = formatCountdown(ms);
    expect(result).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1, expired: false });
  });

  it("残り0ミリ秒の場合は期限切れになること", () => {
    expect(formatCountdown(0)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    });
  });

  it("負のミリ秒の場合は期限切れになること", () => {
    expect(formatCountdown(-1)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    });
    expect(formatCountdown(-100000)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    });
  });

  it("残り59秒を正しく変換すること", () => {
    const result = formatCountdown(59 * 1000);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 59, expired: false });
  });

  it("残り1分を正しく変換すること", () => {
    const result = formatCountdown(60 * 1000);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 1, seconds: 0, expired: false });
  });

  it("残り1時間を正しく変換すること", () => {
    const result = formatCountdown(3600 * 1000);
    expect(result).toEqual({ days: 0, hours: 1, minutes: 0, seconds: 0, expired: false });
  });

  it("残り1日を正しく変換すること", () => {
    const result = formatCountdown(86400 * 1000);
    expect(result).toEqual({ days: 1, hours: 0, minutes: 0, seconds: 0, expired: false });
  });

  it("残り100日を正しく変換すること", () => {
    const result = formatCountdown(100 * 86400 * 1000);
    expect(result).toEqual({ days: 100, hours: 0, minutes: 0, seconds: 0, expired: false });
  });

  it("時間・分・秒が0を超えないこと", () => {
    const result = formatCountdown((25 * 3600 + 65 * 60 + 70) * 1000);
    expect(result.hours).toBeLessThan(24);
    expect(result.minutes).toBeLessThan(60);
    expect(result.seconds).toBeLessThan(60);
  });

  it("残り1ミリ秒は期限切れにならないこと", () => {
    const result = formatCountdown(1);
    expect(result.expired).toBe(false);
  });
});

describe("parseTargetDate", () => {
  it("有効な日付と時刻を正しくパースすること", () => {
    const result = parseTargetDate("2030-12-31", "23:59");
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2030);
    expect(result?.getMonth()).toBe(11); // 0-indexed
    expect(result?.getDate()).toBe(31);
  });

  it("時刻省略時は00:00が使われること", () => {
    const result = parseTargetDate("2030-01-01", "");
    expect(result).not.toBeNull();
    expect(result?.getHours()).toBe(0);
    expect(result?.getMinutes()).toBe(0);
  });

  it("空の日付はnullを返すこと", () => {
    expect(parseTargetDate("", "10:00")).toBeNull();
    expect(parseTargetDate("", "")).toBeNull();
  });

  it("不正な日付はnullを返すこと", () => {
    expect(parseTargetDate("not-a-date", "10:00")).toBeNull();
    expect(parseTargetDate("2030-13-01", "00:00")).toBeNull();
  });

  it("有効な日時のDateオブジェクトを返すこと", () => {
    const result = parseTargetDate("2025-06-15", "12:30");
    expect(result).toBeInstanceOf(Date);
  });
});
