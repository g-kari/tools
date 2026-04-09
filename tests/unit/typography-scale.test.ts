import { describe, it, expect } from "vite-plus/test";
import {
  generateScale,
  generateCssOutput,
  generateScssOutput,
  generateJsonOutput,
  generateTailwindOutput,
  generateOutput,
  getStepLabel,
  SCALE_RATIOS,
} from "../../app/utils/typography-scale";

describe("getStepLabel", () => {
  it("既知のステップに対して正しいラベルを返す", () => {
    expect(getStepLabel(0)).toBe("base");
    expect(getStepLabel(1)).toBe("lg");
    expect(getStepLabel(2)).toBe("xl");
    expect(getStepLabel(3)).toBe("2xl");
    expect(getStepLabel(-1)).toBe("sm");
    expect(getStepLabel(-2)).toBe("xs");
    expect(getStepLabel(-3)).toBe("2xs");
  });

  it("定義外の正のステップに対して N xl 形式のラベルを返す", () => {
    expect(getStepLabel(8)).toBe("8xl");
    expect(getStepLabel(9)).toBe("9xl");
  });

  it("定義外の負のステップに対して N xs 形式のラベルを返す", () => {
    expect(getStepLabel(-5)).toBe("5xs");
  });
});

describe("generateScale", () => {
  const defaultOptions = {
    baseSizePx: 16,
    rootFontSizePx: 16,
    ratio: 1.333,
    stepsUp: 3,
    stepsDown: 2,
  };

  it("正しい数のステップを生成する", () => {
    const steps = generateScale(defaultOptions);
    // stepsDown=2, stepsUp=3 → -2 to 3 → 6 steps
    expect(steps).toHaveLength(6);
  });

  it("ステップ0（基準）のサイズが baseSizePx に等しい", () => {
    const steps = generateScale(defaultOptions);
    const baseStep = steps.find((s) => s.step === 0);
    expect(baseStep).toBeDefined();
    expect(baseStep!.sizePx).toBe(16);
  });

  it("ステップ0のサイズが 1rem になる（rootFontSizePx=baseSizePx=16 の場合）", () => {
    const steps = generateScale(defaultOptions);
    const baseStep = steps.find((s) => s.step === 0);
    expect(baseStep!.sizeRem).toBe(1);
  });

  it("上方向ステップは基準より大きい", () => {
    const steps = generateScale(defaultOptions);
    const base = steps.find((s) => s.step === 0)!;
    const larger = steps.filter((s) => s.step > 0);
    larger.forEach((s) => expect(s.sizePx).toBeGreaterThan(base.sizePx));
  });

  it("下方向ステップは基準より小さい", () => {
    const steps = generateScale(defaultOptions);
    const base = steps.find((s) => s.step === 0)!;
    const smaller = steps.filter((s) => s.step < 0);
    smaller.forEach((s) => expect(s.sizePx).toBeLessThan(base.sizePx));
  });

  it("各ステップのラベルが正しく設定される", () => {
    const steps = generateScale(defaultOptions);
    const labels = steps.map((s) => s.label);
    expect(labels).toContain("base");
    expect(labels).toContain("lg");
    expect(labels).toContain("xs");
  });

  it("各ステップのCSS変数名が正しい形式", () => {
    const steps = generateScale(defaultOptions);
    steps.forEach((s) => {
      expect(s.varName).toBe(`--type-${s.label}`);
    });
  });

  it("stepsUp=0 の場合、基準以下のステップのみ生成", () => {
    const steps = generateScale({ ...defaultOptions, stepsUp: 0 });
    expect(steps.every((s) => s.step <= 0)).toBe(true);
  });

  it("stepsDown=0 の場合、基準以上のステップのみ生成", () => {
    const steps = generateScale({ ...defaultOptions, stepsDown: 0 });
    expect(steps.every((s) => s.step >= 0)).toBe(true);
  });

  it("rootFontSizePx が異なる場合、rem が適切に計算される", () => {
    const steps = generateScale({
      ...defaultOptions,
      baseSizePx: 16,
      rootFontSizePx: 10,
    });
    const base = steps.find((s) => s.step === 0)!;
    // 16px / 10px = 1.6rem
    expect(base.sizeRem).toBeCloseTo(1.6, 4);
  });

  it("sizePx が小数第2位で丸められる", () => {
    const steps = generateScale(defaultOptions);
    steps.forEach((s) => {
      const rounded = Math.round(s.sizePx * 100) / 100;
      expect(s.sizePx).toBe(rounded);
    });
  });
});

describe("generateCssOutput", () => {
  it(":root ブロックを生成する", () => {
    const steps = generateScale({
      baseSizePx: 16,
      rootFontSizePx: 16,
      ratio: 1.333,
      stepsUp: 2,
      stepsDown: 1,
    });
    const output = generateCssOutput(steps);
    expect(output).toContain(":root {");
    expect(output).toContain("}");
  });

  it("CSS変数名が含まれる", () => {
    const steps = generateScale({
      baseSizePx: 16,
      rootFontSizePx: 16,
      ratio: 1.333,
      stepsUp: 1,
      stepsDown: 0,
    });
    const output = generateCssOutput(steps);
    expect(output).toContain("--type-base");
    expect(output).toContain("--type-lg");
  });

  it("px コメントが含まれる", () => {
    const steps = generateScale({
      baseSizePx: 16,
      rootFontSizePx: 16,
      ratio: 1.333,
      stepsUp: 0,
      stepsDown: 0,
    });
    const output = generateCssOutput(steps);
    expect(output).toContain("/* 16.00px */");
  });
});

describe("generateScssOutput", () => {
  it("SCSS変数の形式で出力する", () => {
    const steps = generateScale({
      baseSizePx: 16,
      rootFontSizePx: 16,
      ratio: 1.25,
      stepsUp: 1,
      stepsDown: 0,
    });
    const output = generateScssOutput(steps);
    expect(output).toContain("$type-base:");
    expect(output).toContain("$type-lg:");
    expect(output).toContain("rem;");
  });
});

describe("generateJsonOutput", () => {
  it("有効なJSONを出力する", () => {
    const steps = generateScale({
      baseSizePx: 16,
      rootFontSizePx: 16,
      ratio: 1.25,
      stepsUp: 1,
      stepsDown: 1,
    });
    const output = generateJsonOutput(steps);
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty("typography");
    expect(parsed.typography).toHaveProperty("base");
    expect(parsed.typography.base).toHaveProperty("px");
    expect(parsed.typography.base).toHaveProperty("rem");
  });

  it("base ステップが px=16 になる（baseSizePx=16 の場合）", () => {
    const steps = generateScale({
      baseSizePx: 16,
      rootFontSizePx: 16,
      ratio: 1.25,
      stepsUp: 0,
      stepsDown: 0,
    });
    const output = generateJsonOutput(steps);
    const parsed = JSON.parse(output);
    expect(parsed.typography.base.px).toBe(16);
  });
});

describe("generateTailwindOutput", () => {
  it("Tailwind config の形式で出力する", () => {
    const steps = generateScale({
      baseSizePx: 16,
      rootFontSizePx: 16,
      ratio: 1.25,
      stepsUp: 1,
      stepsDown: 0,
    });
    const output = generateTailwindOutput(steps);
    expect(output).toContain("tailwind.config.js");
    expect(output).toContain("fontSize:");
    expect(output).toContain('"base":');
    expect(output).toContain('"lg":');
  });
});

describe("generateOutput", () => {
  const steps = generateScale({
    baseSizePx: 16,
    rootFontSizePx: 16,
    ratio: 1.25,
    stepsUp: 1,
    stepsDown: 1,
  });

  it("css フォーマットで generateCssOutput と同じ出力", () => {
    expect(generateOutput(steps, "css")).toBe(generateCssOutput(steps));
  });

  it("scss フォーマットで generateScssOutput と同じ出力", () => {
    expect(generateOutput(steps, "scss")).toBe(generateScssOutput(steps));
  });

  it("json フォーマットで generateJsonOutput と同じ出力", () => {
    expect(generateOutput(steps, "json")).toBe(generateJsonOutput(steps));
  });

  it("tailwind フォーマットで generateTailwindOutput と同じ出力", () => {
    expect(generateOutput(steps, "tailwind")).toBe(generateTailwindOutput(steps));
  });
});

describe("SCALE_RATIOS", () => {
  it("8種類のプリセット比率が定義されている", () => {
    expect(SCALE_RATIOS).toHaveLength(8);
  });

  it("全ての比率が1より大きい", () => {
    SCALE_RATIOS.forEach((r) => {
      expect(r.value).toBeGreaterThan(1);
    });
  });

  it("Perfect Fourth が含まれる", () => {
    const pf = SCALE_RATIOS.find((r) => r.value === 1.333);
    expect(pf).toBeDefined();
  });

  it("Golden Ratio が含まれる", () => {
    const gr = SCALE_RATIOS.find((r) => r.value === 1.618);
    expect(gr).toBeDefined();
  });
});
