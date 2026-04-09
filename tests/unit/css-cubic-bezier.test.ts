import { describe, it, expect } from "vite-plus/test";
import {
  clamp,
  round3,
  formatCubicBezier,
  generateTimingFunctionCSS,
  computeBezierPoint,
  BEZIER_PRESETS,
} from "../../app/utils/css-cubic-bezier";

describe("clamp", () => {
  it("範囲内の値をそのまま返す", () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it("最小値より小さい場合は最小値を返す", () => {
    expect(clamp(-0.1, 0, 1)).toBe(0);
  });

  it("最大値より大きい場合は最大値を返す", () => {
    expect(clamp(1.5, 0, 1)).toBe(1);
  });

  it("境界値の最小は返す", () => {
    expect(clamp(0, 0, 1)).toBe(0);
  });

  it("境界値の最大は返す", () => {
    expect(clamp(1, 0, 1)).toBe(1);
  });

  it("負の範囲にも対応する", () => {
    expect(clamp(-3, -2, 2)).toBe(-2);
    expect(clamp(3, -2, 2)).toBe(2);
    expect(clamp(0, -2, 2)).toBe(0);
  });
});

describe("round3", () => {
  it("小数点以下3桁に丸める", () => {
    expect(round3(0.1234)).toBe(0.123);
  });

  it("小数点以下4桁目を四捨五入する", () => {
    expect(round3(0.1235)).toBe(0.124);
  });

  it("整数はそのまま返す", () => {
    expect(round3(1)).toBe(1);
  });

  it("0を返す", () => {
    expect(round3(0)).toBe(0);
  });

  it("負の値も丸める", () => {
    expect(round3(-0.5678)).toBe(-0.568);
  });
});

describe("formatCubicBezier", () => {
  it("cubic-bezier() 文字列を生成する", () => {
    expect(formatCubicBezier(0.25, 0.1, 0.25, 1)).toBe(
      "cubic-bezier(0.25, 0.1, 0.25, 1)"
    );
  });

  it("ease プリセット相当の値を生成する", () => {
    expect(formatCubicBezier(0.25, 0.1, 0.25, 1)).toBe(
      "cubic-bezier(0.25, 0.1, 0.25, 1)"
    );
  });

  it("linear 相当 (0, 0, 1, 1) を生成する", () => {
    expect(formatCubicBezier(0, 0, 1, 1)).toBe("cubic-bezier(0, 0, 1, 1)");
  });

  it("y値が範囲外 (バウンス) でも生成する", () => {
    const result = formatCubicBezier(0.34, 1.56, 0.64, 1);
    expect(result).toBe("cubic-bezier(0.34, 1.56, 0.64, 1)");
  });

  it("負のy値でも生成する", () => {
    const result = formatCubicBezier(0.36, 0, 0.66, -0.56);
    expect(result).toBe("cubic-bezier(0.36, 0, 0.66, -0.56)");
  });

  it("値を小数点以下3桁に丸める", () => {
    const result = formatCubicBezier(0.12345, 0.6789, 0.5, 1);
    expect(result).toBe("cubic-bezier(0.123, 0.679, 0.5, 1)");
  });
});

describe("generateTimingFunctionCSS", () => {
  it("transition-timing-function 宣言を含む", () => {
    const result = generateTimingFunctionCSS(0.25, 0.1, 0.25, 1);
    expect(result).toContain("transition-timing-function:");
    expect(result).toContain("cubic-bezier(0.25, 0.1, 0.25, 1)");
  });

  it("animation-timing-function 宣言を含む", () => {
    const result = generateTimingFunctionCSS(0.25, 0.1, 0.25, 1);
    expect(result).toContain("animation-timing-function:");
  });

  it("2行の宣言を生成する", () => {
    const result = generateTimingFunctionCSS(0, 0, 1, 1);
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
  });

  it("両行に同じcubic-bezier値を含む", () => {
    const result = generateTimingFunctionCSS(0.42, 0, 0.58, 1);
    const bezier = "cubic-bezier(0.42, 0, 0.58, 1)";
    const occurrences = (result.match(new RegExp(bezier.replace("(", "\\(").replace(")", "\\)"), "g")) ?? []).length;
    expect(occurrences).toBe(2);
  });
});

describe("computeBezierPoint", () => {
  it("t=0 のとき (0, 0) を返す", () => {
    const { x, y } = computeBezierPoint(0, 0.25, 0.1, 0.25, 1);
    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(0, 5);
  });

  it("t=1 のとき (1, 1) を返す", () => {
    const { x, y } = computeBezierPoint(1, 0.25, 0.1, 0.25, 1);
    expect(x).toBeCloseTo(1, 5);
    expect(y).toBeCloseTo(1, 5);
  });

  it("linear (0,0,1,1) の場合 t=0.5 で x≈0.5, y≈0.5 を返す", () => {
    const { x, y } = computeBezierPoint(0.5, 0, 0, 1, 1);
    expect(x).toBeCloseTo(0.5, 2);
    expect(y).toBeCloseTo(0.5, 2);
  });

  it("t は 0〜1 の範囲で有効な座標を返す", () => {
    for (let t = 0; t <= 1; t += 0.1) {
      const { x, y } = computeBezierPoint(t, 0.25, 0.1, 0.25, 1);
      expect(x).toBeGreaterThanOrEqual(-0.01);
      expect(x).toBeLessThanOrEqual(1.01);
      // y は control points によっては範囲外になりうる
      expect(typeof y).toBe("number");
    }
  });
});

describe("BEZIER_PRESETS", () => {
  it("1つ以上のプリセットが存在する", () => {
    expect(BEZIER_PRESETS.length).toBeGreaterThan(0);
  });

  it("各プリセットが必要なフィールドを持つ", () => {
    for (const preset of BEZIER_PRESETS) {
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("description");
      expect(preset).toHaveProperty("x1");
      expect(preset).toHaveProperty("y1");
      expect(preset).toHaveProperty("x2");
      expect(preset).toHaveProperty("y2");
    }
  });

  it("x1 と x2 は 0〜1 の範囲内", () => {
    for (const preset of BEZIER_PRESETS) {
      expect(preset.x1).toBeGreaterThanOrEqual(0);
      expect(preset.x1).toBeLessThanOrEqual(1);
      expect(preset.x2).toBeGreaterThanOrEqual(0);
      expect(preset.x2).toBeLessThanOrEqual(1);
    }
  });

  it("各プリセットから有効な cubic-bezier() 文字列を生成できる", () => {
    for (const preset of BEZIER_PRESETS) {
      const css = formatCubicBezier(preset.x1, preset.y1, preset.x2, preset.y2);
      expect(css).toMatch(/^cubic-bezier\(/);
      expect(css).toMatch(/\)$/);
    }
  });

  it("linear プリセットが存在する", () => {
    const linear = BEZIER_PRESETS.find((p) => p.name === "linear");
    expect(linear).toBeDefined();
    expect(linear?.x1).toBe(0);
    expect(linear?.y1).toBe(0);
    expect(linear?.x2).toBe(1);
    expect(linear?.y2).toBe(1);
  });

  it("ease プリセットが存在する", () => {
    const ease = BEZIER_PRESETS.find((p) => p.name === "ease");
    expect(ease).toBeDefined();
  });
});
