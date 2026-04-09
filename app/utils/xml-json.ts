/**
 * XML ↔ JSON 相互変換ユーティリティ
 *
 * - xmlToJson: XML文字列をJSONオブジェクトに変換
 * - jsonToXml: JSONオブジェクトをXML文字列に変換
 * - formatXml: XML文字列をインデント整形
 */

/** 変換結果の型 */
export interface XmlJsonResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * XMLノードをJSONオブジェクトに再帰変換する内部関数
 */
function nodeToJson(node: Element): unknown {
  const result: Record<string, unknown> = {};

  // 属性を変換
  if (node.attributes.length > 0) {
    const attrs: Record<string, string> = {};
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      attrs[`@${attr.name}`] = attr.value;
    }
    result["@attributes"] = attrs;
  }

  const children = Array.from(node.childNodes);
  const elementChildren = children.filter((c) => c.nodeType === Node.ELEMENT_NODE) as Element[];
  const textContent = children
    .filter((c) => c.nodeType === Node.TEXT_NODE)
    .map((c) => c.textContent ?? "")
    .join("")
    .trim();

  if (elementChildren.length === 0) {
    // 葉ノード: テキスト or 空
    if (Object.keys(result).length === 0) {
      return textContent;
    }
    if (textContent) {
      result["#text"] = textContent;
    }
    return result;
  }

  // 子要素をグループ化
  const grouped: Record<string, unknown[]> = {};
  for (const child of elementChildren) {
    const name = child.tagName;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(nodeToJson(child));
  }

  for (const [name, values] of Object.entries(grouped)) {
    result[name] = values.length === 1 ? values[0] : values;
  }

  if (textContent && elementChildren.length === 0) {
    result["#text"] = textContent;
  }

  return result;
}

/**
 * XML文字列をJSON文字列に変換する
 * @param xmlString - 変換するXML文字列
 * @param indent - インデント幅（デフォルト: 2）
 * @returns 変換結果
 */
export function xmlToJson(xmlString: string, indent = 2): XmlJsonResult {
  if (!xmlString.trim()) {
    return { success: false, output: "", error: "XMLを入力してください" };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");

    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      return {
        success: false,
        output: "",
        error: `XML解析エラー: ${parseError.textContent?.split("\n")[0] ?? "不正なXMLです"}`,
      };
    }

    const root = doc.documentElement;
    const json: Record<string, unknown> = {};
    json[root.tagName] = nodeToJson(root);

    return {
      success: true,
      output: JSON.stringify(json, null, indent),
    };
  } catch (e) {
    return {
      success: false,
      output: "",
      error: `変換エラー: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * JSONオブジェクトをXMLに再帰変換する内部関数
 */
function jsonToXmlNode(
  tagName: string,
  value: unknown,
  indentLevel: number,
  indentStr: string,
): string {
  const indent = indentStr.repeat(indentLevel);

  if (value === null || value === undefined) {
    return `${indent}<${tagName} />`;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const escaped = String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
    return `${indent}<${tagName}>${escaped}</${tagName}>`;
  }

  if (Array.isArray(value)) {
    return value.map((item) => jsonToXmlNode(tagName, item, indentLevel, indentStr)).join("\n");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    let attrs = "";
    const attrObj = obj["@attributes"];
    if (attrObj && typeof attrObj === "object") {
      for (const [k, v] of Object.entries(attrObj as Record<string, string>)) {
        const attrName = k.startsWith("@") ? k.slice(1) : k;
        const escaped = String(v).replace(/"/g, "&quot;");
        attrs += ` ${attrName}="${escaped}"`;
      }
    }

    const children: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      if (key === "@attributes") continue;
      if (key === "#text") continue;
      children.push(jsonToXmlNode(key, val, indentLevel + 1, indentStr));
    }

    const textContent = obj["#text"];

    if (children.length === 0) {
      if (textContent !== undefined) {
        const escaped = String(textContent)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `${indent}<${tagName}${attrs}>${escaped}</${tagName}>`;
      }
      return `${indent}<${tagName}${attrs} />`;
    }

    return `${indent}<${tagName}${attrs}>\n${children.join("\n")}\n${indent}</${tagName}>`;
  }

  return `${indent}<${tagName} />`;
}

/**
 * JSON文字列をXML文字列に変換する
 * @param jsonString - 変換するJSON文字列
 * @param indent - インデント幅（デフォルト: 2）
 * @returns 変換結果
 */
export function jsonToXml(jsonString: string, indent = 2): XmlJsonResult {
  if (!jsonString.trim()) {
    return { success: false, output: "", error: "JSONを入力してください" };
  }

  try {
    const obj = JSON.parse(jsonString) as Record<string, unknown>;
    if (typeof obj !== "object" || Array.isArray(obj) || obj === null) {
      return {
        success: false,
        output: "",
        error: "JSONはルートレベルのオブジェクト（{ }）である必要があります",
      };
    }

    const indentStr = " ".repeat(indent);
    const entries = Object.entries(obj);
    if (entries.length === 0) {
      return { success: false, output: "", error: "JSONオブジェクトが空です" };
    }

    const [rootTag, rootValue] = entries[0];
    const xmlDecl = '<?xml version="1.0" encoding="UTF-8"?>';
    const body = jsonToXmlNode(rootTag, rootValue, 0, indentStr);

    return {
      success: true,
      output: `${xmlDecl}\n${body}`,
    };
  } catch (e) {
    return {
      success: false,
      output: "",
      error: `JSON解析エラー: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * サンプルXMLを返す
 */
export function getSampleXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">Harry Potter</title>
    <author>J.K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="non-fiction">
    <title lang="ja">吾輩は猫である</title>
    <author>夏目漱石</author>
    <year>1905</year>
    <price>980</price>
  </book>
</bookstore>`;
}

/**
 * サンプルJSONを返す
 */
export function getSampleJson(): string {
  return JSON.stringify(
    {
      bookstore: {
        book: [
          {
            "@attributes": { category: "fiction" },
            title: "Harry Potter",
            author: "J.K. Rowling",
            year: "2005",
            price: "29.99",
          },
          {
            "@attributes": { category: "non-fiction" },
            title: "吾輩は猫である",
            author: "夏目漱石",
            year: "1905",
            price: "980",
          },
        ],
      },
    },
    null,
    2,
  );
}
