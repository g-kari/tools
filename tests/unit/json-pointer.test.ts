import { describe, it, expect } from "vite-plus/test";
import {
  evaluateJsonPointer,
  enumeratePointers,
  decodeToken,
  encodeToken,
  getSampleJson,
  EXAMPLE_POINTERS,
} from "../../app/utils/json-pointer";

describe("JSON Pointer Utility (RFC 6901)", () => {
  const sampleDoc = JSON.stringify({
    store: {
      book: [
        {
          category: "reference",
          author: "Nigel Rees",
          title: "Sayings of the Century",
          price: 8.95,
        },
        { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 },
      ],
      bicycle: { color: "red", price: 19.95 },
    },
    user: { name: "Alice", active: true, tags: ["admin", "editor"] },
  });

  // ------------------------------------------------------------------ //
  describe("decodeToken", () => {
    it("should decode ~1 to /", () => {
      expect(decodeToken("a~1b")).toBe("a/b");
    });

    it("should decode ~0 to ~", () => {
      expect(decodeToken("a~0b")).toBe("a~b");
    });

    it("should decode ~1 before ~0 per RFC 6901", () => {
      expect(decodeToken("~01")).toBe("~1");
    });

    it("should leave plain tokens unchanged", () => {
      expect(decodeToken("foo")).toBe("foo");
    });
  });

  // ------------------------------------------------------------------ //
  describe("encodeToken", () => {
    it("should encode / to ~1", () => {
      expect(encodeToken("a/b")).toBe("a~1b");
    });

    it("should encode ~ to ~0", () => {
      expect(encodeToken("a~b")).toBe("a~0b");
    });

    it("should encode ~ before / per RFC 6901", () => {
      expect(encodeToken("a~/b")).toBe("a~0~1b");
    });

    it("should leave plain keys unchanged", () => {
      expect(encodeToken("foo")).toBe("foo");
    });
  });

  // ------------------------------------------------------------------ //
  describe("evaluateJsonPointer", () => {
    it("should return root document for empty pointer", () => {
      const result = evaluateJsonPointer(sampleDoc, "");
      expect(result.type).toBe("object (2キー)");
      const parsed = JSON.parse(result.formatted) as { store: unknown; user: unknown };
      expect(parsed.store).toBeDefined();
      expect(parsed.user).toBeDefined();
    });

    it("should access a nested object key", () => {
      const result = evaluateJsonPointer(sampleDoc, "/store/bicycle/color");
      expect(result.value).toBe("red");
      expect(result.type).toBe("string");
    });

    it("should access an array element by index", () => {
      const result = evaluateJsonPointer(sampleDoc, "/store/book/0/title");
      expect(result.value).toBe("Sayings of the Century");
    });

    it("should access a deeply nested value", () => {
      const result = evaluateJsonPointer(sampleDoc, "/user/tags/1");
      expect(result.value).toBe("editor");
    });

    it("should access a boolean value", () => {
      const result = evaluateJsonPointer(sampleDoc, "/user/active");
      expect(result.value).toBe(true);
      expect(result.type).toBe("boolean");
    });

    it("should access a number value", () => {
      const result = evaluateJsonPointer(sampleDoc, "/store/bicycle/price");
      expect(result.value).toBe(19.95);
      expect(result.type).toBe("number");
    });

    it("should access an object", () => {
      const result = evaluateJsonPointer(sampleDoc, "/store/bicycle");
      expect(result.type).toBe("object (2キー)");
    });

    it("should access an array", () => {
      const result = evaluateJsonPointer(sampleDoc, "/store/book");
      expect(result.type).toBe("array (2件)");
    });

    it("should handle keys with escaped slashes", () => {
      const doc = JSON.stringify({ "a/b": "value" });
      const result = evaluateJsonPointer(doc, "/a~1b");
      expect(result.value).toBe("value");
    });

    it("should handle keys with escaped tildes", () => {
      const doc = JSON.stringify({ "a~b": "value" });
      const result = evaluateJsonPointer(doc, "/a~0b");
      expect(result.value).toBe("value");
    });

    it("should throw for empty JSON input", () => {
      expect(() => evaluateJsonPointer("", "/foo")).toThrow("JSONを入力してください");
    });

    it("should throw for invalid JSON", () => {
      expect(() => evaluateJsonPointer("{invalid}", "/foo")).toThrow("無効なJSON形式です");
    });

    it("should throw for pointer not starting with /", () => {
      expect(() => evaluateJsonPointer('{"a":1}', "a")).toThrow("/");
    });

    it("should throw when key does not exist", () => {
      expect(() => evaluateJsonPointer('{"a":1}', "/missing")).toThrow('"missing"');
    });

    it("should throw for out-of-range array index", () => {
      expect(() => evaluateJsonPointer("[1,2,3]", "/5")).toThrow("範囲外");
    });

    it("should throw for - index in read-only evaluation", () => {
      expect(() => evaluateJsonPointer("[1,2,3]", "/-")).toThrow("−");
    });
  });

  // ------------------------------------------------------------------ //
  describe("enumeratePointers", () => {
    it("should enumerate all leaf pointers", () => {
      const entries = enumeratePointers(sampleDoc);
      const pointers = entries.map((e) => e.pointer);
      expect(pointers).toContain("/store/book/0/title");
      expect(pointers).toContain("/store/bicycle/color");
      expect(pointers).toContain("/user/active");
    });

    it("should include type information for each entry", () => {
      const entries = enumeratePointers(sampleDoc);
      const titleEntry = entries.find((e) => e.pointer === "/store/book/0/title");
      expect(titleEntry?.type).toBe("string");
    });

    it("should include value string for each entry", () => {
      const entries = enumeratePointers(sampleDoc);
      const colorEntry = entries.find((e) => e.pointer === "/store/bicycle/color");
      expect(colorEntry?.value).toBe('"red"');
    });

    it("should respect maxEntries limit", () => {
      const entries = enumeratePointers(sampleDoc, 3);
      expect(entries.length).toBeLessThanOrEqual(3);
    });

    it("should handle empty object", () => {
      const entries = enumeratePointers("{}");
      expect(entries.length).toBe(1);
      expect(entries[0].value).toBe("{}");
    });

    it("should handle empty array", () => {
      const entries = enumeratePointers("[]");
      expect(entries.length).toBe(1);
      expect(entries[0].value).toBe("[]");
    });

    it("should throw for empty input", () => {
      expect(() => enumeratePointers("")).toThrow("JSONを入力してください");
    });

    it("should throw for invalid JSON", () => {
      expect(() => enumeratePointers("{bad}")).toThrow("無効なJSON形式です");
    });
  });

  // ------------------------------------------------------------------ //
  describe("getSampleJson", () => {
    it("should return valid JSON", () => {
      expect(() => JSON.parse(getSampleJson())).not.toThrow();
    });

    it("should contain store and user keys", () => {
      const parsed = JSON.parse(getSampleJson()) as { store: unknown; user: unknown };
      expect(parsed.store).toBeDefined();
      expect(parsed.user).toBeDefined();
    });
  });

  // ------------------------------------------------------------------ //
  describe("EXAMPLE_POINTERS", () => {
    it("should contain at least one entry", () => {
      expect(EXAMPLE_POINTERS.length).toBeGreaterThan(0);
    });

    it("each entry should have pointer and label fields", () => {
      for (const ex of EXAMPLE_POINTERS) {
        expect(typeof ex.pointer).toBe("string");
        expect(typeof ex.label).toBe("string");
      }
    });
  });
});
