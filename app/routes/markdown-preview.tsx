import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { Marked } from "marked";
import parse from "html-react-parser";
import type { DOMNode, HTMLReactParserOptions } from "html-react-parser";
import { Element } from "domhandler";

export const Route = createFileRoute("/markdown-preview")({
  head: () => ({
    meta: [
      { title: "Markdownプレビュー | Web ツール集" },
      {
        name: "description",
        content:
          "Markdownをリアルタイムでプレビューできるツール。見出し、リスト、コードブロック、テーブルなどに対応。",
      },
      { property: "og:title", content: "Markdownプレビュー | Web ツール集" },
      {
        property: "og:description",
        content:
          "Markdownをリアルタイムでプレビューできるツール。見出し、リスト、コードブロック、テーブルなどに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/markdown-preview` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Markdownプレビュー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "Markdownをリアルタイムでプレビューできるツール。見出し、リスト、コードブロック、テーブルなどに対応。",
      },
    ],
  }),
  component: MarkdownPreview,
});

const SAMPLE_MARKDOWN = `# Markdownサンプル

## 見出し2

### 見出し3

**太字テキスト**と*斜体テキスト*

## リスト

- 箇条書き1
- 箇条書き2
  - ネスト項目
- 箇条書き3

## 番号付きリスト

1. 最初の項目
2. 二番目の項目
3. 三番目の項目

## リンクと画像

[リンクテキスト](https://example.com)

## コードブロック

インラインコード: \`const hello = "world"\`

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## 表

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| データ1 | データ2 | データ3 |
| データ4 | データ5 | データ6 |

## 引用

> これは引用文です。
> 複数行にまたがることもできます。

## 水平線

---

テキストの末尾
`;

/**
 * html-react-parserのオプション: 危険なタグを除去する
 * scriptやiframe等のタグを除去し、イベントハンドラ属性を除去する
 */
const URL_ATTRIBUTES = new Set(["href", "src", "action", "data", "formaction", "xlink:href"]);

/**
 * URL 属性にスクリプトを実行できるスキームが含まれていないか検証する。
 * ブラウザーがスキーム判定時に無視する ASCII 制御文字や空白も除去してから判定する。
 */
export function isSafeUrlAttributeValue(value: string): boolean {
  const normalized = value.replace(/[\u0000-\u0020\u007f]+/g, "").toLowerCase();
  return !normalized.startsWith("javascript:") &&
    !normalized.startsWith("vbscript:") &&
    !normalized.startsWith("data:");
}

const parseOptions: HTMLReactParserOptions = {
  replace(domNode: DOMNode) {
    if (!(domNode instanceof Element)) return;

    const tagName = domNode.tagName?.toLowerCase();
    // 危険なタグをnullに置き換えて除去
    if (
      tagName === "script" ||
      tagName === "iframe" ||
      tagName === "form" ||
      tagName === "object" ||
      tagName === "embed" ||
      tagName === "svg" ||
      tagName === "math" ||
      tagName === "meta" ||
      tagName === "link" ||
      tagName === "base"
    ) {
      return null;
    }

    // イベントハンドラ属性を除去
    if (domNode.attribs) {
      const attribs = { ...domNode.attribs };
      Object.keys(attribs).forEach((attr) => {
        const normalizedAttr = attr.toLowerCase();
        if (normalizedAttr.startsWith("on") || normalizedAttr === "style") {
          delete attribs[attr];
          return;
        }
        // 難読化された危険なスキームを含む URL 属性を無効化
        if (URL_ATTRIBUTES.has(normalizedAttr) && !isSafeUrlAttributeValue(attribs[attr] ?? "")) {
          attribs[attr] = "#";
        }
      });
      domNode.attribs = attribs;
    }
  },
};

/** GFM・ソフト改行を有効化したmarkedインスタンス */
const markedInstance = new Marked({ breaks: true, gfm: true });

/**
 * MarkdownをHTMLに変換する関数
 * @param markdown - 変換するMarkdown文字列
 * @returns HTML文字列
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown.trim()) return "";
  return markedInstance.parse(markdown) as string;
}

/**
 * Markdownプレビューコンポーネント
 */
function MarkdownPreview() {
  const { showToast } = useToast();
  const [markdownInput, setMarkdownInput] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  // 入力変更時にリアルタイムでプレビューを更新
  useEffect(() => {
    const html = parseMarkdown(markdownInput);
    setPreviewHtml(html);
  }, [markdownInput]);

  // 初期フォーカス
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCopyMarkdown = useCallback(async () => {
    if (!markdownInput) {
      announceStatus("エラー: コピーするMarkdownがありません");
      showToast("コピーするMarkdownがありません", "error");
      return;
    }
    const success = await copy(markdownInput);
    if (success) {
      announceStatus("Markdownをクリップボードにコピーしました");
      showToast("Markdownをコピーしました", "success");
    } else {
      announceStatus("エラー: クリップボードへのコピーに失敗しました");
      showToast("クリップボードへのコピーに失敗しました", "error");
    }
  }, [markdownInput, announceStatus, showToast, copy]);

  const handleCopyHtml = useCallback(async () => {
    if (!previewHtml) {
      announceStatus("エラー: コピーするHTMLがありません");
      showToast("コピーするHTMLがありません", "error");
      return;
    }
    const success = await copy(previewHtml);
    if (success) {
      announceStatus("HTMLをクリップボードにコピーしました");
      showToast("HTMLをコピーしました", "success");
    } else {
      announceStatus("エラー: クリップボードへのコピーに失敗しました");
      showToast("クリップボードへのコピーに失敗しました", "error");
    }
  }, [previewHtml, announceStatus, showToast, copy]);

  const handleInsertSample = useCallback(() => {
    setMarkdownInput(SAMPLE_MARKDOWN);
    announceStatus("サンプルMarkdownを挿入しました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleClear = useCallback(() => {
    setMarkdownInput("");
    setPreviewHtml("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  // Ctrl+Enter でMarkdownをコピー
  useKeyboardShortcut("Enter", handleCopyMarkdown, { ctrl: true });

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <div className="button-group" role="group" aria-label="ツール操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleCopyMarkdown}
              aria-label="Markdownをクリップボードにコピー"
              disabled={!markdownInput}
            >
              Markdownをコピー
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleCopyHtml}
              aria-label="レンダリングされたHTMLをクリップボードにコピー"
              disabled={!previewHtml}
            >
              HTMLをコピー
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleInsertSample}
              aria-label="サンプルMarkdownを挿入"
            >
              サンプルを挿入
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と出力をクリア"
            >
              クリア
            </Button>
          </div>
        </div>

        <div className="markdown-preview-layout">
          <div className="markdown-preview-input">
            <label htmlFor="markdownInput" className="section-title">
              Markdown入力
            </label>
            <Textarea
              id="markdownInput"
              ref={inputRef}
              value={markdownInput}
              onChange={(e) => setMarkdownInput(e.target.value)}
              placeholder="ここにMarkdownを入力してください...&#10;&#10;# 見出し&#10;**太字** や *斜体* も使えます"
              aria-label="Markdown入力エリア"
              aria-describedby="markdown-input-help"
              className="markdown-preview-textarea"
            />
            <span id="markdown-input-help" className="sr-only">
              Markdownを入力すると右側にリアルタイムプレビューが表示されます
            </span>
          </div>

          <div className="markdown-preview-output">
            <p className="section-title" aria-hidden="true">
              プレビュー
            </p>
            <div
              role="region"
              aria-label="Markdownプレビュー表示エリア"
              aria-live="polite"
              className="markdown-preview-content"
            >
              {previewHtml ? (
                <div className="markdown-preview-inner">{parse(previewHtml, parseOptions)}</div>
              ) : (
                <p className="markdown-preview-placeholder">
                  左側のエリアにMarkdownを入力するとプレビューが表示されます
                </p>
              )}
            </div>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "左側のエリアにMarkdownを入力すると、右側にリアルタイムプレビューが表示されます",
                "「サンプルを挿入」ボタンでサンプルMarkdownを挿入できます",
                "「Markdownをコピー」ボタンで入力テキストをコピーできます",
                "「HTMLをコピー」ボタンでレンダリング済みHTMLをコピーできます",
                "キーボードショートカット: Ctrl+Enter でMarkdownをコピー",
              ],
            },
            {
              title: "対応構文",
              items: [
                "見出し: # H1, ## H2, ### H3",
                "リスト: - 箇条書き、1. 番号付きリスト",
                "コードブロック: ```言語名 でシンタックスハイライト",
                "テーブル: | 列1 | 列2 | の形式で作成",
                "引用: > 引用テキスト",
                "太字: **テキスト**、斜体: *テキスト*",
                "リンク: [テキスト](URL)",
                "水平線: ---",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
