import { describe, it, expect } from "vite-plus/test";
import {
  parseIni,
  formatIni,
  iniToJson,
  jsonToIni,
  calcIniStats,
} from "../../app/utils/ini-parser";

const specialNames = ["__proto__", "constructor", "toString", "hasOwnProperty"];
const marker = "__iniSyntheticMarker_20261019";
const secondMarker = `${marker}_second`;

/** Keep the baseline regression probe local even when the old parser writes through inheritance. */
function withPrototypeCheck(run: () => void): void {
  const targets = [
    Object.prototype,
    Object,
    Object.getOwnPropertyDescriptor(Object.prototype, "toString")?.value as object,
    Object.getOwnPropertyDescriptor(Object.prototype, "hasOwnProperty")?.value as object,
  ];
  const keys = [marker, secondMarker];
  const previous = targets.map((target) =>
    keys.map((key) => Object.getOwnPropertyDescriptor(target, key)),
  );
  try {
    run();
    targets.forEach((target, index) => {
      keys.forEach((key, keyIndex) => {
        expect(Object.getOwnPropertyDescriptor(target, key)).toEqual(previous[index][keyIndex]);
      });
    });
  } finally {
    targets.forEach((target, index) => {
      keys.forEach((key, keyIndex) => {
        const descriptor = previous[index][keyIndex];
        if (descriptor) Object.defineProperty(target, key, descriptor);
        else Reflect.deleteProperty(target, key);
      });
    });
  }
}

describe.each(specialNames)("INI own data name: %s", (name) => {
  it("keeps section names as own data without changing inherited objects", () => {
    withPrototypeCheck(() => {
      const result = parseIni(`[${name}]\n${marker} = first\n[${name}]\n${secondMarker} = kept`);
      expect(result.errors).toEqual([]);
      expect(Object.hasOwn(result.data, name)).toBe(true);
      expect(result.data[name][marker]).toBe("first");
      expect(result.data[name][secondMarker]).toBe("kept");
      expect(Object.getPrototypeOf(result.data)).toBe(Object.prototype);
      expect(Object.getPrototypeOf(result.data[name])).toBe(Object.prototype);
      expect(formatIni(result.data)).toContain(`[${name}]`);
      expect(JSON.parse(JSON.stringify(iniToJson(result.data)))[name][marker]).toBe("first");
    });
  });

  it.each([false, true])("keeps global keys with multiValue=%s", (multiValue) => {
    const result = parseIni(`${name} = first\n${name} = second`, { multiValue });
    const expected = multiValue ? ["first", "second"] : "second";
    expect(Object.hasOwn(result.data[""], name)).toBe(true);
    expect(result.data[""][name]).toEqual(expected);
    expect(Object.getPrototypeOf(result.data[""])).toBe(Object.prototype);
    const converted = iniToJson(result.data);
    expect(Object.hasOwn(converted, name)).toBe(true);
    expect(converted[name]).toEqual(expected);
    expect(Object.getPrototypeOf(converted)).toBe(Object.prototype);
  });

  it("supports a custom global section using the same name", () => {
    const result = parseIni("key = first\nkey = second", { globalSection: name, multiValue: true });
    expect(Object.hasOwn(result.data, name)).toBe(true);
    expect(result.data[name].key).toEqual(["first", "second"]);
    expect(Object.getPrototypeOf(result.data)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(result.data[name])).toBe(Object.prototype);
  });

  it("keeps a nested key in JSON to INI and back", () => {
    const input = JSON.parse(`{"ordinary":{"${name}":["first","second"]}}`);
    const converted = jsonToIni(input);
    expect(Object.hasOwn(converted.ordinary, name)).toBe(true);
    expect(converted.ordinary[name]).toEqual(["first", "second"]);
    expect(Object.getPrototypeOf(converted.ordinary)).toBe(Object.prototype);
    expect(iniToJson(parseIni(formatIni(converted), { multiValue: true }).data)).toEqual(input);
  });

  it("keeps a JSON section name through both conversions", () => {
    const input = JSON.parse(`{"${name}":{"value":"kept"}}`);
    const converted = jsonToIni(input);
    expect(Object.hasOwn(converted, name)).toBe(true);
    expect(Object.getPrototypeOf(converted)).toBe(Object.prototype);
    const json = iniToJson(converted);
    expect(Object.hasOwn(json, name)).toBe(true);
    expect(json).toEqual(input);
    expect(Object.getPrototypeOf(json)).toBe(Object.prototype);
  });

  it.each(['"kept"', '["first","second"]'])("keeps a JSON global value %s", (value) => {
    const input = JSON.parse(`{"${name}":${value}}`);
    const converted = jsonToIni(input);
    expect(Object.hasOwn(converted[""], name)).toBe(true);
    expect(converted[""][name]).toEqual(input[name]);
    expect(Object.getPrototypeOf(converted[""])).toBe(Object.prototype);
    expect(iniToJson(converted)).toEqual(input);
  });

  it("counts a special section without dropping its own statistic", () => {
    const data = JSON.parse(`{"${name}":{"value":"kept"}}`);
    const stats = calcIniStats({ data, errors: [], comments: [] });
    expect(stats.sectionCount).toBe(1);
    expect(stats.totalKeys).toBe(1);
    expect(Object.hasOwn(stats.sectionKeyCounts, name)).toBe(true);
    expect(stats.sectionKeyCounts[name]).toBe(1);
    expect(Object.getPrototypeOf(stats.sectionKeyCounts)).toBe(Object.prototype);
  });
});
