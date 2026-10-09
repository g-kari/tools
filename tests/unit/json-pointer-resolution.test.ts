import { describe, expect, it } from "vite-plus/test";
import { decodeToken, enumeratePointers, evaluateJsonPointer } from "../../app/utils/json-pointer";

describe("JSON Pointer exact resolution", () => {
  it.each([
    "",
    "01",
    "00",
    "+1",
    "-0",
    "1.0",
    "1e0",
    "0x1",
    " 1",
    "1 ",
    "0\n",
    "0\r",
    "0\u2028",
    "１",
  ])("rejects noncanonical array index %j instead of selecting an element", (index) => {
    expect(() => evaluateJsonPointer('["first","second"]', `/${index}`)).toThrow(
      "配列インデックス",
    );
  });

  it.each(["0", "1"])("resolves canonical array index %s", (index) => {
    expect(evaluateJsonPointer('["first","second"]', `/${index}`).value).toBe(
      index === "0" ? "first" : "second",
    );
  });

  it.each(["2", "9007199254740993", "9".repeat(400)])(
    "rejects out-of-range canonical array index %s",
    (index) => {
      expect(() => evaluateJsonPointer('["first","second"]', `/${index}`)).toThrow("範囲外");
    },
  );

  it.each(["toString", "constructor", "__proto__", "hasOwnProperty"])(
    "does not resolve inherited member %s",
    (key) => {
      expect(() => evaluateJsonPointer("{}", `/${key}`)).toThrow("存在しません");
      expect(() => evaluateJsonPointer('{"nested":{}}', `/nested/${key}`)).toThrow("存在しません");
    },
  );

  it("resolves actual object members including empty, numeric and prototype-like names", () => {
    const doc =
      '{"":"empty","01":"leading","+1":"plus","toString":"own","constructor":false,"__proto__":{"value":7},"hasOwnProperty":null}';
    for (const key of ["", "01", "+1", "toString", "constructor", "hasOwnProperty"]) {
      expect(evaluateJsonPointer(doc, `/${key}`).value).toEqual(
        (JSON.parse(doc) as Record<string, unknown>)[key],
      );
    }
    expect(evaluateJsonPointer(doc, "/__proto__/value").value).toBe(7);
  });

  it.each(["~", "~2", "a~2b", "~~0", "~10~"])(
    "rejects invalid tilde escape in token %j",
    (token) => {
      expect(() => decodeToken(token)).toThrow("エスケープ");
      expect(() => evaluateJsonPointer(JSON.stringify({ [token]: 7 }), `/${token}`)).toThrow(
        "エスケープ",
      );
    },
  );

  it("preserves RFC escape order and does not normalize Unicode member names", () => {
    const doc = JSON.stringify({
      "~1": "tilde-one",
      "a/b": "slash",
      é: "composed",
      é: "decomposed",
    });
    expect(evaluateJsonPointer(doc, "/~01").value).toBe("tilde-one");
    expect(evaluateJsonPointer(doc, "/a~1b").value).toBe("slash");
    expect(evaluateJsonPointer(doc, "/é").value).toBe("composed");
    expect(evaluateJsonPointer(doc, "/é").value).toBe("decomposed");
  });

  it("resolves every generated pointer for nested special keys and arrays", () => {
    const doc =
      '{"":0,"a/b":{"~01":["value",null]},"__proto__":{"toString":"own"},"01":{"+1":true}}';
    for (const entry of enumeratePointers(doc)) {
      expect(evaluateJsonPointer(doc, entry.pointer).formatted).toBe(entry.value);
    }
  });
});
