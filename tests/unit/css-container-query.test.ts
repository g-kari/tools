import { describe, it, expect } from "vite-plus/test";
import {
  formatCondition,
  generateContainerCSS,
  generateQueryCSS,
  generateFullCSS,
  checkCondition,
  checkAllConditions,
  createDefaultCondition,
  defaultContainerConfig,
  defaultQueryConfig,
  type QueryCondition,
} from "../../app/utils/css-container-query";

const baseCondition = (overrides: Partial<QueryCondition> = {}): QueryCondition => ({
  id: "test-cond",
  type: "min-width",
  value: 400,
  maxValue: 800,
  unit: "px",
  ratioW: 16,
  ratioH: 9,
  ...overrides,
});

// ── formatCondition ──────────────────────────────────────────────

describe("formatCondition", () => {
  it("min-width を正しくフォーマットする", () => {
    expect(formatCondition(baseCondition({ type: "min-width", value: 400, unit: "px" }))).toBe(
      "(min-width: 400px)",
    );
  });

  it("max-width を正しくフォーマットする", () => {
    expect(formatCondition(baseCondition({ type: "max-width", value: 600, unit: "em" }))).toBe(
      "(max-width: 600em)",
    );
  });

  it("width-range を正しくフォーマットする", () => {
    const cond = baseCondition({ type: "width-range", value: 300, maxValue: 700, unit: "px" });
    expect(formatCondition(cond)).toBe("(300px <= width <= 700px)");
  });

  it("min-height を正しくフォーマットする", () => {
    expect(formatCondition(baseCondition({ type: "min-height", value: 200, unit: "px" }))).toBe(
      "(min-height: 200px)",
    );
  });

  it("max-height を正しくフォーマットする", () => {
    expect(formatCondition(baseCondition({ type: "max-height", value: 500, unit: "rem" }))).toBe(
      "(max-height: 500rem)",
    );
  });

  it("aspect-ratio を正しくフォーマットする", () => {
    const cond = baseCondition({ type: "aspect-ratio", ratioW: 16, ratioH: 9 });
    expect(formatCondition(cond)).toBe("(aspect-ratio >= 16/9)");
  });

  it("rem 単位を使用した min-width をフォーマットする", () => {
    expect(formatCondition(baseCondition({ type: "min-width", value: 25, unit: "rem" }))).toBe(
      "(min-width: 25rem)",
    );
  });
});

// ── generateContainerCSS ────────────────────────────────────────

describe("generateContainerCSS", () => {
  it("基本的なコンテナー CSS を生成する", () => {
    const css = generateContainerCSS({
      containerType: "inline-size",
      containerName: "",
      containerSelector: ".container",
    });
    expect(css).toContain(".container {");
    expect(css).toContain("container-type: inline-size;");
    expect(css).not.toContain("container-name");
  });

  it("container-name が指定された場合は含める", () => {
    const css = generateContainerCSS({
      containerType: "inline-size",
      containerName: "sidebar",
      containerSelector: ".container",
    });
    expect(css).toContain("container-name: sidebar;");
  });

  it("カスタムセレクタを使用する", () => {
    const css = generateContainerCSS({
      containerType: "size",
      containerName: "",
      containerSelector: "#main-content",
    });
    expect(css).toContain("#main-content {");
    expect(css).toContain("container-type: size;");
  });

  it("container-name が空文字の場合は省略する", () => {
    const css = generateContainerCSS({
      containerType: "normal",
      containerName: "  ",
      containerSelector: ".wrap",
    });
    expect(css).not.toContain("container-name");
  });
});

// ── generateQueryCSS ────────────────────────────────────────────

describe("generateQueryCSS", () => {
  const containerCfg = defaultContainerConfig;

  it("条件なしの場合は空文字を返す", () => {
    const result = generateQueryCSS(containerCfg, {
      ...defaultQueryConfig,
      conditions: [],
    });
    expect(result).toBe("");
  });

  it("単一条件の @container クエリを生成する", () => {
    const result = generateQueryCSS(containerCfg, {
      conditions: [baseCondition({ type: "min-width", value: 400, unit: "px" })],
      logicalOp: "and",
      targetSelector: ".card",
      innerCSS: "  display: flex;",
    });
    expect(result).toContain("@container (min-width: 400px)");
    expect(result).toContain(".card {");
    expect(result).toContain("display: flex;");
  });

  it("container-name 付きのクエリを生成する", () => {
    const result = generateQueryCSS(
      { ...containerCfg, containerName: "sidebar" },
      {
        conditions: [baseCondition({ type: "min-width", value: 300, unit: "px" })],
        logicalOp: "and",
        targetSelector: ".item",
        innerCSS: "  color: red;",
      },
    );
    expect(result).toContain("@container sidebar (min-width: 300px)");
  });

  it("AND 演算子で複数条件を結合する", () => {
    const result = generateQueryCSS(containerCfg, {
      conditions: [
        baseCondition({ id: "a", type: "min-width", value: 200, unit: "px" }),
        baseCondition({ id: "b", type: "max-width", value: 600, unit: "px" }),
      ],
      logicalOp: "and",
      targetSelector: ".card",
      innerCSS: "",
    });
    expect(result).toContain("(min-width: 200px) and (max-width: 600px)");
  });

  it("OR 演算子で複数条件を結合する", () => {
    const result = generateQueryCSS(containerCfg, {
      conditions: [
        baseCondition({ id: "a", type: "min-width", value: 200, unit: "px" }),
        baseCondition({ id: "b", type: "max-width", value: 100, unit: "px" }),
      ],
      logicalOp: "or",
      targetSelector: ".card",
      innerCSS: "",
    });
    expect(result).toContain("(min-width: 200px) or (max-width: 100px)");
  });
});

// ── generateFullCSS ─────────────────────────────────────────────

describe("generateFullCSS", () => {
  it("コンテナー定義とクエリを結合して出力する", () => {
    const css = generateFullCSS(defaultContainerConfig, defaultQueryConfig);
    expect(css).toContain("container-type: inline-size;");
    expect(css).toContain("@container");
    expect(css).toContain(".card {");
  });

  it("条件なしの場合はコンテナー定義のみ出力する", () => {
    const css = generateFullCSS(defaultContainerConfig, {
      ...defaultQueryConfig,
      conditions: [],
    });
    expect(css).toContain("container-type: inline-size;");
    expect(css).not.toContain("@container");
  });
});

// ── checkCondition ──────────────────────────────────────────────

describe("checkCondition", () => {
  it("min-width: 幅が条件以上のとき true", () => {
    expect(checkCondition(baseCondition({ type: "min-width", value: 400, unit: "px" }), 400)).toBe(
      true,
    );
    expect(checkCondition(baseCondition({ type: "min-width", value: 400, unit: "px" }), 500)).toBe(
      true,
    );
  });

  it("min-width: 幅が条件未満のとき false", () => {
    expect(checkCondition(baseCondition({ type: "min-width", value: 400, unit: "px" }), 399)).toBe(
      false,
    );
  });

  it("max-width: 幅が条件以下のとき true", () => {
    expect(checkCondition(baseCondition({ type: "max-width", value: 600, unit: "px" }), 600)).toBe(
      true,
    );
    expect(checkCondition(baseCondition({ type: "max-width", value: 600, unit: "px" }), 300)).toBe(
      true,
    );
  });

  it("max-width: 幅が条件超過のとき false", () => {
    expect(checkCondition(baseCondition({ type: "max-width", value: 600, unit: "px" }), 601)).toBe(
      false,
    );
  });

  it("width-range: 範囲内のとき true", () => {
    const cond = baseCondition({ type: "width-range", value: 300, maxValue: 700, unit: "px" });
    expect(checkCondition(cond, 300)).toBe(true);
    expect(checkCondition(cond, 500)).toBe(true);
    expect(checkCondition(cond, 700)).toBe(true);
  });

  it("width-range: 範囲外のとき false", () => {
    const cond = baseCondition({ type: "width-range", value: 300, maxValue: 700, unit: "px" });
    expect(checkCondition(cond, 299)).toBe(false);
    expect(checkCondition(cond, 701)).toBe(false);
  });

  it("min-height / max-height は常に true（プレビュー近似）", () => {
    expect(
      checkCondition(baseCondition({ type: "min-height", value: 9999, unit: "px" }), 100),
    ).toBe(true);
    expect(checkCondition(baseCondition({ type: "max-height", value: 0, unit: "px" }), 100)).toBe(
      true,
    );
  });

  it("em 単位は 16px 基準で換算する", () => {
    // 25em = 400px
    expect(checkCondition(baseCondition({ type: "min-width", value: 25, unit: "em" }), 400)).toBe(
      true,
    );
    expect(checkCondition(baseCondition({ type: "min-width", value: 25, unit: "em" }), 399)).toBe(
      false,
    );
  });
});

// ── checkAllConditions ──────────────────────────────────────────

describe("checkAllConditions", () => {
  // min-width: 300px — 300 未満で失敗
  const cond1 = baseCondition({ id: "a", type: "min-width", value: 300, unit: "px" });
  // max-width: 600px — 600 超過で失敗
  const cond2 = baseCondition({ id: "b", type: "max-width", value: 600, unit: "px" });
  // AND/OR で両方 false にするため min-width 系を2つ使う
  const condBigA = baseCondition({ id: "c", type: "min-width", value: 500, unit: "px" });
  const condBigB = baseCondition({ id: "d", type: "min-width", value: 800, unit: "px" });

  it("条件なしの場合は false を返す", () => {
    expect(checkAllConditions([], "and", 500)).toBe(false);
  });

  it("AND: 全条件を満たすとき true", () => {
    // 400px は min-width:300 を満たし max-width:600 も満たす
    expect(checkAllConditions([cond1, cond2], "and", 400)).toBe(true);
  });

  it("AND: 一つでも満たさないとき false", () => {
    // 700px は min-width:300 を満たすが max-width:600 を超過
    expect(checkAllConditions([cond1, cond2], "and", 700)).toBe(false);
  });

  it("OR: 一つでも満たすとき true", () => {
    // 700px は max-width:600 を超えるが min-width:300 を満たす → OR で true
    expect(checkAllConditions([cond1, cond2], "or", 700)).toBe(true);
  });

  it("OR: 全条件を満たさないとき false", () => {
    // 100px は min-width:500 も min-width:800 も満たさない → OR で false
    expect(checkAllConditions([condBigA, condBigB], "or", 100)).toBe(false);
  });
});

// ── createDefaultCondition ──────────────────────────────────────

describe("createDefaultCondition", () => {
  it("一意のIDを持つ条件を生成する", () => {
    const a = createDefaultCondition();
    const b = createDefaultCondition();
    expect(a.id).not.toBe(b.id);
  });

  it("デフォルト値が正しく設定されている", () => {
    const cond = createDefaultCondition();
    expect(cond.type).toBe("min-width");
    expect(cond.value).toBe(400);
    expect(cond.unit).toBe("px");
  });
});
