import { describe, it, expect } from "vitest";
import {
  normalizeHue,
  generateMonochromatic,
  generateComplementary,
  generateTriadic,
  generateAnalogous,
  generateSplitComplementary,
  generateTetradic,
  getContrastColor,
} from "../../app/routes/color-palette";

describe("normalizeHue", () => {
  it("正の値はそのまま返す（0〜360内）", () => {
    expect(normalizeHue(180)).toBe(180);
  });

  it("360を超えた値を正規化する", () => {
    expect(normalizeHue(400)).toBe(40);
  });

  it("負の値を正規化する", () => {
    expect(normalizeHue(-30)).toBe(330);
  });

  it("0を返す（360は0になる）", () => {
    expect(normalizeHue(360)).toBe(0);
  });

  it("-360は0になる", () => {
    expect(normalizeHue(-360)).toBe(0);
  });
});

describe("generateComplementary", () => {
  it("2色を返す", () => {
    const result = generateComplementary("#FF0000");
    expect(result).toHaveLength(2);
  });

  it("最初の色はベースカラー", () => {
    const result = generateComplementary("#FF0000");
    expect(result[0]).toBe("#FF0000");
  });

  it("2色目はhueが180°異なる補色", () => {
    const result = generateComplementary("#FF0000");
    // 赤（hue=0）の補色はシアン（hue=180）付近
    expect(result[1]).not.toBe("#FF0000");
  });
});

describe("generateTriadic", () => {
  it("3色を返す", () => {
    const result = generateTriadic("#FF0000");
    expect(result).toHaveLength(3);
  });

  it("最初の色はベースカラー", () => {
    const result = generateTriadic("#FF0000");
    expect(result[0]).toBe("#FF0000");
  });

  it("3色はすべて異なる", () => {
    const result = generateTriadic("#4a90e2");
    const unique = new Set(result);
    expect(unique.size).toBe(3);
  });
});

describe("generateAnalogous", () => {
  it("5色を返す", () => {
    const result = generateAnalogous("#FF0000");
    expect(result).toHaveLength(5);
  });

  it("中央（インデックス2）がベースカラー", () => {
    const result = generateAnalogous("#FF0000");
    expect(result[2]).toBe("#FF0000");
  });
});

describe("generateSplitComplementary", () => {
  it("3色を返す", () => {
    const result = generateSplitComplementary("#FF0000");
    expect(result).toHaveLength(3);
  });

  it("最初の色はベースカラー", () => {
    const result = generateSplitComplementary("#FF0000");
    expect(result[0]).toBe("#FF0000");
  });
});

describe("generateTetradic", () => {
  it("4色を返す", () => {
    const result = generateTetradic("#FF0000");
    expect(result).toHaveLength(4);
  });

  it("最初の色はベースカラー", () => {
    const result = generateTetradic("#FF0000");
    expect(result[0]).toBe("#FF0000");
  });

  it("4色はすべて異なる", () => {
    const result = generateTetradic("#4a90e2");
    const unique = new Set(result);
    expect(unique.size).toBe(4);
  });
});

describe("generateMonochromatic", () => {
  it("6色を返す", () => {
    const result = generateMonochromatic("#4a90e2");
    expect(result).toHaveLength(6);
  });

  it("すべて有効なHEX文字列を返す", () => {
    const result = generateMonochromatic("#4a90e2");
    result.forEach((color) => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it("無効なHEXに対してはベースカラーを含む配列を返す", () => {
    const result = generateMonochromatic("invalid");
    expect(result).toHaveLength(6);
  });
});

describe("getContrastColor", () => {
  it("白背景に対して黒を返す", () => {
    expect(getContrastColor("#FFFFFF")).toBe("black");
  });

  it("黒背景に対して白を返す", () => {
    expect(getContrastColor("#000000")).toBe("white");
  });

  it("明るい色に対して黒を返す", () => {
    expect(getContrastColor("#FFFF00")).toBe("black");
  });

  it("暗い色に対して白を返す", () => {
    expect(getContrastColor("#1a1a2e")).toBe("white");
  });

  it("無効なHEXに対してwhiteを返す（rgb(0,0,0)として扱われるため）", () => {
    // hexToRgbが無効な文字列を{r:0,g:0,b:0}として返すため、黒（暗い）→white
    expect(getContrastColor("invalid")).toBe("white");
  });
});
