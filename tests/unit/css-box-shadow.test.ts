import { describe, it, expect } from "vitest";
import {
  hexToRgba,
  layerToValue,
  generateBoxShadowValue,
  generateFullCSS,
  createDefaultLayer,
  BOX_SHADOW_PRESETS,
  type BoxShadowLayer,
} from "../../app/utils/css-box-shadow";

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
  const baseLayer: BoxShadowLayer = {
    id: "test",
    offsetX: 2,
    offsetY: 4,
    blur: 8,
    spread: 0,
    color: "#000000",
    opacity: 20,
    inset: false,
  };

  it("通常シャドウを生成する", () => {
    const result = layerToValue(baseLayer);
    expect(result).toBe("2px 4px 8px 0px rgba(0,0,0,0.20)");
  });

  it("inset シャドウを生成する", () => {
    const layer = { ...baseLayer, inset: true };
    const result = layerToValue(layer);
    expect(result).toContain("inset ");
    expect(result).toBe("inset 2px 4px 8px 0px rgba(0,0,0,0.20)");
  });

  it("負のオフセットを正しく出力する", () => {
    const layer = { ...baseLayer, offsetX: -5, offsetY: -3 };
    const result = layerToValue(layer);
    expect(result).toContain("-5px -3px");
  });

  it("spread が正の場合を正しく出力する", () => {
    const layer = { ...baseLayer, spread: 4 };
    const result = layerToValue(layer);
    expect(result).toContain("8px 4px");
  });
});

describe("generateBoxShadowValue", () => {
  it("レイヤーが空の場合 none を返す", () => {
    expect(generateBoxShadowValue([])).toBe("none");
  });

  it("1レイヤーの値を返す", () => {
    const layer: BoxShadowLayer = {
      id: "l1",
      offsetX: 0,
      offsetY: 4,
      blur: 16,
      spread: 0,
      color: "#000000",
      opacity: 15,
      inset: false,
    };
    const result = generateBoxShadowValue([layer]);
    expect(result).toBe("0px 4px 16px 0px rgba(0,0,0,0.15)");
  });

  it("複数レイヤーをカンマ区切りで結合する", () => {
    const layer1: BoxShadowLayer = {
      id: "l1",
      offsetX: 2,
      offsetY: 2,
      blur: 4,
      spread: 0,
      color: "#000000",
      opacity: 10,
      inset: false,
    };
    const layer2: BoxShadowLayer = {
      id: "l2",
      offsetX: 0,
      offsetY: 8,
      blur: 20,
      spread: 0,
      color: "#000000",
      opacity: 20,
      inset: false,
    };
    const result = generateBoxShadowValue([layer1, layer2]);
    expect(result).toContain(",");
    expect(result).toContain("2px 2px 4px 0px");
    expect(result).toContain("0px 8px 20px 0px");
  });
});

describe("generateFullCSS", () => {
  it("正しいCSSブロックを生成する", () => {
    const layer: BoxShadowLayer = {
      id: "l1",
      offsetX: 0,
      offsetY: 4,
      blur: 8,
      spread: 0,
      color: "#000000",
      opacity: 20,
      inset: false,
    };
    const css = generateFullCSS([layer]);
    expect(css).toContain(".element {");
    expect(css).toContain("box-shadow:");
    expect(css).toContain("}");
  });

  it("空レイヤーのとき none を含む", () => {
    const css = generateFullCSS([]);
    expect(css).toContain("none");
  });
});

describe("createDefaultLayer", () => {
  it("BoxShadowLayer の全フィールドを持つ", () => {
    const layer = createDefaultLayer(0);
    expect(layer).toHaveProperty("id");
    expect(layer).toHaveProperty("offsetX");
    expect(layer).toHaveProperty("offsetY");
    expect(layer).toHaveProperty("blur");
    expect(layer).toHaveProperty("spread");
    expect(layer).toHaveProperty("color");
    expect(layer).toHaveProperty("opacity");
    expect(layer).toHaveProperty("inset");
  });

  it("inset がデフォルト false", () => {
    const layer = createDefaultLayer(0);
    expect(layer.inset).toBe(false);
  });

  it("index が異なると異なるIDを生成する", () => {
    const layer1 = createDefaultLayer(0);
    const layer2 = createDefaultLayer(1);
    expect(layer1.id).not.toBe(layer2.id);
  });
});

describe("BOX_SHADOW_PRESETS", () => {
  it("プリセットが存在する", () => {
    expect(BOX_SHADOW_PRESETS.length).toBeGreaterThan(0);
  });

  it("各プリセットが label と layers を持つ", () => {
    for (const preset of BOX_SHADOW_PRESETS) {
      expect(preset).toHaveProperty("label");
      expect(preset).toHaveProperty("layers");
      expect(Array.isArray(preset.layers)).toBe(true);
      expect(preset.layers.length).toBeGreaterThan(0);
    }
  });
});
