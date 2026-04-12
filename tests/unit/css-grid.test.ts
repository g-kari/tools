import { describe, it, expect } from "vite-plus/test";
import {
  createDefaultItem,
  createDefaultItems,
  generateContainerCSS,
  generateItemCSS,
  generateFullCSS,
  getContainerStyles,
  getItemStyles,
  defaultContainerConfig,
  type GridItemConfig,
} from "../../app/utils/css-grid";

describe("createDefaultItem", () => {
  it("正しいデフォルト値でアイテムを生成する", () => {
    const item = createDefaultItem(0);
    expect(item.label).toBe("Item 1");
    expect(item.gridColumn).toBe("auto");
    expect(item.gridRow).toBe("auto");
    expect(item.justifySelf).toBe("auto");
    expect(item.alignSelf).toBe("auto");
    expect(item.id).toBeTruthy();
  });

  it("indexに応じたラベルを生成する", () => {
    expect(createDefaultItem(0).label).toBe("Item 1");
    expect(createDefaultItem(4).label).toBe("Item 5");
  });

  it("idが一意である", () => {
    const item1 = createDefaultItem(0);
    const item2 = createDefaultItem(1);
    expect(item1.id).not.toBe(item2.id);
  });
});

describe("createDefaultItems", () => {
  it("6個のアイテムを生成する", () => {
    const items = createDefaultItems();
    expect(items).toHaveLength(6);
  });
});

describe("generateContainerCSS", () => {
  it("デフォルト設定でCSSを生成する", () => {
    const css = generateContainerCSS(defaultContainerConfig);
    expect(css).toContain("display: grid;");
    expect(css).toContain("grid-template-columns: repeat(3, 1fr);");
    expect(css).toContain("gap: 8px;");
  });

  it("grid-template-rowsがautoの場合は出力しない", () => {
    const css = generateContainerCSS({
      ...defaultContainerConfig,
      gridTemplateRows: "auto",
    });
    expect(css).not.toContain("grid-template-rows");
  });

  it("grid-template-rowsがauto以外の場合は出力する", () => {
    const css = generateContainerCSS({
      ...defaultContainerConfig,
      gridTemplateRows: "100px auto",
    });
    expect(css).toContain("grid-template-rows: 100px auto;");
  });

  it("justify-itemsがstretchの場合は出力しない", () => {
    const css = generateContainerCSS({
      ...defaultContainerConfig,
      justifyItems: "stretch",
    });
    expect(css).not.toContain("justify-items");
  });

  it("justify-itemsがstretch以外の場合は出力する", () => {
    const css = generateContainerCSS({
      ...defaultContainerConfig,
      justifyItems: "center",
    });
    expect(css).toContain("justify-items: center;");
  });

  it("justify-contentがstartの場合は出力しない", () => {
    const css = generateContainerCSS({
      ...defaultContainerConfig,
      justifyContent: "start",
    });
    expect(css).not.toContain("justify-content");
  });

  it("justify-contentがstart以外の場合は出力する", () => {
    const css = generateContainerCSS({
      ...defaultContainerConfig,
      justifyContent: "space-between",
    });
    expect(css).toContain("justify-content: space-between;");
  });

  it(".containerセレクタが含まれる", () => {
    const css = generateContainerCSS(defaultContainerConfig);
    expect(css).toContain(".container {");
    expect(css).toContain("}");
  });
});

describe("generateItemCSS", () => {
  it("全プロパティがautoの場合は空文字を返す", () => {
    const item: GridItemConfig = {
      id: "test",
      label: "Item 1",
      gridColumn: "auto",
      gridRow: "auto",
      justifySelf: "auto",
      alignSelf: "auto",
    };
    expect(generateItemCSS(item, ".item:nth-child(1)")).toBe("");
  });

  it("grid-columnが設定されている場合はCSSを生成する", () => {
    const item: GridItemConfig = {
      id: "test",
      label: "Item 1",
      gridColumn: "1 / 3",
      gridRow: "auto",
      justifySelf: "auto",
      alignSelf: "auto",
    };
    const css = generateItemCSS(item, ".item:nth-child(1)");
    expect(css).toContain("grid-column: 1 / 3;");
    expect(css).toContain(".item:nth-child(1)");
  });

  it("grid-rowが設定されている場合はCSSを生成する", () => {
    const item: GridItemConfig = {
      id: "test",
      label: "Item 1",
      gridColumn: "auto",
      gridRow: "span 2",
      justifySelf: "auto",
      alignSelf: "auto",
    };
    const css = generateItemCSS(item, ".item:nth-child(2)");
    expect(css).toContain("grid-row: span 2;");
  });

  it("justify-selfが設定されている場合はCSSを生成する", () => {
    const item: GridItemConfig = {
      id: "test",
      label: "Item 1",
      gridColumn: "auto",
      gridRow: "auto",
      justifySelf: "center",
      alignSelf: "auto",
    };
    const css = generateItemCSS(item, ".item:nth-child(1)");
    expect(css).toContain("justify-self: center;");
  });
});

describe("generateFullCSS", () => {
  it("コンテナとアイテムのCSSを結合する", () => {
    const items = createDefaultItems();
    const css = generateFullCSS(defaultContainerConfig, items);
    expect(css).toContain(".container {");
    expect(css).toContain("display: grid;");
  });

  it("デフォルトアイテムのみの場合はコンテナCSSのみ生成される", () => {
    const items = createDefaultItems();
    const css = generateFullCSS(defaultContainerConfig, items);
    expect(css).not.toContain(".item:nth-child");
  });

  it("カスタムプロパティがあるアイテムのCSSが含まれる", () => {
    const items = createDefaultItems();
    items[0] = { ...items[0], gridColumn: "1 / 3" };
    const css = generateFullCSS(defaultContainerConfig, items);
    expect(css).toContain(".item:nth-child(1)");
    expect(css).toContain("grid-column: 1 / 3;");
  });
});

describe("getContainerStyles", () => {
  it("display:gridが含まれる", () => {
    const styles = getContainerStyles(defaultContainerConfig);
    expect(styles.display).toBe("grid");
  });

  it("grid-template-columnsが含まれる", () => {
    const styles = getContainerStyles(defaultContainerConfig);
    expect(styles.gridTemplateColumns).toBe("repeat(3, 1fr)");
  });

  it("gapが含まれる", () => {
    const styles = getContainerStyles(defaultContainerConfig);
    expect(styles.gap).toBe("8px");
  });

  it("justify-itemsがstretchの場合は含まれない", () => {
    const styles = getContainerStyles({
      ...defaultContainerConfig,
      justifyItems: "stretch",
    });
    expect(styles.justifyItems).toBeUndefined();
  });

  it("justify-itemsがcenterの場合は含まれる", () => {
    const styles = getContainerStyles({
      ...defaultContainerConfig,
      justifyItems: "center",
    });
    expect(styles.justifyItems).toBe("center");
  });
});

describe("getItemStyles", () => {
  it("全プロパティがautoの場合は空オブジェクトを返す", () => {
    const item: GridItemConfig = {
      id: "test",
      label: "Item 1",
      gridColumn: "auto",
      gridRow: "auto",
      justifySelf: "auto",
      alignSelf: "auto",
    };
    const styles = getItemStyles(item);
    expect(Object.keys(styles)).toHaveLength(0);
  });

  it("grid-columnが設定されている場合は含まれる", () => {
    const item: GridItemConfig = {
      id: "test",
      label: "Item 1",
      gridColumn: "1 / span 2",
      gridRow: "auto",
      justifySelf: "auto",
      alignSelf: "auto",
    };
    const styles = getItemStyles(item);
    expect(styles.gridColumn).toBe("1 / span 2");
  });

  it("align-selfが設定されている場合は含まれる", () => {
    const item: GridItemConfig = {
      id: "test",
      label: "Item 1",
      gridColumn: "auto",
      gridRow: "auto",
      justifySelf: "auto",
      alignSelf: "end",
    };
    const styles = getItemStyles(item);
    expect(styles.alignSelf).toBe("end");
  });
});

describe("defaultContainerConfig", () => {
  it("適切なデフォルト値を持つ", () => {
    expect(defaultContainerConfig.gridTemplateColumns).toBe("repeat(3, 1fr)");
    expect(defaultContainerConfig.gridTemplateRows).toBe("auto");
    expect(defaultContainerConfig.gap).toBe("8px");
    expect(defaultContainerConfig.justifyItems).toBe("stretch");
    expect(defaultContainerConfig.alignItems).toBe("stretch");
    expect(defaultContainerConfig.justifyContent).toBe("start");
    expect(defaultContainerConfig.alignContent).toBe("start");
  });
});
