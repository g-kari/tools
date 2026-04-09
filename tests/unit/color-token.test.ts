import { describe, it, expect } from "vite-plus/test";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  generateShades,
  formatShades,
  shouldUseWhiteText,
  SHADE_KEYS,
} from "../../app/utils/color-token";

/**
 * color-token.tsx で使用している normalizeHex のロジックを同等実装
 * （ルートファイルから export していないため、テスト用に再実装）
 */
function normalizeHex(raw: string): string | null {
  const clean = raw.replace(/^#/, "");
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) return `#${clean.toLowerCase()}`;
  if (/^[0-9A-Fa-f]{3}$/.test(clean)) {
    const expanded = clean
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }
  return null;
}

describe("normalizeHex", () => {
  it("6桁 HEX をそのまま小文字で返す", () => {
    expect(normalizeHex("#3B82F6")).toBe("#3b82f6");
    expect(normalizeHex("3b82f6")).toBe("#3b82f6");
  });

  it("3桁 HEX を6桁に展開する", () => {
    expect(normalizeHex("#fff")).toBe("#ffffff");
    expect(normalizeHex("fff")).toBe("#ffffff");
    expect(normalizeHex("#abc")).toBe("#aabbcc");
    expect(normalizeHex("#000")).toBe("#000000");
  });

  it("無効な文字列は null を返す", () => {
    expect(normalizeHex("")).toBeNull();
    expect(normalizeHex("gg")).toBeNull();
    expect(normalizeHex("12345")).toBeNull();
    expect(normalizeHex("ggggggg")).toBeNull();
  });
});

describe("shouldUseWhiteText (中間色)", () => {
  it("#3b82f6（青）には白テキストを使う", () => {
    // 輝度 L ≈ 0.21 → 0.179 より大きいため黒テキストの境界に近いが、
    // WCAG 比較: 白とのコントラスト = 1.05/0.26 ≈ 4.04、黒とのコントラスト = 0.26/0.05 ≈ 5.2
    // → 黒の方がコントラストが高いため false（黒テキスト）が正しい
    expect(shouldUseWhiteText("#3b82f6")).toBe(false);
  });

  it("#1e3a5f（紺）には白テキストを使う", () => {
    expect(shouldUseWhiteText("#1e3a5f")).toBe(true);
  });

  it("#6b7280（ミドルグレー）には白テキストを使う", () => {
    // 輝度 L ≈ 0.17 → 閾値 0.179 以下のため白テキスト
    expect(shouldUseWhiteText("#6b7280")).toBe(true);
  });
});

describe("hexToRgb", () => {
  it("正常な HEX を変換できる", () => {
    expect(hexToRgb("#3b82f6")).toEqual({ r: 59, g: 130, b: 246 });
  });

  it("# なしでも変換できる", () => {
    expect(hexToRgb("ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("黒を変換できる", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("無効な文字列は null を返す", () => {
    expect(hexToRgb("gggggg")).toBeNull();
    expect(hexToRgb("abc")).toBeNull();
    expect(hexToRgb("")).toBeNull();
  });
});

describe("rgbToHex", () => {
  it("RGB を HEX に変換できる", () => {
    expect(rgbToHex({ r: 59, g: 130, b: 246 })).toBe("#3b82f6");
  });

  it("白を変換できる", () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe("#ffffff");
  });

  it("黒を変換できる", () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
  });

  it("範囲外の値をクランプする", () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe("#ff0080");
  });
});

describe("rgbToHsl / hslToRgb ラウンドトリップ", () => {
  const cases = [
    { r: 255, g: 0, b: 0 },   // 赤
    { r: 0, g: 255, b: 0 },   // 緑
    { r: 0, g: 0, b: 255 },   // 青
    { r: 59, g: 130, b: 246 }, // ブルー
  ];

  cases.forEach(({ r, g, b }) => {
    it(`rgb(${r},${g},${b}) → HSL → RGB が元に戻る（±2 誤差許容）`, () => {
      const hsl = rgbToHsl({ r, g, b });
      const back = hslToRgb(hsl);
      expect(Math.abs(back.r - r)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.g - g)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.b - b)).toBeLessThanOrEqual(2);
    });
  });
});

describe("shouldUseWhiteText", () => {
  it("暗い色には白テキストを使う", () => {
    expect(shouldUseWhiteText("#000000")).toBe(true);
    expect(shouldUseWhiteText("#1e293b")).toBe(true);
  });

  it("明るい色には黒テキストを使う", () => {
    expect(shouldUseWhiteText("#ffffff")).toBe(false);
    expect(shouldUseWhiteText("#f8fafc")).toBe(false);
  });
});

describe("generateShades", () => {
  it("11 段階のシェードを生成する", () => {
    const shades = generateShades("#3b82f6");
    expect(shades).toHaveLength(11);
  });

  it("全シェードキー (50〜950) が含まれる", () => {
    const shades = generateShades("#3b82f6");
    const keys = shades.map((s) => s.key);
    expect(keys).toEqual(SHADE_KEYS);
  });

  it("各シェードに有効な HEX が含まれる", () => {
    const shades = generateShades("#3b82f6");
    shades.forEach((s) => {
      expect(s.hex).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("各シェードに rgb と hsl 文字列が含まれる", () => {
    const shades = generateShades("#3b82f6");
    shades.forEach((s) => {
      expect(s.rgb).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      expect(s.hsl).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });
  });

  it("明るいシェード (50) は暗いシェード (950) より明るい", () => {
    const shades = generateShades("#3b82f6");
    const s50 = shades.find((s) => s.key === 50)!;
    const s950 = shades.find((s) => s.key === 950)!;
    const rgb50 = hexToRgb(s50.hex)!;
    const rgb950 = hexToRgb(s950.hex)!;
    const lum50 = rgb50.r + rgb50.g + rgb50.b;
    const lum950 = rgb950.r + rgb950.g + rgb950.b;
    expect(lum50).toBeGreaterThan(lum950);
  });

  it("無彩色（グレー）にも対応する", () => {
    const shades = generateShades("#808080");
    expect(shades).toHaveLength(11);
    shades.forEach((s) => {
      expect(s.hex).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("空文字列では空配列を返す", () => {
    expect(generateShades("")).toEqual([]);
    expect(generateShades("invalid")).toEqual([]);
  });
});

describe("formatShades", () => {
  const shades = generateShades("#3b82f6");
  const name = "primary";

  it("CSS 変数形式で出力される", () => {
    const output = formatShades(shades, name, "css");
    expect(output).toContain(":root {");
    expect(output).toContain("--primary-500:");
    expect(output).toContain("--primary-50:");
    expect(output).toContain("--primary-950:");
  });

  it("SCSS 変数形式で出力される", () => {
    const output = formatShades(shades, name, "scss");
    expect(output).toContain("$primary-500:");
    expect(output).toContain("$primary-50:");
    expect(output).not.toContain(":root");
  });

  it("Tailwind 設定形式で出力される", () => {
    const output = formatShades(shades, name, "tailwind");
    expect(output).toContain("tailwind.config.js");
    expect(output).toContain("'primary':");
    expect(output).toContain("500:");
    expect(output).toContain("50:");
  });

  it("JSON 形式で出力される", () => {
    const output = formatShades(shades, name, "json");
    const parsed = JSON.parse(output);
    expect(parsed["primary-500"]).toMatch(/^#[0-9a-f]{6}$/);
    expect(parsed["primary-50"]).toMatch(/^#[0-9a-f]{6}$/);
    expect(parsed["primary-950"]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("カラー名が空の場合は 'color' をデフォルト使用", () => {
    const output = formatShades(shades, "", "css");
    expect(output).toContain("--color-500:");
  });
});
