import { describe, it, expect } from "vite-plus/test";
import {
  calculateWpm,
  calculateAccuracy,
  getCharStatuses,
} from "../../app/routes/typing-speed";

describe("calculateWpm", () => {
  it("300文字を60秒で入力するとWPM=60", () => {
    expect(calculateWpm(300, 60)).toBe(60);
  });

  it("150文字を30秒で入力するとWPM=60", () => {
    expect(calculateWpm(150, 30)).toBe(60);
  });

  it("経過時間が0以下のとき0を返す", () => {
    expect(calculateWpm(100, 0)).toBe(0);
    expect(calculateWpm(100, -1)).toBe(0);
  });

  it("正確な文字数が0のとき0を返す", () => {
    expect(calculateWpm(0, 60)).toBe(0);
  });

  it("小数点を丸める", () => {
    const result = calculateWpm(100, 60);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("50文字を60秒で入力するとWPM=10", () => {
    expect(calculateWpm(50, 60)).toBe(10);
  });
});

describe("calculateAccuracy", () => {
  it("全て正確なとき100%", () => {
    expect(calculateAccuracy(100, 100)).toBe(100);
  });

  it("半分正確なとき50%", () => {
    expect(calculateAccuracy(50, 100)).toBe(50);
  });

  it("入力なしのとき100%", () => {
    expect(calculateAccuracy(0, 0)).toBe(100);
  });

  it("正確な文字が0でも分母が0でない場合0%", () => {
    expect(calculateAccuracy(0, 10)).toBe(0);
  });

  it("90%の精度を正しく計算", () => {
    expect(calculateAccuracy(9, 10)).toBe(90);
  });

  it("小数点を丸める", () => {
    const result = calculateAccuracy(1, 3);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("getCharStatuses", () => {
  it("全て正確に入力したとき全てcorrect", () => {
    const statuses = getCharStatuses("hello", "hello");
    expect(statuses).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("未入力の文字はpending", () => {
    const statuses = getCharStatuses("hello", "");
    expect(statuses).toEqual([
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("一部正確、一部ミス、一部未入力", () => {
    const statuses = getCharStatuses("hello", "helo");
    expect(statuses[0]).toBe("correct"); // h
    expect(statuses[1]).toBe("correct"); // e
    expect(statuses[2]).toBe("correct"); // l
    expect(statuses[3]).toBe("incorrect"); // l vs o
    expect(statuses[4]).toBe("pending"); // o (未入力)
  });

  it("空の目標テキストで空配列を返す", () => {
    expect(getCharStatuses("", "")).toEqual([]);
  });

  it("スペース文字を正しく比較する", () => {
    const statuses = getCharStatuses("a b", "a b");
    expect(statuses).toEqual(["correct", "correct", "correct"]);
  });

  it("大文字小文字を区別する", () => {
    const statuses = getCharStatuses("Hello", "hello");
    expect(statuses[0]).toBe("incorrect"); // H vs h
    expect(statuses[1]).toBe("correct"); // e
  });
});
