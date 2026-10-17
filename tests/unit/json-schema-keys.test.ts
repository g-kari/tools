import { describe, expect, it } from "vite-plus/test";
import { generateJsonSchema } from "../../app/utils/json-schema";
import { validateJsonAgainstSchema } from "../../app/utils/json-schema-validator";

const keys = [
  "__proto__",
  "constructor",
  "prototype",
  "toString",
  "hasOwnProperty",
  "valueOf",
  "__defineGetter__",
  "",
  "0",
  "キー",
  "a.b",
  "a/b",
  "a~b",
  "line\nbreak",
  'quote"key',
];
const values = [null, true, 1, 1.5, "text", [], [1, 1.5], {}, { nested: true }];

describe("JSON Schema preserves JSON property names", () => {
  it.each(keys.flatMap((key) => values.map((value) => [key, value] as const)))(
    "retains key %j and its inferred value %j",
    (key, value) => {
      const input = JSON.stringify({ [key]: value });
      const schema = JSON.parse(generateJsonSchema(input));
      expect(Object.keys(schema.properties)).toEqual([key]);
      expect(Object.hasOwn(schema.properties, key)).toBe(true);
      const { $schema: _dialect, ...expected } = JSON.parse(
        generateJsonSchema(JSON.stringify(value)),
      );
      expect(schema.properties[key]).toEqual(expected);
    },
  );

  it.each([
    '{"__proto__":1}',
    '{"__proto__":{"nested":{"__proto__":"inner"}}}',
    '{"outer":{"__proto__":true,"constructor":null}}',
    '[{"__proto__":1},{"__proto__":1.5}]',
    '{"items":[{"__proto__":[]},{"__proto__":[1]}]}',
    '{"__proto__":{"__proto__":{"__proto__":null}}}',
  ])("accepts its original sample %s", (input) => {
    expect(validateJsonAgainstSchema(input, generateJsonSchema(input))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("keeps every key in input order with required and additional-property rules", () => {
    const input = '{"regular":true,"__proto__":1,"constructor":"x","toString":null,"last":[]}';
    const schema = JSON.parse(generateJsonSchema(input));
    expect(Object.keys(schema.properties)).toEqual(Object.keys(JSON.parse(input)));
    expect(schema.required).toEqual(Object.keys(JSON.parse(input)));
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.__proto__).toEqual({ type: "integer" });
  });

  it.each(["{}", '{"__proto__":"1"}', '{"__proto__":1,"extra":true}'])(
    "still rejects missing, wrong-type and additional properties %s",
    (input) => {
      expect(validateJsonAgainstSchema(input, generateJsonSchema('{"__proto__":1}')).valid).toBe(
        false,
      );
    },
  );

  it("does not mutate Object.prototype or change repeated generation", () => {
    const before = Object.getOwnPropertyDescriptors(Object.prototype);
    const input = '{"__proto__":{"polluted":true,"toString":"sample"}}';
    const first = generateJsonSchema(input);
    expect(generateJsonSchema(input)).toBe(first);
    expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(before);
    expect(Object.hasOwn(Object.prototype, "polluted")).toBe(false);
    expect(JSON.parse(first).properties.__proto__.type).toBe("object");
  });
});
