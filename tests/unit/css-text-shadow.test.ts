import { describe, it, expect } from "vite-plus/test";
import {
  hexToRgba,
  layerToValue,
  generateTextShadowValue,
  generateFullCSS,
  createDefaultLayer,
  TEXT_SHADOW_PRESETS,
  type TextShadowLayer,
} from "../../app/utils/css-text-shadow";

describe("hexToRgba", () => {
  it("黒を正しく変換する", () => {
    expect(hexToRgba("#000000", 100)).toBe("rgba(0,0,0,1.00)");
  });

  it("白を正しく変換する", () => {
    expect(hexToRgba("#ffffff", 50)).toBe("rgba(255,255,255,0.50)");
  });

  it("任意のカラーを変換する", () => {
    expect(hexToRgba("#3b82f6", 70)).toBe("rgba(59,130,246,0.70)");
  });

  it("# なしでも動作する", () => {
    expect(hexToRgba("000000", 20)).toBe("rgba(0,0,0,0.20)");
  });

  it("opacity 0 のとき透明になる", () => {
    expect(hexToRgba("#ff0000", 0)).toBe("rgba(255,0,0,0.00)");
  });

  it("不正なhexは fallback を返す", () => {
    const result = hexToRgba("#zzzzzz", 20);
    expect(result).toContain("rgba(");
  });
});

describe("layerToValue", () => {
  const baseLayer: TextShadowLayer = {
    id: "test",
    offsetX: 2,
    offsetY: 2,
    blur: 4,
    color: "#000000",
    opacity: 50,
  };

  it("通常シャドウを生成する", () => {
    const result = layerToValue(baseLayer);
    expect(result).toBe("2px 2px 4px rgba(0,0,0,0.50)");
  });

  it("負のオフセットを正しく出力する", () => {
    const layer = { ...baseLayer, offsetX: -5, offsetY: -3 };
    const result = layerToValue(layer);
    expect(result).toContain("-5px -3px");
  });

  it("blur が 0 のとき省略なしで出力する", () => {
    const layer = { ...baseLayer, blur: 0 };
    const result = layerToValue(layer);
    expect(result).toContain("0px");
    expect(result).toBe("2px 2px 0px rgba(0,0,0,0.50)");
  });

  it("opacity が 100 のとき rgba(r,g,b,1.00) を出力する", () => {
    const layer = { ...baseLayer, opacity: 100 };
    const result = layerToValue(layer);
    expect(result).toContain("1.00");
  });
});

describe("generateTextShadowValue", () => {
  it("レイヤーが空の場合 none を返す", () => {
    expect(generateTextShadowValue([])).toBe("none");
  });

  it("1レイヤーの値を返す", () => {
    const layer: TextShadowLayer = {
      id: "l1",
      offsetX: 1,
      offsetY: 1,
      blur: 2,
      color: "#000000",
      opacity: 50,
    };
    const result = generateTextShadowValue([layer]);
    expect(result).toBe("1px 1px 2px rgba(0,0,0,0.50)");
  });

  it("複数レイヤーをカンマ区切りで結合する", () => {
    const layer1: TextShadowLayer = {
      id: "l1",
      offsetX: 0,
      offsetY: 0,
      blur: 4,
      color: "#00bfff",
      opacity: 100,
    };
    const layer2: TextShadowLayer = {
      id: "l2",
      offsetX: 0,
      offsetY: 0,
      blur: 10,
      color: "#00bfff",
      opacity: 70,
    };
    const result = generateTextShadowValue([layer1, layer2]);
    expect(result).toContain(",");
    expect(result).toContain("0px 0px 4px");
    expect(result).toContain("0px 0px 10px");
  });
});

describe("generateFullCSS", () => {
  it("正しいCSSブロックを生成する", () => {
    const layer: TextShadowLayer = {
      id: "l1",
      offsetX: 1,
      offsetY: 1,
      blur: 2,
      color: "#000000",
      opacity: 50,
    };
    const css = generateFullCSS([layer]);
    expect(css).toContain(".element {");
    expect(css).toContain("text-shadow:");
    expect(css).toContain("}");
  });

  it("空レイヤーのとき none を含む", () => {
    const css = generateFullCSS([]);
    expect(css).toContain("none");
  });
});

describe("createDefaultLayer", () => {
  it("TextShadowLayer の全フィールドを持つ", () => {
    const layer = createDefaultLayer(0);
    expect(layer).toHaveProperty("id");
    expect(layer).toHaveProperty("offsetX");
    expect(layer).toHaveProperty("offsetY");
    expect(layer).toHaveProperty("blur");
    expect(layer).toHaveProperty("color");
    expect(layer).toHaveProperty("opacity");
  });

  it("inset フィールドを持たない（text-shadowはinset非対応）", () => {
    const layer = createDefaultLayer(0);
    expect(layer).not.toHaveProperty("inset");
  });

  it("index が異なると異なるIDを生成する", () => {
    const layer1 = createDefaultLayer(0);
    const layer2 = createDefaultLayer(1);
    expect(layer1.id).not.toBe(layer2.id);
  });
});

describe("TEXT_SHADOW_PRESETS", () => {
  it("プリセットが存在する", () => {
    expect(TEXT_SHADOW_PRESETS.length).toBeGreaterThan(0);
  });

  it("各プリセットが label と layers を持つ", () => {
    for (const preset of TEXT_SHADOW_PRESETS) {
      expect(preset).toHaveProperty("label");
      expect(preset).toHaveProperty("layers");
      expect(Array.isArray(preset.layers)).toBe(true);
      expect(preset.layers.length).toBeGreaterThan(0);
    }
  });

  it("各プリセットレイヤーが inset を持たない", () => {
    for (const preset of TEXT_SHADOW_PRESETS) {
      for (const layer of preset.layers) {
        expect(layer).not.toHaveProperty("inset");
      }
    }
  });

  it("ネオンプリセットが複数レイヤーを持つ", () => {
    const neon = TEXT_SHADOW_PRESETS.find((p) => p.label === "ネオン（青）");
    expect(neon).toBeDefined();
    expect(neon!.layers.length).toBeGreaterThan(1);
  });

  it("アウトラインプリセットが4レイヤーを持つ", () => {
    const outline = TEXT_SHADOW_PRESETS.find((p) => p.label === "アウトライン");
    expect(outline).toBeDefined();
    expect(outline!.layers.length).toBe(4);
  });
});
