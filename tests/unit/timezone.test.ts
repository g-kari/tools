import { describe, expect, it } from "vite-plus/test";
import {
  TIMEZONES,
  DEFAULT_SELECTED_TIMEZONES,
  getUtcOffset,
  formatInTimezone,
  convertToTimezones,
  getTimezoneOffsetMs,
  parseDateTimeWithTimezone,
  isValidTimezone,
  getCurrentDatetimeLocal,
} from "../../app/utils/timezone";

describe("TIMEZONES", () => {
  it("重複するタイムゾーンIDがないこと", () => {
    const ids = TIMEZONES.map((tz) => tz.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("各タイムゾーンにid・label・cityが存在すること", () => {
    for (const tz of TIMEZONES) {
      expect(tz.id).toBeTruthy();
      expect(tz.label).toBeTruthy();
      expect(tz.city).toBeTruthy();
    }
  });

  it("UTCとAsia/Tokyoが含まれていること", () => {
    const ids = TIMEZONES.map((tz) => tz.id);
    expect(ids).toContain("UTC");
    expect(ids).toContain("Asia/Tokyo");
  });
});

describe("DEFAULT_SELECTED_TIMEZONES", () => {
  it("UTCとAsia/Tokyoがデフォルト選択に含まれること", () => {
    expect(DEFAULT_SELECTED_TIMEZONES.has("UTC")).toBe(true);
    expect(DEFAULT_SELECTED_TIMEZONES.has("Asia/Tokyo")).toBe(true);
  });

  it("デフォルト選択は10件以上あること", () => {
    expect(DEFAULT_SELECTED_TIMEZONES.size).toBeGreaterThanOrEqual(10);
  });
});

describe("getUtcOffset", () => {
  const date = new Date("2024-01-15T12:00:00Z");

  it("UTCのオフセットはGMTまたはGMT+0であること", () => {
    const offset = getUtcOffset(date, "UTC");
    expect(offset).toMatch(/GMT/);
  });

  it("Asia/Tokyoのオフセットは+9であること", () => {
    const offset = getUtcOffset(date, "Asia/Tokyo");
    expect(offset).toMatch(/GMT\+9/);
  });

  it("無効なタイムゾーンはUTCを返すこと", () => {
    const offset = getUtcOffset(date, "Invalid/Timezone");
    expect(offset).toBe("UTC");
  });
});

describe("formatInTimezone", () => {
  const date = new Date("2024-01-15T03:00:00Z");

  it("Asia/TokyoはUTC+9の時刻でフォーマットされること", () => {
    const result = formatInTimezone(date, "Asia/Tokyo");
    // 2024-01-15 03:00 UTC = 2024-01-15 12:00 JST
    expect(result.time).toContain("12:00");
    expect(result.date).toContain("2024");
    expect(result.datetime).toContain("12:00");
  });

  it("UTCは元の時刻でフォーマットされること", () => {
    const result = formatInTimezone(date, "UTC");
    expect(result.time).toContain("03:00");
  });

  it("無効なタイムゾーンは空文字列を返すこと", () => {
    const result = formatInTimezone(date, "Invalid/Timezone");
    expect(result.date).toBe("");
    expect(result.time).toBe("");
    expect(result.datetime).toBe("");
  });
});

describe("convertToTimezones", () => {
  const date = new Date("2024-06-15T12:00:00Z");
  const targets = [
    { id: "UTC", label: "UTC +0", city: "協定世界時" },
    { id: "Asia/Tokyo", label: "JST +9", city: "東京" },
  ];

  it("指定したタイムゾーン数の結果を返すこと", () => {
    const results = convertToTimezones(date, targets);
    expect(results).toHaveLength(2);
  });

  it("各結果にtimezone・datetime・offset・date・timeが含まれること", () => {
    const results = convertToTimezones(date, targets);
    for (const result of results) {
      expect(result.timezone).toBeDefined();
      expect(result.datetime).toBeTruthy();
      expect(result.offset).toBeTruthy();
      expect(result.date).toBeTruthy();
      expect(result.time).toBeTruthy();
    }
  });

  it("空の配列を指定した場合は空の結果を返すこと", () => {
    const results = convertToTimezones(date, []);
    expect(results).toHaveLength(0);
  });
});

describe("getTimezoneOffsetMs", () => {
  const date = new Date("2024-01-15T12:00:00Z");

  it("UTCのオフセットは0ミリ秒であること", () => {
    const offset = getTimezoneOffsetMs(date, "UTC");
    expect(offset).toBe(0);
  });

  it("Asia/Tokyoのオフセットは9時間分のミリ秒であること", () => {
    const offset = getTimezoneOffsetMs(date, "Asia/Tokyo");
    expect(offset).toBe(9 * 60 * 60 * 1000);
  });

  it("America/New_Yorkのオフセットは-5時間（冬時間）であること", () => {
    const offset = getTimezoneOffsetMs(date, "America/New_York");
    expect(offset).toBe(-5 * 60 * 60 * 1000);
  });
});

describe("parseDateTimeWithTimezone", () => {
  it("UTCの日時文字列を正しくパースすること", () => {
    const result = parseDateTimeWithTimezone("2024-01-15T12:00", "UTC");
    expect(result).not.toBeNull();
    expect(result!.toISOString()).toContain("2024-01-15T12:00");
  });

  it("Asia/Tokyoの日時文字列を正しくUTCに変換すること", () => {
    // 2024-01-15 12:00 JST = 2024-01-15 03:00 UTC
    const result = parseDateTimeWithTimezone("2024-01-15T12:00", "Asia/Tokyo");
    expect(result).not.toBeNull();
    expect(result!.toISOString()).toContain("2024-01-15T03:00");
  });

  it("空文字列はnullを返すこと", () => {
    const result = parseDateTimeWithTimezone("", "UTC");
    expect(result).toBeNull();
  });
});

describe("isValidTimezone", () => {
  it("有効なタイムゾーンはtrueを返すこと", () => {
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("Asia/Tokyo")).toBe(true);
    expect(isValidTimezone("America/New_York")).toBe(true);
  });

  it("無効なタイムゾーンはfalseを返すこと", () => {
    expect(isValidTimezone("Invalid/Timezone")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
    expect(isValidTimezone("NotATimezone")).toBe(false);
  });
});

describe("getCurrentDatetimeLocal", () => {
  it("YYYY-MM-DDTHH:mm形式の文字列を返すこと", () => {
    const result = getCurrentDatetimeLocal();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("現在時刻に近い値を返すこと", () => {
    const before = new Date();
    const result = getCurrentDatetimeLocal();
    const after = new Date();

    const resultDate = new Date(result + ":00");
    expect(resultDate.getTime()).toBeGreaterThanOrEqual(before.getTime() - 60000);
    expect(resultDate.getTime()).toBeLessThanOrEqual(after.getTime() + 60000);
  });
});
