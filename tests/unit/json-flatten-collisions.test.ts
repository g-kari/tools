import { describe, expect, it } from "vite-plus/test";
import {
  flattenJson,
  type JsonValue,
  flattenJsonString,
  unflattenJson,
  unflattenJsonString,
} from "../../app/utils/json-flatten";

const delimiters = [".", "/", "_", "__", "-", ":"];

describe("JSON flatten path conflicts", () => {
  for (const delimiter of delimiters) {
    for (const reversed of [false, true]) {
      it(`rejects duplicate destinations with ${delimiter} (reversed=${reversed})`, () => {
        const entries: [string, unknown][] = [
          [`a${delimiter}b`, 1],
          ["a", { b: 2 }],
        ];
        const source = JSON.stringify(Object.fromEntries(reversed ? entries.reverse() : entries));
        expect(() => flattenJsonString(source, { delimiter })).toThrow("衝突");
        expect(() => flattenJsonString(source, { delimiter })).toThrow(`a${delimiter}b`);
      });

      it(`rejects ancestor conflicts with ${delimiter} (reversed=${reversed})`, () => {
        const entries: [string, unknown][] = [
          [`a${delimiter}b`, 1],
          ["a", 2],
        ];
        const source = JSON.stringify(Object.fromEntries(reversed ? entries.reverse() : entries));
        expect(() => unflattenJsonString(source, { delimiter })).toThrow("衝突");
        expect(() => unflattenJsonString(source, { delimiter })).toThrow(`a${delimiter}b`);
      });
    }
  }

  it("rejects a literal array-index key that would overwrite an array item", () => {
    expect(() => flattenJsonString('{"tags.0":"literal","tags":["array"]}')).toThrow("衝突");
    expect(() => flattenJsonString('{"tags":["array"],"tags.0":"literal"}')).toThrow("衝突");
  });

  it("rejects an empty-key path that collapses onto another member", () => {
    expect(() => flattenJsonString('{"":{"value":1},"value":2}')).toThrow("衝突");
  });

  for (const value of [null, false, 0, "", [], {}]) {
    it(`detects a duplicate destination after ${JSON.stringify(value)}`, () => {
      const source = JSON.stringify(
        Object.fromEntries([
          ["a.b", value],
          ["a", { b: 2 }],
        ]),
      );
      expect(() => flattenJsonString(source)).toThrow("衝突");
    });
  }

  it("detects collisions at the selected maximum depth", () => {
    expect(() => flattenJsonString('{"a.b":1,"a":{"b":{"c":2}}}', { maxDepth: 2 })).toThrow("衝突");
    expect(() => flattenJsonString('{"a":{"b":{"c":2}},"a.b":1}', { maxDepth: 2 })).toThrow("衝突");
    expect(JSON.parse(flattenJsonString('{"a.b":1,"a":{"b":{"c":2}}}'))).toEqual({
      "a.b": 1,
      "a.b.c": 2,
    });
    expect(JSON.parse(flattenJsonString('{"a.b":1,"a":{"b":2}}', { maxDepth: 1 }))).toEqual({
      "a.b": 1,
      a: { b: 2 },
    });
  });

  it("retains array and maximum-depth options without changing their output", () => {
    const source = '{"tags":["a","b"],"user":{"name":"太郎"}}';
    expect(JSON.parse(flattenJsonString(source, { flattenArrays: false }))).toEqual({
      tags: ["a", "b"],
      "user.name": "太郎",
    });
    expect(JSON.parse(flattenJsonString(source, { maxDepth: 1 }))).toEqual(JSON.parse(source));
    expect(unflattenJson({ "tags.0": "a", "tags.1": "b" })).toEqual({ tags: ["a", "b"] });
  });

  for (const value of [null, false, 0, "", 1, {}, { b: 1 }, [], [1]]) {
    it(`treats ${JSON.stringify(value)} as a leaf during prefix validation`, () => {
      const entries: [string, unknown][] = [
        ["a", value],
        ["a.b", 2],
      ];
      for (const ordered of [entries, [...entries].reverse()]) {
        const input = Object.fromEntries(ordered);
        const before = JSON.stringify(input);
        expect(() => unflattenJson(input as Record<string, JsonValue>)).toThrow("衝突");
        expect(JSON.stringify(input)).toBe(before);
      }
    });
  }

  it("compares segments, not raw string prefixes", () => {
    expect(unflattenJson({ a: 1, ab: 2 })).toEqual({ a: 1, ab: 2 });
    expect(unflattenJson({ a__b: 1, a__c: 2 }, { delimiter: "__" })).toEqual({ a: { b: 1, c: 2 } });
    expect(() => unflattenJson({ a__: 1, a____b: 2 }, { delimiter: "__" })).toThrow("衝突");
    expect(() => unflattenJson({ a: 1, ab: 2 }, { delimiter: "" })).toThrow("衝突");
    expect(unflattenJson({ "": 1, a: 2 }, { delimiter: "" })).toEqual({ a: 2 });
    expect(unflattenJson({ "": 1 }, { delimiter: "" })).toEqual({});
  });

  it("preserves numeric-root, sparse-array, and existing numeric-alias outputs", () => {
    expect(unflattenJson({ "0": "a", "2": "c" })).toEqual(["a", null, "c"]);
    expect(unflattenJson({ "0": "a", name: "x" })).toEqual({ "0": "a", name: "x" });
    expect(JSON.parse(unflattenJsonString('{"tags.01":"odd","tags.1":"regular"}'))).toEqual({
      tags: [null, "regular"],
    });
    expect(flattenJson(1)).toEqual({ "": 1 });
    expect(flattenJson({})).toEqual({ "": {} });
  });

  it("preserves literal own special keys with ordinary output objects", () => {
    const input = JSON.parse('{"__proto__":1,"constructor":2,"toString":3}');
    const flattened = flattenJson(input);
    expect(Object.getPrototypeOf(flattened)).toBe(Object.prototype);
    expect(Object.keys(flattened)).toEqual(["__proto__", "constructor", "toString"]);
    expect(JSON.parse(JSON.stringify(flattened))).toEqual(input);
    const restored = unflattenJson(input);
    if (restored === null || typeof restored !== "object") throw new Error("Expected an object");
    expect(Object.getPrototypeOf(restored)).toBe(Object.prototype);
    expect(Object.keys(restored)).toEqual(Object.keys(input));
    expect(JSON.stringify(restored)).toBe(JSON.stringify(input));
  });

  it("builds special-key descendants as own JSON members", () => {
    const key = "__toolsFlattenOwnMemberProbe";
    const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, key);
    try {
      const source = `{"__proto__.${key}":"own","constructor.name":"literal"}`;
      const result = JSON.parse(unflattenJsonString(source));
      expect(Object.hasOwn(result, "__proto__")).toBe(true);
      expect(result.__proto__[key]).toBe("own");
      expect(result.constructor).toEqual({ name: "literal" });
      expect(Object.getOwnPropertyDescriptor(Object.prototype, key)).toEqual(descriptor);
    } finally {
      if (descriptor) Object.defineProperty(Object.prototype, key, descriptor);
      else Reflect.deleteProperty(Object.prototype, key);
    }
  });
});
