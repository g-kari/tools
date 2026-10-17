import { describe, expect, it } from "vite-plus/test";
import { generateJsonSchema } from "../../app/utils/json-schema";
import { validateJsonAgainstSchema } from "../../app/utils/json-schema-validator";

const keys = [
  "__proto__",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
  "__defineGetter__",
  "",
  "キー",
  "regular",
];

// Pass raw JSON through the public parser; an object-literal __proto__ is a setter.
function propertySchema(key: string, required = false) {
  const name = JSON.stringify(key);
  return `{"type":"object","properties":{${name}:{"type":"string"}}${required ? `,"required":[${name}]` : ""}}`;
}

describe("JSON Schema validator uses JSON's own properties", () => {
  it.each(keys)("rejects missing required-only key %j", (key) => {
    const result = validateJsonAgainstSchema(
      "{}",
      `{"type":"object","required":[${JSON.stringify(key)}]}`,
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { path: "", keyword: "required", message: `必須プロパティ "${key}" が存在しません` },
    ]);
  });

  it.each(keys)("reports only required for an absent declared key %j", (key) => {
    const result = validateJsonAgainstSchema("{}", propertySchema(key, true));
    expect(result.valid).toBe(false);
    expect(result.errors.map(({ keyword }) => keyword)).toEqual(["required"]);
  });

  it.each(keys)("skips an absent optional key %j", (key) => {
    expect(validateJsonAgainstSchema("{}", propertySchema(key))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it.each(keys)("accepts a present own key %j", (key) => {
    const input = `{${JSON.stringify(key)}:"sample"}`;
    expect(Object.hasOwn(JSON.parse(input), key)).toBe(true);
    expect(validateJsonAgainstSchema(input, propertySchema(key, true))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it.each(keys)("still validates a present own key's type %j", (key) => {
    const result = validateJsonAgainstSchema(
      `{${JSON.stringify(key)}:42}`,
      propertySchema(key, true),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.map(({ path, keyword }) => ({ path, keyword }))).toEqual([
      { path: `/${key}`, keyword: "type" },
    ]);
  });

  it.each([
    ["nested object", '{"outer":{}}', "/outer", '{"outer":{"__proto__":"sample"}}'],
    ["array item", "[{}]", "/0", '[{"__proto__":"sample"}]'],
  ])("applies own-property checks inside a %s", (location, missing, path, present) => {
    for (const required of [false, true]) {
      const inner = propertySchema("__proto__", required);
      const schema =
        location === "nested object"
          ? `{"type":"object","properties":{"outer":${inner}}}`
          : `{"type":"array","items":${inner}}`;
      const result = validateJsonAgainstSchema(missing, schema);
      expect(result.valid).toBe(!required);
      expect(result.errors.map(({ path, keyword }) => ({ path, keyword }))).toEqual(
        required ? [{ path, keyword: "required" }] : [],
      );
      expect(validateJsonAgainstSchema(present, schema)).toEqual({ valid: true, errors: [] });
    }
  });

  it.each(["allOf", "anyOf", "oneOf"])("preserves %s semantics for own keys", (keyword) => {
    for (const required of [false, true]) {
      const schema = `{"${keyword}":[${propertySchema("toString", required)}]}`;
      expect(validateJsonAgainstSchema("{}", schema).valid).toBe(!required);
      expect(validateJsonAgainstSchema('{"toString":"sample"}', schema).valid).toBe(true);
      expect(validateJsonAgainstSchema('{"toString":42}', schema).valid).toBe(false);
    }
  });

  it("keeps additional and pattern properties restricted to JSON keys", () => {
    const schema =
      '{"type":"object","properties":{"__proto__":{"type":"object"}},"patternProperties":{"^x-":{"type":"string"}},"additionalProperties":false}';
    expect(validateJsonAgainstSchema("{}", schema)).toEqual({ valid: true, errors: [] });
    expect(validateJsonAgainstSchema('{"__proto__":{},"x-name":"sample"}', schema)).toEqual({
      valid: true,
      errors: [],
    });
    expect(validateJsonAgainstSchema('{"constructor":"sample"}', schema).errors[0].keyword).toBe(
      "additionalProperties",
    );
    expect(validateJsonAgainstSchema('{"x-name":42}', schema).errors[0].keyword).toBe("type");
  });

  it.each([
    ['{"__proto__":{}}', "{}"],
    ['{"outer":{"__proto__":{}}}', '{"outer":{}}'],
    ['[{"__proto__":{}}]', "[{}]"],
  ])("rejects missing object-valued keys from generated schema %s", (present, missing) => {
    const schema = generateJsonSchema(present);
    expect(validateJsonAgainstSchema(present, schema)).toEqual({ valid: true, errors: [] });
    const result = validateJsonAgainstSchema(missing, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.map(({ keyword }) => keyword)).toEqual(["required"]);
  });

  it("does not mutate prototypes or call an input's hasOwnProperty", () => {
    const before = Object.getOwnPropertyDescriptors(Object.prototype);
    const input = '{"__proto__":{"marker":true},"hasOwnProperty":"sample"}';
    const schema =
      '{"type":"object","required":["__proto__","hasOwnProperty"],"properties":{"__proto__":{"type":"object"},"hasOwnProperty":{"type":"string"}}}';
    expect(validateJsonAgainstSchema(input, schema)).toEqual({ valid: true, errors: [] });
    expect(validateJsonAgainstSchema(input, schema)).toEqual({ valid: true, errors: [] });
    expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(before);
    expect(Object.hasOwn(Object.prototype, "marker")).toBe(false);
    expect(validateJsonAgainstSchema("{}", "{}")).toEqual({ valid: true, errors: [] });
  });
});
