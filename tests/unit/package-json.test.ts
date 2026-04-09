import { describe, it, expect } from "vite-plus/test";
import {
  generatePackageJson,
  getDefaultConfig,
  formatAuthor,
  PRESETS,
  SCRIPT_TEMPLATES,
  LICENSE_OPTIONS,
  MODULE_TYPE_OPTIONS,
} from "../../app/utils/package-json";

describe("getDefaultConfig", () => {
  it("デフォルト設定を返す", () => {
    const config = getDefaultConfig();
    expect(config.basic.version).toBe("1.0.0");
    expect(config.basic.license).toBe("MIT");
    expect(config.basic.private).toBe(false);
    expect(config.basic.type).toBe("");
    expect(config.scripts).toEqual([]);
    expect(config.keywords).toEqual([]);
  });

  it("呼び出すたびに独立したオブジェクトを返す", () => {
    const a = getDefaultConfig();
    const b = getDefaultConfig();
    a.basic.name = "changed";
    expect(b.basic.name).toBe("");
  });
});

describe("formatAuthor", () => {
  it("名前のみの場合、名前だけを返す", () => {
    expect(formatAuthor({ name: "Alice", email: "", url: "" })).toBe("Alice");
  });

  it("名前とメールの場合、正しくフォーマットする", () => {
    expect(formatAuthor({ name: "Alice", email: "alice@example.com", url: "" })).toBe(
      "Alice <alice@example.com>",
    );
  });

  it("名前とURLの場合、正しくフォーマットする", () => {
    expect(formatAuthor({ name: "Alice", email: "", url: "https://example.com" })).toBe(
      "Alice (https://example.com)",
    );
  });

  it("全フィールドがある場合、正しくフォーマットする", () => {
    const result = formatAuthor({
      name: "Alice",
      email: "alice@example.com",
      url: "https://example.com",
    });
    expect(result).toBe("Alice <alice@example.com> (https://example.com)");
  });

  it("名前が空の場合、空文字を返す", () => {
    expect(formatAuthor({ name: "", email: "alice@example.com", url: "https://example.com" })).toBe(
      "",
    );
  });
});

describe("generatePackageJson", () => {
  it("有効な JSON 文字列を生成する", () => {
    const config = getDefaultConfig();
    config.basic.name = "test-package";
    const result = generatePackageJson(config);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("name フィールドを含む", () => {
    const config = getDefaultConfig();
    config.basic.name = "my-package";
    const result = JSON.parse(generatePackageJson(config));
    expect(result.name).toBe("my-package");
  });

  it("version フィールドを含む", () => {
    const config = getDefaultConfig();
    config.basic.version = "2.3.4";
    const result = JSON.parse(generatePackageJson(config));
    expect(result.version).toBe("2.3.4");
  });

  it("description が空の場合は省略する", () => {
    const config = getDefaultConfig();
    config.basic.description = "";
    const result = JSON.parse(generatePackageJson(config));
    expect(result.description).toBeUndefined();
  });

  it("description がある場合は含む", () => {
    const config = getDefaultConfig();
    config.basic.description = "A test package";
    const result = JSON.parse(generatePackageJson(config));
    expect(result.description).toBe("A test package");
  });

  it("private: true の場合はフィールドを含む", () => {
    const config = getDefaultConfig();
    config.basic.private = true;
    const result = JSON.parse(generatePackageJson(config));
    expect(result.private).toBe(true);
  });

  it("private: false の場合はフィールドを省略する", () => {
    const config = getDefaultConfig();
    config.basic.private = false;
    const result = JSON.parse(generatePackageJson(config));
    expect(result.private).toBeUndefined();
  });

  it("type が設定されている場合は含む", () => {
    const config = getDefaultConfig();
    config.basic.type = "module";
    const result = JSON.parse(generatePackageJson(config));
    expect(result.type).toBe("module");
  });

  it("type が空の場合は省略する", () => {
    const config = getDefaultConfig();
    config.basic.type = "";
    const result = JSON.parse(generatePackageJson(config));
    expect(result.type).toBeUndefined();
  });

  it("main エントリポイントを含む", () => {
    const config = getDefaultConfig();
    config.entries.main = "dist/index.js";
    const result = JSON.parse(generatePackageJson(config));
    expect(result.main).toBe("dist/index.js");
  });

  it("module エントリポイントを含む", () => {
    const config = getDefaultConfig();
    config.entries.module = "dist/index.esm.js";
    const result = JSON.parse(generatePackageJson(config));
    expect(result.module).toBe("dist/index.esm.js");
  });

  it("types フィールドを含む", () => {
    const config = getDefaultConfig();
    config.entries.types = "dist/index.d.ts";
    const result = JSON.parse(generatePackageJson(config));
    expect(result.types).toBe("dist/index.d.ts");
  });

  it("エントリポイントが空の場合は省略する", () => {
    const config = getDefaultConfig();
    const result = JSON.parse(generatePackageJson(config));
    expect(result.main).toBeUndefined();
    expect(result.module).toBeUndefined();
    expect(result.types).toBeUndefined();
  });

  it("scripts フィールドを正しく生成する", () => {
    const config = getDefaultConfig();
    config.scripts = [
      { key: "build", value: "tsc" },
      { key: "test", value: "vitest" },
    ];
    const result = JSON.parse(generatePackageJson(config));
    expect(result.scripts).toEqual({ build: "tsc", test: "vitest" });
  });

  it("scripts が空の場合は省略する", () => {
    const config = getDefaultConfig();
    config.scripts = [];
    const result = JSON.parse(generatePackageJson(config));
    expect(result.scripts).toBeUndefined();
  });

  it("key が空のスクリプトを除外する", () => {
    const config = getDefaultConfig();
    config.scripts = [
      { key: "build", value: "tsc" },
      { key: "", value: "some command" },
    ];
    const result = JSON.parse(generatePackageJson(config));
    expect(Object.keys(result.scripts)).toEqual(["build"]);
  });

  it("keywords フィールドを含む", () => {
    const config = getDefaultConfig();
    config.keywords = ["typescript", "utility"];
    const result = JSON.parse(generatePackageJson(config));
    expect(result.keywords).toEqual(["typescript", "utility"]);
  });

  it("keywords が空の場合は省略する", () => {
    const config = getDefaultConfig();
    config.keywords = [];
    const result = JSON.parse(generatePackageJson(config));
    expect(result.keywords).toBeUndefined();
  });

  it("author フィールドを含む（名前あり）", () => {
    const config = getDefaultConfig();
    config.basic.author = { name: "Alice", email: "alice@example.com", url: "" };
    const result = JSON.parse(generatePackageJson(config));
    expect(result.author).toBe("Alice <alice@example.com>");
  });

  it("author の名前が空の場合は省略する", () => {
    const config = getDefaultConfig();
    config.basic.author = { name: "", email: "alice@example.com", url: "" };
    const result = JSON.parse(generatePackageJson(config));
    expect(result.author).toBeUndefined();
  });

  it("license フィールドを含む", () => {
    const config = getDefaultConfig();
    config.basic.license = "Apache-2.0";
    const result = JSON.parse(generatePackageJson(config));
    expect(result.license).toBe("Apache-2.0");
  });

  it("2 スペースインデントの JSON を生成する", () => {
    const config = getDefaultConfig();
    config.basic.name = "test";
    const result = generatePackageJson(config);
    expect(result).toContain('  "name"');
  });
});

describe("PRESETS", () => {
  it("4 つのプリセットを定義している", () => {
    expect(PRESETS.length).toBe(4);
  });

  it("全プリセットが label・description・config を持つ", () => {
    for (const preset of PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.config).toBeDefined();
    }
  });

  it("各プリセットが有効な license を持つ", () => {
    for (const preset of PRESETS) {
      if (preset.config.basic?.license) {
        expect(LICENSE_OPTIONS).toContain(preset.config.basic.license);
      }
    }
  });
});

describe("SCRIPT_TEMPLATES", () => {
  it("テンプレートが存在する", () => {
    expect(SCRIPT_TEMPLATES.length).toBeGreaterThan(0);
  });

  it("全テンプレートが key と value を持つ", () => {
    for (const tpl of SCRIPT_TEMPLATES) {
      expect(tpl.key.length).toBeGreaterThan(0);
      expect(tpl.value.length).toBeGreaterThan(0);
    }
  });
});

describe("LICENSE_OPTIONS", () => {
  it("MIT を含む", () => {
    expect(LICENSE_OPTIONS).toContain("MIT");
  });

  it("UNLICENSED を含む", () => {
    expect(LICENSE_OPTIONS).toContain("UNLICENSED");
  });
});

describe("MODULE_TYPE_OPTIONS", () => {
  it("空文字・commonjs・module の 3 種類を含む", () => {
    const values = MODULE_TYPE_OPTIONS.map((o) => o.value);
    expect(values).toContain("");
    expect(values).toContain("commonjs");
    expect(values).toContain("module");
  });
});
