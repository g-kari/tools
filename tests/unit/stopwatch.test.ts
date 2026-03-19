import { describe, it, expect } from "vitest";
import { formatElapsed, getLapRating } from "../../app/routes/stopwatch";
import type { LapTime } from "../../app/routes/stopwatch";

describe("formatElapsed", () => {
  it("0ミリ秒を正しくフォーマットすること", () => {
    expect(formatElapsed(0)).toBe("00:00.000");
  });

  it("1500ミリ秒（1.5秒）を正しくフォーマットすること", () => {
    expect(formatElapsed(1500)).toBe("00:01.500");
  });

  it("65432ミリ秒（1分5秒432ms）を正しくフォーマットすること", () => {
    expect(formatElapsed(65432)).toBe("01:05.432");
  });

  it("60000ミリ秒（ちょうど1分）を正しくフォーマットすること", () => {
    expect(formatElapsed(60000)).toBe("01:00.000");
  });

  it("3661001ミリ秒（61分1秒1ms）を正しくフォーマットすること", () => {
    expect(formatElapsed(3661001)).toBe("61:01.001");
  });

  it("999ミリ秒を正しくフォーマットすること", () => {
    expect(formatElapsed(999)).toBe("00:00.999");
  });

  it("59999ミリ秒（59秒999ms）を正しくフォーマットすること", () => {
    expect(formatElapsed(59999)).toBe("00:59.999");
  });

  it("負の値は0として扱うこと", () => {
    expect(formatElapsed(-100)).toBe("00:00.000");
  });

  it("小数点以下は切り捨てること", () => {
    expect(formatElapsed(1500.9)).toBe("00:01.500");
  });
});

describe("getLapRating", () => {
  const makeLap = (lap: number, lapMs: number): LapTime => ({
    lap,
    lapMs,
    totalMs: lapMs,
  });

  it("ラップが1件のみの場合は normal を返すこと", () => {
    const laps: LapTime[] = [makeLap(1, 5000)];
    expect(getLapRating(5000, laps)).toBe("normal");
  });

  it("ラップが2件の場合、最速に best を返すこと", () => {
    const laps: LapTime[] = [makeLap(1, 5000), makeLap(2, 3000)];
    expect(getLapRating(3000, laps)).toBe("best");
  });

  it("ラップが2件の場合、最遅に worst を返すこと", () => {
    const laps: LapTime[] = [makeLap(1, 5000), makeLap(2, 3000)];
    expect(getLapRating(5000, laps)).toBe("worst");
  });

  it("3件のうち中間は normal を返すこと", () => {
    const laps: LapTime[] = [
      makeLap(1, 5000),
      makeLap(2, 3000),
      makeLap(3, 4000),
    ];
    expect(getLapRating(4000, laps)).toBe("normal");
  });

  it("3件のうち最速は best を返すこと", () => {
    const laps: LapTime[] = [
      makeLap(1, 5000),
      makeLap(2, 3000),
      makeLap(3, 4000),
    ];
    expect(getLapRating(3000, laps)).toBe("best");
  });

  it("3件のうち最遅は worst を返すこと", () => {
    const laps: LapTime[] = [
      makeLap(1, 5000),
      makeLap(2, 3000),
      makeLap(3, 4000),
    ];
    expect(getLapRating(5000, laps)).toBe("worst");
  });

  it("ラップが空のリストの場合は normal を返すこと", () => {
    expect(getLapRating(1000, [])).toBe("normal");
  });

  it("全ラップが同じタイムの場合は best を返すこと（min === max）", () => {
    const laps: LapTime[] = [
      makeLap(1, 5000),
      makeLap(2, 5000),
      makeLap(3, 5000),
    ];
    // min === max === lapMs なので best
    expect(getLapRating(5000, laps)).toBe("best");
  });
});
