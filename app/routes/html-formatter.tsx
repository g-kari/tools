import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { formatHTML, HTML_SAMPLE, type HtmlFormatOptions } from "~/utils/html-formatter";
import "../styles/tools/html-formatter.css";

export const Route = createFileRoute("/html-formatter")({
  head: () => ({
    meta: [
      { title: "HTML フォーマッター | Web ツール集" },
      {
        name: "description",
        content:
          "HTML を整形・美化するツール。インデント幅（2/4スペース・タブ）の選択、void 要素・インライン要素・script/style タグの適切な処理に対応。",
      },
      { property: "og:title", content: "HTML フォーマッター | Web ツール集" },
      {
        property: "og:description",
        content: "HTML を整形・美化。インデント幅選択、void・インライン要素の適切な処理に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/html-formatter` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "HTML フォーマッター | Web ツール集" },
      {
        name: "twitter:description",
        content: "HTML を整形・美化。インデント幅選択対応。",
      },
    ],
  }),
  component: HtmlFormatter,
});

/**
 * HTML フォーマッターコンポーネント
 */
function HtmlFormatter() {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [indentSize, setIndentSize] = useState<2 | 4>(2);
  const [useTabs, setUseTabs] = useState(false);
  const [stats, setStats] = useState<{ elementCount: number; tokenCount: number } | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  const handleFormat = useCallback(() => {
    if (!inputText.trim()) {
      announceStatus("エラー: HTML を入力してください");
      showToast("HTML を入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    const options: Partial<HtmlFormatOptions> = { indentSize, useTabs };
    const result = formatHTML(inputText, options);
    setOutputText(result.formatted);
    setStats({ elementCount: result.elementCount, tokenCount: result.tokenCount });
    announceStatus(`HTML の整形が完了しました（要素数: ${result.elementCount}）`);
  }, [inputText, indentSize, useTabs, announceStatus, showToast]);

  const handleSample = useCallback(() => {
    setInputText(HTML_SAMPLE);
    setOutputText("");
    setStats(null);
    announceStatus("サンプル HTML をセットしました");
  }, [announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    setStats(null);
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleCopy = useCallback(async () => {
    if (!outputText) return;
    const success = await copy(outputText);
    if (success) {
      setIsCopied(true);
      announceStatus("出力結果をコピーしました");
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    } else {
      announceStatus("コピーに失敗しました");
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, copy, announceStatus, showToast]);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="HTML フォーマットフォーム">
          {/* オプション */}
          <div className="converter-section">
            <div className="hf-options-row">
              <fieldset className="hf-option-fieldset">
                <legend className="section-title">インデント</legend>
                <div className="csv-json-mode-group" role="group">
                  <label className="format-option">
                    <input
                      type="radio"
                      name="indent"
                      checked={!useTabs && indentSize === 2}
                      onChange={() => {
                        setUseTabs(false);
                        setIndentSize(2);
                      }}
                      aria-label="2スペース"
                    />
                    <span className="format-label">2スペース</span>
                  </label>
                  <label className="format-option">
                    <input
                      type="radio"
                      name="indent"
                      checked={!useTabs && indentSize === 4}
                      onChange={() => {
                        setUseTabs(false);
                        setIndentSize(4);
                      }}
                      aria-label="4スペース"
                    />
                    <span className="format-label">4スペース</span>
                  </label>
                  <label className="format-option">
                    <input
                      type="radio"
                      name="indent"
                      checked={useTabs}
                      onChange={() => setUseTabs(true)}
                      aria-label="タブ"
                    />
                    <span className="format-label">タブ</span>
                  </label>
                </div>
              </fieldset>
            </div>
          </div>

          {/* 入力 */}
          <div className="converter-section">
            <label htmlFor="html-input" className="section-title">
              HTML 入力
            </label>
            <Textarea
              id="html-input"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="<!DOCTYPE html><html><head><title>...</title></head><body>...</body></html>"
              aria-label="整形対象の HTML テキスト"
              className="csv-json-textarea hf-input"
            />
          </div>

          {/* ボタン */}
          <div className="button-group" role="group" aria-label="操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleFormat}
              aria-label="HTML を整形"
            >
              整形
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSample}
              aria-label="サンプル HTML をセット"
            >
              サンプル
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

          {/* 統計 */}
          {stats && (
            <div className="hf-stats" aria-live="polite">
              <span className="hf-stat-item">
                <span className="hf-stat-label">要素数</span>
                <span className="hf-stat-value">{stats.elementCount}</span>
              </span>
              <span className="hf-stat-item">
                <span className="hf-stat-label">トークン数</span>
                <span className="hf-stat-value">{stats.tokenCount}</span>
              </span>
            </div>
          )}

          {/* 出力 */}
          <div className="output-section">
            <div className="csv-json-output-header">
              <label htmlFor="html-output" className="section-title">
                整形結果
              </label>
              <button
                type="button"
                className={`number-base-copy-btn${isCopied ? " copied" : ""}`}
                onClick={handleCopy}
                disabled={!outputText}
                aria-label="整形結果をクリップボードにコピー"
              >
                {isCopied ? "コピー済" : "コピー"}
              </button>
            </div>
            <Textarea
              id="html-output"
              value={outputText}
              readOnly
              placeholder="整形結果がここに表示されます..."
              aria-label="HTML 整形結果の出力欄"
              aria-live="polite"
              className="csv-json-textarea hf-output"
            />
          </div>
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "HTML を入力欄に貼り付けます（圧縮済みの HTML も可）",
                "インデントの種類を選択して「整形」ボタンを押します",
                "「サンプル」ボタンでサンプル HTML を入力できます",
                "整形結果は「コピー」ボタンでクリップボードにコピーできます",
              ],
            },
            {
              title: "対応している機能",
              items: [
                "DOCTYPE 宣言・HTML コメントの保持",
                "void 要素（br・hr・img・input など）の正しいハンドリング",
                "インライン要素（a・span・strong など）の改行なし処理",
                "script・style・pre・textarea タグの内容をそのまま保持",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
