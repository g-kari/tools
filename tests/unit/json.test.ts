import { describe, it, expect } from "vite-plus/test";
import { formatJson, minifyJson } from "../../app/utils/json";

describe("JSON Formatter Functions", () => {
  describe("formatJson", () => {
    it("should format a simple object", () => {
      const input = '{"name":"太郎","age":30}';
      const result = formatJson(input);
      expect(result).toBe('{\n  "name": "太郎",\n  "age": 30\n}');
    });

    it("should format a nested object", () => {
      const input = '{"user":{"name":"太郎","address":{"city":"東京"}}}';
      const result = formatJson(input);
      expect(result).toContain("{\n");
      expect(result).toContain('"user"');
      expect(result).toContain('"address"');
    });

    it("should format an array", () => {
      const input = "[1,2,3]";
      const result = formatJson(input);
      expect(result).toBe("[\n  1,\n  2,\n  3\n]");
    });

    it("should format with custom indent", () => {
      const input = '{"a":1}';
      const result = formatJson(input, 4);
      expect(result).toBe('{\n    "a": 1\n}');
    });

    it("should handle empty object", () => {
      const input = "{}";
      const result = formatJson(input);
      expect(result).toBe("{}");
    });

    it("should handle empty array", () => {
      const input = "[]";
      const result = formatJson(input);
      expect(result).toBe("[]");
    });

    it("should handle boolean values", () => {
      const input = '{"active":true,"deleted":false}';
      const result = formatJson(input);
      expect(result).toContain('"active": true');
      expect(result).toContain('"deleted": false');
    });

    it("should handle null values", () => {
      const input = '{"value":null}';
      const result = formatJson(input);
      expect(result).toContain('"value": null');
    });

    it("should handle string with special characters", () => {
      const input = '{"text":"Hello\\nWorld"}';
      const result = formatJson(input);
      expect(result).toContain('"text": "Hello\\nWorld"');
    });

    it("should throw error for invalid JSON", () => {
      expect(() => formatJson("invalid")).toThrow();
    });

    it("should throw error for unclosed brace", () => {
      expect(() => formatJson('{"a":1')).toThrow();
    });

    it("should throw error for trailing comma", () => {
      expect(() => formatJson('{"a":1,}')).toThrow();
    });
  });

  describe("minifyJson", () => {
    it("should minify a formatted object", () => {
      const input = '{\n  "name": "太郎",\n  "age": 30\n}';
      const result = minifyJson(input);
      expect(result).toBe('{"name":"太郎","age":30}');
    });

    it("should minify a nested object", () => {
      const input = `{
        "user": {
          "name": "太郎",
          "address": {
            "city": "東京"
          }
        }
      }`;
      const result = minifyJson(input);
      expect(result).toBe('{"user":{"name":"太郎","address":{"city":"東京"}}}');
    });

    it("should minify an array", () => {
      const input = "[\n  1,\n  2,\n  3\n]";
      const result = minifyJson(input);
      expect(result).toBe("[1,2,3]");
    });

    it("should handle already minified JSON", () => {
      const input = '{"a":1}';
      const result = minifyJson(input);
      expect(result).toBe('{"a":1}');
    });

    it("should handle empty object", () => {
      const input = "{ }";
      const result = minifyJson(input);
      expect(result).toBe("{}");
    });

    it("should handle empty array", () => {
      const input = "[ ]";
      const result = minifyJson(input);
      expect(result).toBe("[]");
    });

    it("should throw error for invalid JSON", () => {
      expect(() => minifyJson("not json")).toThrow();
    });

    it("should throw error for empty string", () => {
      expect(() => minifyJson("")).toThrow();
    });
  });

  describe("Round-trip conversion", () => {
    it("should preserve data through format/minify cycle", () => {
      const original = '{"name":"太郎","items":[1,2,3],"active":true}';
      const formatted = formatJson(original);
      const minified = minifyJson(formatted);
      expect(minified).toBe(original);
    });

    it("should preserve nested structures", () => {
      const original = '{"a":{"b":{"c":1}}}';
      const formatted = formatJson(original);
      const minified = minifyJson(formatted);
      expect(minified).toBe(original);
    });

    it("should preserve arrays of objects", () => {
      const original = '[{"id":1},{"id":2}]';
      const formatted = formatJson(original);
      const minified = minifyJson(formatted);
      expect(minified).toBe(original);
    });
  });
});

/** Independent character-wise oracle for whitespace outside quoted strings. */
function withoutJsonWhitespace(text: string): string {
  let quoted = false;
  let escaped = false;
  let result = "";
  for (const character of text) {
    if (quoted) {
      result += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') {
      quoted = true;
      result += character;
    } else if (!" \t\r\n".includes(character)) {
      result += character;
    }
  }
  return result;
}

describe("Lossless JSON whitespace transformations", () => {
  const precise = [
    "9007199254740993",
    "18446744073709551615",
    "-9007199254740993",
    "1.2345678901234567890123456789",
    "1e400",
    "-1E+400",
    "1e-4000",
    "-0",
    "-0.000",
    "1.00e+02",
    "0.10000000000000001",
  ];

  it.each(precise)("keeps numeric token %s at every nesting level", (number) => {
    for (const source of [number, `[ ${number} ]`, `{ "a": ${number}, "v": [${number}] }`]) {
      const expected = withoutJsonWhitespace(source);
      expect(minifyJson(source)).toBe(expected);
      expect(withoutJsonWhitespace(formatJson(source))).toBe(expected);
      expect(minifyJson(formatJson(source))).toBe(expected);
    }
  });

  it("keeps original duplicate members, integer-like key order and escaped key spellings", () => {
    const source = String.raw`{ "10": 1, "2": 2, "same": 3, "same": 4, "\u0073ame": 5, "__proto__": {"x":1} }`;
    const expected = withoutJsonWhitespace(source);
    expect(minifyJson(source)).toBe(expected);
    expect(formatJson(source)).toBe(
      String.raw`{
  "10": 1,
  "2": 2,
  "same": 3,
  "same": 4,
  "\u0073ame": 5,
  "__proto__": {
    "x": 1
  }
}`,
    );
    expect(minifyJson(formatJson(source))).toBe(expected);
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });

  it.each([
    String.raw`" \t\r\n \b\f \/ \u0061 \uD800 \" \\ ,:{}[] "`,
    String.raw`{"quote":"\\\"","tail":"\\","literal":"text , : { } [ ]"}`,
    '{ "text" : "日本語 😀 \u2028 \u2029\\t" }',
  ])("preserves string token bytes and punctuation in %s", (source) => {
    const expected = withoutJsonWhitespace(source);
    expect(minifyJson(source)).toBe(expected);
    expect(withoutJsonWhitespace(formatJson(source))).toBe(expected);
  });

  it("formats mixed empty containers with correct nesting", () => {
    expect(formatJson('{"a":[{},[],{"b":[]}],"c":{}}')).toBe(
      '{\n  "a": [\n    {},\n    [],\n    {\n      "b": []\n    }\n  ],\n  "c": {}\n}',
    );
  });

  it.each([0, -1, 0.1, 0.9, 1.9, 4, 10, 100, NaN, Infinity, -Infinity])(
    "matches native indentation width for %s spaces",
    (indent) => {
      const source = '{"a":[1,{},[]]}';
      expect(formatJson(source, indent)).toBe(JSON.stringify(JSON.parse(source), null, indent));
    },
  );

  it.each(["true", "false", "null", '" text "', "[]", "{}", "[{},[]]"])(
    "keeps top-level JSON value %s",
    (source) => {
      const input = ` \t\r\n${source}\n `;
      expect(minifyJson(input)).toBe(source);
      expect(withoutJsonWhitespace(formatJson(input))).toBe(source);
    },
  );

  it.each([
    "",
    " \t\r\n",
    "undefined",
    "NaN",
    "Infinity",
    "+1",
    "01",
    "1.",
    "1e",
    "[1,]",
    '{"a":1,}',
    "{a:1}",
    "[1 2]",
    "true false",
    "{}[]",
    "// comment\n{}",
    String.raw`"\x41"`,
    '"unterminated',
    '"line\nbreak"',
    "\uFEFF{}",
    "{}\u00A0",
  ])("keeps strict native JSON rejection for %j", (source) => {
    expect(() => formatJson(source)).toThrow(SyntaxError);
    expect(() => minifyJson(source)).toThrow(SyntaxError);
  });

  it("preserves tokens and idempotence over 250 generated nested documents", () => {
    for (let i = 0; i < 250; i++) {
      const source = ` { "${10 + i}": ${precise[i % precise.length]}, "2": [ {}, [], ${i}.00E+02, ${JSON.stringify(`text ${i} ,:{}[] \\" \n`)} ], "2": null } `;
      const expected = withoutJsonWhitespace(source);
      const formatted = formatJson(source);
      expect(JSON.parse(formatted)).toEqual(JSON.parse(source));
      expect(withoutJsonWhitespace(formatted)).toBe(expected);
      expect(formatJson(formatted)).toBe(formatted);
      expect(minifyJson(formatted)).toBe(expected);
      expect(minifyJson(expected)).toBe(expected);
    }
  });

  it("processes a large flat document and deeply nested JSON without formatter recursion", () => {
    const source = `[${Array.from({ length: 10000 }, () => "9007199254740993").join(",\n ")}]`;
    expect(minifyJson(formatJson(source))).toBe(withoutJsonWhitespace(source));
    const deep = "[".repeat(5000) + "1e400" + "]".repeat(5000);
    expect(formatJson(deep, 0)).toBe(deep);
    expect(minifyJson(deep)).toBe(deep);
  });
});
