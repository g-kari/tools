import { describe, it, expect } from "vitest";
import {
  formatColorStops,
  generateLinearGradient,
  generateRadialGradient,
  generateConicGradient,
  generateGradientCSS,
  generateFullCSS,
  createDefaultStops,
  redistributeStops,
  GRADIENT_PRESETS,
  type GradientConfig,
  type ColorStop,
} from "../../app/utils/css-gradient";

describe("formatColorStops", () => {
  it("カラーストップをCSS文字列に変換する", () => {
    const stops: ColorStop[] = [
      { id: "a", color: "#ff0000", position: 0 },
      { id: "b", color: "#0000ff", position: 100 },
    ];
    expect(formatColorStops(stops)).toBe("#ff0000 0%, #0000ff 100%");
  });

  it("3つのストップを正しくフォーマットする", () => {
    const stops: ColorStop[] = [
      { id: "a", color: "#ff0000", position: 0 },
      { id: "b", color: "#00ff00", position: 50 },
      { id: "c", color: "#0000ff", position: 100 },
    ];
    expect(formatColorStops(stops)).toBe(
      "#ff0000 0%, #00ff00 50%, #0000ff 100%"
    );
  });

  it("空配列は空文字列を返す", () => {
    expect(formatColorStops([])).toBe("");
  });
});

describe("generateLinearGradient", () => {
  it("デフォルト角度でlinear-gradientを生成する", () => {
    const config: GradientConfig = {
      type: "linear",
      stops: [
        { id: "a", color: "#ff0000", position: 0 },
        { id: "b", color: "#0000ff", position: 100 },
      ],
    };
    const result = generateLinearGradient(config);
    expect(result).toBe("linear-gradient(90deg, #ff0000 0%, #0000ff 100%)");
  });

  it("指定した角度でlinear-gradientを生成する", () => {
    const config: GradientConfig = {
      type: "linear",
      stops: [
        { id: "a", color: "#ff0000", position: 0 },
        { id: "b", color: "#0000ff", position: 100 },
      ],
      linear: { angle: 45 },
    };
    const result = generateLinearGradient(config);
    expect(result).toBe("linear-gradient(45deg, #ff0000 0%, #0000ff 100%)");
  });

  it("0degのlinear-gradientを生成する", () => {
    const config: GradientConfig = {
      type: "linear",
      stops: [
        { id: "a", color: "#ffffff", position: 0 },
        { id: "b", color: "#000000", position: 100 },
      ],
      linear: { angle: 0 },
    };
    expect(generateLinearGradient(config)).toContain("0deg");
  });
});

describe("generateRadialGradient", () => {
  it("デフォルト設定でradial-gradientを生成する", () => {
    const config: GradientConfig = {
      type: "radial",
      stops: [
        { id: "a", color: "#ff0000", position: 0 },
        { id: "b", color: "#0000ff", position: 100 },
      ],
    };
    const result = generateRadialGradient(config);
    expect(result).toBe(
      "radial-gradient(ellipse at 50% 50%, #ff0000 0%, #0000ff 100%)"
    );
  });

  it("circle形状でradial-gradientを生成する", () => {
    const config: GradientConfig = {
      type: "radial",
      stops: [
        { id: "a", color: "#ff0000", position: 0 },
        { id: "b", color: "#0000ff", position: 100 },
      ],
      radial: { shape: "circle", positionX: 30, positionY: 70 },
    };
    const result = generateRadialGradient(config);
    expect(result).toBe(
      "radial-gradient(circle at 30% 70%, #ff0000 0%, #0000ff 100%)"
    );
  });
});

describe("generateConicGradient", () => {
  it("デフォルト設定でconic-gradientを生成する", () => {
    const config: GradientConfig = {
      type: "conic",
      stops: [
        { id: "a", color: "#ff0000", position: 0 },
        { id: "b", color: "#0000ff", position: 100 },
      ],
    };
    const result = generateConicGradient(config);
    expect(result).toBe(
      "conic-gradient(from 0deg at 50% 50%, #ff0000 0%, #0000ff 100%)"
    );
  });

  it("角度と位置を指定したconic-gradientを生成する", () => {
    const config: GradientConfig = {
      type: "conic",
      stops: [
        { id: "a", color: "#ff0000", position: 0 },
        { id: "b", color: "#0000ff", position: 100 },
      ],
      conic: { angle: 45, positionX: 25, positionY: 75 },
    };
    const result = generateConicGradient(config);
    expect(result).toBe(
      "conic-gradient(from 45deg at 25% 75%, #ff0000 0%, #0000ff 100%)"
    );
  });
});

describe("generateGradientCSS", () => {
  it("typeがlinearのときlinear-gradientを返す", () => {
    const config: GradientConfig = {
      type: "linear",
      stops: [
        { id: "a", color: "#ff0000", position: 0 },
        { id: "b", color: "#0000ff", position: 100 },
      ],
      linear: { angle: 90 },
    };
    expect(generateGradientCSS(config)).toContain("linear-gradient");
  });

  it("typeがradialのときradial-gradientを返す", () => {
    const config: GradientConfig = {
      type: "radial",
      stops: [
        { id: "a", color: "#ff0000", position: 0 },
        { id: "b", color: "#0000ff", position: 100 },
      ],
    };
    expect(generateGradientCSS(config)).toContain("radial-gradient");
  });

  it("typeがconicのときconic-gradientを返す", () => {
    const config: GradientConfig = {
      type: "conic",
      stops: [
        { id: "a", color: "#ff0000", position: 0 },
        { id: "b", color: "#0000ff", position: 100 },
      ],
    };
    expect(generateGradientCSS(config)).toContain("conic-gradient");
  });
});

describe("generateFullCSS", () => {
  it("background プロパティを含む宣言を返す", () => {
    const config: GradientConfig = {
      type: "linear",
      stops: [
        { id: "a", color: "#ff0000", position: 0 },
        { id: "b", color: "#0000ff", position: 100 },
      ],
    };
    const result = generateFullCSS(config);
    expect(result).toMatch(/^background: .+;$/);
  });

  it("linear-gradientを含む", () => {
    const config: GradientConfig = {
      type: "linear",
      stops: [
        { id: "a", color: "#aabbcc", position: 0 },
        { id: "b", color: "#112233", position: 100 },
      ],
    };
    expect(generateFullCSS(config)).toContain("linear-gradient");
  });
});

describe("createDefaultStops", () => {
  it("2つのカラーストップを返す", () => {
    const stops = createDefaultStops();
    expect(stops).toHaveLength(2);
  });

  it("最初のストップはposition 0", () => {
    const stops = createDefaultStops();
    expect(stops[0].position).toBe(0);
  });

  it("最後のストップはposition 100", () => {
    const stops = createDefaultStops();
    expect(stops[stops.length - 1].position).toBe(100);
  });

  it("各ストップが id・color・position を持つ", () => {
    const stops = createDefaultStops();
    stops.forEach((stop) => {
      expect(stop).toHaveProperty("id");
      expect(stop).toHaveProperty("color");
      expect(stop).toHaveProperty("position");
    });
  });

  it("各ストップのidが一意である", () => {
    const stops = createDefaultStops();
    const ids = stops.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("redistributeStops", () => {
  it("2ストップを0と100に再配置する", () => {
    const stops: ColorStop[] = [
      { id: "a", color: "#ff0000", position: 10 },
      { id: "b", color: "#0000ff", position: 20 },
    ];
    const result = redistributeStops(stops);
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(100);
  });

  it("3ストップを0・50・100に再配置する", () => {
    const stops: ColorStop[] = [
      { id: "a", color: "#ff0000", position: 5 },
      { id: "b", color: "#00ff00", position: 10 },
      { id: "c", color: "#0000ff", position: 15 },
    ];
    const result = redistributeStops(stops);
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(50);
    expect(result[2].position).toBe(100);
  });

  it("4ストップを均等に再配置する", () => {
    const stops: ColorStop[] = [
      { id: "a", color: "#ff0000", position: 0 },
      { id: "b", color: "#00ff00", position: 0 },
      { id: "c", color: "#0000ff", position: 0 },
      { id: "d", color: "#ffff00", position: 0 },
    ];
    const result = redistributeStops(stops);
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(33);
    expect(result[2].position).toBe(67);
    expect(result[3].position).toBe(100);
  });

  it("1ストップはそのまま返す", () => {
    const stops: ColorStop[] = [{ id: "a", color: "#ff0000", position: 50 }];
    const result = redistributeStops(stops);
    expect(result).toHaveLength(1);
    expect(result[0].position).toBe(50);
  });

  it("色とidは変更しない", () => {
    const stops: ColorStop[] = [
      { id: "x1", color: "#aabbcc", position: 10 },
      { id: "x2", color: "#112233", position: 20 },
    ];
    const result = redistributeStops(stops);
    expect(result[0].color).toBe("#aabbcc");
    expect(result[0].id).toBe("x1");
    expect(result[1].color).toBe("#112233");
    expect(result[1].id).toBe("x2");
  });
});

describe("GRADIENT_PRESETS", () => {
  it("1つ以上のプリセットが存在する", () => {
    expect(GRADIENT_PRESETS.length).toBeGreaterThan(0);
  });

  it("各プリセットが name と config を持つ", () => {
    GRADIENT_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("config");
    });
  });

  it("各プリセットのconfigが有効なGradientConfigである", () => {
    GRADIENT_PRESETS.forEach((preset) => {
      expect(["linear", "radial", "conic"]).toContain(preset.config.type);
      expect(preset.config.stops.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("各プリセットのストップにidが設定されている", () => {
    GRADIENT_PRESETS.forEach((preset) => {
      preset.config.stops.forEach((stop) => {
        expect(stop.id).toBeTruthy();
      });
    });
  });

  it("各プリセットのconfigからCSSを生成できる", () => {
    GRADIENT_PRESETS.forEach((preset) => {
      const css = generateGradientCSS(preset.config);
      expect(css).toBeTruthy();
      expect(css.length).toBeGreaterThan(0);
    });
  });
});
