import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";
import * as yaml from "js-yaml";
import { tomlToJson, jsonToToml } from "../../app/routes/toml-json";
import { formatToml, minifyToml, validateToml } from "../../app/utils/toml-formatter";
import { tomlToYaml, yamlToToml } from "../../app/utils/yaml-toml";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

/** A killed child bounds a synchronous parser regression without hanging the test runner. */
const rejectEofComment = `
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { TomlError } from "smol-toml";
const { formatToml, minifyToml, validateToml } = await import(
  pathToFileURL(resolve("app/utils/toml-formatter.ts")).href
);
const { tomlToYaml } = await import(
  pathToFileURL(resolve("app/utils/yaml-toml.ts")).href
);
const input = process.argv[1];
for (const convert of [formatToml, minifyToml, tomlToYaml]) {
  assert.throws(() => convert(input), TomlError);
}
const result = validateToml(input);
assert.equal(result.valid, false);
assert.equal(typeof result.error, "string");
assert.ok(result.error.length > 0);
process.stdout.write("TOML_EOF_REJECTED\\n");
`;

describe("TOML parser security and compatibility", () => {
  test.each([
    ["array", "a=[1 #"],
    ["inline table", "a={b=1 #"],
  ])(
    "rejects an EOF comment inside an unfinished %s without hanging",
    (_label, input) => {
      const child = spawnSync(
        process.execPath,
        ["--experimental-strip-types", "--input-type=module", "-e", rejectEofComment, input],
        {
          cwd: repoRoot,
          env: {},
          timeout: 3000,
          killSignal: "SIGKILL",
          encoding: "utf8",
          maxBuffer: 64 * 1024,
        },
      );

      expect(child.error, child.stderr).toBeUndefined();
      expect(child.signal, child.stderr).toBeNull();
      expect(child.status, child.stderr).toBe(0);
      expect(child.stdout).toBe("TOML_EOF_REJECTED\n");
    },
    10000,
  );

  test("serializes nested null-prototype tables and retains special own keys", () => {
    const input = [
      'title = "日本語"',
      'constructor = "own"',
      "[__proto__]",
      "toml_regression_marker = true",
      "[nested]",
      '__proto__ = "literal"',
      "enabled = true",
      "[[rows]]",
      'label = "first"',
      "[[rows]]",
      'label = "second"',
    ].join("\n");
    const expected = JSON.parse(
      '{"title":"日本語","constructor":"own","__proto__":{"toml_regression_marker":true},"nested":{"__proto__":"literal","enabled":true},"rows":[{"label":"first"},{"label":"second"}]}',
    );

    expect(Object.hasOwn(Object.prototype, "toml_regression_marker")).toBe(false);
    expect(JSON.parse(tomlToJson(input))).toEqual(expected);
    for (const format of [formatToml, minifyToml]) {
      expect(JSON.parse(tomlToJson(format(input)))).toEqual(expected);
    }
    expect(yaml.load(tomlToYaml(input))).toEqual(expected);
    expect(JSON.parse(tomlToJson(jsonToToml(JSON.stringify(expected))))).toEqual(expected);
    expect(JSON.parse(tomlToJson(yamlToToml(tomlToYaml(input))))).toEqual(expected);
    expect(Object.hasOwn(Object.prototype, "toml_regression_marker")).toBe(false);
  });

  test("preserves date formatting and the existing YAML timestamp conversion", () => {
    const input = [
      "offset = 1979-05-27T07:32:00-08:00",
      "local_date = 1979-05-27",
      "local_time = 07:32:00",
      "local_date_time = 1979-05-27T07:32:00",
    ].join("\n");
    const expected = {
      offset: "1979-05-27T07:32:00.000-08:00",
      local_date: "1979-05-27",
      local_time: "07:32:00.000",
      local_date_time: "1979-05-27T07:32:00.000",
    };

    expect(JSON.parse(tomlToJson(input))).toEqual(expected);
    expect(JSON.parse(tomlToJson(formatToml(input)))).toEqual(expected);
    expect(JSON.parse(tomlToJson(minifyToml(input)))).toEqual(expected);
    // js-yaml reloads timestamps as native Dates, so YAML round trips normalize them.
    expect(JSON.parse(tomlToJson(yamlToToml(tomlToYaml(input))))).toEqual({
      offset: "1979-05-27T15:32:00.000Z",
      local_date: "1979-05-27T00:00:00.000Z",
      local_time: "07:32:00.000",
      local_date_time: "1979-05-27T07:32:00.000Z",
    });
  });

  test.each(["value = 07:32:00-08:00", "value = 1979-05-27Z"])(
    "rejects an offset attached to a local date or time: %s",
    (input) => {
      expect(() => tomlToJson(input)).toThrow();
      expect(() => formatToml(input)).toThrow();
      expect(() => minifyToml(input)).toThrow();
      expect(() => tomlToYaml(input)).toThrow();
      expect(validateToml(input)).toEqual({ valid: false, error: expect.any(String) });
    },
  );

  test("round-trips an unsafe-integer Number using a TOML float", () => {
    const input = '{"value":9007199254740992}';
    const result = jsonToToml(input);

    expect(result).toContain("9007199254740992.0");
    expect(JSON.parse(tomlToJson(result))).toEqual(JSON.parse(input));
  });

  test("retains every key in a bounded dot-free-key document", () => {
    const entries = Array.from({ length: 2000 }, (_, index) => [`key${index}`, index] as const);
    const input = entries.map(([key, value]) => `${key} = ${value}`).join("\n");

    expect(JSON.parse(tomlToJson(input))).toEqual(Object.fromEntries(entries));
  });
});
