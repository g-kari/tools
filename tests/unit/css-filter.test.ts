import { describe, it, expect } from "vitest";
import {
  createDefaultState,
  generateFilterValue,
  generateFullCSS,
  isDefaultState,
  FILTER_PRESETS,
  type FilterState,
} from "../../app/utils/css-filter";

describe("createDefaultState", () => {
  it("デフォルト状態を返す", () => {
    const state = createDefaultState();
    expect(state.blur).toBe(0);
    expect(state.brightness).toBe(100);
    expect(state.contrast).toBe(100);
    expect(state.grayscale).toBe(0);
    expect(state.hueRotate).toBe(0);
    expect(state.invert).toBe(0);
    expect(state.opacity).toBe(100);
    expect(state.saturate).toBe(100);
    expect(state.sepia).toBe(0);
  });

  it("呼び出すたびに独立したオブジェクトを返す", () => {
    const s1 = createDefaultState();
    const s2 = createDefaultState();
    s1.blur = 10;
    expect(s2.blur).toBe(0);
  });
});

describe("generateFilterValue", () => {
  it("デフォルト状態では none を返す", () => {
    expect(generateFilterValue(createDefaultState())).toBe("none");
  });

  it("blur が設定されたとき blur() を含む", () => {
    const state: FilterState = { ...createDefaultState(), blur: 5 };
    expect(generateFilterValue(state)).toContain("blur(5px)");
  });

  it("brightness が 100 以外のとき brightness() を含む", () => {
    const state: FilterState = { ...createDefaultState(), brightness: 150 };
    expect(generateFilterValue(state)).toContain("brightness(150%)");
  });

  it("contrast が 100 以外のとき contrast() を含む", () => {
    const state: FilterState = { ...createDefaultState(), contrast: 80 };
    expect(generateFilterValue(state)).toContain("contrast(80%)");
  });

  it("grayscale が設定されたとき grayscale() を含む", () => {
    const state: FilterState = { ...createDefaultState(), grayscale: 100 };
    expect(generateFilterValue(state)).toContain("grayscale(100%)");
  });

  it("hueRotate が設定されたとき hue-rotate() を含む", () => {
    const state: FilterState = { ...createDefaultState(), hueRotate: 180 };
    expect(generateFilterValue(state)).toContain("hue-rotate(180deg)");
  });

  it("invert が設定されたとき invert() を含む", () => {
    const state: FilterState = { ...createDefaultState(), invert: 100 };
    expect(generateFilterValue(state)).toContain("invert(100%)");
  });

  it("opacity が 100 以外のとき opacity() を含む", () => {
    const state: FilterState = { ...createDefaultState(), opacity: 50 };
    expect(generateFilterValue(state)).toContain("opacity(50%)");
  });

  it("saturate が 100 以外のとき saturate() を含む", () => {
    const state: FilterState = { ...createDefaultState(), saturate: 200 };
    expect(generateFilterValue(state)).toContain("saturate(200%)");
  });

  it("sepia が設定されたとき sepia() を含む", () => {
    const state: FilterState = { ...createDefaultState(), sepia: 80 };
    expect(generateFilterValue(state)).toContain("sepia(80%)");
  });

  it("複数フィルターが設定されたとき複数の関数をスペース区切りで出力する", () => {
    const state: FilterState = {
      ...createDefaultState(),
      grayscale: 100,
      brightness: 90,
    };
    const result = generateFilterValue(state);
    expect(result).toContain("grayscale(100%)");
    expect(result).toContain("brightness(90%)");
    expect(result).not.toBe("none");
  });

  it("デフォルト値のフィルターは省略する", () => {
    const state: FilterState = {
      ...createDefaultState(),
      blur: 0,
      brightness: 100,
      grayscale: 50,
    };
    const result = generateFilterValue(state);
    expect(result).not.toContain("blur(");
    expect(result).not.toContain("brightness(");
    expect(result).toContain("grayscale(50%)");
  });
});

describe("generateFullCSS", () => {
  it(".element ブロックを生成する", () => {
    const css = generateFullCSS(createDefaultState());
    expect(css).toContain(".element {");
    expect(css).toContain("filter:");
    expect(css).toContain("}");
  });

  it("デフォルト状態では filter: none を含む", () => {
    const css = generateFullCSS(createDefaultState());
    expect(css).toContain("filter: none");
  });

  it("フィルター設定済みの値を正しく含む", () => {
    const state: FilterState = { ...createDefaultState(), grayscale: 100 };
    const css = generateFullCSS(state);
    expect(css).toContain("grayscale(100%)");
  });
});

describe("isDefaultState", () => {
  it("デフォルト状態で true を返す", () => {
    expect(isDefaultState(createDefaultState())).toBe(true);
  });

  it("blur が変更された場合 false を返す", () => {
    const state: FilterState = { ...createDefaultState(), blur: 5 };
    expect(isDefaultState(state)).toBe(false);
  });

  it("brightness が変更された場合 false を返す", () => {
    const state: FilterState = { ...createDefaultState(), brightness: 120 };
    expect(isDefaultState(state)).toBe(false);
  });

  it("sepia が変更された場合 false を返す", () => {
    const state: FilterState = { ...createDefaultState(), sepia: 50 };
    expect(isDefaultState(state)).toBe(false);
  });
});

describe("FILTER_PRESETS", () => {
  it("プリセットが存在する", () => {
    expect(FILTER_PRESETS.length).toBeGreaterThan(0);
  });

  it("各プリセットが label と state を持つ", () => {
    for (const preset of FILTER_PRESETS) {
      expect(preset).toHaveProperty("label");
      expect(typeof preset.label).toBe("string");
      expect(preset).toHaveProperty("state");
      expect(preset.state).toHaveProperty("blur");
      expect(preset.state).toHaveProperty("brightness");
      expect(preset.state).toHaveProperty("grayscale");
    }
  });

  it("モノクロプリセットは grayscale: 100 を持つ", () => {
    const mono = FILTER_PRESETS.find((p) => p.label === "モノクロ");
    expect(mono).toBeDefined();
    expect(mono!.state.grayscale).toBe(100);
  });

  it("反転プリセットは invert: 100 を持つ", () => {
    const inv = FILTER_PRESETS.find((p) => p.label === "反転");
    expect(inv).toBeDefined();
    expect(inv!.state.invert).toBe(100);
  });
});
