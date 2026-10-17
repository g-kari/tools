// @vitest-environment jsdom
import { describe, expect, it } from "vite-plus/test";
import { jsonToXml, xmlToJson } from "../../app/utils/xml-json";

const attributeCases = [
  ["R&D", "R&amp;D"],
  ["a < b", "a &lt; b"],
  ['say "hello"', "say &quot;hello&quot;"],
  ["<&\"' >", "&lt;&amp;&quot;' >"],
  ["&amp;", "&amp;amp;"],
  ["&lt;", "&amp;lt;"],
  ["&quot;", "&amp;quot;"],
  ["&#65;", "&amp;#65;"],
  ["&#x41;", "&amp;#x41;"],
  ["&unknown;", "&amp;unknown;"],
  ['&&<<""', "&amp;&amp;&lt;&lt;&quot;&quot;"],
  ["日本語と😀", "日本語と😀"],
  ["", ""],
  ["ordinary-value", "ordinary-value"],
];

function convert(value: unknown, indent = 2) {
  const result = jsonToXml(JSON.stringify({ root: value }), indent);
  expect(result.success).toBe(true);
  const document = new DOMParser().parseFromString(result.output, "application/xml");
  expect(document.querySelector("parsererror")).toBeNull();
  return { output: result.output, root: document.documentElement };
}

describe.each(["value", "@value"])("JSON→XML 属性値 (%s)", (key) => {
  it.each(attributeCases)("XMLとして解析でき、値を保持する: %j", (value, escaped) => {
    const { output, root } = convert({ "@attributes": { [key]: value } });
    expect(output).toBe(`<?xml version="1.0" encoding="UTF-8"?>\n<root value="${escaped}" />`);
    expect(root.getAttribute("value")).toBe(value);
  });
});

describe("JSON→XML 属性の回帰", () => {
  it.each([0, 2, 4])("ネスト・配列・混在テキストの属性を保持する (indent=%i)", (indent) => {
    const value = '<&"日本語';
    const { root } = convert(
      {
        "@attributes": { label: value },
        group: {
          "@attributes": { "@label": value },
          "#text": "before < & ",
          item: [
            { "@attributes": { label: value }, "#text": "one" },
            { "@attributes": { "@label": value }, child: "two" },
          ],
        },
      },
      indent,
    );
    const elements = [root, ...root.querySelectorAll("group, item")];
    expect(elements).toHaveLength(4);
    for (const element of elements) expect(element.getAttribute("label")).toBe(value);
    expect(root.querySelector("group")?.textContent).toBe("before < & onetwo");
    expect(root.querySelectorAll("item")).toHaveLength(2);
  });

  it("数値・真偽値・nullの既存の文字列化を保持する", () => {
    const { root } = convert({ "@attributes": { zero: 0, yes: true, no: false, empty: null } });
    expect(root.getAttribute("zero")).toBe("0");
    expect(root.getAttribute("yes")).toBe("true");
    expect(root.getAttribute("no")).toBe("false");
    expect(root.getAttribute("empty")).toBe("null");
  });

  it("XML由来の属性をCDATA・混在内容とともにJSON表現で往復する", () => {
    const source =
      '<root title="R&amp;D &lt; &quot;quoted&quot; &amp;amp;">before<item label="&amp;#65;"><![CDATA[<&>]]></item>after</root>';
    const json = xmlToJson(source);
    expect(json.success).toBe(true);
    const xml = jsonToXml(json.output);
    expect(xml.success).toBe(true);
    const roundTrip = xmlToJson(xml.output);
    expect(roundTrip.success).toBe(true);
    expect(JSON.parse(roundTrip.output) as unknown).toEqual(JSON.parse(json.output) as unknown);
  });
});
