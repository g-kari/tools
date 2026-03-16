import { describe, it, expect } from "vitest";
import {
  parseInteger,
  formatInteger,
  toBinary32,
  formatBinaryGroups,
  computeResults,
  computeShift,
  popcount,
  getSetBits,
} from "../../app/utils/bitwise";

describe("parseInteger", () => {
  it("10進数を正しくパースする", () => {
    expect(parseInteger("42", 10)).toBe(42);
    expect(parseInteger("0", 10)).toBe(0);
    expect(parseInteger("-1", 10)).toBe(-1);
    expect(parseInteger("2147483647", 10)).toBe(2147483647);
    expect(parseInteger("-2147483648", 10)).toBe(-2147483648);
  });

  it("2進数を正しくパースする", () => {
    expect(parseInteger("1010", 2)).toBe(10);
    expect(parseInteger("0", 2)).toBe(0);
    expect(parseInteger("11111111", 2)).toBe(255);
  });

  it("8進数を正しくパースする", () => {
    expect(parseInteger("17", 8)).toBe(15);
    expect(parseInteger("0", 8)).toBe(0);
    expect(parseInteger("377", 8)).toBe(255);
  });

  it("16進数を正しくパースする", () => {
    expect(parseInteger("FF", 16)).toBe(255);
    expect(parseInteger("ff", 16)).toBe(255);
    expect(parseInteger("0", 16)).toBe(0);
    expect(parseInteger("DEADBEEF", 16)).toBe(0xdeadbeef | 0);
  });

  it("無効な入力は null を返す", () => {
    expect(parseInteger("", 10)).toBeNull();
    expect(parseInteger("abc", 10)).toBeNull();
    expect(parseInteger("2", 2)).toBeNull(); // 2進数に '2' は無効
    expect(parseInteger("8", 8)).toBeNull(); // 8進数に '8' は無効
    expect(parseInteger("G", 16)).toBeNull();
  });

  it("32ビット範囲外は null を返す", () => {
    expect(parseInteger("2147483648", 10)).toBeNull(); // > INT32_MAX
    expect(parseInteger("-2147483649", 10)).toBeNull(); // < INT32_MIN
  });

  it("空文字と '-' だけは null を返す", () => {
    expect(parseInteger("", 10)).toBeNull();
    expect(parseInteger("-", 10)).toBeNull();
  });
});

describe("formatInteger", () => {
  it("10進数でフォーマットする", () => {
    expect(formatInteger(42, 10)).toBe("42");
    expect(formatInteger(-1, 10)).toBe("-1");
    expect(formatInteger(0, 10)).toBe("0");
  });

  it("2進数でフォーマットする（負数は Two's complement）", () => {
    expect(formatInteger(10, 2)).toBe("1010");
    expect(formatInteger(0, 2)).toBe("0");
    // -1 は 32ビット Two's complement で全ビット1
    expect(formatInteger(-1, 2)).toBe("11111111111111111111111111111111");
  });

  it("16進数でフォーマットする", () => {
    expect(formatInteger(255, 16)).toBe("ff");
    expect(formatInteger(-1, 16)).toBe("-1");
    expect(formatInteger(0, 16)).toBe("0");
  });

  it("8進数でフォーマットする", () => {
    expect(formatInteger(8, 8)).toBe("10");
    expect(formatInteger(255, 8)).toBe("377");
  });
});

describe("toBinary32", () => {
  it("32ビット2進数文字列を返す", () => {
    expect(toBinary32(0).length).toBe(32);
    expect(toBinary32(1)).toBe("00000000000000000000000000000001");
    expect(toBinary32(-1)).toBe("11111111111111111111111111111111");
    expect(toBinary32(255)).toBe("00000000000000000000000011111111");
  });
});

describe("formatBinaryGroups", () => {
  it("4ビットごとにスペース区切りで表示する", () => {
    const bin = "00000000000000000000000011111111";
    const result = formatBinaryGroups(bin);
    expect(result).toBe("0000 0000 0000 0000 0000 0000 1111 1111");
  });
});

describe("computeResults", () => {
  it("AND演算を正しく計算する", () => {
    const results = computeResults(0b1010, 0b1100);
    const and = results.find((r) => r.label === "AND")!;
    expect(and.value).toBe(0b1000);
  });

  it("OR演算を正しく計算する", () => {
    const results = computeResults(0b1010, 0b1100);
    const or = results.find((r) => r.label === "OR")!;
    expect(or.value).toBe(0b1110);
  });

  it("XOR演算を正しく計算する", () => {
    const results = computeResults(0b1010, 0b1100);
    const xor = results.find((r) => r.label === "XOR")!;
    expect(xor.value).toBe(0b0110);
  });

  it("NOT A演算を正しく計算する", () => {
    const results = computeResults(0, 0);
    const notA = results.find((r) => r.label === "NOT A")!;
    expect(notA.value).toBe(-1);
  });

  it("NOT B演算を正しく計算する", () => {
    const results = computeResults(0, 0b1111);
    const notB = results.find((r) => r.label === "NOT B")!;
    expect(notB.value).toBe(~0b1111);
  });

  it("左シフトを正しく計算する", () => {
    const results = computeResults(1, 0);
    const ls = results.find((r) => r.label === "A << 1")!;
    expect(ls.value).toBe(2);
  });

  it("算術右シフトを正しく計算する", () => {
    const results = computeResults(-4, 0);
    const rs = results.find((r) => r.label === "A >> 1")!;
    expect(rs.value).toBe(-2);
  });

  it("論理右シフトを正しく計算する", () => {
    const results = computeResults(-4, 0);
    const urs = results.find((r) => r.label === "A >>> 1")!;
    // -4 >>> 1 = 2147483646
    expect(urs.value).toBe((-4 >>> 1) | 0);
  });
});

describe("computeShift", () => {
  it("左シフトを計算する", () => {
    expect(computeShift(1, 3).leftShift).toBe(8);
  });

  it("符号付き右シフトを計算する", () => {
    expect(computeShift(-8, 2).rightShift).toBe(-2);
  });

  it("符号なし右シフトを計算する", () => {
    const result = computeShift(-1, 1).unsignedRightShift;
    expect(result).toBe((-1 >>> 1) | 0);
  });

  it("シフト量が31を超えると31にクランプされる", () => {
    const r1 = computeShift(1, 31);
    const r2 = computeShift(1, 40);
    expect(r1.leftShift).toBe(r2.leftShift);
  });
});

describe("popcount", () => {
  it("セットビット数を返す", () => {
    expect(popcount(0)).toBe(0);
    expect(popcount(1)).toBe(1);
    expect(popcount(0xff)).toBe(8);
    expect(popcount(-1)).toBe(32);
    expect(popcount(0b1010)).toBe(2);
  });
});

describe("getSetBits", () => {
  it("立っているビットのポジション（LSB基準）を返す", () => {
    expect(getSetBits(1)).toEqual([0]);
    expect(getSetBits(2)).toEqual([1]);
    expect(getSetBits(0b101)).toEqual([0, 2]);
    expect(getSetBits(0)).toEqual([]);
  });
});
