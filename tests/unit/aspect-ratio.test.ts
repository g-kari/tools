import { describe, it, expect } from "vite-plus/test";
import {
  gcd,
  simplifyRatio,
  calcHeightFromWidth,
  calcWidthFromHeight,
  ratioToDecimal,
  ASPECT_RATIO_PRESETS,
} from "../../app/utils/aspect-ratio";

describe("gcd", () => {
  it("最大公約数を正しく計算する", () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(100, 75)).toBe(25);
    expect(gcd(1920, 1080)).toBe(120);
    expect(gcd(16, 9)).toBe(1);
  });

  it("同じ値の場合は自身を返す", () => {
    expect(gcd(7, 7)).toBe(7);
    expect(gcd(100, 100)).toBe(100);
  });

  it("一方が0の場合は0でない方を返す", () => {
    expect(gcd(0, 5)).toBe(5);
    expect(gcd(5, 0)).toBe(5);
  });

  it("負数を正しく処理する", () => {
    expect(gcd(-12, 8)).toBe(4);
    expect(gcd(12, -8)).toBe(4);
  });
});

describe("simplifyRatio", () => {
  it("1920x1080 を 16:9 に約分する", () => {
    expect(simplifyRatio(1920, 1080)).toEqual([16, 9]);
  });

  it("1280x960 を 4:3 に約分する", () => {
    expect(simplifyRatio(1280, 960)).toEqual([4, 3]);
  });

  it("既に最小の比率はそのまま返す", () => {
    expect(simplifyRatio(16, 9)).toEqual([16, 9]);
    expect(simplifyRatio(1, 1)).toEqual([1, 1]);
  });

  it("正方形の場合は 1:1 を返す", () => {
    expect(simplifyRatio(100, 100)).toEqual([1, 1]);
    expect(simplifyRatio(500, 500)).toEqual([1, 1]);
  });

  it("2560x1080 を 64:27 に約分する", () => {
    expect(simplifyRatio(2560, 1080)).toEqual([64, 27]);
  });

  it("0以下の値はそのまま返す", () => {
    expect(simplifyRatio(0, 100)).toEqual([0, 100]);
    expect(simplifyRatio(100, 0)).toEqual([100, 0]);
  });
});

describe("calcHeightFromWidth", () => {
  it("16:9 で幅1920から高さ1080を計算する", () => {
    expect(calcHeightFromWidth(1920, 16, 9)).toBe(1080);
  });

  it("4:3 で幅1024から高さ768を計算する", () => {
    expect(calcHeightFromWidth(1024, 4, 3)).toBe(768);
  });

  it("1:1 で幅から高さが等しくなる", () => {
    expect(calcHeightFromWidth(500, 1, 1)).toBe(500);
  });

  it("ratioW が 0 の場合は 0 を返す", () => {
    expect(calcHeightFromWidth(100, 0, 9)).toBe(0);
  });

  it("9:16 でスマートフォン縦向きを計算する", () => {
    expect(calcHeightFromWidth(1080, 9, 16)).toBe(1920);
  });
});

describe("calcWidthFromHeight", () => {
  it("16:9 で高さ1080から幅1920を計算する", () => {
    expect(calcWidthFromHeight(1080, 16, 9)).toBe(1920);
  });

  it("4:3 で高さ768から幅1024を計算する", () => {
    expect(calcWidthFromHeight(768, 4, 3)).toBe(1024);
  });

  it("1:1 で高さから幅が等しくなる", () => {
    expect(calcWidthFromHeight(500, 1, 1)).toBe(500);
  });

  it("ratioH が 0 の場合は 0 を返す", () => {
    expect(calcWidthFromHeight(100, 16, 0)).toBe(0);
  });
});

describe("ratioToDecimal", () => {
  it("16:9 の小数値を計算する", () => {
    expect(ratioToDecimal(16, 9)).toBeCloseTo(1.7778, 4);
  });

  it("4:3 の小数値を計算する", () => {
    expect(ratioToDecimal(4, 3)).toBeCloseTo(1.3333, 4);
  });

  it("1:1 は 1.0 を返す", () => {
    expect(ratioToDecimal(1, 1)).toBe(1.0);
  });

  it("ratioH が 0 の場合は 0 を返す", () => {
    expect(ratioToDecimal(16, 0)).toBe(0);
  });
});

describe("ASPECT_RATIO_PRESETS", () => {
  it("プリセットが定義されている", () => {
    expect(ASPECT_RATIO_PRESETS.length).toBeGreaterThan(0);
  });

  it("16:9 プリセットが含まれている", () => {
    const preset = ASPECT_RATIO_PRESETS.find((p) => p.label === "16:9");
    expect(preset).toBeDefined();
    expect(preset?.ratioW).toBe(16);
    expect(preset?.ratioH).toBe(9);
  });

  it("1:1 プリセットが含まれている", () => {
    const preset = ASPECT_RATIO_PRESETS.find((p) => p.label === "1:1");
    expect(preset).toBeDefined();
    expect(preset?.ratioW).toBe(1);
    expect(preset?.ratioH).toBe(1);
  });

  it("全プリセットが label, ratioW, ratioH, description を持つ", () => {
    for (const preset of ASPECT_RATIO_PRESETS) {
      expect(preset.label).toBeTruthy();
      expect(preset.ratioW).toBeGreaterThan(0);
      expect(preset.ratioH).toBeGreaterThan(0);
      expect(preset.description).toBeTruthy();
    }
  });
});
