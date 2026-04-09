import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import {
  mergeJsonStrings,
  getSampleJsonPair,
  DEFAULT_MERGE_OPTIONS,
  type MergeOptions,
  type ArrayMergeStrategy,
} from "../utils/json-merge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

export const Route = createFileRoute("/json-merge")({
  head: () => ({
    meta: [
      { title: "JSONマージ | Web ツール集" },
      {
        name: "description",
        content:
          "複数のJSONオブジェクトをディープマージ・シャローマージできるオンラインツール。配列の結合戦略も選択可能。",
      },
      { property: "og:title", content: "JSONマージ | Web ツール集" },
      {
        property: "og:description",
        content:
          "複数のJSONオブジェクトをディープマージ・シャローマージできるオンラインツール。配列の結合戦略も選択可能。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-merge` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "JSONマージ | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "複数のJSONオブジェクトをディープマージ・シャローマージできるオンラインツール。配列の結合戦略も選択可能。",
      },
    ],
  }),
  component: JsonMerge,
});

function JsonMerge() {
  const [inputs, setInputs] = useState<string[]>(["", ""]);
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<MergeOptions>(DEFAULT_MERGE_OPTIONS);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleMerge = useCallback(() => {
    const nonEmpty = inputs.filter((s) => s.trim());
    if (nonEmpty.length < 2) {
      setError("2つ以上のJSONを入力してください");
      announceStatus("エラー: 2つ以上のJSONを入力してください");
      showToast("2つ以上のJSONを入力してください", "error");
      return;
    }
    setError(null);
    try {
      const result = mergeJsonStrings(nonEmpty, options);
      setOutputText(result);
      announceStatus("JSONのマージが完了しました");
      showToast("JSONをマージしました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "マージに失敗しました";
      setError(message);
      setOutputText("");
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [inputs, options, announceStatus, showToast]);

  const handleCopy = useCallback(() => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText).then(() => {
      showToast("クリップボードにコピーしました", "success");
      announceStatus("クリップボードにコピーしました");
    });
  }, [outputText, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setInputs(["", ""]);
    setOutputText("");
    setError(null);
    announceStatus("入力と出力をクリアしました");
    firstInputRef.current?.focus();
  }, [announceStatus]);

  const handleLoadSample = useCallback(() => {
    const [s1, s2] = getSampleJsonPair();
    setInputs([s1, s2]);
    setOutputText("");
    setError(null);
    announceStatus("サンプルデータを読み込みました");
    showToast("サンプルデータを読み込みました", "success");
  }, [announceStatus, showToast]);

  const addInput = useCallback(() => {
    setInputs((prev) => [...prev, ""]);
  }, []);

  const removeInput = useCallback((index: number) => {
    setInputs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateInput = useCallback((index: number, value: string) => {
    setInputs((prev) => prev.map((s, i) => (i === index ? value : s)));
  }, []);

  useKeyboardShortcut("Enter", handleMerge, { ctrl: true });

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="JSONマージフォーム">
          <div className="converter-section">
            <div className="section-title">マージオプション</div>
            <div className="json-merge-options">
              <div className="json-merge-option-group">
                <span>マージ方式:</span>
                <select
                  value={options.deep ? "deep" : "shallow"}
                  onChange={(e) => setOptions((o) => ({ ...o, deep: e.target.value === "deep" }))}
                  aria-label="マージ方式の選択"
                >
                  <option value="deep">ディープマージ</option>
                  <option value="shallow">シャローマージ</option>
                </select>
              </div>
              <div className="json-merge-option-group">
                <span>配列の扱い:</span>
                <select
                  value={options.arrayStrategy}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      arrayStrategy: e.target.value as ArrayMergeStrategy,
                    }))
                  }
                  aria-label="配列のマージ戦略の選択"
                  disabled={!options.deep}
                >
                  <option value="replace">上書き</option>
                  <option value="concat">結合</option>
                  <option value="unique">重複排除して結合</option>
                </select>
              </div>
            </div>
          </div>

          {inputs.map((value, index) => (
            <div key={index} className="converter-section">
              <div className="section-title-row">
                <label htmlFor={`json-input-${index}`} className="section-title">
                  JSON {index + 1}
                </label>
                {inputs.length > 2 && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeInput(index)}
                    aria-label={`JSON ${index + 1} を削除`}
                  >
                    削除
                  </button>
                )}
              </div>
              <Textarea
                id={`json-input-${index}`}
                ref={index === 0 ? firstInputRef : undefined}
                value={value}
                onChange={(e) => updateInput(index, e.target.value)}
                placeholder={`JSON ${index + 1} を入力してください...`}
                aria-label={`JSON ${index + 1} 入力欄`}
              />
            </div>
          ))}

          <div className="button-group" role="group" aria-label="JSON操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleMerge}
              aria-label="JSONをマージ（Ctrl+Enter）"
            >
              マージ
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={addInput}
              aria-label="JSON入力欄を追加"
            >
              + JSON追加
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-secondary"
              onClick={handleLoadSample}
              aria-label="サンプルデータを読み込む"
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

          <ErrorMessage message={error} />

          <div className="output-section">
            <div className="section-title-row">
              <label htmlFor="outputText" className="section-title">
                マージ結果
              </label>
              {outputText && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopy}
                  aria-label="結果をクリップボードにコピー"
                >
                  コピー
                </button>
              )}
            </div>
            <Textarea
              id="outputText"
              value={outputText}
              readOnly
              placeholder="マージ結果がここに表示されます..."
              aria-label="マージ結果の出力欄"
              aria-live="polite"
            />
          </div>
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "2つ以上のJSON入力欄にJSONオブジェクトを入力します",
                "「マージ」ボタンで左から右の順にマージします",
                "「+ JSON追加」で3つ以上のJSONをまとめてマージできます",
                "キーボードショートカット: Ctrl+Enter でマージ実行",
              ],
            },
            {
              title: "マージ方式",
              items: [
                "ディープマージ: ネストされたオブジェクトも再帰的にマージします",
                "シャローマージ: トップレベルのキーのみをマージします（Object.assignと同等）",
              ],
            },
            {
              title: "配列の扱い（ディープマージ時）",
              items: [
                "上書き: 右側の配列で置き換えます",
                "結合: 左右の配列を連結します",
                "重複排除して結合: 連結後に重複する要素を取り除きます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
