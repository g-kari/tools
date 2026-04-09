import { describe, it, expect } from "vite-plus/test";
import { yamlToJson, jsonToYaml } from "../../app/routes/yaml-json";

describe("yamlToJson", () => {
  describe("基本的な変換", () => {
    /**
     * 基本的なキーバリューのYAMLをJSONに変換するテスト
     */
    it("基本的なキーバリューのYAMLをJSONに変換する", () => {
      const yaml = "name: 田中\nage: 30";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result).toEqual({ name: "田中", age: 30 });
    });

    /**
     * ネストされたオブジェクトを含むYAMLをJSONに変換するテスト
     */
    it("ネストされたオブジェクトを含むYAMLをJSONに変換する", () => {
      const yaml = "person:\n  name: 田中\n  age: 30\n  address:\n    city: 東京";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result).toEqual({
        person: {
          name: "田中",
          age: 30,
          address: { city: "東京" },
        },
      });
    });

    /**
     * 配列を含むYAMLをJSONに変換するテスト
     */
    it("配列を含むYAMLをJSONに変換する", () => {
      const yaml = "fruits:\n  - apple\n  - orange\n  - banana";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result).toEqual({ fruits: ["apple", "orange", "banana"] });
    });

    /**
     * オブジェクトと配列が混在する複合構造をJSONに変換するテスト
     */
    it("複合構造（オブジェクト+配列）をJSONに変換する", () => {
      const yaml = "users:\n  - name: 田中\n    age: 30\n  - name: 佐藤\n    age: 25";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result).toEqual({
        users: [
          { name: "田中", age: 30 },
          { name: "佐藤", age: 25 },
        ],
      });
    });

    /**
     * 文字列値を含むYAMLをJSONに変換するテスト
     */
    it("文字列値を含むYAMLをJSONに変換する", () => {
      const yaml = "greeting: Hello World\nmessage: こんにちは";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result).toEqual({ greeting: "Hello World", message: "こんにちは" });
    });

    /**
     * 数値・真偽値の型変換が正しく行われるテスト
     */
    it("数値・真偽値の型変換が正しく行われる", () => {
      const yaml = "count: 42\nprice: 3.14\nactive: true\ndisabled: false";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result).toEqual({
        count: 42,
        price: 3.14,
        active: true,
        disabled: false,
      });
    });

    /**
     * null値を含むYAMLをJSONに変換するテスト
     */
    it("null値を含むYAMLをJSONに変換する", () => {
      const yaml = "name: 田中\nvalue: null\nempty: ~";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result.name).toBe("田中");
      expect(result.value).toBeNull();
      expect(result.empty).toBeNull();
    });

    /**
     * 日本語テキストを含むYAMLをJSONに変換するテスト
     */
    it("日本語テキストを含むYAMLをJSONに変換する", () => {
      const yaml = "タイトル: サンプルデータ\n説明: これはテストです";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result).toEqual({
        タイトル: "サンプルデータ",
        説明: "これはテストです",
      });
    });
  });

  describe("コメントとオプション", () => {
    /**
     * コメント付きYAMLを変換するとコメントが除去されるテスト
     */
    it("コメント付きYAMLを変換するとコメントが除去される", () => {
      const yaml = "# これはコメントです\nname: 田中 # インラインコメント\nage: 30";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result).toEqual({ name: "田中", age: 30 });
    });

    /**
     * インデント2スペースオプションでJSONを出力するテスト
     */
    it("インデント2スペースオプションでJSONを出力する", () => {
      const yaml = "name: 田中\nage: 30";
      const result = yamlToJson(yaml, 2);
      expect(result).toContain("  ");
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: "田中", age: 30 });
    });

    /**
     * インデント4スペースオプションでJSONを出力するテスト
     */
    it("インデント4スペースオプションでJSONを出力する", () => {
      const yaml = "name: 田中\nage: 30";
      const result = yamlToJson(yaml, 4);
      expect(result).toContain("    ");
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: "田中", age: 30 });
    });

    /**
     * シングルクォートで囲まれた文字列を正しく変換するテスト
     */
    it("シングルクォートで囲まれた文字列を正しく変換する", () => {
      const yaml = "name: '田中太郎'\nvalue: 'hello world'";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result).toEqual({ name: "田中太郎", value: "hello world" });
    });

    /**
     * マルチライン文字列（リテラルブロック）を正しく変換するテスト
     */
    it("マルチライン文字列（リテラルブロック）を正しく変換する", () => {
      const yaml = "description: |\n  行1\n  行2\n  行3";
      const result = JSON.parse(yamlToJson(yaml));
      expect(result.description).toContain("行1");
      expect(result.description).toContain("行2");
      expect(result.description).toContain("行3");
    });
  });

  describe("エラーケース", () => {
    /**
     * 空文字列の入力でエラーをスローするテスト
     */
    it("空文字列の入力でエラーをスローする", () => {
      expect(() => yamlToJson("")).toThrow();
    });

    /**
     * 無効なYAML形式の入力でエラーをスローするテスト
     */
    it("無効なYAML形式の入力でエラーをスローする", () => {
      const invalidYaml = "key: :\n  invalid: : yaml";
      expect(() => yamlToJson(invalidYaml)).toThrow();
    });
  });
});

describe("jsonToYaml", () => {
  describe("基本的な変換", () => {
    /**
     * 基本的なオブジェクトをYAMLに変換するテスト
     */
    it("基本的なオブジェクトをYAMLに変換する", () => {
      const json = JSON.stringify({ name: "田中", age: 30 });
      const result = jsonToYaml(json);
      expect(result).toContain("name:");
      expect(result).toContain("田中");
      expect(result).toContain("age:");
      expect(result).toContain("30");
    });

    /**
     * ネストされたオブジェクトをYAMLに変換するテスト
     */
    it("ネストされたオブジェクトをYAMLに変換する", () => {
      const json = JSON.stringify({
        person: { name: "田中", address: { city: "東京" } },
      });
      const result = jsonToYaml(json);
      expect(result).toContain("person:");
      expect(result).toContain("name:");
      expect(result).toContain("address:");
      expect(result).toContain("city:");
    });

    /**
     * 配列を含むオブジェクトをYAMLに変換するテスト
     */
    it("配列を含むオブジェクトをYAMLに変換する", () => {
      const json = JSON.stringify({ fruits: ["apple", "orange", "banana"] });
      const result = jsonToYaml(json);
      expect(result).toContain("fruits:");
      expect(result).toContain("- apple");
      expect(result).toContain("- orange");
      expect(result).toContain("- banana");
    });

    /**
     * 複合構造（オブジェクト+配列）をYAMLに変換するテスト
     */
    it("複合構造（オブジェクト+配列）をYAMLに変換する", () => {
      const json = JSON.stringify({
        users: [
          { name: "田中", age: 30 },
          { name: "佐藤", age: 25 },
        ],
      });
      const result = jsonToYaml(json);
      expect(result).toContain("users:");
      expect(result).toContain("name:");
      expect(result).toContain("田中");
      expect(result).toContain("佐藤");
    });

    /**
     * 文字列値を含むJSONをYAMLに変換するテスト
     */
    it("文字列値を含むJSONをYAMLに変換する", () => {
      const json = JSON.stringify({
        greeting: "Hello World",
        message: "こんにちは",
      });
      const result = jsonToYaml(json);
      expect(result).toContain("greeting:");
      expect(result).toContain("Hello World");
      expect(result).toContain("message:");
      expect(result).toContain("こんにちは");
    });

    /**
     * 数値・真偽値の型変換が正しく行われるテスト
     */
    it("数値・真偽値の型変換が正しく行われる", () => {
      const json = JSON.stringify({
        count: 42,
        price: 3.14,
        active: true,
        disabled: false,
      });
      const result = jsonToYaml(json);
      expect(result).toContain("count: 42");
      expect(result).toContain("price: 3.14");
      expect(result).toContain("active: true");
      expect(result).toContain("disabled: false");
    });

    /**
     * null値を含むJSONをYAMLに変換するテスト
     */
    it("null値を含むJSONをYAMLに変換する", () => {
      const json = JSON.stringify({ name: "田中", value: null });
      const result = jsonToYaml(json);
      expect(result).toContain("name:");
      expect(result).toContain("value:");
      expect(result).toMatch(/value:\s*null/);
    });

    /**
     * 日本語テキストを含むJSONをYAMLに変換するテスト
     */
    it("日本語テキストを含むJSONをYAMLに変換する", () => {
      const json = JSON.stringify({
        タイトル: "サンプルデータ",
        説明: "これはテストです",
      });
      const result = jsonToYaml(json);
      expect(result).toContain("サンプルデータ");
      expect(result).toContain("これはテストです");
    });

    /**
     * 空オブジェクト{}をYAMLに変換するテスト
     */
    it("空オブジェクト{}をYAMLに変換する", () => {
      const json = "{}";
      const result = jsonToYaml(json);
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    /**
     * 空配列[]をYAMLに変換するテスト
     */
    it("空配列[]をYAMLに変換する", () => {
      const json = "[]";
      const result = jsonToYaml(json);
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });
  });

  describe("エラーケース", () => {
    /**
     * 空文字列の入力でエラーをスローするテスト
     */
    it("空文字列の入力でエラーをスローする", () => {
      expect(() => jsonToYaml("")).toThrow();
    });

    /**
     * 無効なJSON形式の入力でエラーをスローするテスト
     */
    it("無効なJSON形式の入力でエラーをスローする", () => {
      expect(() => jsonToYaml("{invalid json}")).toThrow();
    });
  });
});

describe("ラウンドトリップ変換", () => {
  /**
   * YAML→JSON→YAMLの往復変換で値が等価なテスト
   */
  it("YAML→JSON→YAMLの往復変換で値が等価", () => {
    const originalYaml = "name: 田中\nage: 30\ncity: 東京";
    const json = yamlToJson(originalYaml);
    const backToYaml = jsonToYaml(json);
    const reparsed = JSON.parse(yamlToJson(backToYaml));
    const original = JSON.parse(json);
    expect(reparsed).toEqual(original);
  });

  /**
   * JSON→YAML→JSONの往復変換で値が等価なテスト
   */
  it("JSON→YAML→JSONの往復変換で値が等価", () => {
    const originalJson = JSON.stringify({
      name: "田中",
      age: 30,
      active: true,
    });
    const yaml = jsonToYaml(originalJson);
    const backToJson = yamlToJson(yaml);
    expect(JSON.parse(backToJson)).toEqual(JSON.parse(originalJson));
  });

  /**
   * ネストされた構造のラウンドトリップが値を保持するテスト
   */
  it("ネストされた構造のラウンドトリップが値を保持する", () => {
    const originalJson = JSON.stringify({
      person: {
        name: "田中",
        address: { city: "東京", zip: "100-0001" },
      },
    });
    const yaml = jsonToYaml(originalJson);
    const backToJson = yamlToJson(yaml);
    expect(JSON.parse(backToJson)).toEqual(JSON.parse(originalJson));
  });

  /**
   * 配列を含む構造のラウンドトリップが値を保持するテスト
   */
  it("配列を含む構造のラウンドトリップが値を保持する", () => {
    const originalJson = JSON.stringify({
      users: [
        { name: "田中", age: 30 },
        { name: "佐藤", age: 25 },
      ],
    });
    const yaml = jsonToYaml(originalJson);
    const backToJson = yamlToJson(yaml);
    expect(JSON.parse(backToJson)).toEqual(JSON.parse(originalJson));
  });

  /**
   * 混合型（文字列・数値・真偽値・null）のラウンドトリップが値を保持するテスト
   */
  it("混合型のラウンドトリップが値を保持する", () => {
    const originalJson = JSON.stringify({
      str: "テキスト",
      num: 42,
      float: 3.14,
      bool: true,
      nullable: null,
      arr: [1, "two", false],
    });
    const yaml = jsonToYaml(originalJson);
    const backToJson = yamlToJson(yaml);
    expect(JSON.parse(backToJson)).toEqual(JSON.parse(originalJson));
  });
});
