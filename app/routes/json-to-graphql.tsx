import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { generateGraphQLSchema, getSampleJson } from "../utils/json-to-graphql";

export const Route = createFileRoute("/json-to-graphql")({
  head: () => ({
    meta: [
      { title: "JSON→GraphQLスキーマ生成 | Web ツール集" },
      {
        name: "description",
        content: "JSONデータからGraphQLスキーマ（SDL形式）を自動生成できるオンラインツール。",
      },
      {
        property: "og:title",
        content: "JSON→GraphQLスキーマ生成 | Web ツール集",
      },
      {
        property: "og:description",
        content: "JSONデータからGraphQLスキーマ（SDL形式）を自動生成できるオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-to-graphql` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "JSON→GraphQLスキーマ生成 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "JSONデータからGraphQLスキーマ（SDL形式）を自動生成できるオンラインツール。",
      },
    ],
  }),
  component: JsonToGraphQLConverter,
});

/**
 * JSON→GraphQLスキーマ生成のメインコンポーネント
 * JSONデータを入力としてGraphQLスキーマ（SDL形式）を生成する
 */
function JsonToGraphQLConverter() {
  const { showToast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rootTypeName, setRootTypeName] = useState("Root");
  const [nonNull, setNonNull] = useState(true);
  const [useInterface, setUseInterface] = useState(false);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleGenerate = useCallback(() => {
    setError(null);
    setOutputText("");

    try {
      const result = generateGraphQLSchema(jsonText, {
        rootTypeName: rootTypeName || "Root",
        nonNull,
        useInterface,
      });
      setOutputText(result);
      announceStatus("スキーマを生成しました");
      showToast("スキーマを生成しました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [jsonText, rootTypeName, nonNull, useInterface, announceStatus, showToast]);

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

  const handleCopyOutput = useCallback(async () => {
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

  // Ctrl+Enter でスキーマ生成実行
  useKeyboardShortcut("Enter", handleGenerate, { ctrl: true });

  useEffect(() => {
    jsonRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="JSON→GraphQLスキーマ生成フォーム">
          <div className="jts-layout">
            {/* 左パネル: JSON入力 */}
            <div className="jts-panel">
              <span className="jts-panel-label">JSON入力</span>
              <textarea
                ref={jsonRef}
                id="jsonInput"
                className="jts-textarea"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={'JSONを入力してください...\n例: {"name": "Alice", "age": 30}'}
                aria-label="JSON入力欄"
                aria-describedby="jtg-input-help"
                spellCheck={false}
              />
              <span id="jtg-input-help" className="sr-only">
                GraphQLスキーマを生成したいJSONデータを入力してください
              </span>

              {/* オプション設定 */}
              <div className="jts-options" role="group" aria-label="スキーマ生成オプション">
                <div className="jts-options-row">
                  <label className="jts-option-label" htmlFor="jtg-root-type-name">
                    ルート型名:
                  </label>
                  <input
                    id="jtg-root-type-name"
                    type="text"
                    className="jts-root-name-input"
                    value={rootTypeName}
                    onChange={(e) => setRootTypeName(e.target.value)}
                    aria-label="ルート型名"
                  />
                </div>
                <div className="jts-options-row">
                  <label className="jts-option-label">
                    <input
                      type="checkbox"
                      checked={nonNull}
                      onChange={(e) => setNonNull(e.target.checked)}
                    />
                    Non-Null (!) を付与する
                  </label>
                  <label className="jts-option-label">
                    <input
                      type="checkbox"
                      checked={useInterface}
                      onChange={(e) => setUseInterface(e.target.checked)}
                    />
                    interface を使用する
                  </label>
                </div>
              </div>

              <div className="jts-actions">
                <button
                  type="button"
                  className="jts-btn"
                  onClick={handleLoadSample}
                  aria-label="サンプルJSONを読み込む"
                >
                  サンプル読込
                </button>
                <button
                  type="button"
                  className="jts-btn"
                  onClick={handleClear}
                  aria-label="入力と結果をクリアする"
                >
                  クリア
                </button>
                <button
                  type="button"
                  className="jts-btn jts-btn--primary"
                  onClick={handleGenerate}
                  aria-label="GraphQLスキーマを生成する"
                >
                  スキーマ生成
                </button>
              </div>
            </div>

            {/* 右パネル: GraphQLスキーマ出力 */}
            <div className="jts-panel">
              <span className="jts-panel-label">生成されたGraphQLスキーマ</span>
              <div
                className="jts-result-area"
                role="region"
                aria-label="生成されたGraphQLスキーマ"
                aria-live="polite"
              >
                {outputText ? (
                  outputText
                ) : (
                  <span className="jts-result-empty">
                    {error
                      ? "エラーが発生しました"
                      : "JSONを入力して「スキーマ生成」ボタンを押してください（Ctrl+Enter）"}
                  </span>
                )}
              </div>

              <div className="jts-actions">
                <button
                  type="button"
                  className="jts-btn"
                  onClick={handleCopyOutput}
                  disabled={!outputText}
                  aria-label="生成されたGraphQLスキーマをクリップボードにコピーする"
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
                "「スキーマ生成」ボタンまたはCtrl+EnterでGraphQLスキーマを生成します",
                "生成されたスキーマは「スキーマをコピー」ボタンでコピーできます",
              ],
            },
            {
              title: "オプション",
              items: [
                "ルート型名: 生成されるルート型の名前を変更できます（デフォルト: Root）",
                "Non-Null (!): null以外のフィールドに ! を付与して非null型にします",
                "interface: type の代わりに interface キーワードを使用します",
              ],
            },
            {
              title: "型変換ルール",
              items: [
                "string → String",
                "number (整数) → Int",
                "number (小数) → Float",
                "boolean → Boolean",
                "null → String（nullable）",
                "配列 → [ElementType]",
                "オブジェクト → ネストされた名前付き type",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
