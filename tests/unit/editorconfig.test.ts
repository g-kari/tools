import { describe, it, expect } from "vitest";
import {
  generateEditorConfig,
  createDefaultOverride,
  applyPreset,
  FILE_TYPES,
  PRESETS,
  DEFAULT_GLOBAL,
} from "../../app/utils/editorconfig";

describe("generateEditorConfig - 基本出力", () => {
  it("root = true が出力される", () => {
    const result = generateEditorConfig(DEFAULT_GLOBAL, {});
    expect(result).toContain("root = true");
  });

  it("[*] セクションが出力される", () => {
    const result = generateEditorConfig(DEFAULT_GLOBAL, {});
    expect(result).toContain("[*]");
  });

  it("indent_style が出力される", () => {
    const result = generateEditorConfig(DEFAULT_GLOBAL, {});
    expect(result).toContain("indent_style = space");
  });

  it("indent_size が出力される", () => {
    const result = generateEditorConfig(DEFAULT_GLOBAL, {});
    expect(result).toContain("indent_size = 2");
  });

  it("end_of_line が出力される", () => {
    const result = generateEditorConfig(DEFAULT_GLOBAL, {});
    expect(result).toContain("end_of_line = lf");
  });

  it("charset が出力される", () => {
    const result = generateEditorConfig(DEFAULT_GLOBAL, {});
    expect(result).toContain("charset = utf-8");
  });

  it("trim_trailing_whitespace が出力される", () => {
    const result = generateEditorConfig(DEFAULT_GLOBAL, {});
    expect(result).toContain("trim_trailing_whitespace = true");
  });

  it("insert_final_newline が出力される", () => {
    const result = generateEditorConfig(DEFAULT_GLOBAL, {});
    expect(result).toContain("insert_final_newline = true");
  });

  it("末尾改行で終わる", () => {
    const result = generateEditorConfig(DEFAULT_GLOBAL, {});
    expect(result.endsWith("\n")).toBe(true);
  });
});

describe("generateEditorConfig - root = false", () => {
  it("root = false のとき root 行を出力しない", () => {
    const global = { ...DEFAULT_GLOBAL, root: false };
    const result = generateEditorConfig(global, {});
    expect(result).not.toContain("root = true");
    expect(result).not.toContain("root = false");
  });
});

describe("generateEditorConfig - タブインデント設定", () => {
  it("indent_style = tab が出力される", () => {
    const global = { ...DEFAULT_GLOBAL, indentStyle: "tab" as const };
    const result = generateEditorConfig(global, {});
    expect(result).toContain("indent_style = tab");
  });
});

describe("generateEditorConfig - CRLF 設定", () => {
  it("end_of_line = crlf が出力される", () => {
    const global = { ...DEFAULT_GLOBAL, endOfLine: "crlf" as const };
    const result = generateEditorConfig(global, {});
    expect(result).toContain("end_of_line = crlf");
  });
});

describe("generateEditorConfig - フラグ false 出力", () => {
  it("trim_trailing_whitespace = false が出力される", () => {
    const global = { ...DEFAULT_GLOBAL, trimTrailingWhitespace: false };
    const result = generateEditorConfig(global, {});
    expect(result).toContain("trim_trailing_whitespace = false");
  });

  it("insert_final_newline = false が出力される", () => {
    const global = { ...DEFAULT_GLOBAL, insertFinalNewline: false };
    const result = generateEditorConfig(global, {});
    expect(result).toContain("insert_final_newline = false");
  });
});

describe("generateEditorConfig - ファイルタイプオーバーライド", () => {
  it("enabled = false のファイルタイプは出力されない", () => {
    const overrides = {
      "*.{py,pyi}": {
        enabled: false,
        overrideIndentStyle: true,
        indentStyle: "space" as const,
        overrideIndentSize: true,
        indentSize: 4,
      },
    };
    const result = generateEditorConfig(DEFAULT_GLOBAL, overrides);
    expect(result).not.toContain("[*.{py,pyi}]");
  });

  it("グローバルと異なる値のオーバーライドが出力される", () => {
    const overrides = {
      "*.{go}": {
        enabled: true,
        overrideIndentStyle: true,
        indentStyle: "tab" as const,
        overrideIndentSize: true,
        indentSize: 4,
      },
    };
    // グローバルは space/2 なので tab/4 は差分あり → 出力される
    const result = generateEditorConfig(DEFAULT_GLOBAL, overrides);
    expect(result).toContain("[*.{go}]");
    expect(result).toContain("indent_style = tab");
  });

  it("グローバルと同じ値のオーバーライドは出力されない", () => {
    const overrides = {
      "*.{js,jsx,ts,tsx,mjs,cjs}": {
        enabled: true,
        overrideIndentStyle: true,
        indentStyle: "space" as const, // グローバルと同じ
        overrideIndentSize: true,
        indentSize: 2, // グローバルと同じ
      },
    };
    const result = generateEditorConfig(DEFAULT_GLOBAL, overrides);
    expect(result).not.toContain("[*.{js,jsx,ts,tsx,mjs,cjs}]");
  });
});

describe("createDefaultOverride", () => {
  it("enabled = false で作成される", () => {
    const ft = FILE_TYPES[0];
    const ov = createDefaultOverride(ft);
    expect(ov.enabled).toBe(false);
  });

  it("ファイルタイプのデフォルト値が設定される", () => {
    const goFt = FILE_TYPES.find((ft) => ft.pattern === "*.{go}")!;
    const ov = createDefaultOverride(goFt);
    expect(ov.indentStyle).toBe("tab");
    expect(ov.indentSize).toBe(4);
  });
});

describe("applyPreset", () => {
  it("Webフロントエンドプリセットが正しく適用される", () => {
    const preset = PRESETS.find((p) => p.name === "Webフロントエンド標準")!;
    const result = applyPreset(preset);
    expect(result.indentStyle).toBe("space");
    expect(result.indentSize).toBe(2);
    expect(result.endOfLine).toBe("lf");
  });

  it("Goプリセットはタブインデントになる", () => {
    const preset = PRESETS.find((p) => p.name === "Go標準")!;
    const result = applyPreset(preset);
    expect(result.indentStyle).toBe("tab");
  });

  it("Windowsプリセットは CRLF になる", () => {
    const preset = PRESETS.find((p) => p.name === "Windowsフレンドリー")!;
    const result = applyPreset(preset);
    expect(result.endOfLine).toBe("crlf");
  });
});

describe("FILE_TYPES", () => {
  it("ファイルタイプが1件以上存在する", () => {
    expect(FILE_TYPES.length).toBeGreaterThan(0);
  });

  it("各ファイルタイプにパターンとラベルがある", () => {
    for (const ft of FILE_TYPES) {
      expect(ft.pattern).toBeTruthy();
      expect(ft.label).toBeTruthy();
    }
  });
});
