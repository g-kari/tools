import { describe, it, expect } from "vite-plus/test";
import {
  generateTsConfig,
  getDefaultValues,
  TSCONFIG_CATEGORIES,
  TSCONFIG_PRESETS,
} from "../../app/utils/tsconfig-builder";

describe("generateTsConfig", () => {
  it("有効な JSON 文字列を返す", () => {
    const values = { target: "ES2022", strict: true };
    const result = generateTsConfig(values);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("compilerOptions に設定値が含まれる", () => {
    const values = { target: "ES2022", strict: true };
    const result = JSON.parse(generateTsConfig(values));
    expect(result.compilerOptions.target).toBe("ES2022");
    expect(result.compilerOptions.strict).toBe(true);
  });

  it("空文字列のオプションは出力に含まれない", () => {
    const values = { outDir: "", rootDir: "" };
    const result = JSON.parse(generateTsConfig(values));
    expect(result.compilerOptions.outDir).toBeUndefined();
    expect(result.compilerOptions.rootDir).toBeUndefined();
  });

  it("空配列のオプションは出力に含まれない", () => {
    const values = { lib: [] };
    const result = JSON.parse(generateTsConfig(values));
    expect(result.compilerOptions.lib).toBeUndefined();
  });

  it("false のブール値は出力に含まれる", () => {
    const values = { strict: false };
    const result = JSON.parse(generateTsConfig(values));
    // false はデフォルト値のままなので含まれる
    expect(result.compilerOptions.strict).toBe(false);
  });

  it("include と exclude フィールドが含まれる", () => {
    const result = JSON.parse(generateTsConfig({}));
    expect(result.include).toEqual(["src/**/*"]);
    expect(result.exclude).toEqual(["node_modules", "dist"]);
  });

  it("lib に配列値が正しく設定される", () => {
    const values = { lib: ["ES2022", "DOM"] };
    const result = JSON.parse(generateTsConfig(values));
    expect(result.compilerOptions.lib).toEqual(["ES2022", "DOM"]);
  });
});

describe("getDefaultValues", () => {
  it("すべてのカテゴリのオプションのデフォルト値を返す", () => {
    const defaults = getDefaultValues();
    const allKeys = TSCONFIG_CATEGORIES.flatMap((c) => c.options.map((o) => o.key));
    for (const key of allKeys) {
      expect(defaults).toHaveProperty(key);
    }
  });

  it("ブール型オプションのデフォルト値は false", () => {
    const defaults = getDefaultValues();
    const boolOptions = TSCONFIG_CATEGORIES.flatMap((c) =>
      c.options.filter((o) => o.type === "boolean"),
    );
    for (const opt of boolOptions) {
      expect(defaults[opt.key]).toBe(false);
    }
  });
});

describe("TSCONFIG_CATEGORIES", () => {
  it("少なくとも1つのカテゴリが存在する", () => {
    expect(TSCONFIG_CATEGORIES.length).toBeGreaterThan(0);
  });

  it("各カテゴリに id・label・icon・options が含まれる", () => {
    for (const cat of TSCONFIG_CATEGORIES) {
      expect(cat.id).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(Array.isArray(cat.options)).toBe(true);
      expect(cat.options.length).toBeGreaterThan(0);
    }
  });

  it("各オプションに必須フィールドが含まれる", () => {
    for (const cat of TSCONFIG_CATEGORIES) {
      for (const opt of cat.options) {
        expect(opt.key).toBeTruthy();
        expect(opt.label).toBeTruthy();
        expect(opt.description).toBeTruthy();
        expect(["boolean", "string", "enum", "list"]).toContain(opt.type);
      }
    }
  });

  it("enum/list タイプのオプションに choices が定義されている", () => {
    for (const cat of TSCONFIG_CATEGORIES) {
      for (const opt of cat.options) {
        if (opt.type === "enum" || opt.type === "list") {
          expect(opt.choices).toBeDefined();
          expect((opt.choices ?? []).length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("TSCONFIG_PRESETS", () => {
  it("少なくとも1つのプリセットが存在する", () => {
    expect(TSCONFIG_PRESETS.length).toBeGreaterThan(0);
  });

  it("各プリセットに id・label・description・values が含まれる", () => {
    for (const preset of TSCONFIG_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(typeof preset.values).toBe("object");
    }
  });

  it("Node.js プリセットが存在し target に ES2022 を含む", () => {
    const nodePreset = TSCONFIG_PRESETS.find((p) => p.id === "node-lts");
    expect(nodePreset).toBeDefined();
    expect(nodePreset?.values.target).toBe("ES2022");
  });

  it("Vite + React プリセットが存在し jsx に react-jsx を含む", () => {
    const vitePreset = TSCONFIG_PRESETS.find((p) => p.id === "vite-react");
    expect(vitePreset).toBeDefined();
    expect(vitePreset?.values.jsx).toBe("react-jsx");
  });

  it("各プリセットの values は有効な JSON に変換できる", () => {
    for (const preset of TSCONFIG_PRESETS) {
      const result = generateTsConfig(preset.values as Record<string, unknown>);
      expect(() => JSON.parse(result)).not.toThrow();
    }
  });
});
