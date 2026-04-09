import { describe, it, expect } from "vite-plus/test";
import {
  generateLoremIpsum,
  generateLatinParagraph,
  generateJapaneseParagraph,
  wrapWithHtmlTags,
} from "~/routes/lorem-ipsum";

describe("Lorem Ipsum Generation", () => {
  describe("generateLatinParagraph", () => {
    it("空でない文字列を返す", () => {
      const result = generateLatinParagraph();
      expect(result.length).toBeGreaterThan(0);
    });

    it("ピリオドで終わる", () => {
      const result = generateLatinParagraph();
      expect(result.endsWith(".")).toBe(true);
    });

    it("先頭が大文字である", () => {
      const result = generateLatinParagraph();
      expect(result[0]).toMatch(/[A-Z]/);
    });

    it("指定した文数の文を生成する", () => {
      const result = generateLatinParagraph(3);
      // ピリオドの数で文数を確認
      const sentenceCount = (result.match(/\./g) || []).length;
      expect(sentenceCount).toBe(3);
    });

    it("文数1でも動作する", () => {
      const result = generateLatinParagraph(1);
      expect(result.length).toBeGreaterThan(0);
      expect(result.endsWith(".")).toBe(true);
    });
  });

  describe("generateJapaneseParagraph", () => {
    it("空でない文字列を返す", () => {
      const result = generateJapaneseParagraph();
      expect(result.length).toBeGreaterThan(0);
    });

    it("句点（。）で終わる", () => {
      const result = generateJapaneseParagraph();
      expect(result.endsWith("。")).toBe(true);
    });

    it("指定した文数の文を生成する", () => {
      const result = generateJapaneseParagraph(4);
      const sentenceCount = (result.match(/。/g) || []).length;
      expect(sentenceCount).toBe(4);
    });

    it("文数1でも動作する", () => {
      const result = generateJapaneseParagraph(1);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("wrapWithHtmlTags", () => {
    it("各段落を<p>タグで囲む", () => {
      const result = wrapWithHtmlTags(["段落1", "段落2"]);
      expect(result).toBe("<p>段落1</p>\n<p>段落2</p>");
    });

    it("空配列では空文字列を返す", () => {
      const result = wrapWithHtmlTags([]);
      expect(result).toBe("");
    });

    it("単一段落でも正しくタグを付ける", () => {
      const result = wrapWithHtmlTags(["Hello World"]);
      expect(result).toBe("<p>Hello World</p>");
    });

    it("<p>タグが含まれる", () => {
      const result = wrapWithHtmlTags(["test"]);
      expect(result).toContain("<p>");
      expect(result).toContain("</p>");
    });
  });

  describe("generateLoremIpsum - 段落モード（ラテン語）", () => {
    it("指定した段落数のテキストを生成する（1段落）", () => {
      const result = generateLoremIpsum({
        mode: "paragraphs",
        paragraphCount: 1,
        wordCount: 100,
        sentenceCount: 10,
        language: "latin",
        wrapHtml: false,
        startWithLorem: false,
      });
      expect(result.length).toBeGreaterThan(0);
      // 1段落は改行なし
      expect(result.split("\n\n")).toHaveLength(1);
    });

    it("指定した段落数のテキストを生成する（3段落）", () => {
      const result = generateLoremIpsum({
        mode: "paragraphs",
        paragraphCount: 3,
        wordCount: 100,
        sentenceCount: 10,
        language: "latin",
        wrapHtml: false,
        startWithLorem: false,
      });
      expect(result.split("\n\n")).toHaveLength(3);
    });

    it("先頭をLorem ipsum...で始めるオプションが動作する", () => {
      const result = generateLoremIpsum({
        mode: "paragraphs",
        paragraphCount: 1,
        wordCount: 100,
        sentenceCount: 10,
        language: "latin",
        wrapHtml: false,
        startWithLorem: true,
      });
      expect(result).toMatch(/^Lorem ipsum dolor sit amet/);
    });

    it("先頭固定オプション OFF では Lorem ipsum... で始まるとは限らない（複数回実行で確認）", () => {
      // startWithLorem: false のとき、決定的に "Lorem ipsum..." で始まらないことがある
      let nonLoremStart = false;
      for (let i = 0; i < 50; i++) {
        const result = generateLoremIpsum({
          mode: "paragraphs",
          paragraphCount: 1,
          wordCount: 100,
          sentenceCount: 10,
          language: "latin",
          wrapHtml: false,
          startWithLorem: false,
        });
        if (!result.startsWith("Lorem ipsum dolor sit amet")) {
          nonLoremStart = true;
          break;
        }
      }
      expect(nonLoremStart).toBe(true);
    });
  });

  describe("generateLoremIpsum - 段落モード（日本語）", () => {
    it("日本語ダミーテキストを生成する", () => {
      const result = generateLoremIpsum({
        mode: "paragraphs",
        paragraphCount: 2,
        wordCount: 100,
        sentenceCount: 10,
        language: "japanese",
        wrapHtml: false,
        startWithLorem: false,
      });
      expect(result.length).toBeGreaterThan(0);
      expect(result.split("\n\n")).toHaveLength(2);
    });

    it("日本語テキストは句点（。）を含む", () => {
      const result = generateLoremIpsum({
        mode: "paragraphs",
        paragraphCount: 1,
        wordCount: 100,
        sentenceCount: 10,
        language: "japanese",
        wrapHtml: false,
        startWithLorem: false,
      });
      expect(result).toContain("。");
    });
  });

  describe("generateLoremIpsum - 単語数モード", () => {
    it("単語数モードで生成する", () => {
      const result = generateLoremIpsum({
        mode: "words",
        paragraphCount: 3,
        wordCount: 50,
        sentenceCount: 10,
        language: "latin",
        wrapHtml: false,
        startWithLorem: false,
      });
      expect(result.length).toBeGreaterThan(0);
    });

    it("単語数モードで指定した単語数を生成する", () => {
      const result = generateLoremIpsum({
        mode: "words",
        paragraphCount: 3,
        wordCount: 10,
        sentenceCount: 10,
        language: "latin",
        wrapHtml: false,
        startWithLorem: false,
      });
      // スペースで分割して単語数を確認（ピリオドを取り除く）
      const words = result.replace(/\./g, "").trim().split(/\s+/);
      expect(words).toHaveLength(10);
    });
  });

  describe("generateLoremIpsum - 文数モード", () => {
    it("文数モードで生成する", () => {
      const result = generateLoremIpsum({
        mode: "sentences",
        paragraphCount: 3,
        wordCount: 100,
        sentenceCount: 6,
        language: "latin",
        wrapHtml: false,
        startWithLorem: false,
      });
      expect(result.length).toBeGreaterThan(0);
      const sentenceCount = (result.match(/\./g) || []).length;
      expect(sentenceCount).toBe(6);
    });
  });

  describe("generateLoremIpsum - HTMLタグオプション", () => {
    it("HTMLタグ付き出力が<p>タグを含む", () => {
      const result = generateLoremIpsum({
        mode: "paragraphs",
        paragraphCount: 2,
        wordCount: 100,
        sentenceCount: 10,
        language: "latin",
        wrapHtml: true,
        startWithLorem: false,
      });
      expect(result).toContain("<p>");
      expect(result).toContain("</p>");
    });

    it("HTMLタグ付き出力の段落数が正しい", () => {
      const result = generateLoremIpsum({
        mode: "paragraphs",
        paragraphCount: 3,
        wordCount: 100,
        sentenceCount: 10,
        language: "latin",
        wrapHtml: true,
        startWithLorem: false,
      });
      const pTagCount = (result.match(/<p>/g) || []).length;
      expect(pTagCount).toBe(3);
    });
  });
});
