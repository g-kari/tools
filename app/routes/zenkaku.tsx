import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  convertText,
  analyzeText,
  DEFAULT_OPTIONS,
  type ZenkakuOptions,
  type ConversionDirection,
} from "~/utils/zenkaku";

export const Route = createFileRoute("/zenkaku")({
  head: () => ({
    meta: [
      { title: "全角/半角変換 | Web ツール集" },
      {
        name: "description",
        content:
          "全角と半角の相互変換ツール。英数字・記号・カタカナ・スペースを選択して変換。日本語テキスト処理・フォームデータのクリーニングに便利。",
      },
      {
        property: "og:title",
        content: "全角/半角変換 | Web ツール集",
      },
      {
        property: "og:description",
        content: "全角と半角の相互変換ツール。英数字・記号・カタカナ・スペースを選択して変換。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/zenkaku` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "全角/半角変換 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "全角と半角の相互変換ツール。英数字・記号・カタカナ対応。",
      },
    ],
  }),
  component: ZenkakuConverter,
});

function ZenkakuConverter() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [direction, setDirection] = useState<ConversionDirection>("toHankaku");
  const [options, setOptions] = useState<ZenkakuOptions>(DEFAULT_OPTIONS);

  const handleConvert = useCallback(() => {
    if (!input) {
      setOutput("");
      return;
    }
    const result = convertText(input, direction, options);
    setOutput(result);
    announceStatus("変換が完了しました");
  }, [input, direction, options, announceStatus]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      if (value) {
        const result = convertText(value, direction, options);
        setOutput(result);
      } else {
        setOutput("");
      }
    },
    [direction, options],
  );

  const handleDirectionChange = useCallback(
    (newDirection: ConversionDirection) => {
      setDirection(newDirection);
      if (input) {
        const result = convertText(input, newDirection, options);
        setOutput(result);
      }
    },
    [input, options],
  );

  const handleOptionChange = useCallback(
    (key: keyof ZenkakuOptions, value: boolean) => {
      const newOptions = { ...options, [key]: value };
      setOptions(newOptions);
      if (input) {
        const result = convertText(input, direction, newOptions);
        setOutput(result);
      }
    },
    [input, direction, options],
  );

  const handleSwap = useCallback(() => {
    setInput(output);
    const newDirection: ConversionDirection = direction === "toHankaku" ? "toZenkaku" : "toHankaku";
    setDirection(newDirection);
    if (output) {
      const result = convertText(output, newDirection, options);
      setOutput(result);
    } else {
      setOutput("");
    }
    announceStatus("入出力を入れ替えました");
  }, [input, output, direction, options, announceStatus]);

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

  const stats = input ? analyzeText(input) : null;
  const outputStats = output ? analyzeText(output) : null;

  const OPTION_LABELS: { key: keyof ZenkakuOptions; label: string; description: string }[] = [
    { key: "alphanumeric", label: "英数字", description: "A–Z・a–z・0–9" },
    { key: "symbols", label: "記号", description: "!、@、#、$ などの記号" },
    { key: "katakana", label: "カタカナ", description: "ア–ン（濁点・半濁点対応）" },
    { key: "space", label: "スペース", description: "半角スペース ⇔ 全角スペース" },
  ];

  return (
    <>
      <div className="tool-container">
        {/* 変換方向 */}
        <div className="converter-section">
          <h2 className="section-title">変換方向</h2>
          <div className="zenkaku-direction-group" role="radiogroup" aria-label="変換方向">
            <label className="zenkaku-direction-option">
              <input
                type="radio"
                name="direction"
                value="toHankaku"
                checked={direction === "toHankaku"}
                onChange={() => handleDirectionChange("toHankaku")}
              />
              <span className="zenkaku-direction-label">全角 → 半角</span>
              <span className="zenkaku-direction-desc">全角文字を半角に変換</span>
            </label>
            <label className="zenkaku-direction-option">
              <input
                type="radio"
                name="direction"
                value="toZenkaku"
                checked={direction === "toZenkaku"}
                onChange={() => handleDirectionChange("toZenkaku")}
              />
              <span className="zenkaku-direction-label">半角 → 全角</span>
              <span className="zenkaku-direction-desc">半角文字を全角に変換</span>
            </label>
          </div>
        </div>

        {/* 変換対象オプション */}
        <div className="converter-section">
          <h2 className="section-title">変換対象</h2>
          <div className="zenkaku-options" role="group" aria-label="変換対象の選択">
            {OPTION_LABELS.map(({ key, label, description }) => (
              <label key={key} className="zenkaku-option-item">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(e) => handleOptionChange(key, e.target.checked)}
                  aria-describedby={`opt-desc-${key}`}
                />
                <span className="zenkaku-option-label">{label}</span>
                <span id={`opt-desc-${key}`} className="zenkaku-option-desc">
                  {description}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 入力 */}
        <div className="converter-section">
          <div className="zenkaku-io-header">
            <label htmlFor="zenkaku-input">
              入力テキスト
              {stats && <span className="zenkaku-char-info">（{stats.total} 文字）</span>}
            </label>
          </div>
          <textarea
            id="zenkaku-input"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={
              direction === "toHankaku"
                ? "全角テキストを入力... 例：Ａｂｃ　１２３　ｱｲｳ"
                : "半角テキストを入力... 例：Abc 123 ｱｲｳ"
            }
            rows={6}
            spellCheck={false}
            aria-label="変換する入力テキスト"
          />
        </div>

        {/* ボタン */}
        <div className="button-group" role="group" aria-label="操作">
          <button type="button" className="btn-primary" onClick={handleConvert} disabled={!input}>
            変換
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSwap}
            disabled={!output}
            title="入出力を入れ替えて逆方向に変換"
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
            <div className="zenkaku-io-header">
              <label htmlFor="zenkaku-output">
                変換結果
                {outputStats && (
                  <span className="zenkaku-char-info">（{outputStats.total} 文字）</span>
                )}
              </label>
              <button
                type="button"
                className="btn-secondary zenkaku-copy-btn"
                onClick={handleCopy}
                aria-label="変換結果をクリップボードにコピー"
              >
                コピー
              </button>
            </div>
            <textarea
              id="zenkaku-output"
              value={output}
              readOnly
              rows={6}
              aria-label="変換結果"
              aria-live="polite"
            />
          </div>
        )}
      </div>

      <TipsCard
        sections={[
          {
            title: "全角/半角とは",
            items: [
              "全角（Zenkaku）文字は半角の2倍の幅を持つ文字です。日本語フォントでの表示幅が統一されます",
              "半角（Hankaku）は ASCII 範囲の通常の文字幅です（英数字、記号など）",
              "全角英数字（Ａ–Ｚ、０–９）はフォームデータや CSV に混入することがあり、システム処理前に正規化が必要です",
              "全角カタカナ（ア–ン）と半角カタカナ（ｱ–ﾝ）は同じ音を表しますが、文字コードが異なります",
            ],
          },
          {
            title: "よくある使用例",
            items: [
              "フォーム入力データの正規化: ユーザーが全角で入力した英数字を半角に統一",
              "CSVデータのクリーニング: 全角スペースや全角数字を半角に変換",
              "レガシーシステム連携: Shift_JIS 系システムとの互換性確保",
              "カタカナ正規化: 半角カタカナを全角カタカナに統一して検索・比較を容易にする",
            ],
          },
          {
            title: "濁点・半濁点の扱い",
            items: [
              "半角 → 全角変換では、ｶﾞ（カ＋濁点）のような2文字の組み合わせをガ（1文字）に合成します",
              "全角 → 半角変換では、ガ（1文字）をｶﾞ（カ＋濁点の2文字）に分解します",
              "ヴ（ヴ）は半角変換でｳﾞ（ウ＋濁点）の2文字になります",
            ],
          },
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
