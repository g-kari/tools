import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { convertKana, type KanaConvertMode } from "~/utils/kana";

export const Route = createFileRoute("/kana-convert")({
  head: () => ({
    meta: [
      { title: "ひらがな・カタカナ・ローマ字変換 | Web ツール集" },
      {
        name: "description",
        content:
          "ひらがな・カタカナ・ローマ字を相互変換するツール。ヘボン式ローマ字対応。日本語テキスト処理・学習に。",
      },
      {
        property: "og:title",
        content: "ひらがな・カタカナ・ローマ字変換 | Web ツール集",
      },
      {
        property: "og:description",
        content: "ひらがな・カタカナ・ローマ字を相互変換するツール。ヘボン式ローマ字対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/kana-convert` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ひらがな・カタカナ・ローマ字変換 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "ひらがな・カタカナ・ローマ字の相互変換ツール。",
      },
    ],
  }),
  component: KanaConverter,
});

const MODES: { value: KanaConvertMode; label: string; desc: string }[] = [
  {
    value: "hiraganaToKatakana",
    label: "ひらがな → カタカナ",
    desc: "ひらがなをカタカナに変換",
  },
  {
    value: "katakanaToHiragana",
    label: "カタカナ → ひらがな",
    desc: "カタカナをひらがなに変換",
  },
  {
    value: "kanaToRomaji",
    label: "仮名 → ローマ字",
    desc: "ひらがな・カタカナをヘボン式ローマ字に変換",
  },
  {
    value: "romajiToHiragana",
    label: "ローマ字 → ひらがな",
    desc: "ローマ字をひらがなに変換",
  },
  {
    value: "romajiToKatakana",
    label: "ローマ字 → カタカナ",
    desc: "ローマ字をカタカナに変換",
  },
];

function KanaConverter() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<KanaConvertMode>("hiraganaToKatakana");

  const doConvert = useCallback((text: string, currentMode: KanaConvertMode) => {
    if (!text) return "";
    return convertKana(text, currentMode);
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      setOutput(doConvert(value, mode));
    },
    [mode, doConvert],
  );

  const handleModeChange = useCallback(
    (newMode: KanaConvertMode) => {
      setMode(newMode);
      setOutput(doConvert(input, newMode));
    },
    [input, doConvert],
  );

  const handleSwap = useCallback(() => {
    setInput(output);
    setOutput(doConvert(output, mode));
    announceStatus("入出力を入れ替えました");
  }, [output, mode, doConvert, announceStatus]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    announceStatus("クリアしました");
  }, [announceStatus]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const success = await copy(output);
    if (success) {
      announceStatus("変換結果をコピーしました");
      showToast("コピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [output, copy, announceStatus, showToast]);

  const selectedMode = MODES.find((m) => m.value === mode)!;

  return (
    <>
      <div className="tool-container">
        {/* 変換モード選択 */}
        <div className="converter-section">
          <h2 className="section-title">変換モード</h2>
          <div className="kana-mode-group" role="radiogroup" aria-label="変換モード選択">
            {MODES.map((m) => (
              <label key={m.value} className="kana-mode-option">
                <input
                  type="radio"
                  name="kana-mode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => handleModeChange(m.value)}
                />
                <span className="kana-mode-label">{m.label}</span>
                <span className="kana-mode-desc">{m.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 入力 */}
        <div className="converter-section">
          <label htmlFor="kana-input" className="kana-textarea-label">
            入力テキスト
          </label>
          <textarea
            id="kana-input"
            className="kana-textarea"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={
              mode === "romajiToHiragana" || mode === "romajiToKatakana"
                ? "ローマ字を入力... 例: nihongo, tokyo, sushi"
                : "テキストを入力... 例: にほんご、東京、すし"
            }
            rows={5}
            spellCheck={false}
            aria-label={`${selectedMode.label} の入力テキスト`}
          />
        </div>

        {/* ボタン */}
        <div className="button-group" role="group" aria-label="操作">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSwap}
            disabled={!output}
            title="変換結果を入力欄に移す"
          >
            ⇄ 入れ替え
          </button>
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            disabled={!input && !output}
          >
            クリア
          </button>
        </div>

        {/* 出力 */}
        {output !== "" && (
          <div className="converter-section">
            <div className="kana-output-header">
              <label htmlFor="kana-output" className="kana-textarea-label">
                変換結果
              </label>
              <button
                type="button"
                className="btn-secondary kana-copy-btn"
                onClick={handleCopy}
                aria-label="変換結果をクリップボードにコピー"
              >
                コピー
              </button>
            </div>
            <textarea
              id="kana-output"
              className="kana-textarea"
              value={output}
              readOnly
              rows={5}
              aria-label="変換結果"
              aria-live="polite"
            />
          </div>
        )}
      </div>

      <TipsCard
        sections={[
          {
            title: "対応する変換",
            items: [
              "ひらがな ⇔ カタカナ: Unicode のオフセットを利用した高速変換",
              "仮名 → ローマ字: ヘボン式ローマ字（パスポートや国際標準に準拠）",
              "ローマ字 → 仮名: ヘボン式・訓令式混在対応、最長一致アルゴリズムで精度向上",
              "促音（っ/ッ）は後続子音の重複で表現（例: kitte → きって）",
            ],
          },
          {
            title: "ヘボン式ローマ字の主な規則",
            items: [
              "し = shi、ち = chi、つ = tsu（訓令式とは異なる）",
              "じゃ・じゅ・じょ = ja / ju / jo",
              "ん は n（母音・y の前では n' と表記）",
              "促音（っ）は後続子音を重ねて表現（例: っか → kka）",
            ],
          },
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
