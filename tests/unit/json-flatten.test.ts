import { describe, it, expect } from "vite-plus/test";
import {
  flattenJson,
  unflattenJson,
  flattenJsonString,
  unflattenJsonString,
} from "../../app/utils/json-flatten";

describe("flattenJson", () => {
  it("シンプルなネストオブジェクトをフラット化する", () => {
    const input = { user: { name: "太郎", age: 30 } };
    const result = flattenJson(input);
    expect(result).toEqual({ "user.name": "太郎", "user.age": 30 });
  });

  it("深いネスト構造をフラット化する", () => {
    const input = { a: { b: { c: { d: 1 } } } };
    const result = flattenJson(input);
    expect(result).toEqual({ "a.b.c.d": 1 });
  });

  it("配列をフラット化する", () => {
    const input = { tags: ["a", "b", "c"] };
    const result = flattenJson(input);
    expect(result).toEqual({
      "tags.0": "a",
      "tags.1": "b",
      "tags.2": "c",
    });
  });

  it("配列フラット化を無効にする", () => {
    const input = { tags: ["a", "b"] };
    const result = flattenJson(input, { flattenArrays: false });
    expect(result).toEqual({ tags: ["a", "b"] });
  });

  it("カスタム区切り文字を使用する", () => {
    const input = { user: { name: "太郎" } };
    const result = flattenJson(input, { delimiter: "/" });
    expect(result).toEqual({ "user/name": "太郎" });
  });

  it("アンダースコア区切り文字を使用する", () => {
    const input = { user: { name: "太郎" } };
    const result = flattenJson(input, { delimiter: "_" });
    expect(result).toEqual({ user_name: "太郎" });
  });

  it("nullを含むオブジェクトをフラット化する", () => {
    const input = { user: { name: null, active: true } };
    const result = flattenJson(input);
    expect(result).toEqual({ "user.name": null, "user.active": true });
  });

  it("空オブジェクトをフラット化する", () => {
    const input = { empty: {} };
    const result = flattenJson(input);
    expect(result).toEqual({ empty: {} });
  });

  it("空配列をフラット化する", () => {
    const input = { items: [] };
    const result = flattenJson(input);
    expect(result).toEqual({ items: [] });
  });

  it("最大深さを制限する", () => {
    // maxDepth=1 は深さ1のオブジェクトまで展開する（トップレベルのみ）
    const input = { a: { b: { c: 1 } } };
    const result = flattenJson(input, { maxDepth: 1 });
    expect(result).toEqual({ a: { b: { c: 1 } } });
  });

  it("混合型（数値・文字列・真偽値）をフラット化する", () => {
    const input = {
      str: "hello",
      num: 42,
      bool: true,
      nested: { x: 1 },
    };
    const result = flattenJson(input);
    expect(result).toEqual({
      str: "hello",
      num: 42,
      bool: true,
      "nested.x": 1,
    });
  });
});

describe("unflattenJson", () => {
  it("フラットなオブジェクトをネスト化する", () => {
    const input = { "user.name": "太郎", "user.age": 30 };
    const result = unflattenJson(input);
    expect(result).toEqual({ user: { name: "太郎", age: 30 } });
  });

  it("深いキーをネスト化する", () => {
    const input = { "a.b.c.d": 1 };
    const result = unflattenJson(input);
    expect(result).toEqual({ a: { b: { c: { d: 1 } } } });
  });

  it("数値インデックスを配列に復元する", () => {
    const input = { "tags.0": "a", "tags.1": "b", "tags.2": "c" };
    const result = unflattenJson(input);
    expect(result).toEqual({ tags: ["a", "b", "c"] });
  });

  it("カスタム区切り文字でアンフラット化する", () => {
    const input = { "user/name": "太郎" };
    const result = unflattenJson(input, { delimiter: "/" });
    expect(result).toEqual({ user: { name: "太郎" } });
  });

  it("空のオブジェクトを処理する", () => {
    const result = unflattenJson({});
    expect(result).toEqual({});
  });
});

describe("flattenJsonString", () => {
  it("JSON文字列をフラット化する", () => {
    const input = JSON.stringify({ user: { name: "太郎", age: 30 } });
    const result = flattenJsonString(input);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ "user.name": "太郎", "user.age": 30 });
  });

  it("無効なJSONで例外をスローする", () => {
    expect(() => flattenJsonString("invalid json")).toThrow();
  });

  it("区切り文字オプションを適用する", () => {
    const input = JSON.stringify({ a: { b: 1 } });
    const result = flattenJsonString(input, { delimiter: "/" });
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ "a/b": 1 });
  });
});

describe("unflattenJsonString", () => {
  it("フラットなJSON文字列をアンフラット化する", () => {
    const input = JSON.stringify({ "user.name": "太郎", "user.age": 30 });
    const result = unflattenJsonString(input);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ user: { name: "太郎", age: 30 } });
  });

  it("無効なJSONで例外をスローする", () => {
    expect(() => unflattenJsonString("invalid json")).toThrow();
  });

  it("配列でない入力でエラーをスローする", () => {
    expect(() => unflattenJsonString("[1, 2, 3]")).toThrow();
  });

  it("区切り文字オプションを適用する", () => {
    const input = JSON.stringify({ "a/b": 1 });
    const result = unflattenJsonString(input, { delimiter: "/" });
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ a: { b: 1 } });
  });
});

describe("フラット化 → アンフラット化のラウンドトリップ", () => {
  it("シンプルなオブジェクトのラウンドトリップ", () => {
    const original = { user: { name: "太郎", age: 30 } };
    const flattened = flattenJson(original);
    const restored = unflattenJson(flattened as Record<string, unknown>);
    expect(restored).toEqual(original);
  });

  it("配列を含むオブジェクトのラウンドトリップ", () => {
    const original = { tags: ["a", "b", "c"] };
    const flattened = flattenJson(original);
    const restored = unflattenJson(flattened as Record<string, unknown>);
    expect(restored).toEqual(original);
  });
});
