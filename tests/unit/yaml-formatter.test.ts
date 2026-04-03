import { describe, it, expect } from "vitest";
import { formatYaml, minifyYaml, validateYaml } from "../../app/utils/yaml";

describe("formatYaml", () => {
  describe("基本的な整形", () => {
    it("シンプルなYAMLをインデント2で整形できる", () => {
      const input = "name: Alice\nage: 30";
      const result = formatYaml(input, 2);
      expect(result).toContain("name: Alice");
      expect(result).toContain("age: 30");
    });

    it("ネストしたオブジェクトをインデント2で整形できる", () => {
      const input = "person:\n  name: Bob\n  age: 25";
      const result = formatYaml(input, 2);
      expect(result).toContain("person:");
      expect(result).toContain("  name: Bob");
    });

    it("インデント4で整形できる", () => {
      const input = "person:\n  name: Bob";
      const result = formatYaml(input, 4);
      expect(result).toContain("    name: Bob");
    });

    it("配列を含むYAMLを整形できる", () => {
      const input = "fruits:\n  - apple\n  - banana\n  - cherry";
      const result = formatYaml(input, 2);
      expect(result).toContain("fruits:");
      expect(result).toContain("apple");
      expect(result).toContain("banana");
    });

    it("整形後も値が保持される", () => {
      const input = "url: https://example.com\nport: 8080\nenabled: true";
      const result = formatYaml(input, 2);
      expect(result).toContain("https://example.com");
      expect(result).toContain("8080");
      expect(result).toContain("true");
    });
  });

  describe("sortKeys オプション", () => {
    it("sortKeys=true でキーがアルファベット順に並ぶ", () => {
      const input = "zebra: 1\napple: 2\nmango: 3";
      const result = formatYaml(input, 2, true);
      const appleIdx = result.indexOf("apple");
      const mangoIdx = result.indexOf("mango");
      const zebraIdx = result.indexOf("zebra");
      expect(appleIdx).toBeLessThan(mangoIdx);
      expect(mangoIdx).toBeLessThan(zebraIdx);
    });

    it("sortKeys=false でキーの順序が維持される（デフォルト）", () => {
      const input = "zebra: 1\napple: 2\nmango: 3";
      const result = formatYaml(input, 2, false);
      const zebraIdx = result.indexOf("zebra");
      const appleIdx = result.indexOf("apple");
      expect(zebraIdx).toBeLessThan(appleIdx);
    });
  });

  describe("エラーケース", () => {
    it("空文字列はエラーをスローする", () => {
      expect(() => formatYaml("")).toThrow("YAMLデータが空です");
    });

    it("空白のみはエラーをスローする", () => {
      expect(() => formatYaml("   ")).toThrow("YAMLデータが空です");
    });

    it("コメントのみはエラーをスローする", () => {
      expect(() => formatYaml("# comment only")).toThrow("YAMLデータが空です");
    });

    it("不正なYAML構文はエラーをスローする", () => {
      const invalid = "key: : invalid";
      expect(() => formatYaml(invalid)).toThrow();
    });
  });
});

describe("minifyYaml", () => {
  describe("基本的な圧縮", () => {
    it("シンプルなYAMLを圧縮できる", () => {
      const input = "name: Alice\nage: 30";
      const result = minifyYaml(input);
      // 圧縮後は改行が少なくなるか、フロースタイルになる
      expect(result).toBeTruthy();
      expect(result).toContain("Alice");
      expect(result).toContain("30");
    });

    it("ネストしたオブジェクトを圧縮できる", () => {
      const input = `
person:
  name: Bob
  age: 25
  address:
    city: Tokyo
`;
      const result = minifyYaml(input);
      expect(result).toContain("Bob");
      expect(result).toContain("25");
      expect(result).toContain("Tokyo");
      // フロースタイルに変換されていることを確認
      expect(result).toContain("{");
    });

    it("圧縮後に末尾の改行がない", () => {
      const input = "name: Alice\nage: 30";
      const result = minifyYaml(input);
      expect(result.endsWith("\n")).toBe(false);
    });

    it("配列を含むYAMLを圧縮できる", () => {
      const input = "fruits:\n  - apple\n  - banana";
      const result = minifyYaml(input);
      expect(result).toContain("apple");
      expect(result).toContain("banana");
    });
  });

  describe("エラーケース", () => {
    it("空文字列はエラーをスローする", () => {
      expect(() => minifyYaml("")).toThrow("YAMLデータが空です");
    });

    it("空白のみはエラーをスローする", () => {
      expect(() => minifyYaml("   \n   ")).toThrow("YAMLデータが空です");
    });

    it("コメントのみはエラーをスローする", () => {
      expect(() => minifyYaml("# comment")).toThrow("YAMLデータが空です");
    });

    it("不正なYAMLはエラーをスローする", () => {
      expect(() => minifyYaml("key: : invalid")).toThrow();
    });
  });
});

describe("validateYaml", () => {
  describe("有効なYAML", () => {
    it("シンプルなkey-valueは有効", () => {
      const result = validateYaml("name: Alice\nage: 30");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("ネストしたオブジェクトは有効", () => {
      const result = validateYaml("person:\n  name: Bob\n  age: 25");
      expect(result.valid).toBe(true);
    });

    it("配列を含むYAMLは有効", () => {
      const result = validateYaml("fruits:\n  - apple\n  - banana");
      expect(result.valid).toBe(true);
    });

    it("数値・真偽値・nullを含むYAMLは有効", () => {
      const result = validateYaml("count: 42\nflag: true\nvalue: null");
      expect(result.valid).toBe(true);
    });

    it("マルチラインYAMLは有効", () => {
      const input = `
database:
  host: localhost
  port: 5432
  name: mydb
servers:
  - prod
  - staging
`;
      const result = validateYaml(input);
      expect(result.valid).toBe(true);
    });
  });

  describe("無効なYAML", () => {
    it("空文字列はinvalid", () => {
      const result = validateYaml("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("YAMLデータが空です");
    });

    it("空白のみはinvalid", () => {
      const result = validateYaml("   ");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("YAMLデータが空です");
    });

    it("コメントのみはinvalid", () => {
      const result = validateYaml("# comment only");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("空");
    });

    it("不正なインデントはinvalid", () => {
      const invalid = "key:\n  sub: 1\n invalid-indent: 2";
      const result = validateYaml(invalid);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("タブインデントはinvalid", () => {
      const withTab = "key:\n\tsub: value";
      const result = validateYaml(withTab);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("エラーメッセージが含まれる", () => {
      const result = validateYaml("bad: : yaml");
      expect(result.valid).toBe(false);
      expect(typeof result.error).toBe("string");
      expect(result.error!.length).toBeGreaterThan(0);
    });
  });

  describe("formatYaml との連携", () => {
    it("validateYaml が valid なら formatYaml もエラーなく実行できる", () => {
      const input = "name: Alice\nage: 30";
      const validation = validateYaml(input);
      expect(validation.valid).toBe(true);
      expect(() => formatYaml(input)).not.toThrow();
    });

    it("validateYaml が invalid なら formatYaml はスローする", () => {
      const input = "bad: : yaml";
      const validation = validateYaml(input);
      expect(validation.valid).toBe(false);
      expect(() => formatYaml(input)).toThrow();
    });
  });
});
