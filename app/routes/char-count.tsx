import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/char-count")({
  head: () => ({
    meta: [{ title: "文字数カウント" }],
  }),
  component: CharCountPage,
});

/**
 * テキストの文字数をカウントする
 * @param text - カウント対象のテキスト
 * @returns 文字数（スペース含む）
 */
export function countChars(text: string): number {
  return [...text].length;
}

/**
 * テキストの文字数をカウントする（スペース除く）
 * @param text - カウント対象のテキスト
 * @returns 文字数（スペース除く）
 */
export function countCharsWithoutSpaces(text: string): number {
  return [...text.replace(/\s/g, "")].length;
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
  // 英単語と日本語の文字をそれぞれカウント
  // 英単語はスペース区切り、日本語は1文字=1単語としてカウント
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
            <button
              type="button"
              className="btn-clear"
              onClick={handleClear}
              disabled={text.length === 0}
            >
              クリア
            </button>
          </div>
        </div>

        <div className="converter-section">
          <h2 className="section-title">カウント結果</h2>
          <div className="count-results" role="region" aria-live="polite">
            <div className="count-item">
              <span className="count-label">文字数</span>
              <span className="count-value" data-testid="char-count">
                {chars.toLocaleString()}
              </span>
            </div>
            <div className="count-item">
              <span className="count-label">文字数（空白除く）</span>
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

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">文字数カウントとは</h3>
          <ul>
            <li>テキストの文字数、バイト数、行数などをリアルタイムでカウントします</li>
            <li>日本語、英語、絵文字など、あらゆる文字に対応しています</li>
            <li>バイト数はUTF-8エンコーディングで計算されます</li>
          </ul>
          <h3>使い方</h3>
          <ul>
            <li>テキストエリアに文字列を入力すると、自動的にカウントされます</li>
            <li>「クリア」ボタンで入力内容をリセットできます</li>
          </ul>
        </aside>
      </div>

      <style>{`
        .count-results {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .count-item {
          display: flex;
          flex-direction: column;
          padding: 1rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 12px;
          text-align: center;
        }

        .count-label {
          font-size: 0.875rem;
          color: var(--md-sys-color-on-surface-variant);
          margin-bottom: 0.5rem;
        }

        .count-value {
          font-size: 1.5rem;
          font-weight: 500;
          font-family: 'Roboto Mono', monospace;
          color: var(--md-sys-color-primary);
        }

        @media (max-width: 480px) {
          .count-results {
            grid-template-columns: repeat(2, 1fr);
          }

          .count-value {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </>
  );
}
