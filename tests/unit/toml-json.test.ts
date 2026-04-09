import { describe, it, expect } from "vite-plus/test";
import { tomlToJson, jsonToToml } from "../../app/routes/toml-json";

describe("tomlToJson", () => {
  describe("基本的な変換", () => {
    /**
     * 基本的なキーバリューのTOMLをJSONに変換するテスト
     */
    it("基本的なキーバリューのTOMLをJSONに変換する", () => {
      const toml = 'name = "田中"\nage = 30';
      const result = JSON.parse(tomlToJson(toml));
      expect(result).toEqual({ name: "田中", age: 30 });
    });

    /**
     * ネストされたオブジェクトを含むTOMLをJSONに変換するテスト
     */
    it("ネストされたオブジェクトを含むTOMLをJSONに変換する", () => {
      const toml = '[person]\nname = "田中"\nage = 30\n\n[person.address]\ncity = "東京"';
      const result = JSON.parse(tomlToJson(toml));
      expect(result).toEqual({
        person: {
          name: "田中",
          age: 30,
          address: { city: "東京" },
        },
      });
    });

    /**
     * 配列を含むTOMLをJSONに変換するテスト
     */
    it("配列を含むTOMLをJSONに変換する", () => {
      const toml = 'fruits = ["apple", "orange", "banana"]';
      const result = JSON.parse(tomlToJson(toml));
      expect(result).toEqual({ fruits: ["apple", "orange", "banana"] });
    });

    /**
     * オブジェクトと配列が混在する複合構造をJSONに変換するテスト
     */
    it("複合構造（オブジェクト+配列）をJSONに変換する", () => {
      const toml = '[[users]]\nname = "田中"\nage = 30\n\n[[users]]\nname = "佐藤"\nage = 25';
      const result = JSON.parse(tomlToJson(toml));
      expect(result).toEqual({
        users: [
          { name: "田中", age: 30 },
          { name: "佐藤", age: 25 },
        ],
      });
    });

    /**
     * 文字列値を含むTOMLをJSONに変換するテスト
     */
    it("文字列値を含むTOMLをJSONに変換する", () => {
      const toml = 'greeting = "Hello World"\nmessage = "こんにちは"';
      const result = JSON.parse(tomlToJson(toml));
      expect(result).toEqual({ greeting: "Hello World", message: "こんにちは" });
    });

    /**
     * 数値・真偽値の型変換が正しく行われるテスト
     */
    it("数値・真偽値の型変換が正しく行われる", () => {
      const toml = "count = 42\nprice = 3.14\nactive = true\ndisabled = false";
      const result = JSON.parse(tomlToJson(toml));
      expect(result).toEqual({
        count: 42,
        price: 3.14,
        active: true,
        disabled: false,
      });
    });

    /**
     * 日本語テキストを含むTOMLをJSONに変換するテスト
     */
    it("日本語テキストを含むTOMLをJSONに変換する", () => {
      const toml = 'title = "サンプルデータ"\ndescription = "これはテストです"';
      const result = JSON.parse(tomlToJson(toml));
      expect(result).toEqual({
        title: "サンプルデータ",
        description: "これはテストです",
      });
    });
  });

  describe("コメントとオプション", () => {
    /**
     * コメント付きTOMLを変換するとコメントが除去されるテスト
     */
    it("コメント付きTOMLを変換するとコメントが除去される", () => {
      const toml = '# これはコメントです\nname = "田中"\nage = 30';
      const result = JSON.parse(tomlToJson(toml));
      expect(result).toEqual({ name: "田中", age: 30 });
    });

    /**
     * インデント2スペースオプションでJSONを出力するテスト
     */
    it("インデント2スペースオプションでJSONを出力する", () => {
      const toml = 'name = "田中"\nage = 30';
      const result = tomlToJson(toml, 2);
      expect(result).toContain("  ");
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: "田中", age: 30 });
    });

    /**
     * インデント4スペースオプションでJSONを出力するテスト
     */
    it("インデント4スペースオプションでJSONを出力する", () => {
      const toml = 'name = "田中"\nage = 30';
      const result = tomlToJson(toml, 4);
      expect(result).toContain("    ");
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: "田中", age: 30 });
    });
  });

  describe("エラーケース", () => {
    /**
     * 空文字列の入力でエラーをスローするテスト
     */
    it("空文字列の入力でエラーをスローする", () => {
      expect(() => tomlToJson("")).toThrow();
    });

    /**
     * 無効なTOML形式の入力でエラーをスローするテスト
     */
    it("無効なTOML形式の入力でエラーをスローする", () => {
      const invalidToml = "key = = invalid";
      expect(() => tomlToJson(invalidToml)).toThrow();
    });
  });
});

describe("jsonToToml", () => {
  describe("基本的な変換", () => {
    /**
     * 基本的なオブジェクトをTOMLに変換するテスト
     */
    it("基本的なオブジェクトをTOMLに変換する", () => {
      const json = JSON.stringify({ name: "田中", age: 30 });
      const result = jsonToToml(json);
      expect(result).toContain("name");
      expect(result).toContain("田中");
      expect(result).toContain("age");
      expect(result).toContain("30");
    });

    /**
     * ネストされたオブジェクトをTOMLに変換するテスト
     */
    it("ネストされたオブジェクトをTOMLに変換する", () => {
      const json = JSON.stringify({
        person: { name: "田中", address: { city: "東京" } },
      });
      const result = jsonToToml(json);
      expect(result).toContain("person");
      expect(result).toContain("name");
      expect(result).toContain("address");
      expect(result).toContain("city");
    });

    /**
     * 配列を含むオブジェクトをTOMLに変換するテスト
     */
    it("配列を含むオブジェクトをTOMLに変換する", () => {
      const json = JSON.stringify({ fruits: ["apple", "orange", "banana"] });
      const result = jsonToToml(json);
      expect(result).toContain("fruits");
      expect(result).toContain("apple");
      expect(result).toContain("orange");
      expect(result).toContain("banana");
    });

    /**
     * 複合構造（オブジェクト+配列）をTOMLに変換するテスト
     */
    it("複合構造（オブジェクト+配列）をTOMLに変換する", () => {
      const json = JSON.stringify({
        users: [
          { name: "田中", age: 30 },
          { name: "佐藤", age: 25 },
        ],
      });
      const result = jsonToToml(json);
      expect(result).toContain("users");
      expect(result).toContain("田中");
      expect(result).toContain("佐藤");
    });

    /**
     * 文字列値を含むJSONをTOMLに変換するテスト
     */
    it("文字列値を含むJSONをTOMLに変換する", () => {
      const json = JSON.stringify({
        greeting: "Hello World",
        message: "こんにちは",
      });
      const result = jsonToToml(json);
      expect(result).toContain("greeting");
      expect(result).toContain("Hello World");
      expect(result).toContain("message");
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
      const result = jsonToToml(json);
      expect(result).toContain("42");
      expect(result).toContain("3.14");
      expect(result).toContain("true");
      expect(result).toContain("false");
    });

    /**
     * 日本語テキストを含むJSONをTOMLに変換するテスト
     */
    it("日本語テキストを含むJSONをTOMLに変換する", () => {
      const json = JSON.stringify({
        title: "サンプルデータ",
        description: "これはテストです",
      });
      const result = jsonToToml(json);
      expect(result).toContain("サンプルデータ");
      expect(result).toContain("これはテストです");
    });

    /**
     * 空オブジェクト{}をTOMLに変換するテスト
     */
    it("空オブジェクト{}をTOMLに変換する", () => {
      const json = "{}";
      const result = jsonToToml(json);
      expect(typeof result).toBe("string");
    });
  });

  describe("エラーケース", () => {
    /**
     * 空文字列の入力でエラーをスローするテスト
     */
    it("空文字列の入力でエラーをスローする", () => {
      expect(() => jsonToToml("")).toThrow();
    });

    /**
     * 無効なJSON形式の入力でエラーをスローするテスト
     */
    it("無効なJSON形式の入力でエラーをスローする", () => {
      expect(() => jsonToToml("{invalid json}")).toThrow();
    });

    /**
     * トップレベル配列の入力でエラーをスローするテスト（TOMLはルート配列をサポートしない）
     */
    it("トップレベル配列の入力でエラーをスローする", () => {
      expect(() => jsonToToml("[1, 2, 3]")).toThrow(
        "JSONのルートはオブジェクト（{}）である必要があります",
      );
    });

    /**
     * 配列内にnull値を含むJSONでエラーをスローするテスト
     */
    it("配列内のnull値を含むJSONでエラーをスローする", () => {
      expect(() => jsonToToml('{"arr": [null]}')).toThrow();
    });
  });
});

describe("ラウンドトリップ変換", () => {
  /**
   * TOML→JSON→TOMLの往復変換で値が等価なテスト
   */
  it("TOML→JSON→TOMLの往復変換で値が等価", () => {
    const originalToml = 'name = "田中"\nage = 30\ncity = "東京"';
    const json = tomlToJson(originalToml);
    const backToToml = jsonToToml(json);
    const reparsed = JSON.parse(tomlToJson(backToToml));
    const original = JSON.parse(json);
    expect(reparsed).toEqual(original);
  });

  /**
   * JSON→TOML→JSONの往復変換で値が等価なテスト
   */
  it("JSON→TOML→JSONの往復変換で値が等価", () => {
    const originalJson = JSON.stringify({
      name: "田中",
      age: 30,
      active: true,
    });
    const toml = jsonToToml(originalJson);
    const backToJson = tomlToJson(toml);
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
    const toml = jsonToToml(originalJson);
    const backToJson = tomlToJson(toml);
    expect(JSON.parse(backToJson)).toEqual(JSON.parse(originalJson));
  });

  /**
   * 配列を含む構造のラウンドトリップが値を保持するテスト
   */
  it("配列を含む構造のラウンドトリップが値を保持する", () => {
    const originalJson = JSON.stringify({
      fruits: ["apple", "orange", "banana"],
    });
    const toml = jsonToToml(originalJson);
    const backToJson = tomlToJson(toml);
    expect(JSON.parse(backToJson)).toEqual(JSON.parse(originalJson));
  });

  /**
   * 混合型（文字列・数値・真偽値）のラウンドトリップが値を保持するテスト
   * ※TOMLはnull値をサポートしていないため、null値のテストは除外
   */
  it("混合型のラウンドトリップが値を保持する", () => {
    const originalJson = JSON.stringify({
      str: "テキスト",
      num: 42,
      float: 3.14,
      bool: true,
    });
    const toml = jsonToToml(originalJson);
    const backToJson = tomlToJson(toml);
    expect(JSON.parse(backToJson)).toEqual(JSON.parse(originalJson));
  });
});
