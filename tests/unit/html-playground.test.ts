import { describe, it, expect } from "vite-plus/test";
import { buildDocument, SAMPLES, PANEL_TAB_LABELS } from "../../app/utils/html-playground";

describe("HTML プレイグラウンド ユーティリティ", () => {
  // ---------------------------------------------------------------------------
  // buildDocument
  // ---------------------------------------------------------------------------
  describe("buildDocument", () => {
    it("有効な HTML ドキュメント文字列を返す", () => {
      const result = buildDocument("<p>Hello</p>", "body { color: red; }", "console.log(1);");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("DOCTYPE 宣言を含む", () => {
      const result = buildDocument("", "", "");
      expect(result).toContain("<!DOCTYPE html>");
    });

    it('html lang="ja" タグを含む', () => {
      const result = buildDocument("", "", "");
      expect(result).toContain('lang="ja"');
    });

    it("HTML コンテンツが body 内に埋め込まれる", () => {
      const html = '<div id="test">content</div>';
      const result = buildDocument(html, "", "");
      expect(result).toContain(html);
    });

    it("CSS が style タグ内に埋め込まれる", () => {
      const css = "body { margin: 0; }";
      const result = buildDocument("", css, "");
      expect(result).toContain("<style>");
      expect(result).toContain(css);
      expect(result).toContain("</style>");
    });

    it("JavaScript が script タグ内に埋め込まれる", () => {
      const js = "const x = 42;";
      const result = buildDocument("", "", js);
      expect(result).toContain("<script>");
      expect(result).toContain(js);
      expect(result).toContain("</script>");
    });

    it("空の HTML/CSS/JS でも有効なドキュメントを返す", () => {
      const result = buildDocument("", "", "");
      expect(result).toContain("<html");
      expect(result).toContain("</html>");
      expect(result).toContain("<body>");
      expect(result).toContain("</body>");
    });

    it("特殊文字を含む HTML をそのまま埋め込む", () => {
      const html = "<p>テスト &amp; <em>強調</em></p>";
      const result = buildDocument(html, "", "");
      expect(result).toContain(html);
    });

    it("複数行の CSS を正しく埋め込む", () => {
      const css = `h1 {\n  color: blue;\n  font-size: 2rem;\n}`;
      const result = buildDocument("", css, "");
      expect(result).toContain(css);
    });

    it("複数行の JS を正しく埋め込む", () => {
      const js = `function hello() {\n  return 'world';\n}\nhello();`;
      const result = buildDocument("", "", js);
      expect(result).toContain(js);
    });

    it("HTML・CSS・JS がすべて同時に含まれる", () => {
      const html = "<h1>Title</h1>";
      const css = "h1 { color: red; }";
      const js = 'alert("hi");';
      const result = buildDocument(html, css, js);
      expect(result).toContain(html);
      expect(result).toContain(css);
      expect(result).toContain(js);
    });
  });

  // ---------------------------------------------------------------------------
  // SAMPLES
  // ---------------------------------------------------------------------------
  describe("SAMPLES", () => {
    it("少なくとも 1 つのサンプルが定義されている", () => {
      expect(SAMPLES.length).toBeGreaterThan(0);
    });

    it("各サンプルに name・html・css・js プロパティがある", () => {
      for (const sample of SAMPLES) {
        expect(typeof sample.name).toBe("string");
        expect(sample.name.length).toBeGreaterThan(0);
        expect(typeof sample.html).toBe("string");
        expect(typeof sample.css).toBe("string");
        expect(typeof sample.js).toBe("string");
      }
    });

    it("各サンプルの name が一意である", () => {
      const names = SAMPLES.map((s) => s.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });

    it("各サンプルで buildDocument が正常に動作する", () => {
      for (const sample of SAMPLES) {
        const doc = buildDocument(sample.html, sample.css, sample.js);
        expect(doc).toContain("<!DOCTYPE html>");
        expect(doc).toContain(sample.html);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // PANEL_TAB_LABELS
  // ---------------------------------------------------------------------------
  describe("PANEL_TAB_LABELS", () => {
    it("html・css・js の 3 つのラベルが定義されている", () => {
      expect(PANEL_TAB_LABELS["html"]).toBeTruthy();
      expect(PANEL_TAB_LABELS["css"]).toBeTruthy();
      expect(PANEL_TAB_LABELS["js"]).toBeTruthy();
    });

    it("各ラベルが空でない文字列である", () => {
      for (const label of Object.values(PANEL_TAB_LABELS)) {
        expect(typeof label).toBe("string");
        expect(label.length).toBeGreaterThan(0);
      }
    });

    it("ラベルの数がちょうど 3 つである", () => {
      expect(Object.keys(PANEL_TAB_LABELS).length).toBe(3);
    });
  });
});
