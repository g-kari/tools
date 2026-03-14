import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  generateSlug,
  isValidSlug,
  DEFAULT_SLUG_OPTIONS,
  type SlugOptions,
} from "~/utils/slug";

export const Route = createFileRoute("/slug")({
  head: () => ({
    meta: [
      { title: "スラッグ生成ツール | Web ツール集" },
      {
        name: "description",
        content:
          "テキストをURLフレンドリーなスラッグに変換するツール。アクセント文字対応、区切り文字・大文字小文字・最大文字数の設定が可能。",
      },
      {
        property: "og:title",
        content: "スラッグ生成ツール | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "テキストをURLフレンドリーなスラッグに変換するツール。アクセント文字対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/slug` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: SlugGenerator,
});

/**
 * スラッグジェネレーターページコンポーネント
 */
function SlugGenerator() {
  const { copy } = useClipboard();
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [separator, setSeparator] = useState<SlugOptions["separator"]>(
    DEFAULT_SLUG_OPTIONS.separator
  );
  const [lowercase, setLowercase] = useState(DEFAULT_SLUG_OPTIONS.lowercase);
  const [maxLengthStr, setMaxLengthStr] = useState("");

  const options: SlugOptions = useMemo(
    () => ({
      separator,
      lowercase,
      maxLength: (() => {
        const parsed = parseInt(maxLengthStr, 10);
        return maxLengthStr && !isNaN(parsed) && parsed > 0 ? parsed : null;
      })(),
    }),
    [separator, lowercase, maxLengthStr]
  );

  const slugResult = useMemo(
    () => generateSlug(inputText, options),
    [inputText, options]
  );

  const isValid = useMemo(
    () => (slugResult ? isValidSlug(slugResult) : false),
    [slugResult]
  );

  const hasInput = inputText.trim().length > 0;

  const handleCopy = useCallback(async () => {
    if (!slugResult) return;
    const success = await copy(slugResult);
    if (success) {
      showToast("スラッグをコピーしました", "success");
      announceStatus("スラッグをコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [slugResult, copy, showToast, announceStatus]);

  useKeyboardShortcut("Enter", handleCopy, {
    ctrl: true,
    disabled: !slugResult,
  });

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <label htmlFor="slug-input" className="section-title">
            変換するテキスト
          </label>
          <textarea
            id="slug-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="例: Hello World, café au lait, My Blog Post Title"
            rows={3}
            aria-describedby="slug-input-hint"
          />
          <p id="slug-input-hint" className="slug-hint">
            入力するとURLフレンドリーなスラッグに自動変換されます
          </p>
        </div>

        <div className="slug-options-grid">
          <div className="slug-option-group">
            <span className="slug-option-label">区切り文字</span>
            <div
              className="slug-radio-group"
              role="radiogroup"
              aria-label="区切り文字の選択"
            >
              <label className="slug-radio-item">
                <input
                  type="radio"
                  name="separator"
                  value="hyphen"
                  checked={separator === "hyphen"}
                  onChange={() => setSeparator("hyphen")}
                />
                ハイフン（-）
              </label>
              <label className="slug-radio-item">
                <input
                  type="radio"
                  name="separator"
                  value="underscore"
                  checked={separator === "underscore"}
                  onChange={() => setSeparator("underscore")}
                />
                アンダースコア（_）
              </label>
            </div>
          </div>

          <div className="slug-option-group">
            <span className="slug-option-label">大文字小文字</span>
            <div
              className="slug-radio-group"
              role="radiogroup"
              aria-label="大文字小文字の設定"
            >
              <label className="slug-radio-item">
                <input
                  type="radio"
                  name="lowercase"
                  value="true"
                  checked={lowercase}
                  onChange={() => setLowercase(true)}
                />
                小文字に変換
              </label>
              <label className="slug-radio-item">
                <input
                  type="radio"
                  name="lowercase"
                  value="false"
                  checked={!lowercase}
                  onChange={() => setLowercase(false)}
                />
                大文字小文字を維持
              </label>
            </div>
          </div>

          <div className="slug-option-group">
            <label htmlFor="slug-maxlength" className="slug-option-label">
              最大文字数（空欄で無制限）
            </label>
            <input
              id="slug-maxlength"
              type="number"
              min="1"
              value={maxLengthStr}
              onChange={(e) => setMaxLengthStr(e.target.value)}
              placeholder="例: 50"
              className="slug-maxlength-input"
              aria-label="最大文字数（空欄で無制限）"
            />
          </div>
        </div>

        {hasInput ? (
          <div
            className="slug-result-wrapper"
            aria-label="変換結果"
            aria-live="polite"
          >
            <div className="slug-result-header">
              <span className="slug-result-label">スラッグ</span>
              <span
                className={`slug-validity-badge ${isValid ? "valid" : "invalid"}`}
                aria-label={
                  isValid ? "有効なスラッグ形式" : "無効なスラッグ形式"
                }
              >
                {isValid ? "有効" : "無効"}
              </span>
            </div>
            <code className="slug-result-code">
              {slugResult || "（変換結果なし）"}
            </code>
            <div className="slug-action-row">
              <span className="slug-char-count" aria-live="off">
                {slugResult.length} 文字
              </span>
              <button
                className="slug-copy-btn"
                onClick={handleCopy}
                disabled={!slugResult}
                aria-label="スラッグをクリップボードにコピー（Ctrl+Enter）"
              >
                コピー (Ctrl+Enter)
              </button>
            </div>
          </div>
        ) : (
          <div className="slug-empty-state" aria-live="polite">
            <p>テキストを入力すると、スラッグが表示されます</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "スラッグとは",
              items: [
                "スラッグ（slug）とはURLの一部として使用される、英数字とハイフン・アンダースコアで構成された文字列です",
                "例: https://example.com/blog/hello-world の「hello-world」の部分がスラッグです",
                "SEOやURLの可読性向上に重要な役割を担います",
              ],
            },
            {
              title: "使い方",
              items: [
                "変換したいテキストを入力すると自動的にスラッグに変換されます",
                "区切り文字はハイフン（-）またはアンダースコア（_）から選択できます",
                "アクセント付き文字（café → cafe、über → uber）は自動変換されます",
                "日本語・ひらがな・カタカナ・漢字は除去されます（ローマ字で別途入力してください）",
                "コピーボタンまたはCtrl+Enterでクリップボードにコピーできます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
