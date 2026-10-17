import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vite-plus/test";
import { generateZodSchema, type JsonToZodOptions } from "../../app/utils/json-to-zod";

const defaults: JsonToZodOptions = {
  rootName: "schema",
  addImport: false,
  optional: false,
  nullable: false,
};

interface SchemaNode {
  kind: string;
  shape?: Record<string, SchemaNode>;
  element?: SchemaNode;
  optional(): SchemaNode;
  nullable(): SchemaNode;
}

/** A synthetic Zod boundary, used only to inspect generated object-literal members. */
function node(kind: string, extra: Partial<SchemaNode> = {}): SchemaNode {
  return {
    kind,
    ...extra,
    optional() {
      return this;
    },
    nullable() {
      return this;
    },
  };
}

/** Compile fixed synthetic fixtures and inspect their shape without loading Zod or external I/O. */
function readShape(json: string, options: Partial<JsonToZodOptions> = {}): SchemaNode {
  const source = generateZodSchema(json, { ...defaults, ...options });
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  expect(result.diagnostics).toEqual([]);
  const exports: Record<string, SchemaNode> = {};
  runInNewContext(
    result.outputText,
    {
      exports,
      z: {
        string: () => node("string"),
        number: () => node("number"),
        boolean: () => node("boolean"),
        null: () => node("null"),
        unknown: () => node("unknown"),
        array: (element: SchemaNode) => node("array", { element }),
        object: (shape: Record<string, SchemaNode>) => node("object", { shape }),
        union: () => node("union"),
      },
    },
    { timeout: 1000 },
  );
  return exports.schema;
}

const keys = [
  "",
  "first-name",
  "display name",
  "0",
  "01",
  "123abc",
  "a.b",
  "a/b",
  'quote"name',
  "slash\\name",
  "line\nbreak",
  "tab\tname",
  "null\u0000name",
  "line\u2028separator",
  "paragraph\u2029separator",
  "日本語",
  "😀",
  "\ud800",
  "__proto__",
  "constructor",
  "prototype",
  "default",
  "safe: z.string(), injected",
];

describe("JSON→Zod property names", () => {
  for (const optional of [false, true]) {
    for (const nullable of [false, true]) {
      it.each(keys)(
        `preserves %j as one own member (optional=${optional}, nullable=${nullable})`,
        (key) => {
          const json = JSON.stringify(Object.fromEntries([[key, "value"]]));
          const shape = readShape(json, { optional, nullable }).shape!;
          expect(Object.keys(shape)).toEqual([key]);
          expect(Object.hasOwn(shape, key)).toBe(true);
          expect(shape[key].kind).toBe("string");
          expect(Object.hasOwn(Object.getPrototypeOf(shape), "kind")).toBe(false);
        },
      );
    }
  }

  it("preserves special keys in nested objects and object arrays", () => {
    const nested = Object.fromEntries(keys.map((key) => [key, null]));
    const schema = readShape(JSON.stringify({ nested, rows: [nested] }), {
      optional: true,
      nullable: true,
    });
    expect(Object.keys(schema.shape!.nested.shape!)).toEqual(Object.keys(nested));
    expect(Object.keys(schema.shape!.rows.element!.shape!)).toEqual(Object.keys(nested));
  });

  it("does not collapse the same unusual key in sibling objects", () => {
    const json = '{"a":{"first-name":1},"b":{"first-name":false}}';
    const schema = readShape(json);
    expect(schema.shape!.a.shape!["first-name"].kind).toBe("number");
    expect(schema.shape!.b.shape!["first-name"].kind).toBe("boolean");
  });

  it("keeps ordinary ASCII identifier output unchanged", () => {
    expect(generateZodSchema('{"name":"a","$id":1,"_ok":true}', defaults)).toBe(
      "export const schema = z.object({\n  name: z.string(),\n  $id: z.number(),\n  _ok: z.boolean(),\n});",
    );
  });

  it("preserves import, custom root, optional and nullable generation", () => {
    const source = generateZodSchema('{"first-name":null,"__proto__":1}', {
      rootName: "userSchema",
      addImport: true,
      optional: true,
      nullable: true,
    });
    expect(source).toContain('import { z } from "zod";');
    expect(source).toContain("export const userSchema =");
    expect(source).toContain('"first-name": z.unknown().nullable().optional()');
    expect(source).toContain('["__proto__"]: z.number().optional()');
    const result = ts.transpileModule(source, { reportDiagnostics: true });
    expect(result.diagnostics).toEqual([]);
  });
});
