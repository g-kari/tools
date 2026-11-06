import { describe, expect, it } from "vite-plus/test";
import * as yaml from "js-yaml";
import { parseEnv, toYAML } from "../../app/utils/env-parser";
import type { EnvEntry } from "../../app/utils/env-parser";

function loadMapping(entries: EnvEntry[]): Record<string, string> {
  return yaml.load(toYAML(entries)) as Record<string, string>;
}

describe(".env YAML string preservation", () => {
  const values = [
    "plain text",
    "",
    "true",
    "TRUE",
    "false",
    "False",
    "null",
    "NULL",
    "~",
    "yes",
    "No",
    "on",
    "OFF",
    "3000",
    "00123",
    "9007199254740993",
    "-0",
    "1.50",
    "1e3",
    "0xFF",
    ".inf",
    ".NaN",
    "2026-10-19",
    "2026-10-19T12:34:56Z",
    "'quoted'",
    '"quoted"',
    "-",
    "---",
    "...",
    "[a, b]",
    "{a: b}",
    "# comment",
    "&anchor",
    "*alias",
    "!tag",
    " leading and trailing ",
    "C:\\path\\file",
    "first\nsecond\n",
    "first\rsecond\r",
    "first\r\nsecond\r\n",
    "tab\tvalue",
    "line\u0085break",
    "line\u2028break",
    "line\u2029break",
    "日本語と絵文字 🐈",
    "\ud800",
    "\udfff",
    "x".repeat(2000),
  ];

  it.each(values)("preserves string value %j", (value) => {
    const result = loadMapping([{ key: "VALUE", value }]);
    expect(Object.keys(result)).toEqual(["VALUE"]);
    expect(typeof result.VALUE).toBe("string");
    expect(result.VALUE).toBe(value);
  });

  it.each(Array.from({ length: 33 }, (_, code) => (code === 32 ? 127 : code)))(
    "escapes control character %i without changing its value",
    (code) => {
      const value = `before${String.fromCharCode(code)}after`;
      expect(loadMapping([{ key: "VALUE", value }]).VALUE).toBe(value);
    },
  );

  it("keeps valid environment names distinct and own, including YAML-resolved keys", () => {
    const keys = [
      "TRUE",
      "True",
      "true",
      "FALSE",
      "False",
      "false",
      "NULL",
      "Null",
      "null",
      "yes",
      "No",
      "on",
      "OFF",
      "__proto__",
      "constructor",
      "toString",
      "hasOwnProperty",
    ];
    const source = keys.map((key, index) => `${key}=value${index}`).join("\n");
    const parsed = parseEnv(source);
    expect(parsed.errors).toEqual([]);
    expect(parsed.duplicates).toEqual([]);
    const result = loadMapping(parsed.entries);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.keys(result)).toEqual(keys);
    for (const [index, key] of keys.entries()) {
      expect(Object.prototype.hasOwnProperty.call(result, key)).toBe(true);
      expect(result[key]).toBe(`value${index}`);
    }
  });

  it("uses the last duplicate value, including empty and prototype-like names", () => {
    const parsed = parseEnv("KEY=first\n__proto__=old\nKEY=last\nEMPTY=old\nEMPTY=\n__proto__=new");
    const result = loadMapping(parsed.entries);
    expect(Object.keys(result)).toEqual(["KEY", "__proto__", "EMPTY"]);
    expect(result.KEY).toBe("last");
    expect(result.EMPTY).toBe("");
    expect(Object.prototype.hasOwnProperty.call(result, "__proto__")).toBe(true);
    expect(result.__proto__).toBe("new");
    expect(parsed.entries).toHaveLength(6);
    expect(parsed.duplicates).toEqual(["KEY", "EMPTY", "__proto__"]);
  });

  it("preserves the parsed strings instead of inferring YAML types", () => {
    const source =
      "PORT=3000\nDEBUG=true\nPOSTCODE=00123\nLARGE=9007199254740993\nOPTION=null\nDATE=2026-10-19\nQUOTES=\"'quoted'\"";
    const parsed = parseEnv(source);
    expect(parsed.errors).toEqual([]);
    expect(loadMapping(parsed.entries)).toEqual(
      Object.fromEntries(parsed.entries.map(({ key, value }) => [key, value])),
    );
  });

  it("does not mutate the original entries or parsing diagnostics", () => {
    const parsed = parseEnv("# comment\nKEY=first\nBAD LINE\nKEY=last");
    const before = structuredClone(parsed);
    for (const entry of parsed.entries) Object.freeze(entry);
    Object.freeze(parsed.entries);
    expect(loadMapping(parsed.entries)).toEqual({ KEY: "last" });
    expect(parsed).toEqual(before);
  });

  it("keeps the existing empty-input API and removes only the serializer newline", () => {
    expect(toYAML([])).toBe("");
    const value = "ending space \n";
    const output = toYAML([{ key: "VALUE", value }]);
    expect(output.endsWith("\n")).toBe(false);
    expect((yaml.load(output) as Record<string, string>).VALUE).toBe(value);
  });
});
