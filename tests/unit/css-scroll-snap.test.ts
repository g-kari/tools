import { describe, it, expect } from "vite-plus/test";
import {
  generateContainerProperties,
  generateItemProperties,
  generateContainerCSS,
  generateItemCSS,
  generateFullCSS,
  createDefaultConfig,
  SCROLL_SNAP_PRESETS,
} from "../../app/utils/css-scroll-snap";

const defaultConfig = createDefaultConfig();

describe("createDefaultConfig", () => {
  it("デフォルト設定を返す", () => {
    const config = createDefaultConfig();
    expect(config.container.direction).toBe("x");
    expect(config.container.strictness).toBe("mandatory");
    expect(config.container.overflow).toBe("scroll");
    expect(config.container.scrollPadding).toBe(0);
    expect(config.item.align).toBe("start");
    expect(config.item.stop).toBe("normal");
    expect(config.item.scrollMargin).toBe(0);
  });
});

describe("generateContainerProperties", () => {
  it("x 方向は overflow-x を生成する", () => {
    const props = generateContainerProperties(defaultConfig.container);
    expect(props).toContain("overflow-x: scroll;");
  });

  it("y 方向は overflow-y を生成する", () => {
    const props = generateContainerProperties({
      ...defaultConfig.container,
      direction: "y",
    });
    expect(props).toContain("overflow-y: scroll;");
  });

  it("both 方向は overflow を生成する", () => {
    const props = generateContainerProperties({
      ...defaultConfig.container,
      direction: "both",
    });
    expect(props).toContain("overflow: scroll;");
  });

  it("inline 方向は overflow-x を生成する", () => {
    const props = generateContainerProperties({
      ...defaultConfig.container,
      direction: "inline",
    });
    expect(props).toContain("overflow-x: scroll;");
  });

  it("block 方向は overflow-y を生成する", () => {
    const props = generateContainerProperties({
      ...defaultConfig.container,
      direction: "block",
    });
    expect(props).toContain("overflow-y: scroll;");
  });

  it("scroll-snap-type プロパティを含む", () => {
    const props = generateContainerProperties(defaultConfig.container);
    expect(props).toContain("scroll-snap-type: x mandatory;");
  });

  it("proximity 厳密さが反映される", () => {
    const props = generateContainerProperties({
      ...defaultConfig.container,
      strictness: "proximity",
    });
    expect(props).toContain("scroll-snap-type: x proximity;");
  });

  it("scrollPadding が 0 の場合は scroll-padding を含まない", () => {
    const props = generateContainerProperties(defaultConfig.container);
    const hasPadding = props.some((p) => p.startsWith("scroll-padding"));
    expect(hasPadding).toBe(false);
  });

  it("scrollPadding が 16 の場合は scroll-padding: 16px を含む", () => {
    const props = generateContainerProperties({
      ...defaultConfig.container,
      scrollPadding: 16,
    });
    expect(props).toContain("scroll-padding: 16px;");
  });
});

describe("generateItemProperties", () => {
  it("scroll-snap-align: start を生成する", () => {
    const props = generateItemProperties(defaultConfig.item);
    expect(props).toContain("scroll-snap-align: start;");
  });

  it("scroll-snap-align: center を生成する", () => {
    const props = generateItemProperties({ ...defaultConfig.item, align: "center" });
    expect(props).toContain("scroll-snap-align: center;");
  });

  it("align が none の場合は scroll-snap-align を含まない", () => {
    const props = generateItemProperties({ ...defaultConfig.item, align: "none" });
    const hasAlign = props.some((p) => p.startsWith("scroll-snap-align"));
    expect(hasAlign).toBe(false);
  });

  it("stop が normal の場合は scroll-snap-stop を含まない", () => {
    const props = generateItemProperties(defaultConfig.item);
    const hasStop = props.some((p) => p.startsWith("scroll-snap-stop"));
    expect(hasStop).toBe(false);
  });

  it("stop が always の場合は scroll-snap-stop: always を含む", () => {
    const props = generateItemProperties({ ...defaultConfig.item, stop: "always" });
    expect(props).toContain("scroll-snap-stop: always;");
  });

  it("scrollMargin が 0 の場合は scroll-margin を含まない", () => {
    const props = generateItemProperties(defaultConfig.item);
    const hasMargin = props.some((p) => p.startsWith("scroll-margin"));
    expect(hasMargin).toBe(false);
  });

  it("scrollMargin が 8 の場合は scroll-margin: 8px を含む", () => {
    const props = generateItemProperties({ ...defaultConfig.item, scrollMargin: 8 });
    expect(props).toContain("scroll-margin: 8px;");
  });
});

describe("generateContainerCSS", () => {
  it(".scroll-container セレクタを含む", () => {
    const css = generateContainerCSS(defaultConfig.container);
    expect(css).toContain(".scroll-container");
  });

  it("生成された CSS がプロパティを含む", () => {
    const css = generateContainerCSS(defaultConfig.container);
    expect(css).toContain("scroll-snap-type: x mandatory;");
    expect(css).toContain("overflow-x: scroll;");
  });
});

describe("generateItemCSS", () => {
  it(".scroll-item セレクタを含む", () => {
    const css = generateItemCSS(defaultConfig.item);
    expect(css).toContain(".scroll-item");
  });

  it("align が start の場合は scroll-snap-align: start を含む", () => {
    const css = generateItemCSS(defaultConfig.item);
    expect(css).toContain("scroll-snap-align: start;");
  });

  it("設定がない場合はコメントを含む", () => {
    const css = generateItemCSS({ align: "none", stop: "normal", scrollMargin: 0 });
    expect(css).toContain("/* スナップ設定なし */");
  });
});

describe("generateFullCSS", () => {
  it("コンテナとアイテム両方のCSSブロックを含む", () => {
    const css = generateFullCSS(defaultConfig);
    expect(css).toContain(".scroll-container");
    expect(css).toContain(".scroll-item");
  });

  it("2つのブロックが改行で区切られている", () => {
    const css = generateFullCSS(defaultConfig);
    const blocks = css.split("\n\n");
    expect(blocks.length).toBe(2);
  });
});

describe("SCROLL_SNAP_PRESETS", () => {
  it("プリセットが1つ以上存在する", () => {
    expect(SCROLL_SNAP_PRESETS.length).toBeGreaterThan(0);
  });

  it("全プリセットが name と config を持つ", () => {
    for (const preset of SCROLL_SNAP_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.config).toBeDefined();
      expect(preset.config.container).toBeDefined();
      expect(preset.config.item).toBeDefined();
    }
  });

  it("横スライダープリセットは x 方向", () => {
    const preset = SCROLL_SNAP_PRESETS.find((p) => p.name === "横スライダー");
    expect(preset?.config.container.direction).toBe("x");
  });

  it("縦スクロールプリセットは y 方向", () => {
    const preset = SCROLL_SNAP_PRESETS.find((p) => p.name === "縦スクロール");
    expect(preset?.config.container.direction).toBe("y");
  });

  it("必ず止まるプリセットは always", () => {
    const preset = SCROLL_SNAP_PRESETS.find((p) => p.name === "必ず止まる");
    expect(preset?.config.item.stop).toBe("always");
  });
});
