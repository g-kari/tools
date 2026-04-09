/**
 * XPath 評価ユーティリティ
 *
 * ブラウザネイティブの DOMParser と document.evaluate() を使用して
 * XML ドキュメントに対して XPath 1.0 式を評価します。
 * このモジュールはクライアントサイドでのみ動作します。
 */

/** XPath 評価結果の型 */
export type XPathResultType = "nodeset" | "string" | "number" | "boolean" | "error";

/** XPath 評価結果のノード */
export interface XPathNode {
  /** タグ名または #text / #comment */
  name: string;
  /** テキスト内容 */
  textContent: string;
  /** outerHTML または値の文字列表現 */
  value: string;
  /** ノードタイプ番号 */
  nodeType: number;
  /** ノードタイプ名 */
  nodeTypeName: string;
}

/** XPath 評価結果 */
export interface XPathEvalResult {
  /** 結果の型 */
  type: XPathResultType;
  /** 文字列値（string 型の結果） */
  stringValue?: string;
  /** 数値（number 型の結果） */
  numberValue?: number;
  /** 真偽値（boolean 型の結果） */
  booleanValue?: boolean;
  /** ノード集合（nodeset 型の結果） */
  nodes?: XPathNode[];
  /** ノード数 */
  nodeCount?: number;
  /** エラーメッセージ */
  error?: string;
}

/** XPath 評価オプション */
export interface XPathEvalOptions {
  /** XML 文字列 */
  xml: string;
  /** XPath 式 */
  expression: string;
}

/**
 * ノードタイプ番号からノードタイプ名を返す
 * @param nodeType - ノードタイプ番号
 * @returns ノードタイプ名
 */
function getNodeTypeName(nodeType: number): string {
  const names: Record<number, string> = {
    1: "Element",
    2: "Attribute",
    3: "Text",
    4: "CDATASection",
    5: "EntityReference",
    6: "Entity",
    7: "ProcessingInstruction",
    8: "Comment",
    9: "Document",
    10: "DocumentType",
    11: "DocumentFragment",
    12: "Notation",
  };
  return names[nodeType] ?? `Unknown(${nodeType})`;
}

/**
 * DOM ノードを XPathNode に変換する
 * @param node - DOM ノード
 * @returns XPathNode
 */
function domNodeToXPathNode(node: Node): XPathNode {
  const name = node.nodeName;
  const textContent = node.textContent ?? "";
  const nodeType = node.nodeType;
  const nodeTypeName = getNodeTypeName(nodeType);

  let value: string;
  if (node.nodeType === Node.ELEMENT_NODE) {
    // Element の場合は outerHTML（簡易版）
    const el = node as Element;
    value = el.outerHTML;
  } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
    // Attribute の場合は name="value"
    const attr = node as Attr;
    value = `${attr.name}="${attr.value}"`;
  } else {
    value = textContent;
  }

  return { name, textContent, value, nodeType, nodeTypeName };
}

/**
 * XML 文字列に対して XPath 式を評価する
 * ブラウザ環境でのみ動作します（DOMParser と document.evaluate() が必要）
 * @param options - 評価オプション
 * @returns XPath 評価結果
 */
export function evaluateXPath(options: XPathEvalOptions): XPathEvalResult {
  const { xml, expression } = options;

  if (!xml.trim()) {
    return { type: "error", error: "XML を入力してください" };
  }
  if (!expression.trim()) {
    return { type: "error", error: "XPath 式を入力してください" };
  }

  // サーバーサイドでは実行しない
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return { type: "error", error: "この機能はブラウザ環境でのみ動作します" };
  }

  // XML をパース
  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(xml, "application/xml");

    // パースエラーを確認
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      const errorText = parseError.textContent ?? "XML のパースに失敗しました";
      return { type: "error", error: `XML パースエラー: ${errorText.trim()}` };
    }
  } catch (e) {
    return {
      type: "error",
      error: `XML パースエラー: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // XPath を評価
  try {
    const result = document.evaluate(expression, doc, null, XPathResult.ANY_TYPE, null);

    switch (result.resultType) {
      case XPathResult.NUMBER_TYPE:
        return {
          type: "number",
          numberValue: result.numberValue,
        };

      case XPathResult.STRING_TYPE:
        return {
          type: "string",
          stringValue: result.stringValue,
        };

      case XPathResult.BOOLEAN_TYPE:
        return {
          type: "boolean",
          booleanValue: result.booleanValue,
        };

      case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
      case XPathResult.ORDERED_NODE_ITERATOR_TYPE: {
        const nodes: XPathNode[] = [];
        let node: Node | null;
        while ((node = result.iterateNext()) !== null) {
          nodes.push(domNodeToXPathNode(node));
        }
        return {
          type: "nodeset",
          nodes,
          nodeCount: nodes.length,
        };
      }

      default:
        return {
          type: "error",
          error: `サポートされていない結果型: ${result.resultType}`,
        };
    }
  } catch (e) {
    return {
      type: "error",
      error: `XPath 評価エラー: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * XPath 式の例一覧
 */
export const XPATH_EXAMPLES = [
  {
    label: "ルート要素の子要素を全て選択",
    expression: "//*",
    description: "文書内の全要素を選択",
  },
  {
    label: "特定要素の選択",
    expression: "//book",
    description: "全ての book 要素を選択",
  },
  {
    label: "属性値でフィルタリング",
    expression: '//book[@category="cooking"]',
    description: "category 属性が cooking の book 要素",
  },
  {
    label: "最初の要素",
    expression: "//book[1]",
    description: "最初の book 要素",
  },
  {
    label: "テキスト内容を取得",
    expression: "//title/text()",
    description: "全 title 要素のテキストノード",
  },
  {
    label: "要素数をカウント",
    expression: "count(//book)",
    description: "book 要素の個数",
  },
  {
    label: "属性値を取得",
    expression: "//@category",
    description: "全ての category 属性",
  },
  {
    label: "contains() 関数",
    expression: '//title[contains(., "Everyday")]',
    description: '"Everyday" を含む title 要素',
  },
] as const;

/** サンプル XML */
export const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="cooking">
    <title lang="en">Everyday Italian</title>
    <author>Giada De Laurentiis</author>
    <year>2005</year>
    <price>30.00</price>
  </book>
  <book category="children">
    <title lang="en">Harry Potter</title>
    <author>J K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="web">
    <title lang="en">Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>`;
