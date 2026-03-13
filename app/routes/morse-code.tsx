import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { textToMorse, morseToText, isMorseCode } from "../utils/morse-code";

export const Route = createFileRoute("/morse-code")({
  head: () => ({
    meta: [
      { title: "Morse Code変換 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストとモールス符号（Morse Code）を相互変換するツール。アルファベット・数字・記号に対応",
      },
      {
        property: "og:title",
        content: "Morse Code変換 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "テキストとモールス符号（Morse Code）を相互変換するツール。アルファベット・数字・記号に対応",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/morse-code` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: MorseCodeConverter,
});

/** 変換モードの型定義 */
type ConversionMode = "text-to-morse" | "morse-to-text";

/**
 * Morse Code変換コンポーネント
 * テキスト⇔Morse Codeのリアルタイム相互変換を提供する
 */
function MorseCodeConverter() {
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<ConversionMode>("text-to-morse");
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();
  const { showToast } = useToast();

  /** リアルタイム変換結果 */
  const outputText = useMemo(() => {
    if (!inputText.trim()) return "";
    if (mode === "text-to-morse") {
      return textToMorse(inputText);
    } else {
      return morseToText(inputText);
    }
  }, [inputText, mode]);

  /** 変換できない文字が含まれているかチェック */
  const hasUnknownChars = useMemo(() => {
    return outputText.includes("?");
  }, [outputText]);

  /** morse-to-textモード時に有効なMorse Codeでないかチェック */
  const isInvalidMorseInput = useMemo(() => {
    if (mode !== "morse-to-text") return false;
    if (!inputText.trim()) return false;
    return !isMorseCode(inputText);
  }, [inputText, mode]);

  const handleCopy = async () => {
    if (!outputText) return;
    const success = await copy(outputText);
    if (success) {
      showToast("変換結果をコピーしました", "success");
      announceStatus("変換結果をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  };

  const handleClear = () => {
    setInputText("");
    announceStatus("入力内容をクリアしました");
  };

  const handleModeChange = (newMode: ConversionMode) => {
    setMode(newMode);
    setInputText("");
    announceStatus(
      newMode === "text-to-morse"
        ? "テキスト→Morse Codeモードに切り替えました"
        : "Morse Code→テキストモードに切り替えました"
    );
  };

  const inputLabel =
    mode === "text-to-morse" ? "変換するテキスト" : "変換するMorse Code";
  const inputPlaceholder =
    mode === "text-to-morse"
      ? "HELLO WORLD"
      : ".... . .-.. .-.. --- / .-- --- .-. .-.. -..";
  const outputLabel =
    mode === "text-to-morse" ? "Morse Code（変換結果）" : "テキスト（変換結果）";

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">Morse Code変換</h2>

        {/* モード切替ボタン */}
        <div
          className="morse-code-mode-buttons"
          role="group"
          aria-label="変換モード選択"
        >
          <Button
            variant={mode === "text-to-morse" ? "default" : "outline"}
            onClick={() => handleModeChange("text-to-morse")}
            aria-pressed={mode === "text-to-morse"}
          >
            テキスト → Morse Code
          </Button>
          <Button
            variant={mode === "morse-to-text" ? "default" : "outline"}
            onClick={() => handleModeChange("morse-to-text")}
            aria-pressed={mode === "morse-to-text"}
          >
            Morse Code → テキスト
          </Button>
        </div>

        {/* 入力エリア */}
        <div className="morse-code-input-area">
          <label htmlFor="morse-code-input" className="section-title">
            {inputLabel}
          </label>
          <Textarea
            id="morse-code-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={inputPlaceholder}
            rows={4}
            aria-describedby="morse-code-input-hint"
          />
          <p id="morse-code-input-hint" className="morse-code-hint">
            {mode === "text-to-morse"
              ? "入力するとMorse Codeに自動変換されます（大文字・小文字どちらでも可）"
              : "Morse Codeを入力するとテキストに自動変換されます（文字間はスペース、単語間は /）"}
          </p>
          {isInvalidMorseInput && (
            <p className="morse-code-warning" role="alert">
              入力がMorse Code形式（. - / およびスペース）ではないようです。Morse Codeは . （ドット）、- （ダッシュ）、/ （スラッシュ）、スペースのみで構成されます。
            </p>
          )}
        </div>

        {/* 出力エリア */}
        <div className="morse-code-output-area">
          <label htmlFor="morse-code-output" className="section-title">
            {outputLabel}
          </label>
          <Textarea
            id="morse-code-output"
            value={outputText}
            readOnly
            rows={4}
            placeholder="変換結果がここに表示されます"
            aria-live="polite"
            aria-label={`${outputLabel}: ${outputText || "（変換結果なし）"}`}
          />
          {hasUnknownChars && (
            <p className="morse-code-error" role="alert">
              変換できない文字が含まれています。「?」は変換できなかった文字を示します。
            </p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="morse-code-actions">
          <Button
            variant="default"
            onClick={handleCopy}
            disabled={!outputText}
            aria-label="変換結果をクリップボードにコピー"
          >
            コピー
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!inputText}
            aria-label="入力内容をクリア"
          >
            クリア
          </Button>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "モード切替ボタンで変換方向を選択します",
                "テキスト→Morse Code: 入力欄にテキストを入力するとMorse Codeに変換されます",
                "Morse Code→テキスト: Morse Codeを入力するとテキストに変換されます",
                "「コピー」ボタンで変換結果をクリップボードにコピーできます",
              ],
            },
            {
              title: "Morse Codeの記法",
              items: [
                "・（ドット）と－（ダッシュ）で各文字を表します",
                "文字と文字の間はスペース1つで区切ります",
                "単語と単語の間は / （スラッシュ）で区切ります",
                "例: HELLO WORLD → .... . .-.. .-.. --- / .-- --- .-. .-.. -...",
              ],
            },
            {
              title: "対応文字",
              items: [
                "アルファベット: A-Z（大文字・小文字どちらでも可）",
                "数字: 0-9",
                "基本記号: . , ? ! / ( ) & : ; = + - _ \" $ @",
                "スペース: 単語の区切りとして / に変換されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
