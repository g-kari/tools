import { describe, it, expect } from "vitest";
import {
  formatMediaCondition,
  buildMediaQuery,
  generateMediaQueryCSS,
  formatMediaQueryOutput,
  checkMediaQueryMatch,
  createDefaultMediaCondition,
  defaultMediaQueryRule,
  MEDIA_FEATURES,
  COMMON_BREAKPOINTS,
  type MediaCondition,
  type MediaQueryRule,
} from "../../app/utils/css-media-query";

// テスト用ヘルパー: 条件を作成する
function makeCond(overrides: Partial<MediaCondition> = {}): MediaCondition {
  return {
    id: "test-cond",
    feature: "min-width",
    value: 768,
    unit: "px",
    ratioW: 16,
    ratioH: 9,
    keyword: "landscape",
    ...overrides,
  };
}

// テスト用ヘルパー: ルールを作成する
function makeRule(overrides: Partial<MediaQueryRule> = {}): MediaQueryRule {
  return {
    mediaType: "screen",
    conditions: [makeCond()],
    targetSelector: ".container",
    innerCSS: "  display: flex;",
    ...overrides,
  };
}

describe("formatMediaCondition", () => {
  it("length フィーチャー (min-width px) を正しく出力する", () => {
    const cond = makeCond({ feature: "min-width", value: 768, unit: "px" });
    expect(formatMediaCondition(cond)).toBe("(min-width: 768px)");
  });

  it("length フィーチャー (max-width rem) を正しく出力する", () => {
    const cond = makeCond({ feature: "max-width", value: 48, unit: "rem" });
    expect(formatMediaCondition(cond)).toBe("(max-width: 48rem)");
  });

  it("length フィーチャー (min-height em) を正しく出力する", () => {
    const cond = makeCond({ feature: "min-height", value: 30, unit: "em" });
    expect(formatMediaCondition(cond)).toBe("(min-height: 30em)");
  });

  it("ratio フィーチャー (aspect-ratio 16/9) を正しく出力する", () => {
    const cond = makeCond({
      feature: "aspect-ratio",
      ratioW: 16,
      ratioH: 9,
    });
    expect(formatMediaCondition(cond)).toBe("(aspect-ratio: 16/9)");
  });

  it("ratio フィーチャー (min-aspect-ratio 4/3) を正しく出力する", () => {
    const cond = makeCond({
      feature: "min-aspect-ratio",
      ratioW: 4,
      ratioH: 3,
    });
    expect(formatMediaCondition(cond)).toBe("(min-aspect-ratio: 4/3)");
  });

  it("keyword フィーチャー (orientation: landscape) を正しく出力する", () => {
    const cond = makeCond({ feature: "orientation", keyword: "landscape" });
    expect(formatMediaCondition(cond)).toBe("(orientation: landscape)");
  });

  it("keyword フィーチャー (prefers-color-scheme: dark) を正しく出力する", () => {
    const cond = makeCond({
      feature: "prefers-color-scheme",
      keyword: "dark",
    });
    expect(formatMediaCondition(cond)).toBe("(prefers-color-scheme: dark)");
  });

  it("number フィーチャー (color: 8) を正しく出力する", () => {
    const cond = makeCond({ feature: "color", value: 8 });
    expect(formatMediaCondition(cond)).toBe("(color: 8)");
  });
});

describe("buildMediaQuery", () => {
  it("条件なしのルールを正しく出力する", () => {
    const rule = makeRule({ conditions: [] });
    expect(buildMediaQuery(rule)).toBe("@media screen");
  });

  it("単一条件を含むクエリを正しく出力する", () => {
    const rule = makeRule({
      mediaType: "screen",
      conditions: [makeCond({ feature: "min-width", value: 768, unit: "px" })],
    });
    expect(buildMediaQuery(rule)).toBe(
      "@media screen and (min-width: 768px)"
    );
  });

  it("複数条件を AND で結合する", () => {
    const rule = makeRule({
      conditions: [
        makeCond({ id: "c1", feature: "min-width", value: 768, unit: "px" }),
        makeCond({ id: "c2", feature: "max-width", value: 1280, unit: "px" }),
      ],
    });
    expect(buildMediaQuery(rule)).toBe(
      "@media screen and (min-width: 768px) and (max-width: 1280px)"
    );
  });

  it("mediaType all を正しく出力する", () => {
    const rule = makeRule({ mediaType: "all" });
    expect(buildMediaQuery(rule)).toContain("@media all");
  });

  it("mediaType print を正しく出力する", () => {
    const rule = makeRule({ mediaType: "print" });
    expect(buildMediaQuery(rule)).toContain("@media print");
  });
});

describe("generateMediaQueryCSS", () => {
  it("セレクタとスタイルを含む完全な CSS ブロックを生成する", () => {
    const rule = makeRule({
      targetSelector: ".container",
      innerCSS: "  display: flex;",
    });
    const css = generateMediaQueryCSS(rule);
    expect(css).toContain("@media screen");
    expect(css).toContain(".container {");
    expect(css).toContain("display: flex;");
    expect(css).toMatch(/\}/);
  });

  it("条件なしでも有効な CSS を生成する", () => {
    const rule = makeRule({ conditions: [] });
    const css = generateMediaQueryCSS(rule);
    expect(css).toContain("@media screen");
    expect(css).toContain("{");
  });

  it("innerCSS が空の場合はコメントプレースホルダーを出力する", () => {
    const rule = makeRule({ innerCSS: "" });
    const css = generateMediaQueryCSS(rule);
    expect(css).toContain("/* ここにスタイルを記述 */");
  });

  it("targetSelector が空の場合は .container をデフォルト使用する", () => {
    const rule = makeRule({ targetSelector: "" });
    const css = generateMediaQueryCSS(rule);
    expect(css).toContain(".container {");
  });
});

describe("formatMediaQueryOutput", () => {
  it("css フォーマットで @media を含む出力を返す", () => {
    const output = formatMediaQueryOutput(makeRule(), "css");
    expect(output).toContain("@media");
    expect(output).toContain("screen");
  });

  it("scss フォーマットでコメントヘッダーと @media を含む出力を返す", () => {
    const output = formatMediaQueryOutput(makeRule(), "scss");
    expect(output).toContain("@media");
    expect(output).toContain("Generated with CSS Media Query Builder");
  });

  it("json フォーマットで JSON.parse 可能な出力を返す", () => {
    const output = formatMediaQueryOutput(makeRule(), "json");
    const parsed = JSON.parse(output);
    expect(parsed.mediaType).toBe("screen");
    expect(Array.isArray(parsed.conditions)).toBe(true);
    expect(parsed.targetSelector).toBe(".container");
  });

  it("json フォーマットで length 条件の feature/value/unit が含まれる", () => {
    const output = formatMediaQueryOutput(makeRule(), "json");
    const parsed = JSON.parse(output);
    const cond = parsed.conditions[0];
    expect(cond.feature).toBe("min-width");
    expect(cond.value).toBe(768);
    expect(cond.unit).toBe("px");
  });

  it("json フォーマットで keyword 条件の feature/keyword が含まれる", () => {
    const rule = makeRule({
      conditions: [
        makeCond({ feature: "orientation", keyword: "landscape" }),
      ],
    });
    const output = formatMediaQueryOutput(rule, "json");
    const parsed = JSON.parse(output);
    expect(parsed.conditions[0].feature).toBe("orientation");
    expect(parsed.conditions[0].keyword).toBe("landscape");
  });

  it("json フォーマットで ratio 条件の ratioW/ratioH が含まれる", () => {
    const rule = makeRule({
      conditions: [makeCond({ feature: "aspect-ratio", ratioW: 16, ratioH: 9 })],
    });
    const output = formatMediaQueryOutput(rule, "json");
    const parsed = JSON.parse(output);
    expect(parsed.conditions[0].ratioW).toBe(16);
    expect(parsed.conditions[0].ratioH).toBe(9);
  });
});

describe("checkMediaQueryMatch", () => {
  it("min-width 768px: 768px → true（境界値）", () => {
    const rule = makeRule({
      conditions: [makeCond({ feature: "min-width", value: 768, unit: "px" })],
    });
    expect(checkMediaQueryMatch(rule, 768)).toBe(true);
  });

  it("min-width 768px: 767px → false", () => {
    const rule = makeRule({
      conditions: [makeCond({ feature: "min-width", value: 768, unit: "px" })],
    });
    expect(checkMediaQueryMatch(rule, 767)).toBe(false);
  });

  it("max-width 1024px: 1024px → true（境界値）", () => {
    const rule = makeRule({
      conditions: [makeCond({ feature: "max-width", value: 1024, unit: "px" })],
    });
    expect(checkMediaQueryMatch(rule, 1024)).toBe(true);
  });

  it("max-width 1024px: 1025px → false", () => {
    const rule = makeRule({
      conditions: [makeCond({ feature: "max-width", value: 1024, unit: "px" })],
    });
    expect(checkMediaQueryMatch(rule, 1025)).toBe(false);
  });

  it("min-width 48em: 768px（48*16=768）→ true", () => {
    const rule = makeRule({
      conditions: [makeCond({ feature: "min-width", value: 48, unit: "em" })],
    });
    expect(checkMediaQueryMatch(rule, 768)).toBe(true);
  });

  it("条件が空の場合は true を返す", () => {
    const rule = makeRule({ conditions: [] });
    expect(checkMediaQueryMatch(rule, 320)).toBe(true);
  });

  it("複数条件が全て満たされる場合は true を返す", () => {
    const rule = makeRule({
      conditions: [
        makeCond({ id: "c1", feature: "min-width", value: 600, unit: "px" }),
        makeCond({ id: "c2", feature: "max-width", value: 1200, unit: "px" }),
      ],
    });
    expect(checkMediaQueryMatch(rule, 800)).toBe(true);
  });

  it("複数条件のうち1つが満たされない場合は false を返す", () => {
    const rule = makeRule({
      conditions: [
        makeCond({ id: "c1", feature: "min-width", value: 600, unit: "px" }),
        makeCond({ id: "c2", feature: "max-width", value: 700, unit: "px" }),
      ],
    });
    expect(checkMediaQueryMatch(rule, 800)).toBe(false);
  });

  it("orientation landscape: 幅が大きい場合は true", () => {
    const rule = makeRule({
      conditions: [makeCond({ feature: "orientation", keyword: "landscape" })],
    });
    expect(checkMediaQueryMatch(rule, 1000)).toBe(true);
  });

  it("orientation portrait: 幅が小さい場合は true", () => {
    const rule = makeRule({
      conditions: [makeCond({ feature: "orientation", keyword: "portrait" })],
    });
    expect(checkMediaQueryMatch(rule, 400)).toBe(true);
  });
});

describe("MEDIA_FEATURES 定数", () => {
  it("配列が空でないこと", () => {
    expect(MEDIA_FEATURES.length).toBeGreaterThan(0);
  });

  it("min-width フィーチャーが存在すること", () => {
    const f = MEDIA_FEATURES.find((f) => f.name === "min-width");
    expect(f).toBeDefined();
  });

  it("各要素が name / label / valueType を持つこと", () => {
    for (const f of MEDIA_FEATURES) {
      expect(typeof f.name).toBe("string");
      expect(typeof f.label).toBe("string");
      expect(["length", "ratio", "keyword", "number"]).toContain(f.valueType);
    }
  });

  it("keyword フィーチャーには keywords 配列があること", () => {
    const keywordFeatures = MEDIA_FEATURES.filter(
      (f) => f.valueType === "keyword"
    );
    expect(keywordFeatures.length).toBeGreaterThan(0);
    for (const f of keywordFeatures) {
      expect(Array.isArray(f.keywords)).toBe(true);
      expect((f.keywords ?? []).length).toBeGreaterThan(0);
    }
  });
});

describe("COMMON_BREAKPOINTS 定数", () => {
  it("配列が空でないこと", () => {
    expect(COMMON_BREAKPOINTS.length).toBeGreaterThan(0);
  });

  it("各要素が label / value / unit を持つこと", () => {
    for (const bp of COMMON_BREAKPOINTS) {
      expect(typeof bp.label).toBe("string");
      expect(typeof bp.value).toBe("number");
      expect(["px", "em", "rem"]).toContain(bp.unit);
    }
  });

  it("md ブレイクポイント（768px）が存在すること", () => {
    const md = COMMON_BREAKPOINTS.find(
      (bp) => bp.value === 768 && bp.unit === "px"
    );
    expect(md).toBeDefined();
  });
});

describe("createDefaultMediaCondition", () => {
  it("一意の ID を持つこと（2回呼び出して異なる ID）", () => {
    const c1 = createDefaultMediaCondition();
    const c2 = createDefaultMediaCondition();
    expect(c1.id).not.toBe(c2.id);
  });

  it("デフォルトの feature が min-width であること", () => {
    const cond = createDefaultMediaCondition();
    expect(cond.feature).toBe("min-width");
  });

  it("デフォルトの value が 768 であること", () => {
    const cond = createDefaultMediaCondition();
    expect(cond.value).toBe(768);
  });

  it("デフォルトの unit が px であること", () => {
    const cond = createDefaultMediaCondition();
    expect(cond.unit).toBe("px");
  });
});

describe("defaultMediaQueryRule", () => {
  it("mediaType が screen であること", () => {
    expect(defaultMediaQueryRule.mediaType).toBe("screen");
  });

  it("conditions が1件以上あること", () => {
    expect(defaultMediaQueryRule.conditions.length).toBeGreaterThan(0);
  });

  it("targetSelector が空でないこと", () => {
    expect(defaultMediaQueryRule.targetSelector.length).toBeGreaterThan(0);
  });
});
