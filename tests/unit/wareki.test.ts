import { describe, it, expect } from "vite-plus/test";
import {
  seirekiToWareki,
  warekiToSeireki,
  getEraNames,
  formatWareki,
  getEraPeriod,
  ERAS,
} from "../../app/utils/wareki";

describe("seirekiToWareki - 西暦 → 和暦", () => {
  it("令和の年を正しく変換する", () => {
    const result = seirekiToWareki(2024);
    expect(result).toHaveLength(1);
    expect(result[0].eraName).toBe("令和");
    expect(result[0].year).toBe(6);
    expect(result[0].westernYear).toBe(2024);
  });

  it("令和1年（2019年）を正しく変換する", () => {
    const results = seirekiToWareki(2019);
    const reiwa = results.find((r) => r.eraName === "令和");
    expect(reiwa).toBeDefined();
    expect(reiwa!.year).toBe(1);
  });

  it("平成の年を正しく変換する", () => {
    const result = seirekiToWareki(2000);
    expect(result).toHaveLength(1);
    expect(result[0].eraName).toBe("平成");
    expect(result[0].year).toBe(12);
    expect(result[0].westernYear).toBe(2000);
  });

  it("平成1年（1989年）を正しく変換する", () => {
    const results = seirekiToWareki(1989);
    const heisei = results.find((r) => r.eraName === "平成");
    expect(heisei).toBeDefined();
    expect(heisei!.year).toBe(1);
  });

  it("昭和の年を正しく変換する", () => {
    const result = seirekiToWareki(1970);
    expect(result).toHaveLength(1);
    expect(result[0].eraName).toBe("昭和");
    expect(result[0].year).toBe(45);
  });

  it("大正の年を正しく変換する", () => {
    const result = seirekiToWareki(1920);
    expect(result).toHaveLength(1);
    expect(result[0].eraName).toBe("大正");
    expect(result[0].year).toBe(9);
  });

  it("明治の年を正しく変換する", () => {
    const result = seirekiToWareki(1900);
    expect(result).toHaveLength(1);
    expect(result[0].eraName).toBe("明治");
    expect(result[0].year).toBe(33);
  });

  it("明治元年（1868年）を正しく変換する", () => {
    const result = seirekiToWareki(1868);
    const meiji = result.find((r) => r.eraName === "明治");
    expect(meiji).toBeDefined();
    expect(meiji!.year).toBe(1);
  });

  it("遷移年（2019年）は複数の結果を返す", () => {
    const results = seirekiToWareki(2019);
    expect(results.length).toBeGreaterThan(1);
    const eraNames = results.map((r) => r.eraName);
    expect(eraNames).toContain("令和");
    expect(eraNames).toContain("平成");
  });

  it("遷移年（1989年）は複数の結果を返す", () => {
    const results = seirekiToWareki(1989);
    expect(results.length).toBeGreaterThan(1);
    const eraNames = results.map((r) => r.eraName);
    expect(eraNames).toContain("平成");
    expect(eraNames).toContain("昭和");
  });

  it("1868年より前は空配列を返す", () => {
    expect(seirekiToWareki(1867)).toHaveLength(0);
    expect(seirekiToWareki(1800)).toHaveLength(0);
    expect(seirekiToWareki(0)).toHaveLength(0);
  });

  it("非整数は空配列を返す", () => {
    expect(seirekiToWareki(2024.5)).toHaveLength(0);
    expect(seirekiToWareki(NaN)).toHaveLength(0);
  });
});

describe("warekiToSeireki - 和暦 → 西暦", () => {
  it("令和6年を正しく変換する", () => {
    expect(warekiToSeireki("令和", 6)).toBe(2024);
  });

  it("令和1年を正しく変換する", () => {
    expect(warekiToSeireki("令和", 1)).toBe(2019);
  });

  it("平成31年を正しく変換する", () => {
    expect(warekiToSeireki("平成", 31)).toBe(2019);
  });

  it("平成1年を正しく変換する", () => {
    expect(warekiToSeireki("平成", 1)).toBe(1989);
  });

  it("昭和64年を正しく変換する", () => {
    expect(warekiToSeireki("昭和", 64)).toBe(1989);
  });

  it("昭和1年を正しく変換する", () => {
    expect(warekiToSeireki("昭和", 1)).toBe(1926);
  });

  it("大正15年を正しく変換する", () => {
    expect(warekiToSeireki("大正", 15)).toBe(1926);
  });

  it("大正1年を正しく変換する", () => {
    expect(warekiToSeireki("大正", 1)).toBe(1912);
  });

  it("明治45年を正しく変換する", () => {
    expect(warekiToSeireki("明治", 45)).toBe(1912);
  });

  it("明治1年を正しく変換する", () => {
    expect(warekiToSeireki("明治", 1)).toBe(1868);
  });

  it("存在しない元号はnullを返す", () => {
    expect(warekiToSeireki("大化", 1)).toBeNull();
    expect(warekiToSeireki("", 1)).toBeNull();
  });

  it("年数が0以下はnullを返す", () => {
    expect(warekiToSeireki("令和", 0)).toBeNull();
    expect(warekiToSeireki("令和", -1)).toBeNull();
  });

  it("非整数年数はnullを返す", () => {
    expect(warekiToSeireki("令和", 1.5)).toBeNull();
    expect(warekiToSeireki("令和", NaN)).toBeNull();
  });

  it("元号の有効期間を超えた年数はnullを返す（平成32年は存在しない）", () => {
    expect(warekiToSeireki("平成", 32)).toBeNull();
  });
});

describe("getEraNames", () => {
  it("元号名の配列を返す", () => {
    const names = getEraNames();
    expect(names).toContain("令和");
    expect(names).toContain("平成");
    expect(names).toContain("昭和");
    expect(names).toContain("大正");
    expect(names).toContain("明治");
  });

  it("配列の先頭は最新の元号（令和）", () => {
    expect(getEraNames()[0]).toBe("令和");
  });
});

describe("formatWareki", () => {
  it("変換結果を正しくフォーマットする", () => {
    const result = seirekiToWareki(2024)[0];
    expect(formatWareki(result)).toBe("令和6年（2024年）");
  });

  it("令和1年を正しくフォーマットする", () => {
    const result = seirekiToWareki(2019).find((r) => r.eraName === "令和");
    expect(result).toBeDefined();
    expect(formatWareki(result!)).toBe("令和1年（2019年）");
  });
});

describe("seirekiToWareki と warekiToSeireki の往復変換", () => {
  it("代表的な年で往復変換が一致する", () => {
    const testCases: Array<[string, number, number]> = [
      ["令和", 1, 2019],
      ["令和", 6, 2024],
      ["平成", 1, 1989],
      ["平成", 30, 2018],
      ["昭和", 1, 1926],
      ["昭和", 64, 1989],
      ["大正", 1, 1912],
      ["大正", 15, 1926],
      ["明治", 1, 1868],
      ["明治", 45, 1912],
    ];

    for (const [eraName, eraYear, expectedWestern] of testCases) {
      const western = warekiToSeireki(eraName, eraYear);
      expect(western).toBe(expectedWestern);

      const results = seirekiToWareki(expectedWestern);
      const match = results.find((r) => r.eraName === eraName && r.year === eraYear);
      expect(match).toBeDefined();
    }
  });
});

describe("getEraPeriod - 元号の期間テキスト", () => {
  it("令和（現存元号）は終了日が「現在」と表示される", () => {
    const reiwa = ERAS.find((e) => e.name === "令和");
    expect(reiwa).toBeDefined();
    expect(getEraPeriod(reiwa!)).toBe("2019年5月1日〜現在");
  });

  it("平成は開始日から終了日まで正しく表示される", () => {
    const heisei = ERAS.find((e) => e.name === "平成");
    expect(heisei).toBeDefined();
    expect(getEraPeriod(heisei!)).toBe("1989年1月8日〜2019年4月30日");
  });

  it("昭和は開始日から終了日まで正しく表示される", () => {
    const showa = ERAS.find((e) => e.name === "昭和");
    expect(showa).toBeDefined();
    expect(getEraPeriod(showa!)).toBe("1926年12月25日〜1989年1月7日");
  });

  it("大正は開始日から終了日まで正しく表示される", () => {
    const taisho = ERAS.find((e) => e.name === "大正");
    expect(taisho).toBeDefined();
    expect(getEraPeriod(taisho!)).toBe("1912年7月30日〜1926年12月24日");
  });

  it("明治は開始日から終了日まで正しく表示される", () => {
    const meiji = ERAS.find((e) => e.name === "明治");
    expect(meiji).toBeDefined();
    expect(getEraPeriod(meiji!)).toBe("1868年1月25日〜1912年7月29日");
  });

  it("終了元号の開始日は直前元号の終了日の翌日である（整合性チェック）", () => {
    for (let i = 0; i < ERAS.length - 1; i++) {
      const newer = ERAS[i];
      const older = ERAS[i + 1];
      expect(older.endYear).toBe(newer.startYear);
      const nextDay = new Date(Date.UTC(older.endYear!, older.endMonth! - 1, older.endDay! + 1));
      expect(nextDay.getUTCFullYear()).toBe(newer.startYear);
      expect(nextDay.getUTCMonth() + 1).toBe(newer.startMonth);
      expect(nextDay.getUTCDate()).toBe(newer.startDay);
    }
  });
});
