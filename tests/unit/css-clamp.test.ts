import { describe, it, expect } from "vite-plus/test";
import {
  calculateFluid,
  validateFluidConfig,
  DEFAULT_FLUID_CONFIG,
  FLUID_PRESETS,
} from "../../app/utils/css-clamp";

describe("calculateFluid", () => {
  it("デフォルト設定で clamp() 値を生成する", () => {
    const result = calculateFluid(DEFAULT_FLUID_CONFIG);
    expect(result.clampValue).toMatch(/^clamp\(/);
    expect(result.clampValue).toContain("vw");
  });

  it("CSS カスタムプロパティを生成する", () => {
    const result = calculateFluid(DEFAULT_FLUID_CONFIG);
    expect(result.cssVar).toMatch(/^--fluid-value:/);
  });

  it("SCSS 変数を生成する", () => {
    const result = calculateFluid(DEFAULT_FLUID_CONFIG);
    expect(result.scssVar).toMatch(/^\$fluid-value:/);
  });

  it("px 単位で正しい slope を計算する", () => {
    // minPx=16, maxPx=24, minVp=320, maxVp=1280
    // slope = (24-16) / (1280-320) = 8/960 = 0.008333...
    const result = calculateFluid(DEFAULT_FLUID_CONFIG);
    expect(result.slope).toBeCloseTo(8 / 960, 5);
  });

  it("px 単位で正しい yIntercept を計算する", () => {
    // yIntercept = 16 - 0.008333 * 320 = 16 - 2.6667 = 13.3333
    const result = calculateFluid(DEFAULT_FLUID_CONFIG);
    expect(result.yInterceptPx).toBeCloseTo(16 - (8 / 960) * 320, 5);
  });

  it("rem 単位で clamp() 値を生成する", () => {
    const result = calculateFluid({
      minValue: 1,
      maxValue: 1.5,
      minViewport: 320,
      maxViewport: 1280,
      unit: "rem",
      remBase: 16,
    });
    expect(result.clampValue).toContain("rem");
    expect(result.clampValue).not.toContain("px");
  });

  it("プレビューポイントが 13 個生成される", () => {
    const result = calculateFluid(DEFAULT_FLUID_CONFIG);
    expect(result.points).toHaveLength(13);
  });

  it("minViewport でクランプされていない", () => {
    const result = calculateFluid(DEFAULT_FLUID_CONFIG);
    const minPt = result.points.find((p) => p.viewport === DEFAULT_FLUID_CONFIG.minViewport);
    if (minPt) {
      expect(minPt.clamped).toBe(false);
    }
  });

  it("maxViewport でクランプされていない", () => {
    const result = calculateFluid(DEFAULT_FLUID_CONFIG);
    const maxPt = result.points.find((p) => p.viewport === DEFAULT_FLUID_CONFIG.maxViewport);
    if (maxPt) {
      expect(maxPt.clamped).toBe(false);
    }
  });

  it("最小ビューポートより小さい場合はクランプされる", () => {
    const result = calculateFluid(DEFAULT_FLUID_CONFIG);
    const smallPt = result.points[0]; // startVp = minVp - range * 0.2
    expect(smallPt.viewport).toBeLessThan(DEFAULT_FLUID_CONFIG.minViewport);
    expect(smallPt.clamped).toBe(true);
  });

  it("最大ビューポートより大きい場合はクランプされる", () => {
    const result = calculateFluid(DEFAULT_FLUID_CONFIG);
    const largePt = result.points[result.points.length - 1]; // endVp = maxVp + range * 0.2
    expect(largePt.viewport).toBeGreaterThan(DEFAULT_FLUID_CONFIG.maxViewport);
    expect(largePt.clamped).toBe(true);
  });

  it("clamp() 値に minStr と maxStr が含まれる", () => {
    const result = calculateFluid({
      minValue: 16,
      maxValue: 32,
      minViewport: 320,
      maxViewport: 1280,
      unit: "px",
      remBase: 16,
    });
    expect(result.clampValue).toContain("16px");
    expect(result.clampValue).toContain("32px");
  });

  it("各プリセットで有効な clamp() 値が生成される", () => {
    for (const preset of FLUID_PRESETS) {
      const result = calculateFluid(preset.config);
      expect(result.clampValue).toMatch(/^clamp\(/);
    }
  });
});

describe("validateFluidConfig", () => {
  it("有効な設定では null を返す", () => {
    expect(validateFluidConfig(DEFAULT_FLUID_CONFIG)).toBeNull();
  });

  it("minViewport が 0 の場合はエラー", () => {
    const error = validateFluidConfig({ ...DEFAULT_FLUID_CONFIG, minViewport: 0 });
    expect(error).not.toBeNull();
  });

  it("maxViewport が minViewport 以下の場合はエラー", () => {
    const error = validateFluidConfig({
      ...DEFAULT_FLUID_CONFIG,
      minViewport: 1280,
      maxViewport: 320,
    });
    expect(error).not.toBeNull();
  });

  it("minViewport === maxViewport の場合はエラー", () => {
    const error = validateFluidConfig({
      ...DEFAULT_FLUID_CONFIG,
      minViewport: 800,
      maxViewport: 800,
    });
    expect(error).not.toBeNull();
  });

  it("remBase が 0 の場合はエラー", () => {
    const error = validateFluidConfig({ ...DEFAULT_FLUID_CONFIG, remBase: 0 });
    expect(error).not.toBeNull();
  });

  it("minValue === maxValue の場合はエラー", () => {
    const error = validateFluidConfig({
      ...DEFAULT_FLUID_CONFIG,
      minValue: 16,
      maxValue: 16,
    });
    expect(error).not.toBeNull();
  });
});
