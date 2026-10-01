import { describe, it, expect } from "vite-plus/test";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import {
  isSafeUrlAttributeValue,
  parseMarkdown,
  renderMarkdownPreviewHtml,
} from "../../app/routes/markdown-preview";

function renderPreview(markdown: string): Document {
  const html = renderToStaticMarkup(
    createElement(Fragment, null, renderMarkdownPreviewHtml(parseMarkdown(markdown))),
  );
  return new JSDOM(html, { url: "https://preview.example/" }).window.document;
}

describe("Markdownプレビューのレンダリング", () => {
  it.each([
    ["script", '<script data-blocked="true">blocked child</script>'],
    ["iframe", '<iframe data-blocked="true">blocked child</iframe>'],
    ["form", '<form data-blocked="true"><input value="blocked child"></form>'],
    ["object", '<object data-blocked="true">blocked child</object>'],
    ["embed", '<embed data-blocked="true">'],
    ["svg", '<svg data-blocked="true"><text>blocked child</text></svg>'],
    ["math", '<math data-blocked="true"><mi>blocked child</mi></math>'],
    ["style", '<style data-blocked="true">.blocked-child { color: red }</style>'],
    ["meta", '<meta data-blocked="true" content="blocked child">'],
    ["link", '<link data-blocked="true" href="/blocked-child.css">'],
    ["base", '<base data-blocked="true" href="https://example.com/">'],
  ])("%s要素とその子を実際の出力から除去する", (tag, input) => {
    for (const markdown of [input, `<div>before${input}<strong>after</strong></div>`]) {
      const document = renderPreview(markdown);
      expect(document.querySelector(tag)).toBeNull();
      expect(document.querySelector("[data-blocked]")).toBeNull();
      expect(document.body.textContent).not.toContain("blocked child");
      if (markdown.startsWith("<div>")) {
        expect(document.querySelector("strong")?.textContent).toBe("after");
        expect(document.body.textContent).toContain("before");
      }
    }
  });

  it("イベント属性とstyle属性を除去し通常の属性を保持する", () => {
    const document = renderPreview(
      '<p id="safe" title="kept" ONCLICK="doSomething()" style="color:red">safe text</p>',
    );
    const paragraph = document.querySelector("p");
    expect(paragraph?.getAttribute("id")).toBe("safe");
    expect(paragraph?.getAttribute("title")).toBe("kept");
    expect(paragraph?.hasAttribute("onclick")).toBe(false);
    expect(paragraph?.hasAttribute("style")).toBe(false);
    expect(paragraph?.textContent).toBe("safe text");
  });

  it.each(["href", "src", "action", "data", "formaction", "xlink:href"])(
    "%s属性の難読化された危険なスキームを無効化する",
    (attribute) => {
      for (const value of [
        "javascript:doSomething()",
        "VBScript:doSomething()",
        "data:text/html,blocked",
        " &#x09;java&#x0A;script:doSomething()",
        "&#106;avascript:doSomething()",
      ]) {
        const document = renderPreview(`<a ${attribute}="${value}">link</a>`);
        expect(document.querySelector("a")?.getAttribute(attribute)).toBe("#");
      }
    },
  );

  it.each([
    "https://example.com/docs?q=1&next=2",
    "http://example.com/",
    "/docs/getting-started",
    "../image.png",
    "#section",
    "mailto:hello@example.com",
    "tel:+81312345678",
  ])("通常のリンク%sを変更しない", (value) => {
    const document = renderPreview(`<a href="${value}">link</a>`);
    expect(document.querySelector("a")?.getAttribute("href")).toBe(value);
  });

  it("通常の画像とGFM構文、エスケープ済みコードを保持する", () => {
    const markdown = `# Heading

**bold** and *italic*

- first
- second

> quote

| name | value |
| --- | --- |
| one | two |

![image](/image.png "caption")

\`<iframe>code</iframe>\`

\`\`\`html
<script>code</script>
\`\`\``;
    const document = renderPreview(markdown);
    expect(document.querySelector("h1")?.textContent).toBe("Heading");
    expect(document.querySelector("strong")?.textContent).toBe("bold");
    expect(document.querySelector("em")?.textContent).toBe("italic");
    expect(document.querySelectorAll("li")).toHaveLength(2);
    expect(document.querySelector("blockquote")?.textContent).toContain("quote");
    expect(document.querySelector("td")?.textContent).toBe("one");
    expect(document.querySelector("img")?.getAttribute("src")).toBe("/image.png");
    expect(document.querySelector("img")?.getAttribute("alt")).toBe("image");
    expect(document.querySelector("img")?.getAttribute("title")).toBe("caption");
    expect(document.querySelector("code")?.textContent).toBe("<iframe>code</iframe>");
    expect(document.querySelector("pre code")?.textContent).toBe("<script>code</script>\n");
    expect(document.querySelector("script, iframe")).toBeNull();
  });
});

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
