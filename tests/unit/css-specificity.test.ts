import { describe, it, expect } from "vite-plus/test";
import {
  calculateSpecificity,
  specificityToString,
  specificityToNumber,
  compareSpecificity,
  parseSpecificityEntry,
  SPECIFICITY_SAMPLES,
} from "../../app/utils/css-specificity";

describe("calculateSpecificity", () => {
  describe("ユニバーサルセレクター・コンビネーター", () => {
    it("* は詳細度 0,0,0 を返す", () => {
      expect(calculateSpecificity("*")).toEqual({ ids: 0, classes: 0, types: 0 });
    });

    it("コンビネーターのみは詳細度 0,0,0 を返す", () => {
      expect(calculateSpecificity("> + ~")).toEqual({ ids: 0, classes: 0, types: 0 });
    });
  });

  describe("タイプセレクター", () => {
    it("単一タイプ: div → (0, 0, 1)", () => {
      expect(calculateSpecificity("div")).toEqual({ ids: 0, classes: 0, types: 1 });
    });

    it("複数タイプ: ul li → (0, 0, 2)", () => {
      expect(calculateSpecificity("ul li")).toEqual({ ids: 0, classes: 0, types: 2 });
    });

    it("子孫・子コンビネーター: div > p → (0, 0, 2)", () => {
      expect(calculateSpecificity("div > p")).toEqual({ ids: 0, classes: 0, types: 2 });
    });

    it("隣接セレクター: p + span → (0, 0, 2)", () => {
      expect(calculateSpecificity("p + span")).toEqual({ ids: 0, classes: 0, types: 2 });
    });
  });

  describe("クラスセレクター", () => {
    it(".class → (0, 1, 0)", () => {
      expect(calculateSpecificity(".class")).toEqual({ ids: 0, classes: 1, types: 0 });
    });

    it(".a.b → (0, 2, 0)", () => {
      expect(calculateSpecificity(".a.b")).toEqual({ ids: 0, classes: 2, types: 0 });
    });

    it("li.class → (0, 1, 1)", () => {
      expect(calculateSpecificity("li.class")).toEqual({ ids: 0, classes: 1, types: 1 });
    });
  });

  describe("IDセレクター", () => {
    it("#id → (1, 0, 0)", () => {
      expect(calculateSpecificity("#id")).toEqual({ ids: 1, classes: 0, types: 0 });
    });

    it("#id.class → (1, 1, 0)", () => {
      expect(calculateSpecificity("#id.class")).toEqual({ ids: 1, classes: 1, types: 0 });
    });

    it("#id#id2 → (2, 0, 0)", () => {
      expect(calculateSpecificity("#id#id2")).toEqual({ ids: 2, classes: 0, types: 0 });
    });
  });

  describe("属性セレクター", () => {
    it('[type="text"] → (0, 1, 0)', () => {
      expect(calculateSpecificity('[type="text"]')).toEqual({ ids: 0, classes: 1, types: 0 });
    });

    it("[href] → (0, 1, 0)", () => {
      expect(calculateSpecificity("[href]")).toEqual({ ids: 0, classes: 1, types: 0 });
    });

    it("a[href] → (0, 1, 1)", () => {
      expect(calculateSpecificity("a[href]")).toEqual({ ids: 0, classes: 1, types: 1 });
    });
  });

  describe("擬似クラス", () => {
    it(":hover → (0, 1, 0)", () => {
      expect(calculateSpecificity(":hover")).toEqual({ ids: 0, classes: 1, types: 0 });
    });

    it("a:hover → (0, 1, 1)", () => {
      expect(calculateSpecificity("a:hover")).toEqual({ ids: 0, classes: 1, types: 1 });
    });

    it(":first-child → (0, 1, 0)", () => {
      expect(calculateSpecificity(":first-child")).toEqual({ ids: 0, classes: 1, types: 0 });
    });

    it(":nth-child(2) → (0, 1, 0)", () => {
      expect(calculateSpecificity(":nth-child(2)")).toEqual({ ids: 0, classes: 1, types: 0 });
    });

    it(":focus-visible → (0, 1, 0)", () => {
      expect(calculateSpecificity(":focus-visible")).toEqual({ ids: 0, classes: 1, types: 0 });
    });
  });

  describe("擬似要素", () => {
    it("::before → (0, 0, 1)", () => {
      expect(calculateSpecificity("::before")).toEqual({ ids: 0, classes: 0, types: 1 });
    });

    it("::after → (0, 0, 1)", () => {
      expect(calculateSpecificity("::after")).toEqual({ ids: 0, classes: 0, types: 1 });
    });

    it("p::first-line → (0, 0, 2)", () => {
      expect(calculateSpecificity("p::first-line")).toEqual({ ids: 0, classes: 0, types: 2 });
    });

    it("レガシー :before → (0, 0, 1)", () => {
      expect(calculateSpecificity(":before")).toEqual({ ids: 0, classes: 0, types: 1 });
    });

    it("レガシー :after → (0, 0, 1)", () => {
      expect(calculateSpecificity(":after")).toEqual({ ids: 0, classes: 0, types: 1 });
    });
  });

  describe("複合セレクター", () => {
    it("#header .nav li:first-child → (1, 2, 1)", () => {
      expect(calculateSpecificity("#header .nav li:first-child")).toEqual({
        ids: 1,
        classes: 2,
        types: 1,
      });
    });

    it(".nav > li.active → (0, 2, 1)", () => {
      expect(calculateSpecificity(".nav > li.active")).toEqual({
        ids: 0,
        classes: 2,
        types: 1,
      });
    });

    it("#id .class div::before → (1, 1, 2)", () => {
      expect(calculateSpecificity("#id .class div::before")).toEqual({
        ids: 1,
        classes: 1,
        types: 2,
      });
    });
  });

  describe(":not() 擬似クラス", () => {
    it(":not(.foo) → (0, 1, 0) - .foo の詳細度を使用", () => {
      expect(calculateSpecificity(":not(.foo)")).toEqual({ ids: 0, classes: 1, types: 0 });
    });

    it(":not(#id) → (1, 0, 0) - #id の詳細度を使用", () => {
      expect(calculateSpecificity(":not(#id)")).toEqual({ ids: 1, classes: 0, types: 0 });
    });

    it(":not(div) → (0, 0, 1) - div の詳細度を使用", () => {
      expect(calculateSpecificity(":not(div)")).toEqual({ ids: 0, classes: 0, types: 1 });
    });
  });

  describe(":is() 擬似クラス", () => {
    it(":is(.a, .b) → (0, 1, 0) - 最も高い詳細度を使用", () => {
      expect(calculateSpecificity(":is(.a, .b)")).toEqual({ ids: 0, classes: 1, types: 0 });
    });

    it(":is(.a, #id) → (1, 0, 0) - #id の詳細度を使用", () => {
      expect(calculateSpecificity(":is(.a, #id)")).toEqual({ ids: 1, classes: 0, types: 0 });
    });

    it(":is(h1, h2, h3) → (0, 0, 1) - タイプの詳細度を使用", () => {
      expect(calculateSpecificity(":is(h1, h2, h3)")).toEqual({ ids: 0, classes: 0, types: 1 });
    });
  });

  describe(":where() 擬似クラス", () => {
    it(":where(.foo) → (0, 0, 0) - 詳細度0", () => {
      expect(calculateSpecificity(":where(.foo)")).toEqual({ ids: 0, classes: 0, types: 0 });
    });

    it(":where(#id) → (0, 0, 0) - 詳細度0", () => {
      expect(calculateSpecificity(":where(#id)")).toEqual({ ids: 0, classes: 0, types: 0 });
    });

    it(":where(.wrapper) p → (0, 0, 1) - pのみカウント", () => {
      expect(calculateSpecificity(":where(.wrapper) p")).toEqual({
        ids: 0,
        classes: 0,
        types: 1,
      });
    });
  });

  describe(":has() 擬似クラス", () => {
    it(":has(.foo) → (0, 1, 0)", () => {
      expect(calculateSpecificity(":has(.foo)")).toEqual({ ids: 0, classes: 1, types: 0 });
    });

    it("div:has(> .active) → (0, 1, 1)", () => {
      expect(calculateSpecificity("div:has(> .active)")).toEqual({
        ids: 0,
        classes: 1,
        types: 1,
      });
    });
  });

  describe("空・特殊ケース", () => {
    it("空文字列 → (0, 0, 0)", () => {
      expect(calculateSpecificity("")).toEqual({ ids: 0, classes: 0, types: 0 });
    });

    it("空白のみ → (0, 0, 0)", () => {
      expect(calculateSpecificity("   ")).toEqual({ ids: 0, classes: 0, types: 0 });
    });
  });
});

describe("specificityToString", () => {
  it("(0, 0, 0) の文字列表現", () => {
    expect(specificityToString({ ids: 0, classes: 0, types: 0 })).toBe("(0, 0, 0)");
  });

  it("(1, 2, 3) の文字列表現", () => {
    expect(specificityToString({ ids: 1, classes: 2, types: 3 })).toBe("(1, 2, 3)");
  });
});

describe("specificityToNumber", () => {
  it("(0, 0, 0) → 0", () => {
    expect(specificityToNumber({ ids: 0, classes: 0, types: 0 })).toBe(0);
  });

  it("(1, 0, 0) → 10000", () => {
    expect(specificityToNumber({ ids: 1, classes: 0, types: 0 })).toBe(10000);
  });

  it("(0, 1, 0) → 100", () => {
    expect(specificityToNumber({ ids: 0, classes: 1, types: 0 })).toBe(100);
  });

  it("(0, 0, 1) → 1", () => {
    expect(specificityToNumber({ ids: 0, classes: 0, types: 1 })).toBe(1);
  });

  it("(1, 2, 3) → 10203", () => {
    expect(specificityToNumber({ ids: 1, classes: 2, types: 3 })).toBe(10203);
  });
});

describe("compareSpecificity", () => {
  it("#id > .class: 正の数を返す（IDが高い）", () => {
    const id = calculateSpecificity("#id");
    const cls = calculateSpecificity(".class");
    expect(compareSpecificity(id, cls)).toBeGreaterThan(0);
  });

  it(".class > div: 正の数を返す（クラスが高い）", () => {
    const cls = calculateSpecificity(".class");
    const type = calculateSpecificity("div");
    expect(compareSpecificity(cls, type)).toBeGreaterThan(0);
  });

  it("同じ詳細度: 0を返す", () => {
    const a = calculateSpecificity(".foo");
    const b = calculateSpecificity(".bar");
    expect(compareSpecificity(a, b)).toBe(0);
  });
});

describe("parseSpecificityEntry", () => {
  it("有効なセレクターをパースする", () => {
    const entry = parseSpecificityEntry(".foo");
    expect(entry.selector).toBe(".foo");
    expect(entry.specificity).toEqual({ ids: 0, classes: 1, types: 0 });
    expect(entry.error).toBeUndefined();
  });

  it("空文字列はエラーを返す", () => {
    const entry = parseSpecificityEntry("");
    expect(entry.error).toBeDefined();
  });

  it("空白のみはエラーを返す", () => {
    const entry = parseSpecificityEntry("   ");
    expect(entry.error).toBeDefined();
  });
});

describe("SPECIFICITY_SAMPLES", () => {
  it("サンプルが存在する", () => {
    expect(SPECIFICITY_SAMPLES.length).toBeGreaterThan(0);
  });

  it("全サンプルが selector と description を持つ", () => {
    for (const sample of SPECIFICITY_SAMPLES) {
      expect(sample.selector).toBeTruthy();
      expect(sample.description).toBeTruthy();
    }
  });

  it("* サンプルの詳細度が (0, 0, 0) である", () => {
    const universal = SPECIFICITY_SAMPLES.find((s) => s.selector === "*");
    expect(universal).toBeDefined();
    const spec = calculateSpecificity(universal!.selector);
    expect(spec).toEqual({ ids: 0, classes: 0, types: 0 });
  });

  it("#id サンプルの詳細度が (1, 0, 0) 以上である", () => {
    const idSample = SPECIFICITY_SAMPLES.find((s) => s.selector === "#id");
    if (idSample) {
      const spec = calculateSpecificity(idSample.selector);
      expect(spec.ids).toBeGreaterThan(0);
    }
  });
});
