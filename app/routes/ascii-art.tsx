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
  generateAsciiArt,
  getAvailableFonts,
  isConvertible,
  type AsciiFont,
} from "~/utils/ascii-art";

export const Route = createFileRoute("/ascii-art")({
  head: () => ({
    meta: [
      { title: "ASCIIアート生成 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストをASCIIアートに変換するツール。Standard、Block、Banner、Dots、Thinの5種類のフォントに対応。",
      },
      {
        property: "og:title",
        content: "ASCIIアート生成 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "テキストをASCIIアートに変換するツール。複数フォントスタイル対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/ascii-art` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: AsciiArtGenerator,
});

const MAX_TEXT_LENGTH = 20;

/**
 * ASCIIアートジェネレーターページコンポーネント
 */
function AsciiArtGenerator() {
  const { copy } = useClipboard();
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [selectedFont, setSelectedFont] = useState<AsciiFont>("standard");

  const fonts = useMemo(() => getAvailableFonts(), []);

  const result = useMemo(
    () => generateAsciiArt(inputText, selectedFont),
    [inputText, selectedFont]
  );

  const hasInput = inputText.trim().length > 0;
  const isOverLimit = inputText.length > MAX_TEXT_LENGTH;
  const canConvert = hasInput && isConvertible(inputText);

  const handleCopy = useCallback(async () => {
    if (!result.text) return;
    const success = await copy(result.text);
    if (success) {
      showToast("ASCIIアートをコピーしました", "success");
      announceStatus("ASCIIアートをコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [result.text, copy, showToast, announceStatus]);

  useKeyboardShortcut("Enter", handleCopy, {
    ctrl: true,
    disabled: !canConvert,
  });

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <label htmlFor="ascii-input" className="section-title">
            変換するテキスト
          </label>
          <input
            id="ascii-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="例: HELLO"
            maxLength={MAX_TEXT_LENGTH}
            aria-describedby="ascii-input-hint"
          />
          <p
            id="ascii-input-hint"
            className={`aa-char-limit-hint ${isOverLimit ? "aa-char-limit-warning" : ""}`}
          >
            {inputText.length}/{MAX_TEXT_LENGTH} 文字（英数字・記号対応、最大{MAX_TEXT_LENGTH}文字）
          </p>
        </div>

        <div className="aa-controls-grid">
          <div className="aa-control-group">
            <label htmlFor="aa-font-select" className="aa-control-label">
              フォントスタイル
            </label>
            <select
              id="aa-font-select"
              className="aa-font-select"
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value as AsciiFont)}
              aria-label="ASCIIアートのフォントスタイルを選択"
            >
              {fonts.map((font) => (
                <option key={font.key} value={font.key} title={font.description}>
                  {font.label} — {font.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {canConvert ? (
          <div
            className="aa-result-wrapper"
            aria-label="ASCIIアート変換結果"
            aria-live="polite"
          >
            <div className="aa-result-header">
              <span className="aa-result-label">結果</span>
            </div>
            <pre
              className="aa-result-pre"
              aria-label="ASCIIアート出力"
            >
              {result.text}
            </pre>
            <div className="aa-action-row">
              <span className="aa-char-info" aria-live="off">
                {result.lineCount} 行 / {result.charCount} 文字
              </span>
              <button
                className="aa-copy-btn"
                onClick={handleCopy}
                disabled={!result.text}
                aria-label="ASCIIアートをクリップボードにコピー（Ctrl+Enter）"
              >
                コピー (Ctrl+Enter)
              </button>
            </div>
          </div>
        ) : (
          <div className="aa-empty-state" aria-live="polite">
            <p>テキストを入力すると、ASCIIアートが表示されます</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "ASCIIアートとは",
              items: [
                "ASCIIアートとは、文字や記号を組み合わせて絵や文字を表現するアート形式です",
                "READMEファイルのタイトル装飾、ターミナルの起動メッセージ（MOTD）、コードのコメントなどに使われます",
                "1970〜80年代のコンピューター文化から生まれた伝統的な表現方法です",
              ],
            },
            {
              title: "使い方",
              items: [
                "英数字・記号（A-Z, 0-9, !, ?, ., -, _）を入力するとASCIIアートに変換されます",
                "日本語・ひらがな・カタカナは対応していません（英字で入力してください）",
                `最大${MAX_TEXT_LENGTH}文字まで入力できます`,
                "5種類のフォントスタイルから選択できます",
                "コピーボタンまたはCtrl+Enterでクリップボードにコピーできます",
              ],
            },
            {
              title: "フォントスタイル",
              items: [
                "Standard: クラシックなfiglet風スタイル（_, |, /, \\）",
                "Block: ブロック文字（█, ▄, ▀）を使った太いスタイル",
                "Banner: #文字で塗りつぶした7行バナースタイル",
                "Dots: アスタリスクとドットで作られたシンプルなスタイル",
                "Thin: 細い線で描かれた繊細なスタイル",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
