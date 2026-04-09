import { describe, it, expect } from "vite-plus/test";
import {
  simplifyFourValues,
  generateBorderRadiusValue,
  generateFullCSS,
  createDefaultState,
  BORDER_RADIUS_PRESETS,
  type BorderRadiusState,
} from "../../app/utils/css-border-radius";

describe("simplifyFourValues", () => {
  it("全て等しい場合は1値に省略する", () => {
    expect(simplifyFourValues([8, 8, 8, 8], "px")).toBe("8px");
  });

  it("TL=BR かつ TR=BL の場合は2値に省略する", () => {
    expect(simplifyFourValues([8, 16, 8, 16], "px")).toBe("8px 16px");
  });

  it("TR=BL の場合は3値に省略する", () => {
    expect(simplifyFourValues([8, 16, 24, 16], "px")).toBe("8px 16px 24px");
  });

  it("全て異なる場合は4値になる", () => {
    expect(simplifyFourValues([8, 16, 24, 32], "px")).toBe("8px 16px 24px 32px");
  });

  it("% 単位で動作する", () => {
    expect(simplifyFourValues([50, 50, 50, 50], "%")).toBe("50%");
  });

  it("0を含む場合も正しく動作する", () => {
    expect(simplifyFourValues([0, 16, 0, 16], "px")).toBe("0px 16px");
  });
});

describe("generateBorderRadiusValue", () => {
  it("非楕円モードで全コーナーが等しい場合に1値を返す", () => {
    const state: BorderRadiusState = {
      topLeft: { h: 8, v: 8 },
      topRight: { h: 8, v: 8 },
      bottomRight: { h: 8, v: 8 },
      bottomLeft: { h: 8, v: 8 },
      unit: "px",
      elliptic: false,
    };
    expect(generateBorderRadiusValue(state)).toBe("8px");
  });

  it("非楕円モードで非対称なコーナーを正しく生成する", () => {
    const state: BorderRadiusState = {
      topLeft: { h: 0, v: 0 },
      topRight: { h: 16, v: 16 },
      bottomRight: { h: 0, v: 0 },
      bottomLeft: { h: 16, v: 16 },
      unit: "px",
      elliptic: false,
    };
    expect(generateBorderRadiusValue(state)).toBe("0px 16px");
  });

  it("楕円モードで h=v の場合はスラッシュなしで出力する", () => {
    const state: BorderRadiusState = {
      topLeft: { h: 8, v: 8 },
      topRight: { h: 8, v: 8 },
      bottomRight: { h: 8, v: 8 },
      bottomLeft: { h: 8, v: 8 },
      unit: "px",
      elliptic: true,
    };
    expect(generateBorderRadiusValue(state)).toBe("8px");
  });

  it("楕円モードで h≠v の場合はスラッシュ形式で出力する", () => {
    const state: BorderRadiusState = {
      topLeft: { h: 20, v: 10 },
      topRight: { h: 20, v: 10 },
      bottomRight: { h: 20, v: 10 },
      bottomLeft: { h: 20, v: 10 },
      unit: "px",
      elliptic: true,
    };
    const result = generateBorderRadiusValue(state);
    expect(result).toContain(" / ");
    expect(result).toBe("20px / 10px");
  });

  it("% 単位で 50% 円形を生成する", () => {
    const state: BorderRadiusState = {
      topLeft: { h: 50, v: 50 },
      topRight: { h: 50, v: 50 },
      bottomRight: { h: 50, v: 50 },
      bottomLeft: { h: 50, v: 50 },
      unit: "%",
      elliptic: false,
    };
    expect(generateBorderRadiusValue(state)).toBe("50%");
  });
});

describe("generateFullCSS", () => {
  it("正しいCSSブロックを生成する", () => {
    const state = createDefaultState();
    const css = generateFullCSS(state);
    expect(css).toContain(".element {");
    expect(css).toContain("border-radius:");
    expect(css).toContain("}");
  });

  it("生成CSSに値が含まれる", () => {
    const state = createDefaultState();
    const css = generateFullCSS(state);
    expect(css).toContain("8px");
  });
});

describe("createDefaultState", () => {
  it("必要なフィールドを持つ", () => {
    const state = createDefaultState();
    expect(state).toHaveProperty("topLeft");
    expect(state).toHaveProperty("topRight");
    expect(state).toHaveProperty("bottomRight");
    expect(state).toHaveProperty("bottomLeft");
    expect(state).toHaveProperty("unit");
    expect(state).toHaveProperty("elliptic");
  });

  it("各コーナーが h と v フィールドを持つ", () => {
    const state = createDefaultState();
    for (const corner of [state.topLeft, state.topRight, state.bottomRight, state.bottomLeft]) {
      expect(corner).toHaveProperty("h");
      expect(corner).toHaveProperty("v");
    }
  });

  it("デフォルト単位が px である", () => {
    const state = createDefaultState();
    expect(state.unit).toBe("px");
  });

  it("デフォルトで楕円モードがオフである", () => {
    const state = createDefaultState();
    expect(state.elliptic).toBe(false);
  });
});

describe("BORDER_RADIUS_PRESETS", () => {
  it("プリセットが存在する", () => {
    expect(BORDER_RADIUS_PRESETS.length).toBeGreaterThan(0);
  });

  it("各プリセットが label と state を持つ", () => {
    for (const preset of BORDER_RADIUS_PRESETS) {
      expect(preset).toHaveProperty("label");
      expect(preset).toHaveProperty("state");
    }
  });

  it("各プリセットの state が4コーナーを持つ", () => {
    for (const preset of BORDER_RADIUS_PRESETS) {
      expect(preset.state).toHaveProperty("topLeft");
      expect(preset.state).toHaveProperty("topRight");
      expect(preset.state).toHaveProperty("bottomRight");
      expect(preset.state).toHaveProperty("bottomLeft");
    }
  });

  it("円形プリセットが 50% を設定する", () => {
    const circle = BORDER_RADIUS_PRESETS.find((p) => p.label === "円形");
    expect(circle).toBeDefined();
    expect(circle!.state.unit).toBe("%");
    expect(circle!.state.topLeft.h).toBe(50);
  });

  it("ピル型プリセットが大きな px 値を設定する", () => {
    const pill = BORDER_RADIUS_PRESETS.find((p) => p.label === "ピル型");
    expect(pill).toBeDefined();
    expect(pill!.state.unit).toBe("px");
    expect(pill!.state.topLeft.h).toBeGreaterThan(100);
  });
});
