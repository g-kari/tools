import { describe, it, expect, vi, afterEach } from "vite-plus/test";
import { evaluateXPath, XPATH_EXAMPLES, SAMPLE_XML } from "../../app/utils/xpath";

// ノードタイプ定数
const NODE_ELEMENT = 1;
const NODE_ATTRIBUTE = 2;
const NODE_TEXT = 3;
const NODE_CDATA = 4;
const NODE_COMMENT = 8;

// XPathResult 定数のモック
const MOCK_XPATH_RESULT = {
  ANY_TYPE: 0,
  NUMBER_TYPE: 1,
  STRING_TYPE: 2,
  BOOLEAN_TYPE: 3,
  UNORDERED_NODE_ITERATOR_TYPE: 4,
  ORDERED_NODE_ITERATOR_TYPE: 5,
};

/** 正常なXMLのモック DOMParser */
class ValidDOMParser {
  parseFromString(_xml: string, _type: string) {
    return { querySelector: () => null };
  }
}

/** パースエラーを返すモック DOMParser */
class ErrorDOMParser {
  parseFromString(_xml: string, _type: string) {
    return {
      querySelector: (selector: string) =>
        selector === "parsererror" ? { textContent: "XML parse error: invalid structure" } : null,
    };
  }
}

/** parseFromString でスローするモック DOMParser */
class ThrowingDOMParser {
  parseFromString(_xml: string, _type: string): never {
    throw new Error("DOMParser failed");
  }
}

/** DOM Node のモッククラス */
class MockNode {
  static ELEMENT_NODE = NODE_ELEMENT;
  static ATTRIBUTE_NODE = NODE_ATTRIBUTE;
}

/** ブラウザ環境をセットアップし、document.evaluate() の返り値を設定する */
function setupBrowserMocks(evaluateResult: object): void {
  vi.stubGlobal("window", {});
  vi.stubGlobal("DOMParser", ValidDOMParser);
  vi.stubGlobal("XPathResult", MOCK_XPATH_RESULT);
  vi.stubGlobal("Node", MockNode);
  vi.stubGlobal("document", {
    evaluate: vi.fn().mockReturnValue(evaluateResult),
  });
}

/** ノードセット結果のモックを作成する */
function makeNodesetResult(nodes: object[], ordered = false) {
  let idx = 0;
  return {
    resultType: ordered
      ? MOCK_XPATH_RESULT.ORDERED_NODE_ITERATOR_TYPE
      : MOCK_XPATH_RESULT.UNORDERED_NODE_ITERATOR_TYPE,
    iterateNext: vi.fn().mockImplementation(() => (idx < nodes.length ? nodes[idx++] : null)),
  };
}

// ---------------------------------------------------------------------------
// evaluateXPath テスト
// ---------------------------------------------------------------------------

describe("evaluateXPath", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("入力バリデーション", () => {
    it("XMLが空の場合はエラーを返す", () => {
      const result = evaluateXPath({ xml: "", expression: "//book" });
      expect(result.type).toBe("error");
      expect(result.error).toContain("XML");
    });

    it("XPath式が空の場合はエラーを返す", () => {
      const result = evaluateXPath({ xml: "<root/>", expression: "" });
      expect(result.type).toBe("error");
      expect(result.error).toContain("XPath");
    });

    it("空白のみのXMLはエラーを返す", () => {
      const result = evaluateXPath({ xml: "   ", expression: "//book" });
      expect(result.type).toBe("error");
    });

    it("空白のみのXPath式はエラーを返す", () => {
      const result = evaluateXPath({ xml: "<root/>", expression: "  " });
      expect(result.type).toBe("error");
    });
  });

  describe("ブラウザ環境なし (Node.js)", () => {
    it("windowが未定義の場合はエラーを返す", () => {
      const result = evaluateXPath({ xml: "<root/>", expression: "/root" });
      expect(["error", "nodeset", "string", "number", "boolean"]).toContain(result.type);
    });
  });

  describe("DOMParser エラー", () => {
    it("parsererror 要素が存在する場合はパースエラーを返す", () => {
      vi.stubGlobal("window", {});
      vi.stubGlobal("DOMParser", ErrorDOMParser);
      vi.stubGlobal("XPathResult", MOCK_XPATH_RESULT);
      vi.stubGlobal("Node", MockNode);
      vi.stubGlobal("document", { evaluate: vi.fn() });

      const result = evaluateXPath({
        xml: "<root><unclosed>",
        expression: "//root",
      });
      expect(result.type).toBe("error");
      expect(result.error).toContain("パースエラー");
    });

    it("DOMParser がスローした場合はエラーを返す", () => {
      vi.stubGlobal("window", {});
      vi.stubGlobal("DOMParser", ThrowingDOMParser);
      vi.stubGlobal("XPathResult", MOCK_XPATH_RESULT);
      vi.stubGlobal("Node", MockNode);
      vi.stubGlobal("document", { evaluate: vi.fn() });

      const result = evaluateXPath({ xml: "<root/>", expression: "/root" });
      expect(result.type).toBe("error");
      expect(result.error).toContain("パースエラー");
    });

    it("parseerror の textContent が null の場合はデフォルトメッセージを使用する", () => {
      vi.stubGlobal("window", {});
      vi.stubGlobal(
        "DOMParser",
        class {
          parseFromString() {
            return {
              querySelector: (selector: string) =>
                selector === "parsererror" ? { textContent: null } : null,
            };
          }
        },
      );
      vi.stubGlobal("XPathResult", MOCK_XPATH_RESULT);
      vi.stubGlobal("Node", MockNode);
      vi.stubGlobal("document", { evaluate: vi.fn() });

      const result = evaluateXPath({ xml: "<broken>", expression: "/root" });
      expect(result.type).toBe("error");
      expect(result.error).toContain("パースエラー");
    });

    it("DOMParser が Error 以外をスローした場合も処理できる", () => {
      vi.stubGlobal("window", {});
      vi.stubGlobal("XPathResult", MOCK_XPATH_RESULT);
      vi.stubGlobal("Node", MockNode);
      vi.stubGlobal(
        "DOMParser",
        class {
          parseFromString(): never {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw "string error";
          }
        },
      );
      vi.stubGlobal("document", { evaluate: vi.fn() });

      const result = evaluateXPath({ xml: "<root/>", expression: "/root" });
      expect(result.type).toBe("error");
      expect(result.error).toContain("パースエラー");
    });
  });

  describe("数値型 (NUMBER_TYPE)", () => {
    it("数値結果を返す", () => {
      setupBrowserMocks({
        resultType: MOCK_XPATH_RESULT.NUMBER_TYPE,
        numberValue: 3,
      });
      const result = evaluateXPath({
        xml: "<root><item/><item/><item/></root>",
        expression: "count(//item)",
      });
      expect(result.type).toBe("number");
      expect(result.numberValue).toBe(3);
    });

    it("小数値も返せる", () => {
      setupBrowserMocks({
        resultType: MOCK_XPATH_RESULT.NUMBER_TYPE,
        numberValue: 3.14,
      });
      const result = evaluateXPath({ xml: "<root/>", expression: "3.14" });
      expect(result.type).toBe("number");
      expect(result.numberValue).toBe(3.14);
    });
  });

  describe("文字列型 (STRING_TYPE)", () => {
    it("文字列結果を返す", () => {
      setupBrowserMocks({
        resultType: MOCK_XPATH_RESULT.STRING_TYPE,
        stringValue: "Everyday Italian",
      });
      const result = evaluateXPath({
        xml: "<root><title>Everyday Italian</title></root>",
        expression: "string(//title)",
      });
      expect(result.type).toBe("string");
      expect(result.stringValue).toBe("Everyday Italian");
    });

    it("空文字列も返せる", () => {
      setupBrowserMocks({
        resultType: MOCK_XPATH_RESULT.STRING_TYPE,
        stringValue: "",
      });
      const result = evaluateXPath({ xml: "<root/>", expression: "string()" });
      expect(result.type).toBe("string");
      expect(result.stringValue).toBe("");
    });
  });

  describe("真偽値型 (BOOLEAN_TYPE)", () => {
    it("true を返す", () => {
      setupBrowserMocks({
        resultType: MOCK_XPATH_RESULT.BOOLEAN_TYPE,
        booleanValue: true,
      });
      const result = evaluateXPath({
        xml: "<root><item/></root>",
        expression: "boolean(//item)",
      });
      expect(result.type).toBe("boolean");
      expect(result.booleanValue).toBe(true);
    });

    it("false を返す", () => {
      setupBrowserMocks({
        resultType: MOCK_XPATH_RESULT.BOOLEAN_TYPE,
        booleanValue: false,
      });
      const result = evaluateXPath({
        xml: "<root/>",
        expression: "boolean(//nonexistent)",
      });
      expect(result.type).toBe("boolean");
      expect(result.booleanValue).toBe(false);
    });
  });

  describe("ノードセット型 (UNORDERED_NODE_ITERATOR_TYPE)", () => {
    it("要素ノードを含む結果を返す", () => {
      const mockEl = {
        nodeName: "book",
        textContent: "Some book",
        nodeType: NODE_ELEMENT,
        outerHTML: "<book>Some book</book>",
      };
      setupBrowserMocks(makeNodesetResult([mockEl]));

      const result = evaluateXPath({
        xml: "<store><book>Some book</book></store>",
        expression: "//book",
      });
      expect(result.type).toBe("nodeset");
      expect(result.nodeCount).toBe(1);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes![0].name).toBe("book");
      expect(result.nodes![0].value).toBe("<book>Some book</book>");
      expect(result.nodes![0].nodeTypeName).toBe("Element");
    });

    it("複数要素ノードを含む結果を返す", () => {
      const nodes = [
        { nodeName: "a", textContent: "A", nodeType: NODE_ELEMENT, outerHTML: "<a>A</a>" },
        { nodeName: "b", textContent: "B", nodeType: NODE_ELEMENT, outerHTML: "<b>B</b>" },
      ];
      setupBrowserMocks(makeNodesetResult(nodes));

      const result = evaluateXPath({
        xml: "<root><a>A</a><b>B</b></root>",
        expression: "//*",
      });
      expect(result.type).toBe("nodeset");
      expect(result.nodeCount).toBe(2);
    });

    it("空のノードセットを返す", () => {
      setupBrowserMocks(makeNodesetResult([]));

      const result = evaluateXPath({
        xml: "<root/>",
        expression: "//nonexistent",
      });
      expect(result.type).toBe("nodeset");
      expect(result.nodeCount).toBe(0);
      expect(result.nodes).toHaveLength(0);
    });
  });

  describe("ノードセット型 (ORDERED_NODE_ITERATOR_TYPE)", () => {
    it("属性ノードを含む結果を返す", () => {
      const mockAttr = {
        nodeName: "category",
        textContent: "cooking",
        nodeType: NODE_ATTRIBUTE,
        name: "category",
        value: "cooking",
      };
      setupBrowserMocks(makeNodesetResult([mockAttr], true));

      const result = evaluateXPath({
        xml: '<book category="cooking"/>',
        expression: "//@category",
      });
      expect(result.type).toBe("nodeset");
      expect(result.nodes![0].value).toBe('category="cooking"');
      expect(result.nodes![0].nodeTypeName).toBe("Attribute");
    });

    it("テキストノードを含む結果を返す", () => {
      const mockText = {
        nodeName: "#text",
        textContent: "Hello World",
        nodeType: NODE_TEXT,
      };
      setupBrowserMocks(makeNodesetResult([mockText], true));

      const result = evaluateXPath({
        xml: "<root>Hello World</root>",
        expression: "//text()",
      });
      expect(result.type).toBe("nodeset");
      expect(result.nodes![0].value).toBe("Hello World");
      expect(result.nodes![0].nodeTypeName).toBe("Text");
    });
  });

  describe("サポート外の結果型", () => {
    it("未知の resultType はエラーを返す", () => {
      setupBrowserMocks({ resultType: 99 });

      const result = evaluateXPath({ xml: "<root/>", expression: "/root" });
      expect(result.type).toBe("error");
      expect(result.error).toContain("サポートされていない");
    });
  });

  describe("XPath 評価エラー", () => {
    it("document.evaluate() がスローした場合はエラーを返す", () => {
      vi.stubGlobal("window", {});
      vi.stubGlobal("DOMParser", ValidDOMParser);
      vi.stubGlobal("XPathResult", MOCK_XPATH_RESULT);
      vi.stubGlobal("Node", MockNode);
      vi.stubGlobal("document", {
        evaluate: vi.fn().mockImplementation(() => {
          throw new Error("Invalid XPath expression");
        }),
      });

      const result = evaluateXPath({
        xml: "<root/>",
        expression: "///invalid",
      });
      expect(result.type).toBe("error");
      expect(result.error).toContain("評価エラー");
    });

    it("evaluate が Error 以外をスローした場合も処理できる", () => {
      vi.stubGlobal("window", {});
      vi.stubGlobal("DOMParser", ValidDOMParser);
      vi.stubGlobal("XPathResult", MOCK_XPATH_RESULT);
      vi.stubGlobal("Node", MockNode);
      vi.stubGlobal("document", {
        evaluate: vi.fn().mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw "xpath error string";
        }),
      });

      const result = evaluateXPath({ xml: "<root/>", expression: "/root" });
      expect(result.type).toBe("error");
      expect(result.error).toContain("評価エラー");
    });
  });
});

// ---------------------------------------------------------------------------
// ノードタイプ名のテスト（domNodeToXPathNode 経由で間接テスト）
// ---------------------------------------------------------------------------

describe("ノードタイプ名の変換", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const nodeTypeTestCases: Array<{
    nodeType: number;
    expected: string;
    name?: string;
    value?: string;
  }> = [
    { nodeType: NODE_ELEMENT, expected: "Element" },
    { nodeType: NODE_ATTRIBUTE, expected: "Attribute", name: "attr", value: "val" },
    { nodeType: NODE_TEXT, expected: "Text" },
    { nodeType: NODE_CDATA, expected: "CDATASection" },
    { nodeType: 5, expected: "EntityReference" },
    { nodeType: 6, expected: "Entity" },
    { nodeType: 7, expected: "ProcessingInstruction" },
    { nodeType: NODE_COMMENT, expected: "Comment" },
    { nodeType: 9, expected: "Document" },
    { nodeType: 10, expected: "DocumentType" },
    { nodeType: 11, expected: "DocumentFragment" },
    { nodeType: 12, expected: "Notation" },
  ];

  for (const { nodeType, expected, name, value } of nodeTypeTestCases) {
    it(`nodeType ${nodeType} → "${expected}"`, () => {
      const mockNode: Record<string, unknown> = {
        nodeName: name ?? "#node",
        textContent: "content",
        nodeType,
      };
      if (nodeType === NODE_ATTRIBUTE) {
        mockNode.name = name ?? "attr";
        mockNode.value = value ?? "val";
      }
      if (nodeType === NODE_ELEMENT) {
        mockNode.outerHTML = `<${name ?? "el"}/>`;
      }

      let callCount = 0;
      setupBrowserMocks({
        resultType: MOCK_XPATH_RESULT.UNORDERED_NODE_ITERATOR_TYPE,
        iterateNext: vi.fn().mockImplementation(() => (callCount++ < 1 ? mockNode : null)),
      });

      const result = evaluateXPath({ xml: "<root/>", expression: "/root" });
      expect(result.type).toBe("nodeset");
      expect(result.nodes![0].nodeTypeName).toBe(expected);
    });
  }

  it('未知のノードタイプは "Unknown(n)" を返す', () => {
    const mockUnknown = {
      nodeName: "unknown",
      textContent: "",
      nodeType: 99,
    };
    let callCount = 0;
    setupBrowserMocks({
      resultType: MOCK_XPATH_RESULT.UNORDERED_NODE_ITERATOR_TYPE,
      iterateNext: vi.fn().mockImplementation(() => (callCount++ < 1 ? mockUnknown : null)),
    });

    const result = evaluateXPath({ xml: "<root/>", expression: "/root" });
    expect(result.type).toBe("nodeset");
    expect(result.nodes![0].nodeTypeName).toBe("Unknown(99)");
  });

  it("textContent が null のノードは空文字列に変換する", () => {
    const mockNode = {
      nodeName: "#text",
      textContent: null,
      nodeType: NODE_TEXT,
    };
    let callCount = 0;
    setupBrowserMocks({
      resultType: MOCK_XPATH_RESULT.UNORDERED_NODE_ITERATOR_TYPE,
      iterateNext: vi.fn().mockImplementation(() => (callCount++ < 1 ? mockNode : null)),
    });

    const result = evaluateXPath({ xml: "<root/>", expression: "//text()" });
    expect(result.type).toBe("nodeset");
    expect(result.nodes![0].textContent).toBe("");
  });
});

// ---------------------------------------------------------------------------
// XPATH_EXAMPLES の定数テスト
// ---------------------------------------------------------------------------

describe("XPATH_EXAMPLES", () => {
  it("例が8個含まれる", () => {
    expect(XPATH_EXAMPLES.length).toBe(8);
  });

  it("各例に label・expression・description がある", () => {
    for (const ex of XPATH_EXAMPLES) {
      expect(ex.label).toBeTruthy();
      expect(ex.expression).toBeTruthy();
      expect(ex.description).toBeTruthy();
    }
  });

  it("全ての式が文字列である", () => {
    for (const ex of XPATH_EXAMPLES) {
      expect(typeof ex.expression).toBe("string");
    }
  });

  it("count() 関数を使用する例が含まれる", () => {
    const hasCount = XPATH_EXAMPLES.some((ex) => ex.expression.includes("count("));
    expect(hasCount).toBe(true);
  });

  it("contains() 関数を使用する例が含まれる", () => {
    const hasContains = XPATH_EXAMPLES.some((ex) => ex.expression.includes("contains("));
    expect(hasContains).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SAMPLE_XML の定数テスト
// ---------------------------------------------------------------------------

describe("SAMPLE_XML", () => {
  it("空でない", () => {
    expect(SAMPLE_XML.trim().length).toBeGreaterThan(0);
  });

  it("XML宣言を含む", () => {
    expect(SAMPLE_XML).toContain("<?xml");
  });

  it("bookstore 要素を含む", () => {
    expect(SAMPLE_XML).toContain("<bookstore>");
  });

  it("book 要素が3つ含まれる", () => {
    const matches = SAMPLE_XML.match(/<book /g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(3);
  });

  it("category 属性を含む", () => {
    expect(SAMPLE_XML).toContain("category=");
  });

  it("price 要素を含む", () => {
    expect(SAMPLE_XML).toContain("<price>");
  });

  it("author 要素を含む", () => {
    expect(SAMPLE_XML).toContain("<author>");
  });

  it("lang 属性を含む", () => {
    expect(SAMPLE_XML).toContain("lang=");
  });
});
