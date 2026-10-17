// @vitest-environment jsdom
import { describe, expect, it } from "vite-plus/test";
import { jsonToXml, xmlToJson } from "../../app/utils/xml-json";

function parseJson(xml: string): unknown {
  const result = xmlToJson(xml);
  expect(result.success).toBe(true);
  return JSON.parse(result.output) as unknown;
}

function parseXml(value: unknown): Element {
  const result = jsonToXml(JSON.stringify({ root: value }));
  expect(result.success).toBe(true);
  const document = new DOMParser().parseFromString(result.output, "application/xml");
  expect(document.querySelector("parsererror")).toBeNull();
  return document.documentElement;
}

describe("XML/JSON の直接テキスト保持", () => {
  it.each([
    ["<root><![CDATA[こんにちは<&>]]></root>", { root: "こんにちは<&>" }],
    ["<root>a<![CDATA[b]]>c</root>", { root: "abc" }],
    [
      '<root id="1"><![CDATA[value]]></root>',
      { root: { "@attributes": { "@id": "1" }, "#text": "value" } },
    ],
    [
      "<root>before<child>nested</child>after</root>",
      { root: { child: "nested", "#text": "beforeafter" } },
    ],
    [
      "<root><![CDATA[before]]><child>nested</child><![CDATA[after]]></root>",
      { root: { child: "nested", "#text": "beforeafter" } },
    ],
    [
      "<root>a<!-- ignore -->b<child>nested</child>c</root>",
      { root: { child: "nested", "#text": "abc" } },
    ],
    ["<root>\n  <child>nested</child>\n</root>", { root: { child: "nested" } }],
    ["<root>  value  </root>", { root: "value" }],
    ["<root>   </root>", { root: "" }],
    ["<root>0<child>nested</child></root>", { root: { child: "nested", "#text": "0" } }],
  ])("直接テキストとCDATAを変換する: %s", (xml, expected) => {
    expect(parseJson(xml)).toEqual(expected);
  });

  it.each(["hello", "<&>\"'", "", 0, false, null, { message: "value" }, ["a", "b"]])(
    "子要素と併存する #text を落とさない: %j",
    (text) => {
      const root = parseXml({ "#text": text, child: "nested" });
      const directText = Array.from(root.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join("");
      const expected = typeof text === "object" ? JSON.stringify(text) : String(text);
      expect(directText).toBe(expected);
      expect(root.querySelector("child")?.textContent).toBe("nested");
    },
  );

  it("混在テキストの出力では整形用の空白を挿入しない", () => {
    const root = parseXml({
      "#text": "prefix",
      child: [{ grandchild: "one" }, { grandchild: "two" }],
    });
    expect(root.textContent).toBe("prefixonetwo");
    expect(root.querySelectorAll("child")).toHaveLength(2);
  });

  it("属性・CDATA・繰り返し要素のJSON表現を往復で保持する", () => {
    const source =
      '<root id="1">before<child><![CDATA[<&>]]></child><child>two</child>after</root>';
    const json = xmlToJson(source);
    const xml = jsonToXml(json.output);
    expect(xml.success).toBe(true);
    expect(parseJson(xml.output)).toEqual(JSON.parse(json.output) as unknown);
  });

  it("テキストがない親要素の既存インデント整形を保持する", () => {
    const result = jsonToXml(JSON.stringify({ root: { child: "value" } }), 4);
    expect(result.output).toContain("<root>\n    <child>value</child>\n</root>");
  });
});
