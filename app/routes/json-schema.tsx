import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { generateJsonSchema, getSampleJson } from "../utils/json-schema";

export const Route = createFileRoute("/json-schema")({
  head: () => ({
    meta: [
      { title: "JSONスキーマ生成 | Web ツール集" },
      {
        name: "description",
        content:
          "JSONデータからJSON Schema (draft-07) を自動生成できるオンラインツール。",
      },
      { property: "og:title", content: "JSONスキーマ生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "JSONデータからJSON Schema (draft-07) を自動生成できるオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-schema` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "JSONスキーマ生成 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "JSONデータからJSON Schema (draft-07) を自動生成できるオンラインツール。",
      },
    ],
  }),
  component: JsonSchemaGenerator,
});

/**
 * JSONスキーマジェネレーターのメインコンポーネント
 * JSONデータを入力としてJSON Schema (draft-07) を生成する
 */
function JsonSchemaGenerator() {
  const { showToast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleGenerate = useCallback(() => {
    setError(null);
    setOutputText("");

    try {
      const schema = generateJsonSchema(jsonText);
      setOutputText(schema);
      announceStatus("スキーマを生成しました");
      showToast("スキーマを生成しました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [jsonText, announceStatus, showToast]);

  const handleLoadSample = useCallback(() => {
    setJsonText(getSampleJson());
    setOutputText("");
    setError(null);
    announceStatus("サンプルJSONを読み込みました");
    showToast("サンプルJSONを読み込みました", "success");
  }, [announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setJsonText("");
    setOutputText("");
    setError(null);
    announceStatus("入力と結果をクリアしました");
    jsonRef.current?.focus();
  }, [announceStatus]);

  const handleCopySchema = useCallback(async () => {
    if (!outputText) {
      showToast("コピーするスキーマがありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      announceStatus("スキーマをクリップボードにコピーしました");
      showToast("スキーマをコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, announceStatus, showToast]);

  // Ctrl+Enter でスキーマ生成
  useKeyboardShortcut("Enter", handleGenerate, { ctrl: true });

  useEffect(() => {
    jsonRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="JSONスキーマ生成フォーム"
        >
          <div className="json-schema-layout">
            {/* 左パネル: JSON入力 */}
            <div className="json-schema-panel">
              <span className="json-schema-panel-label">JSON入力</span>
              <textarea
                ref={jsonRef}
                id="jsonInput"
                className="json-schema-textarea"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={'JSONを入力してください...\n例: {"name": "Alice", "age": 30}'}
                aria-label="JSON入力欄"
                aria-describedby="json-schema-input-help"
                spellCheck={false}
              />
              <span id="json-schema-input-help" className="sr-only">
                JSONスキーマを生成したいJSONデータを入力してください
              </span>

              <div className="json-schema-actions">
                <button
                  type="button"
                  className="json-schema-btn"
                  onClick={handleLoadSample}
                  aria-label="サンプルJSONを読み込む"
                >
                  サンプル読込
                </button>
                <button
                  type="button"
                  className="json-schema-btn"
                  onClick={handleClear}
                  aria-label="入力と結果をクリアする"
                >
                  クリア
                </button>
                <button
                  type="button"
                  className="json-schema-btn json-schema-btn--primary"
                  onClick={handleGenerate}
                  aria-label="JSONスキーマを生成する"
                >
                  スキーマ生成
                </button>
              </div>
            </div>

            {/* 右パネル: スキーマ出力 */}
            <div className="json-schema-panel">
              <span className="json-schema-panel-label">生成されたスキーマ</span>
              <div
                className="json-schema-result-area"
                role="region"
                aria-label="生成されたJSONスキーマ"
                aria-live="polite"
              >
                {outputText ? (
                  outputText
                ) : (
                  <span className="json-schema-result-empty">
                    {error
                      ? "エラーが発生しました"
                      : "JSONを入力して「スキーマ生成」ボタンを押してください（Ctrl+Enter）"}
                  </span>
                )}
              </div>

              <div className="json-schema-actions">
                <button
                  type="button"
                  className="json-schema-btn"
                  onClick={handleCopySchema}
                  disabled={!outputText}
                  aria-label="生成されたスキーマをクリップボードにコピーする"
                >
                  スキーマをコピー
                </button>
              </div>
            </div>
          </div>

          <ErrorMessage message={error} />
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「JSON入力」欄にJSONデータを入力します",
                "「サンプル読込」ボタンでサンプルデータを読み込めます",
                "「スキーマ生成」ボタンまたはCtrl+EnterでJSON Schemaを生成します",
                "生成されたスキーマは「スキーマをコピー」ボタンでコピーできます",
              ],
            },
            {
              title: "JSONスキーマについて",
              items: [
                "JSON Schema draft-07 形式でスキーマを生成します",
                "オブジェクトのすべてのプロパティは required として扱われます",
                "additionalProperties は false に設定されます",
                "整数値は integer、小数値は number として区別されます",
                "混在型の配列は oneOf を使ったスキーマになります",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
