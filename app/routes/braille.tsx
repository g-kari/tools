import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { textToBraille } from "../utils/braille";
import "../styles/tools/braille.css";

export const Route = createFileRoute("/braille")({
  head: () => ({
    meta: [
      { title: "点字（Braille）変換 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストをGrade 1 点字（Braille）のUnicode文字に変換するツール。英字・数字・記号に対応。大文字インジケーター・数字インジケーター付き出力。",
      },
      {
        property: "og:title",
        content: "点字（Braille）変換 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "テキストをGrade 1 点字（Braille）Unicode文字に変換するツール。英字・数字・記号対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/braille` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "点字（Braille）変換 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "テキストをGrade 1 点字（Braille）Unicode文字に変換するツール。",
      },
    ],
  }),
  component: BrailleConverter,
});

/**
 * 点字（Braille）変換コンポーネント
 * テキスト→Grade 1 UEB 点字 Unicode のリアルタイム変換を提供する
 */
function BrailleConverter() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");

  const brailleOutput = useMemo(() => textToBraille(inputText), [inputText]);

  const hasUnknownChars = useMemo(
    () => brailleOutput.includes("?"),
    [brailleOutput]
  );

  const handleCopy = useCallback(async () => {
    if (!brailleOutput) return;
    const ok = await copy(brailleOutput);
    if (ok) {
      showToast("点字テキストをコピーしました", "success");
      announceStatus("点字テキストをクリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [brailleOutput, copy, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const isEmpty = inputText.length === 0;

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="braille-input-heading">
          <h2 id="braille-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="braille-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Hello World"
            rows={4}
            aria-label="点字に変換するテキスト"
            aria-describedby="braille-input-hint"
          />
          <p id="braille-input-hint" className="braille-hint">
            英字・数字・基本記号に対応。入力すると自動的に点字Unicode文字に変換されます。
          </p>
        </section>

        <section aria-labelledby="braille-output-heading">
          <h2 id="braille-output-heading" className="section-title">
            点字（Braille）出力
          </h2>
          <div
            id="braille-output"
            className={`braille-output${isEmpty ? " braille-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`点字出力: ${brailleOutput || "（変換結果なし）"}`}
            role="region"
          >
            {isEmpty ? "変換結果がここに表示されます" : brailleOutput}
          </div>

          {hasUnknownChars && (
            <p className="braille-warning" role="alert">
              変換できない文字が含まれています（日本語・特殊記号など）。「?」は変換できなかった文字を示します。
            </p>
          )}
        </section>

        <div className="braille-actions" role="group" aria-label="操作">
          <Button
            type="button"
            variant="default"
            onClick={handleCopy}
            disabled={isEmpty}
            aria-label="点字テキストをクリップボードにコピー"
          >
            コピー
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isEmpty}
            aria-label="入力をクリア"
          >
            クリア
          </Button>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "入力欄にテキストを入力すると、リアルタイムで点字Unicode文字に変換されます",
                "「コピー」ボタンで変換結果をクリップボードにコピーできます",
                "点字フォント（BrailleおよびNoto Sansなど）をインストールすると正しく表示されます",
              ],
            },
            {
              title: "対応文字",
              items: [
                "英字: A〜Z（大文字・小文字どちらでも可）",
                "数字: 0〜9（自動で数字インジケーター ⠼ を付加）",
                "大文字: 大文字インジケーター ⠠ を自動付加",
                "基本記号: スペース・カンマ・ピリオド・感嘆符・疑問符など",
              ],
            },
            {
              title: "Grade 1 点字（UEB）について",
              items: [
                "Grade 1（無契約点字）は文字をそのまま点字に置き換える基本形式です",
                "Grade 2（契約点字）は略語を使う高度な形式ですが、このツールはGrade 1に対応しています",
                "点字は6つのドット（点）の組み合わせで64種類の文字を表現します",
                "数字1〜9はアルファベットA〜Iと同じドットパターンを使用します（数字インジケーターで区別）",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
