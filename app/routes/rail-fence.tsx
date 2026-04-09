import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { encodeRailFence, decodeRailFence, visualizeRailFence } from "../utils/rail-fence";
import "../styles/tools/rail-fence.css";

export const Route = createFileRoute("/rail-fence")({
  head: () => ({
    meta: [
      { title: "Rail Fence暗号（柵暗号） | Web ツール集" },
      {
        name: "description",
        content:
          "Rail Fence暗号（柵暗号）のエンコード・デコードツール。テキストをジグザグパターンで複数のレールに配置して暗号化。レール数を自由に設定でき、ジグザグパターンの可視化にも対応。",
      },
      {
        property: "og:title",
        content: "Rail Fence暗号（柵暗号） | Web ツール集",
      },
      {
        property: "og:description",
        content: "Rail Fence暗号のエンコード・デコードツール。ジグザグパターンの可視化に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/rail-fence` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Rail Fence暗号（柵暗号） | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "Rail Fence暗号のエンコード・デコードツール。ジグザグパターンの可視化に対応。",
      },
    ],
  }),
  component: RailFenceCipher,
});

type Mode = "encode" | "decode";

/**
 * Rail Fence暗号（柵暗号）ツールコンポーネント
 * テキストのRail Fence暗号エンコード・デコードとジグザグ可視化を提供する
 */
function RailFenceCipher() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [rails, setRails] = useState(3);
  const [mode, setMode] = useState<Mode>("encode");
  const [showViz, setShowViz] = useState(false);

  const output = useMemo(() => {
    if (!inputText) return "";
    if (mode === "encode") return encodeRailFence(inputText, rails);
    return decodeRailFence(inputText, rails);
  }, [inputText, rails, mode]);

  const vizLines = useMemo(() => {
    if (!showViz || !inputText) return [];
    const source = mode === "encode" ? inputText : output;
    if (!source) return [];
    return visualizeRailFence(source, rails);
  }, [showViz, inputText, output, mode, rails]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const ok = await copy(output);
    if (ok) {
      showToast("変換結果をコピーしました", "success");
      announceStatus("変換結果をクリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [output, copy, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const handleRailsChange = useCallback((value: number) => {
    const clamped = Math.max(2, Math.min(10, value));
    setRails(clamped);
  }, []);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      announceStatus(
        newMode === "encode"
          ? "エンコードモードに切り替えました"
          : "デコードモードに切り替えました",
      );
    },
    [announceStatus],
  );

  const handleToggleViz = useCallback(() => {
    setShowViz((prev) => {
      const next = !prev;
      announceStatus(next ? "ジグザグ可視化を表示しました" : "ジグザグ可視化を非表示にしました");
      return next;
    });
  }, [announceStatus]);

  const isEmpty = inputText.length === 0;

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="rail-fence-mode-heading">
          <h2 id="rail-fence-mode-heading" className="section-title">
            モード選択
          </h2>
          <div className="rail-fence-mode-group" role="group" aria-label="変換モード">
            <Button
              type="button"
              variant={mode === "encode" ? "default" : "outline"}
              onClick={() => handleModeChange("encode")}
              aria-pressed={mode === "encode"}
            >
              エンコード
            </Button>
            <Button
              type="button"
              variant={mode === "decode" ? "default" : "outline"}
              onClick={() => handleModeChange("decode")}
              aria-pressed={mode === "decode"}
            >
              デコード
            </Button>
          </div>
        </section>

        <section aria-labelledby="rail-fence-rails-heading">
          <h2 id="rail-fence-rails-heading" className="section-title">
            レール数
          </h2>
          <div className="rail-fence-rails-row">
            <span className="rail-fence-rails-label" aria-hidden="true">
              2
            </span>
            <input
              type="range"
              className="rail-fence-rails-slider"
              min={2}
              max={10}
              value={rails}
              onChange={(e) => handleRailsChange(Number(e.target.value))}
              aria-label={`レール数: ${rails}`}
              aria-valuemin={2}
              aria-valuemax={10}
              aria-valuenow={rails}
            />
            <span className="rail-fence-rails-label" aria-hidden="true">
              10
            </span>
            <input
              type="number"
              className="rail-fence-rails-number"
              min={2}
              max={10}
              value={rails}
              onChange={(e) => handleRailsChange(Number(e.target.value))}
              aria-label="レール数（数値入力）"
            />
          </div>
        </section>

        <section aria-labelledby="rail-fence-input-heading">
          <h2 id="rail-fence-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="rail-fence-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={mode === "encode" ? "暗号化するテキストを入力" : "復号する暗号文を入力"}
            rows={4}
            aria-label="Rail Fence暗号の入力テキスト"
          />
        </section>

        <section aria-labelledby="rail-fence-output-heading">
          <h2 id="rail-fence-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="rail-fence-output"
            className={`rail-fence-output${isEmpty ? " rail-fence-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || "（変換結果なし）"}`}
            role="region"
          >
            {isEmpty ? "変換結果がここに表示されます" : output}
          </div>

          <div className="rail-fence-actions" role="group" aria-label="操作">
            <Button
              type="button"
              variant="default"
              onClick={handleCopy}
              disabled={isEmpty}
              aria-label="変換結果をクリップボードにコピー"
            >
              コピー
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleToggleViz}
              disabled={isEmpty}
              aria-label={showViz ? "ジグザグ可視化を非表示" : "ジグザグ可視化を表示"}
            >
              {showViz ? "可視化を非表示" : "ジグザグ可視化"}
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
        </section>

        {showViz && vizLines.length > 0 && (
          <section aria-labelledby="rail-fence-viz-heading">
            <h2 id="rail-fence-viz-heading" className="section-title">
              ジグザグパターン可視化
            </h2>
            <div className="rail-fence-viz" role="region" aria-label="Rail Fenceジグザグパターン">
              {vizLines.map((line, i) => (
                <div key={i} className="rail-fence-viz-row">
                  <span className="rail-fence-viz-rail-label" aria-label={`レール${i + 1}`}>
                    Rail {i + 1}:
                  </span>
                  {line.split("").map((char, j) =>
                    char !== "·" ? (
                      <span key={j} className="rail-fence-viz-char" aria-label={char}>
                        {char}
                      </span>
                    ) : (
                      <span key={j} className="rail-fence-viz-dot" aria-hidden="true">
                        ·
                      </span>
                    ),
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "エンコード: テキストをジグザグパターンで配置し、レール順に読み取って暗号化します",
                "デコード: 同じレール数を指定して元のテキストに戻します",
                "ジグザグ可視化: 暗号化のパターンをビジュアルで確認できます",
                "レール数: 2〜10の範囲で自由に設定できます",
              ],
            },
            {
              title: "Rail Fence暗号について",
              items: [
                "転置式暗号の一種で、文字の順番を入れ替えることで暗号化します",
                "英字・数字・記号・日本語など全ての文字に対応しています",
                "レール数2の場合は偶数文字と奇数文字を入れ替えるシンプルな変換になります",
                "セキュリティ強度は低く、CTFやパズル・なぞなぞなどの用途に適しています",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
