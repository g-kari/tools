import { describe, it, expect } from "vite-plus/test";
import { isSafeUrlAttributeValue, parseMarkdown } from "../../app/routes/markdown-preview";

describe("isSafeUrlAttributeValue", () => {
  it("通常の URL と相対 URL を許可する", () => {
    expect(isSafeUrlAttributeValue("https://example.com/image.png")).toBe(true);
    expect(isSafeUrlAttributeValue("/docs/getting-started")).toBe(true);
  });

  it("スクリプトを実行する URL スキームを拒否する", () => {
    expect(isSafeUrlAttributeValue("javascript:alert(1)")).toBe(false);
    expect(isSafeUrlAttributeValue("VBScript:msgbox(1)")).toBe(false);
    expect(isSafeUrlAttributeValue("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("空白や制御文字で難読化された危険なスキームを拒否する", () => {
    expect(isSafeUrlAttributeValue(" \n\tjava\rscript:alert(1)")).toBe(false);
    expect(isSafeUrlAttributeValue("java\u0000script:alert(1)")).toBe(false);
  });
});

describe("parseMarkdown", () => {
  it("空文字列は空文字列を返す", () => {
    expect(parseMarkdown("")).toBe("");
    expect(parseMarkdown("   ")).toBe("");
  });

  it("見出しをHTMLに変換する", () => {
    const result = parseMarkdown("# 見出し1");
    expect(result).toContain("<h1>");
    expect(result).toContain("見出し1");
  });

  it("h2見出しをHTMLに変換する", () => {
    const result = parseMarkdown("## 見出し2");
    expect(result).toContain("<h2>");
    expect(result).toContain("見出し2");
  });

  it("太字テキストをHTMLに変換する", () => {
    const result = parseMarkdown("**太字**");
    expect(result).toContain("<strong>");
    expect(result).toContain("太字");
  });

  it("斜体テキストをHTMLに変換する", () => {
    const result = parseMarkdown("*斜体*");
    expect(result).toContain("<em>");
    expect(result).toContain("斜体");
  });

  it("箇条書きリストをHTMLに変換する", () => {
    const result = parseMarkdown("- 項目1\n- 項目2");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
    expect(result).toContain("項目1");
  });

  it("番号付きリストをHTMLに変換する", () => {
    const result = parseMarkdown("1. 項目1\n2. 項目2");
    expect(result).toContain("<ol>");
    expect(result).toContain("<li>");
    expect(result).toContain("項目1");
  });

  it("リンクをHTMLに変換する", () => {
    const result = parseMarkdown("[テキスト](https://example.com)");
    expect(result).toContain("<a");
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain("テキスト");
  });

  it("コードブロックをHTMLに変換する", () => {
    const result = parseMarkdown('```javascript\nconsole.log("hello");\n```');
    // markedはコードブロックにクラス属性を付与するため、<code で前方一致チェック
    expect(result).toContain("<code");
    expect(result).toContain("console.log");
  });

  it("インラインコードをHTMLに変換する", () => {
    const result = parseMarkdown("`code`");
    expect(result).toContain("<code>");
    expect(result).toContain("code");
  });

  it("引用をHTMLに変換する", () => {
    const result = parseMarkdown("> 引用テキスト");
    expect(result).toContain("<blockquote>");
    expect(result).toContain("引用テキスト");
  });

  it("水平線をHTMLに変換する", () => {
    const result = parseMarkdown("---");
    expect(result).toContain("<hr");
  });

  it("テーブルをHTMLに変換する", () => {
    const markdown = "| 列1 | 列2 |\n|-----|-----|\n| データ1 | データ2 |";
    const result = parseMarkdown(markdown);
    expect(result).toContain("<table>");
    expect(result).toContain("<th>");
    expect(result).toContain("<td>");
  });

  it("通常のテキストを段落タグに変換する", () => {
    const result = parseMarkdown("これは普通の段落です。");
    expect(result).toContain("<p>");
    expect(result).toContain("これは普通の段落です。");
  });

  it("複数の見出しを変換する", () => {
    const result = parseMarkdown("# H1\n## H2\n### H3");
    expect(result).toContain("<h1>");
    expect(result).toContain("<h2>");
    expect(result).toContain("<h3>");
  });

  it("複合的なMarkdownを変換する", () => {
    const markdown = "# タイトル\n\n**太字**と*斜体*のテキスト\n\n- リスト1\n- リスト2";
    const result = parseMarkdown(markdown);
    expect(result).toContain("<h1>");
    expect(result).toContain("<strong>");
    expect(result).toContain("<em>");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
  });
});
