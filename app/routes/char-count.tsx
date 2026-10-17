import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useGraphemeCount } from "../hooks/useGraphemeCount";

export const Route = createFileRoute("/char-count")({
  head: () => ({
    meta: [
      { title: "文字数カウント | Web ツール集" },
      {
        name: "description",
        content: "テキストの文字数・単語数・行数・バイト数をリアルタイムでカウントするツール。",
      },
      { property: "og:title", content: "文字数カウント | Web ツール集" },
      {
        property: "og:description",
        content: "テキストの文字数・単語数・行数・バイト数をリアルタイムでカウントするツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/char-count` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "文字数カウント | Web ツール集" },
      {
        name: "twitter:description",
        content: "テキストの文字数・単語数・行数・バイト数をリアルタイムでカウントするツール。",
      },
    ],
  }),
  component: CharCountPage,
});

/**
 * テキストのコードポイント数をカウントする
 * @param text - カウント対象のテキスト
 * @returns 文字数（スペース含む）
 */
export function countChars(text: string): number {
  return Array.from(text).length;
}

/**
 * テキストのコードポイント数をカウントする（空白・タブ・改行を除く）
 * @param text - カウント対象のテキスト
 * @returns 文字数（スペース除く）
 */
export function countCharsWithoutSpaces(text: string): number {
  return Array.from(text.replace(/\s/g, "")).length;
}

/**
 * テキストのバイト数をカウントする（UTF-8）
 * @param text - カウント対象のテキスト
 * @returns バイト数
 */
export function countBytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * テキストの行数をカウントする
 * @param text - カウント対象のテキスト
 * @returns 行数
 */
export function countLines(text: string): number {
  if (text === "") return 0;
  return text.split(/\r\n|\r|\n/).length;
}

/**
 * テキストの単語数をカウントする
 * @param text - カウント対象のテキスト
 * @returns 単語数
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  // 空白区切りでカウント。日本語の形態素解析は行わない。
  const words = trimmed.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * テキストの段落数をカウントする
 * @param text - カウント対象のテキスト
 * @returns 段落数
 */
export function countParagraphs(text: string): number {
  if (text.trim() === "") return 0;
  // 空行で区切られた段落をカウント
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return paragraphs.length;
}

function CharCountPage() {
  const [text, setText] = useState("");

  const handleClear = useCallback(() => {
    setText("");
  }, []);

  const chars = countChars(text);
  const graphemes = useGraphemeCount(text);
  const charsWithoutSpaces = countCharsWithoutSpaces(text);
  const bytes = countBytes(text);
  const lines = countLines(text);
  const words = countWords(text);
  const paragraphs = countParagraphs(text);

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">テキスト入力</h2>
          <Textarea
            className="input-area"
            placeholder="文字数をカウントしたいテキストを入力してください..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="カウント対象のテキスト"
            rows={10}
          />
          <div className="button-group" role="group" aria-label="テキスト操作">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={text.length === 0}
            >
              クリア
            </Button>
          </div>
        </div>

        <div className="converter-section">
          <h2 className="section-title">カウント結果</h2>
          <div className="count-results" role="region" aria-label="カウント結果" aria-live="polite">
            <div className="count-item">
              <span className="count-label">文字のまとまり（書記素）</span>
              <span className="count-value" data-testid="grapheme-count">
                {graphemes === undefined
                  ? "確認中"
                  : graphemes === null
                    ? "未対応"
                    : graphemes.toLocaleString()}
              </span>
            </div>
            <div className="count-item">
              <span className="count-label">文字数（コードポイント）</span>
              <span className="count-value" data-testid="char-count">
                {chars.toLocaleString()}
              </span>
            </div>
            <div className="count-item">
              <span className="count-label">コードポイント（空白除く）</span>
              <span className="count-value" data-testid="char-count-no-space">
                {charsWithoutSpaces.toLocaleString()}
              </span>
            </div>
            <div className="count-item">
              <span className="count-label">バイト数（UTF-8）</span>
              <span className="count-value" data-testid="byte-count">
                {bytes.toLocaleString()}
              </span>
            </div>
            <div className="count-item">
              <span className="count-label">行数</span>
              <span className="count-value" data-testid="line-count">
                {lines.toLocaleString()}
              </span>
            </div>
            <div className="count-item">
              <span className="count-label">単語数</span>
              <span className="count-value" data-testid="word-count">
                {words.toLocaleString()}
              </span>
            </div>
            <div className="count-item">
              <span className="count-label">段落数</span>
              <span className="count-value" data-testid="paragraph-count">
                {paragraphs.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "文字数カウントとは",
              items: [
                "テキストの文字数、バイト数、行数などをリアルタイムでカウントします",
                "書記素は、家族の絵文字や結合文字などを1まとまりとして数えます。表示上の字形や投稿サービスの文字制限とは異なる場合があります",
                "書記素数は空白・改行を含み、CRLFは1まとまりです。ブラウザーのIntl.Segmenterが使えない場合は「未対応」と表示します",
                "コードポイント数は従来の文字数です。例えば👨‍👩‍👧‍👦は書記素1・コードポイント7になります",
                "空白除く値は空白・タブ・改行を除きます。単語数は空白区切りで、日本語の形態素解析は行いません",
                "バイト数はUTF-8エンコーディングで計算されます",
              ],
            },
            {
              title: "使い方",
              items: [
                "テキストエリアに文字列を入力すると、自動的にカウントされます",
                "「クリア」ボタンで入力内容をリセットできます",
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
