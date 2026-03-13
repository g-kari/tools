import { describe, it, expect } from "vitest";
import {
  parseTimestamp,
  formatTimestampResult,
  formatRelativeTime,
  dateToTimestamp,
} from "../../app/routes/timestamp";

describe("parseTimestamp", () => {
  it("10桁の秒タイムスタンプを正しく解析する", () => {
    const result = parseTimestamp("1700000000");
    expect(result).not.toBeNull();
    expect(result?.seconds).toBe(1700000000);
    expect(result?.milliseconds).toBe(1700000000000);
  });

  it("13桁のミリ秒タイムスタンプを正しく解析する", () => {
    const result = parseTimestamp("1700000000000");
    expect(result).not.toBeNull();
    expect(result?.seconds).toBe(1700000000);
    expect(result?.milliseconds).toBe(1700000000000);
  });

  it("空文字列はnullを返す", () => {
    expect(parseTimestamp("")).toBeNull();
  });

  it("空白のみはnullを返す", () => {
    expect(parseTimestamp("   ")).toBeNull();
  });

  it("非数値文字列はnullを返す", () => {
    expect(parseTimestamp("abc")).toBeNull();
    expect(parseTimestamp("1a2b")).toBeNull();
  });

  it("前後の空白を無視して解析する", () => {
    const result = parseTimestamp("  1700000000  ");
    expect(result).not.toBeNull();
    expect(result?.seconds).toBe(1700000000);
  });

  it("0を正しく解析する（UNIXエポック）", () => {
    const result = parseTimestamp("0");
    expect(result).not.toBeNull();
    expect(result?.seconds).toBe(0);
    expect(result?.milliseconds).toBe(0);
  });

  it("12桁は秒として扱う", () => {
    const result = parseTimestamp("100000000000");
    expect(result).not.toBeNull();
    expect(result?.seconds).toBe(100000000000);
  });

  it("13桁はミリ秒として扱う", () => {
    const result = parseTimestamp("1000000000000");
    expect(result).not.toBeNull();
    expect(result?.seconds).toBe(1000000000);
  });

  it("負の10桁タイムスタンプ（エポック前）を正しく解析する", () => {
    const result = parseTimestamp("-1000000000");
    expect(result).not.toBeNull();
    expect(result?.seconds).toBe(-1000000000);
    expect(result?.milliseconds).toBe(-1000000000000);
  });

  it("負の13桁タイムスタンプ（ミリ秒）を正しく解析する", () => {
    const result = parseTimestamp("-1700000000000");
    expect(result).not.toBeNull();
    expect(result?.seconds).toBe(-1700000000);
    expect(result?.milliseconds).toBe(-1700000000000);
  });

  it("負の12桁は秒として扱う", () => {
    const result = parseTimestamp("-100000000000");
    expect(result).not.toBeNull();
    expect(result?.seconds).toBe(-100000000000);
  });
});

describe("formatTimestampResult", () => {
  it("UNIXエポック（0秒）を正しくフォーマットする", () => {
    const result = formatTimestampResult(0);
    expect(result.utc).toContain("1970-01-01");
    expect(result.utc).toContain("UTC");
    expect(result.jst).toContain("JST");
    expect(result.relative).toBeTruthy();
  });

  it("既知のタイムスタンプを正しくUTCフォーマットする", () => {
    // 2023-11-14T22:13:20Z
    const result = formatTimestampResult(1700000000);
    expect(result.utc).toContain("2023-11-14");
    expect(result.utc).toContain("22:13:20");
    expect(result.utc).toContain("UTC");
  });

  it("JSTはUTCより9時間進んでいる", () => {
    // 2023-11-14T22:13:20Z → JST 2023-11-15T07:13:20
    const result = formatTimestampResult(1700000000);
    expect(result.jst).toContain("JST");
    // UTCの22時 → JSTの07時（翌日）
    expect(result.jst).toContain("07:13:20");
  });

  it("相対時刻文字列が返される", () => {
    const result = formatTimestampResult(1700000000);
    expect(result.relative).toMatch(/\d+(秒|分|時間|日|ヶ月|年)(前|後)/);
  });
});

describe("formatRelativeTime", () => {
  const nowSeconds = Math.floor(Date.now() / 1000);

  it("30秒前を正しく表示する", () => {
    const result = formatRelativeTime(nowSeconds - 30);
    expect(result).toBe("30秒前");
  });

  it("5分前を正しく表示する", () => {
    const result = formatRelativeTime(nowSeconds - 300);
    expect(result).toBe("5分前");
  });

  it("2時間前を正しく表示する", () => {
    const result = formatRelativeTime(nowSeconds - 7200);
    expect(result).toBe("2時間前");
  });

  it("3日前を正しく表示する", () => {
    const result = formatRelativeTime(nowSeconds - 86400 * 3);
    expect(result).toBe("3日前");
  });

  it("2ヶ月前を正しく表示する", () => {
    const result = formatRelativeTime(nowSeconds - 86400 * 60);
    expect(result).toBe("2ヶ月前");
  });

  it("1年前を正しく表示する", () => {
    const result = formatRelativeTime(nowSeconds - 86400 * 365);
    expect(result).toBe("1年前");
  });

  it("30秒後を正しく表示する", () => {
    const result = formatRelativeTime(nowSeconds + 30);
    expect(result).toBe("30秒後");
  });

  it("2時間後を正しく表示する", () => {
    const result = formatRelativeTime(nowSeconds + 7200);
    expect(result).toBe("2時間後");
  });

  it("3日後を正しく表示する", () => {
    const result = formatRelativeTime(nowSeconds + 86400 * 3);
    expect(result).toBe("3日後");
  });
});

describe("dateToTimestamp", () => {
  it("datetime-local形式の文字列をタイムスタンプに変換する", () => {
    // ローカル時刻として解析されるため、環境依存あり
    const result = dateToTimestamp("1970-01-01T00:00");
    expect(typeof result.seconds).toBe("number");
    expect(typeof result.milliseconds).toBe("number");
    expect(result.milliseconds).toBe(result.seconds * 1000);
  });

  it("秒とミリ秒の関係が正しい", () => {
    const result = dateToTimestamp("2023-11-14T00:00");
    expect(result.milliseconds).toBe(result.seconds * 1000);
  });
});
