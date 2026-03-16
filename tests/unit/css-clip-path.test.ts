import { describe, it, expect } from "vitest";
import {
  generateInsetValue,
  generateCircleValue,
  generateEllipseValue,
  generatePolygonValue,
  generateClipPathCSS,
  generateClipPathValue,
  DEFAULT_INSET,
  DEFAULT_CIRCLE,
  DEFAULT_ELLIPSE,
  DEFAULT_POLYGON,
  POLYGON_PRESETS,
} from "../../app/utils/css-clip-path";

describe("generateInsetValue", () => {
  it("角丸なしの inset 値を生成する", () => {
    const result = generateInsetValue({ top: 10, right: 10, bottom: 10, left: 10, radius: 0 });
    expect(result).toBe("10% 10% 10% 10%");
  });

  it("角丸ありの inset 値を生成する", () => {
    const result = generateInsetValue({ top: 5, right: 15, bottom: 5, left: 15, radius: 10 });
    expect(result).toBe("5% 15% 5% 15% round 10%");
  });

  it("全て0の場合を処理する", () => {
    const result = generateInsetValue({ top: 0, right: 0, bottom: 0, left: 0, radius: 0 });
    expect(result).toBe("0% 0% 0% 0%");
  });

  it("デフォルト値で正しく動作する", () => {
    const result = generateInsetValue(DEFAULT_INSET);
    expect(result).toContain("%");
    expect(result).not.toContain("round");
  });
});

describe("generateCircleValue", () => {
  it("circle の値を正しく生成する", () => {
    const result = generateCircleValue({ radius: 40, cx: 50, cy: 50 });
    expect(result).toBe("40% at 50% 50%");
  });

  it("非中心配置の circle を生成する", () => {
    const result = generateCircleValue({ radius: 30, cx: 20, cy: 80 });
    expect(result).toBe("30% at 20% 80%");
  });

  it("デフォルト値で正しく動作する", () => {
    const result = generateCircleValue(DEFAULT_CIRCLE);
    expect(result).toMatch(/\d+% at \d+% \d+%/);
  });
});

describe("generateEllipseValue", () => {
  it("ellipse の値を正しく生成する", () => {
    const result = generateEllipseValue({ rx: 40, ry: 30, cx: 50, cy: 50 });
    expect(result).toBe("40% 30% at 50% 50%");
  });

  it("非中心配置の ellipse を生成する", () => {
    const result = generateEllipseValue({ rx: 20, ry: 40, cx: 25, cy: 75 });
    expect(result).toBe("20% 40% at 25% 75%");
  });

  it("デフォルト値で正しく動作する", () => {
    const result = generateEllipseValue(DEFAULT_ELLIPSE);
    expect(result).toMatch(/\d+% \d+% at \d+% \d+%/);
  });
});

describe("generatePolygonValue", () => {
  it("三角形の polygon 値を生成する", () => {
    const result = generatePolygonValue({
      points: [
        { x: 50, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    expect(result).toBe("50% 0%, 100% 100%, 0% 100%");
  });

  it("デフォルト polygon を正しく生成する", () => {
    const result = generatePolygonValue(DEFAULT_POLYGON);
    expect(result).toContain("%");
    const commas = (result.match(/,/g) ?? []).length;
    expect(commas).toBe(DEFAULT_POLYGON.points.length - 1);
  });

  it("小数点を持つ頂点を処理する", () => {
    const result = generatePolygonValue({
      points: [
        { x: 50.5, y: 0.1 },
        { x: 99.9, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    expect(result).toContain("50.5%");
    expect(result).toContain("0.1%");
  });
});

describe("generateClipPathCSS", () => {
  it("inset の完全な CSS プロパティを生成する", () => {
    const result = generateClipPathCSS(
      "inset",
      DEFAULT_INSET,
      DEFAULT_CIRCLE,
      DEFAULT_ELLIPSE,
      DEFAULT_POLYGON
    );
    expect(result).toMatch(/^clip-path: inset\(.*\);$/);
  });

  it("circle の完全な CSS プロパティを生成する", () => {
    const result = generateClipPathCSS(
      "circle",
      DEFAULT_INSET,
      DEFAULT_CIRCLE,
      DEFAULT_ELLIPSE,
      DEFAULT_POLYGON
    );
    expect(result).toMatch(/^clip-path: circle\(.*\);$/);
  });

  it("ellipse の完全な CSS プロパティを生成する", () => {
    const result = generateClipPathCSS(
      "ellipse",
      DEFAULT_INSET,
      DEFAULT_CIRCLE,
      DEFAULT_ELLIPSE,
      DEFAULT_POLYGON
    );
    expect(result).toMatch(/^clip-path: ellipse\(.*\);$/);
  });

  it("polygon の完全な CSS プロパティを生成する", () => {
    const result = generateClipPathCSS(
      "polygon",
      DEFAULT_INSET,
      DEFAULT_CIRCLE,
      DEFAULT_ELLIPSE,
      DEFAULT_POLYGON
    );
    expect(result).toMatch(/^clip-path: polygon\(.*\);$/);
  });
});

describe("generateClipPathValue", () => {
  it("clip-path: プレフィックスなしの値を返す", () => {
    const result = generateClipPathValue(
      "circle",
      DEFAULT_INSET,
      DEFAULT_CIRCLE,
      DEFAULT_ELLIPSE,
      DEFAULT_POLYGON
    );
    expect(result).not.toContain("clip-path:");
    expect(result).not.toContain(";");
    expect(result).toMatch(/^circle\(.*\)$/);
  });
});

describe("POLYGON_PRESETS", () => {
  it("各プリセットが3頂点以上を持つ", () => {
    for (const preset of POLYGON_PRESETS) {
      expect(preset.points.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("各プリセットが名前を持つ", () => {
    for (const preset of POLYGON_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(typeof preset.name).toBe("string");
    }
  });

  it("各頂点座標が 0〜100 の範囲内", () => {
    for (const preset of POLYGON_PRESETS) {
      for (const point of preset.points) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(100);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(100);
      }
    }
  });

  it("三角形プリセットが正しい名前を持つ", () => {
    const triangle = POLYGON_PRESETS.find((p) => p.name === "三角形");
    expect(triangle).toBeDefined();
    expect(triangle!.points).toHaveLength(3);
  });
});
