import { describe, it, expect } from "vite-plus/test";
import { formatHTML } from "../../app/utils/html-formatter";

describe("formatHTML", () => {
  describe("基本的な整形", () => {
    it("空文字列を整形するとほぼ空を返す", () => {
      const result = formatHTML("");
      expect(result.formatted.trim()).toBe("");
    });

    it("単純な HTML タグを整形する", () => {
      const result = formatHTML("<div><p>Hello</p></div>");
      expect(result.formatted).toContain("<div>");
      expect(result.formatted).toContain("</div>");
      expect(result.formatted).toContain("<p>");
    });

    it("インデントが正しく適用される", () => {
      const result = formatHTML("<div><p>text</p></div>");
      const lines = result.formatted.split("\n");
      const pLine = lines.find((l) => l.includes("<p>"));
      expect(pLine).toBeDefined();
      expect(pLine!.startsWith("  ")).toBe(true);
    });

    it("elementCount が正しい", () => {
      const result = formatHTML("<div><p>text</p></div>");
      expect(result.elementCount).toBeGreaterThan(0);
    });
  });

  describe("void 要素", () => {
    it("br は閉じタグなし", () => {
      const result = formatHTML("<div><br></div>");
      expect(result.formatted).not.toContain("</br>");
    });

    it("img は閉じタグなし", () => {
      const result = formatHTML('<img src="test.png">');
      expect(result.formatted).not.toContain("</img>");
    });

    it("input は閉じタグなし", () => {
      const result = formatHTML('<form><input type="text"></form>');
      expect(result.formatted).not.toContain("</input>");
    });
  });

  describe("DOCTYPE / コメント", () => {
    it("DOCTYPE を保持する", () => {
      const result = formatHTML("<!DOCTYPE html><html><head></head><body></body></html>");
      expect(result.formatted).toContain("<!DOCTYPE html>");
    });

    it("HTML コメントを保持する", () => {
      const result = formatHTML("<div><!-- comment --></div>");
      expect(result.formatted).toContain("<!-- comment -->");
    });
  });

  describe("インデントオプション", () => {
    it("indentSize=4 で 4 スペースインデント", () => {
      const result = formatHTML("<div><p>text</p></div>", { indentSize: 4 });
      const lines = result.formatted.split("\n");
      const pLine = lines.find((l) => l.includes("<p>"));
      expect(pLine!.startsWith("    ")).toBe(true);
    });

    it("useTabs=true でタブインデント", () => {
      const result = formatHTML("<div><p>text</p></div>", { useTabs: true });
      const lines = result.formatted.split("\n");
      const pLine = lines.find((l) => l.includes("<p>"));
      expect(pLine!.startsWith("\t")).toBe(true);
    });
  });

  describe("raw 要素", () => {
    it("script タグの内容を保持する", () => {
      const result = formatHTML("<html><script>var x = 1;</script></html>");
      expect(result.formatted).toContain("var x = 1;");
    });

    it("style タグの内容を保持する", () => {
      const result = formatHTML("<html><style>body{margin:0}</style></html>");
      expect(result.formatted).toContain("body{margin:0}");
    });

    it("pre タグの内容を保持する", () => {
      const result = formatHTML("<pre>  preserved  spaces  </pre>");
      expect(result.formatted).toContain("preserved  spaces");
    });
  });

  describe("圧縮された HTML の整形", () => {
    it("圧縮 HTML を複数行に展開する", () => {
      const compressed = "<html><head><title>Test</title></head><body><p>Hello</p></body></html>";
      const result = formatHTML(compressed);
      const lines = result.formatted.split("\n").filter((l) => l.trim());
      expect(lines.length).toBeGreaterThan(5);
    });
  });
});
