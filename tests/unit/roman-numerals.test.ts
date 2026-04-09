import { describe, it, expect } from "vite-plus/test";
import { toRoman, fromRoman } from "../../app/routes/roman-numerals";

describe("toRoman - アラビア数字 → ローマ数字", () => {
  it("基本記号を正しく変換する", () => {
    expect(toRoman(1)).toBe("I");
    expect(toRoman(5)).toBe("V");
    expect(toRoman(10)).toBe("X");
    expect(toRoman(50)).toBe("L");
    expect(toRoman(100)).toBe("C");
    expect(toRoman(500)).toBe("D");
    expect(toRoman(1000)).toBe("M");
  });

  it("減算記法を正しく変換する", () => {
    expect(toRoman(4)).toBe("IV");
    expect(toRoman(9)).toBe("IX");
    expect(toRoman(40)).toBe("XL");
    expect(toRoman(90)).toBe("XC");
    expect(toRoman(400)).toBe("CD");
    expect(toRoman(900)).toBe("CM");
  });

  it("組み合わせを正しく変換する", () => {
    expect(toRoman(2)).toBe("II");
    expect(toRoman(3)).toBe("III");
    expect(toRoman(6)).toBe("VI");
    expect(toRoman(7)).toBe("VII");
    expect(toRoman(8)).toBe("VIII");
    expect(toRoman(11)).toBe("XI");
    expect(toRoman(14)).toBe("XIV");
    expect(toRoman(15)).toBe("XV");
    expect(toRoman(19)).toBe("XIX");
    expect(toRoman(20)).toBe("XX");
    expect(toRoman(44)).toBe("XLIV");
    expect(toRoman(49)).toBe("XLIX");
    expect(toRoman(58)).toBe("LVIII");
    expect(toRoman(99)).toBe("XCIX");
  });

  it("よく知られた年号を正しく変換する", () => {
    expect(toRoman(2024)).toBe("MMXXIV");
    expect(toRoman(1999)).toBe("MCMXCIX");
    expect(toRoman(1776)).toBe("MDCCLXXVI");
    expect(toRoman(1492)).toBe("MCDXCII");
  });

  it("最小値（1）を正しく変換する", () => {
    expect(toRoman(1)).toBe("I");
  });

  it("最大値（3999）を正しく変換する", () => {
    expect(toRoman(3999)).toBe("MMMCMXCIX");
  });

  it("範囲外（0以下）はnullを返す", () => {
    expect(toRoman(0)).toBeNull();
    expect(toRoman(-1)).toBeNull();
    expect(toRoman(-100)).toBeNull();
  });

  it("範囲外（4000以上）はnullを返す", () => {
    expect(toRoman(4000)).toBeNull();
    expect(toRoman(5000)).toBeNull();
  });

  it("非整数はnullを返す", () => {
    expect(toRoman(1.5)).toBeNull();
    expect(toRoman(3.14)).toBeNull();
    expect(toRoman(NaN)).toBeNull();
    expect(toRoman(Infinity)).toBeNull();
  });
});

describe("fromRoman - ローマ数字 → アラビア数字", () => {
  it("基本記号を正しく変換する", () => {
    expect(fromRoman("I")).toBe(1);
    expect(fromRoman("V")).toBe(5);
    expect(fromRoman("X")).toBe(10);
    expect(fromRoman("L")).toBe(50);
    expect(fromRoman("C")).toBe(100);
    expect(fromRoman("D")).toBe(500);
    expect(fromRoman("M")).toBe(1000);
  });

  it("減算記法を正しく変換する", () => {
    expect(fromRoman("IV")).toBe(4);
    expect(fromRoman("IX")).toBe(9);
    expect(fromRoman("XL")).toBe(40);
    expect(fromRoman("XC")).toBe(90);
    expect(fromRoman("CD")).toBe(400);
    expect(fromRoman("CM")).toBe(900);
  });

  it("複合的なローマ数字を正しく変換する", () => {
    expect(fromRoman("II")).toBe(2);
    expect(fromRoman("III")).toBe(3);
    expect(fromRoman("VIII")).toBe(8);
    expect(fromRoman("XIV")).toBe(14);
    expect(fromRoman("XIX")).toBe(19);
    expect(fromRoman("XLIV")).toBe(44);
    expect(fromRoman("XCIX")).toBe(99);
    expect(fromRoman("LVIII")).toBe(58);
  });

  it("よく知られた年号を正しく変換する", () => {
    expect(fromRoman("MMXXIV")).toBe(2024);
    expect(fromRoman("MCMXCIX")).toBe(1999);
    expect(fromRoman("MDCCLXXVI")).toBe(1776);
    expect(fromRoman("MCDXCII")).toBe(1492);
  });

  it("最小値（I = 1）を正しく変換する", () => {
    expect(fromRoman("I")).toBe(1);
  });

  it("最大値（MMMCMXCIX = 3999）を正しく変換する", () => {
    expect(fromRoman("MMMCMXCIX")).toBe(3999);
  });

  it("小文字でも正しく変換する", () => {
    expect(fromRoman("iv")).toBe(4);
    expect(fromRoman("mmxxiv")).toBe(2024);
    expect(fromRoman("mcmxcix")).toBe(1999);
  });

  it("前後の空白を無視する", () => {
    expect(fromRoman("  XIV  ")).toBe(14);
    expect(fromRoman(" MMXXIV ")).toBe(2024);
  });

  it("空文字列はnullを返す", () => {
    expect(fromRoman("")).toBeNull();
    expect(fromRoman("   ")).toBeNull();
  });

  it("無効な文字を含む場合はnullを返す", () => {
    expect(fromRoman("A")).toBeNull();
    expect(fromRoman("Z")).toBeNull();
    expect(fromRoman("MMMM")).toBeNull(); // 非正規形
    expect(fromRoman("123")).toBeNull();
    expect(fromRoman("XIV!")).toBeNull();
  });

  it("非正規形はnullを返す（再変換で検証）", () => {
    // 正規形ではない（IIIIは4の正規形IVではない）
    expect(fromRoman("IIII")).toBeNull();
    // VV = 10 だが、正規形はX
    expect(fromRoman("VV")).toBeNull();
    // LL = 100 だが、正規形はC
    expect(fromRoman("LL")).toBeNull();
  });
});

describe("toRoman と fromRoman の往復変換", () => {
  it("1〜3999の全整数で往復変換が一致する（代表値）", () => {
    const testValues = [
      1, 2, 3, 4, 5, 9, 10, 14, 40, 49, 50, 90, 99, 100, 399, 400, 499, 500, 899, 900, 999, 1000,
      1999, 2000, 2024, 3000, 3999,
    ];
    for (const n of testValues) {
      const roman = toRoman(n);
      expect(roman).not.toBeNull();
      expect(fromRoman(roman!)).toBe(n);
    }
  });
});
