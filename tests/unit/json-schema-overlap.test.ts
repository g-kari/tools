import { describe, expect, it } from "vite-plus/test";
import { generateJsonSchema } from "../../app/utils/json-schema";
import { validateJsonAgainstSchema } from "../../app/utils/json-schema-validator";

const overlappingFixtures = [
  [1, 1.5],
  [1.5, 1],
  [0, -0.5, -2, 2.5],
  [{ score: 1 }, { score: 1.5 }],
  [{ nested: { score: 1 } }, { nested: { score: 1.5 } }],
  [[], [1]],
  [[1], []],
  [[1], [1.5]],
  [{ items: [] }, { items: ["x"] }],
  [[[], [1]], [[1.5]]],
];

describe("JSON Schema inferred array alternatives", () => {
  it.each(overlappingFixtures.map((value) => [JSON.stringify(value)]))(
    "accepts its original overlapping sample: %s",
    (input) => {
      const schema = generateJsonSchema(input);
      expect(validateJsonAgainstSchema(input, schema)).toEqual({ valid: true, errors: [] });
      const parsed = JSON.parse(schema);
      expect(parsed.items.anyOf).toBeDefined();
      expect(parsed.items.oneOf).toBeUndefined();
    },
  );

  it("keeps deduplicating alternatives in first-seen order", () => {
    const schema = JSON.parse(generateJsonSchema('[1,1.5,2,2.5,"x","y",true,false,null]'));
    expect(schema.items).toEqual({
      anyOf: [
        { type: "integer" },
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
        { type: "null" },
      ],
    });
  });

  it.each(["[]", "[1,2]", '["x","y"]', '[{"id":1},{"id":2}]'])(
    "leaves single-schema/empty-array output unchanged: %s",
    (input) => {
      const schema = JSON.parse(generateJsonSchema(input));
      expect(schema.items.anyOf).toBeUndefined();
      expect(schema.items.oneOf).toBeUndefined();
      expect(validateJsonAgainstSchema(input, JSON.stringify(schema)).valid).toBe(true);
    },
  );

  it.each(["[true]", '["1"]', "[null]", "[{}]", "[[1]]"])(
    "still rejects an unobserved type against numeric alternatives: %s",
    (input) => {
      expect(validateJsonAgainstSchema(input, generateJsonSchema("[1,1.5]")).valid).toBe(false);
    },
  );

  it.each(["[{}]", '[{"score":true}]', '[{"score":1,"extra":2}]'])(
    "preserves required/type/additional-property restrictions: %s",
    (input) => {
      const schema = generateJsonSchema('[{"score":1},{"score":1.5}]');
      expect(validateJsonAgainstSchema(input, schema).valid).toBe(false);
    },
  );

  it("keeps hand-authored oneOf exclusive in the separate validator", () => {
    const schema = JSON.stringify({ oneOf: [{ type: "integer" }, { type: "number" }] });
    expect(validateJsonAgainstSchema("1", schema).valid).toBe(false);
    expect(validateJsonAgainstSchema("1.5", schema).valid).toBe(true);
    expect(validateJsonAgainstSchema('"x"', schema).valid).toBe(false);
  });
});
