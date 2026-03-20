import { describe, it, expect } from "vitest";
import {
  convertStorage,
  formatStorageValue,
  getStorageUnit,
  STORAGE_UNITS,
  STORAGE_UNIT_GROUPS,
  GROUP_LABELS,
} from "../../app/utils/storage-converter";

describe("STORAGE_UNITS", () => {
  it("すべての単位が定義されていること", () => {
    const ids = STORAGE_UNITS.map((u) => u.id);
    expect(ids).toContain("bit");
    expect(ids).toContain("B");
    expect(ids).toContain("KB");
    expect(ids).toContain("MB");
    expect(ids).toContain("GB");
    expect(ids).toContain("TB");
    expect(ids).toContain("PB");
    expect(ids).toContain("KiB");
    expect(ids).toContain("MiB");
    expect(ids).toContain("GiB");
    expect(ids).toContain("TiB");
    expect(ids).toContain("PiB");
  });

  it("各単位のbytesPerUnitが正の値であること", () => {
    for (const unit of STORAGE_UNITS) {
      expect(unit.bytesPerUnit).toBeGreaterThan(0);
    }
  });

  it("SI単位が10の累乗であること", () => {
    expect(STORAGE_UNITS.find((u) => u.id === "KB")?.bytesPerUnit).toBe(1_000);
    expect(STORAGE_UNITS.find((u) => u.id === "MB")?.bytesPerUnit).toBe(
      1_000_000
    );
    expect(STORAGE_UNITS.find((u) => u.id === "GB")?.bytesPerUnit).toBe(
      1_000_000_000
    );
  });

  it("IEC単位が2の累乗であること", () => {
    expect(STORAGE_UNITS.find((u) => u.id === "KiB")?.bytesPerUnit).toBe(1024);
    expect(STORAGE_UNITS.find((u) => u.id === "MiB")?.bytesPerUnit).toBe(
      1024 ** 2
    );
    expect(STORAGE_UNITS.find((u) => u.id === "GiB")?.bytesPerUnit).toBe(
      1024 ** 3
    );
  });
});

describe("convertStorage", () => {
  it("1GBを全単位に正しく変換すること", () => {
    const results = convertStorage(1, "GB");
    const map = Object.fromEntries(results.map((r) => [r.unitId, r.value]));

    expect(map["bit"]).toBeCloseTo(8_000_000_000);
    expect(map["B"]).toBe(1_000_000_000);
    expect(map["KB"]).toBe(1_000_000);
    expect(map["MB"]).toBe(1_000);
    expect(map["GB"]).toBe(1);
    expect(map["TB"]).toBeCloseTo(0.001);
    expect(map["PB"]).toBeCloseTo(0.000001);
  });

  it("1GiBを全単位に正しく変換すること", () => {
    const results = convertStorage(1, "GiB");
    const map = Object.fromEntries(results.map((r) => [r.unitId, r.value]));

    expect(map["B"]).toBe(1_073_741_824);
    expect(map["KiB"]).toBeCloseTo(1_048_576);
    expect(map["MiB"]).toBeCloseTo(1_024);
    expect(map["GiB"]).toBe(1);
    expect(map["TiB"]).toBeCloseTo(1 / 1024);
  });

  it("1バイトをビットに変換すること", () => {
    const results = convertStorage(1, "B");
    const map = Object.fromEntries(results.map((r) => [r.unitId, r.value]));
    expect(map["bit"]).toBe(8);
  });

  it("8ビットを1バイトに変換すること", () => {
    const results = convertStorage(8, "bit");
    const map = Object.fromEntries(results.map((r) => [r.unitId, r.value]));
    expect(map["B"]).toBe(1);
  });

  it("0を入力したとき全単位が0であること", () => {
    const results = convertStorage(0, "GB");
    for (const r of results) {
      expect(r.value).toBe(0);
    }
  });

  it("NaNを入力したとき空配列を返すこと", () => {
    expect(convertStorage(NaN, "GB")).toEqual([]);
  });

  it("Infinityを入力したとき空配列を返すこと", () => {
    expect(convertStorage(Infinity, "GB")).toEqual([]);
  });

  it("負の値を入力したとき空配列を返すこと", () => {
    expect(convertStorage(-1, "GB")).toEqual([]);
  });

  it("存在しない単位IDを入力したとき空配列を返すこと", () => {
    expect(convertStorage(1, "INVALID")).toEqual([]);
  });

  it("結果がすべてのSTORAGE_UNITSを含むこと", () => {
    const results = convertStorage(1, "B");
    expect(results.length).toBe(STORAGE_UNITS.length);
    const ids = results.map((r) => r.unitId);
    for (const unit of STORAGE_UNITS) {
      expect(ids).toContain(unit.id);
    }
  });

  it("1KB = 1000B の変換", () => {
    const results = convertStorage(1, "KB");
    const map = Object.fromEntries(results.map((r) => [r.unitId, r.value]));
    expect(map["B"]).toBe(1000);
  });

  it("1KiB = 1024B の変換", () => {
    const results = convertStorage(1, "KiB");
    const map = Object.fromEntries(results.map((r) => [r.unitId, r.value]));
    expect(map["B"]).toBe(1024);
  });

  it("1TB = 1000GB の変換", () => {
    const results = convertStorage(1, "TB");
    const map = Object.fromEntries(results.map((r) => [r.unitId, r.value]));
    expect(map["GB"]).toBe(1000);
  });

  it("小数値を入力できること", () => {
    const results = convertStorage(1.5, "GB");
    const map = Object.fromEntries(results.map((r) => [r.unitId, r.value]));
    expect(map["MB"]).toBeCloseTo(1500);
  });
});

describe("formatStorageValue", () => {
  it("0を'0'にフォーマットすること", () => {
    expect(formatStorageValue(0)).toBe("0");
  });

  it("整数を整数文字列にフォーマットすること", () => {
    expect(formatStorageValue(1000)).toBe("1000");
    expect(formatStorageValue(1)).toBe("1");
  });

  it("小数を適切な精度でフォーマットすること", () => {
    const result = formatStorageValue(0.001);
    expect(result).toBeTruthy();
    expect(parseFloat(result)).toBeCloseTo(0.001);
  });

  it("無限大を'—'にフォーマットすること", () => {
    expect(formatStorageValue(Infinity)).toBe("—");
    expect(formatStorageValue(-Infinity)).toBe("—");
  });

  it("極大値を指数表記にフォーマットすること", () => {
    const result = formatStorageValue(1e20);
    expect(result).toContain("e");
  });

  it("極小値を指数表記にフォーマットすること", () => {
    const result = formatStorageValue(1e-8);
    expect(result).toContain("e");
  });
});

describe("getStorageUnit", () => {
  it("存在するIDで正しい単位を返すこと", () => {
    const unit = getStorageUnit("GB");
    expect(unit).toBeDefined();
    expect(unit?.abbr).toBe("GB");
    expect(unit?.group).toBe("decimal");
  });

  it("存在しないIDでundefinedを返すこと", () => {
    expect(getStorageUnit("INVALID")).toBeUndefined();
  });
});

describe("STORAGE_UNIT_GROUPS", () => {
  it("bitsグループにbitが含まれること", () => {
    expect(STORAGE_UNIT_GROUPS.bits.map((u) => u.id)).toContain("bit");
  });

  it("decimalグループにKB/MB/GBが含まれること", () => {
    const ids = STORAGE_UNIT_GROUPS.decimal.map((u) => u.id);
    expect(ids).toContain("KB");
    expect(ids).toContain("MB");
    expect(ids).toContain("GB");
  });

  it("binaryグループにKiB/MiB/GiBが含まれること", () => {
    const ids = STORAGE_UNIT_GROUPS.binary.map((u) => u.id);
    expect(ids).toContain("KiB");
    expect(ids).toContain("MiB");
    expect(ids).toContain("GiB");
  });
});

describe("GROUP_LABELS", () => {
  it("すべてのグループにラベルが定義されていること", () => {
    expect(GROUP_LABELS.bits).toBeTruthy();
    expect(GROUP_LABELS.decimal).toBeTruthy();
    expect(GROUP_LABELS.binary).toBeTruthy();
  });
});
