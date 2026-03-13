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
import {
  evaluateJsonPath,
  formatJson,
  formatResults,
  getSampleJson,
} from "../utils/json-path";

export const Route = createFileRoute("/json-path")({
  head: () => ({
    meta: [
      { title: "JSONPath評価 | Web ツール集" },
      {
        name: "description",
        content:
          "JSONデータにJSONPathクエリを適用して値を抽出・評価できるオンラインツール。",
      },
      { property: "og:title", content: "JSONPath評価 | Web ツール集" },
      {
        property: "og:description",
        content:
          "JSONデータにJSONPathクエリを適用して値を抽出・評価できるオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-path` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "JSONPath評価 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "JSONデータにJSONPathクエリを適用して値を抽出・評価できるオンラインツール。",
      },
    ],
  }),
  component: JsonPathEvaluator,
});

/** よく使われるJSONPathの例 */
const EXAMPLE_PATHS = [
  "$.store.book[*].title",
  "$..author",
  "$.store.bicycle.color",
  "$..book[?(@.price<10)].title",
];

/**
 * JSONPath評価ツールのメインコンポーネント
 * JSONデータにJSONPathクエリを適用して値を抽出・評価する
 */
function JsonPathEvaluator() {
  const { showToast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [pathQuery, setPathQuery] = useState("");
  const [results, setResults] = useState<unknown[] | null>(null);
  const [resultText, setResultText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleEvaluate = useCallback(() => {
    setError(null);
    setResults(null);
    setResultText("");

    try {
      const found = evaluateJsonPath(jsonText, pathQuery);
      setResults(found);
      setResultText(formatResults(found));
      const msg =
        found.length === 0
          ? "一致する値がありません"
          : `${found.length}件の結果が見つかりました`;
      announceStatus(msg);
      showToast(msg, found.length === 0 ? "error" : "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [jsonText, pathQuery, announceStatus, showToast]);

  const handleLoadSample = useCallback(() => {
    setJsonText(getSampleJson());
    setPathQuery("$.store.book[*].title");
    setResults(null);
    setResultText("");
    setError(null);
    announceStatus("サンプルJSONを読み込みました");
    showToast("サンプルJSONを読み込みました", "success");
  }, [announceStatus, showToast]);

  const handleFormatJson = useCallback(() => {
    if (!jsonText.trim()) {
      showToast("JSONを入力してください", "error");
      jsonRef.current?.focus();
      return;
    }
    try {
      const formatted = formatJson(jsonText);
      setJsonText(formatted);
      announceStatus("JSONを整形しました");
      showToast("JSONを整形しました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "無効なJSON形式です";
      setError(message);
      showToast(message, "error");
    }
  }, [jsonText, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setJsonText("");
    setPathQuery("");
    setResults(null);
    setResultText("");
    setError(null);
    announceStatus("入力と結果をクリアしました");
    jsonRef.current?.focus();
  }, [announceStatus]);

  const handleCopyResult = useCallback(async () => {
    if (!resultText) {
      showToast("コピーする結果がありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(resultText);
      announceStatus("結果をクリップボードにコピーしました");
      showToast("結果をコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [resultText, announceStatus, showToast]);

  const handleChipClick = useCallback(
    (example: string) => {
      setPathQuery(example);
      announceStatus(`JSONPath式を設定しました: ${example}`);
    },
    [announceStatus]
  );

  // Ctrl+Enter で評価
  useKeyboardShortcut("Enter", handleEvaluate, { ctrl: true });

  useEffect(() => {
    jsonRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="JSONPath評価フォーム"
        >
          <div className="json-path-layout">
            {/* 左パネル: JSON入力 */}
            <div className="json-path-panel">
              <span className="json-path-panel-label">JSON入力</span>
              <textarea
                ref={jsonRef}
                id="jsonInput"
                className="json-path-textarea"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={'JSONを入力してください...\n例: {"name": "Alice", "age": 30}'}
                aria-label="JSON入力欄"
                aria-describedby="json-input-help"
                spellCheck={false}
              />
              <span id="json-input-help" className="sr-only">
                JSONPath式を評価したいJSONデータを入力してください
              </span>

              <div className="json-path-actions">
                <button
                  type="button"
                  className="json-path-btn"
                  onClick={handleLoadSample}
                  aria-label="サンプルJSONを読み込む"
                >
                  サンプル読込
                </button>
                <button
                  type="button"
                  className="json-path-btn"
                  onClick={handleFormatJson}
                  aria-label="JSONを整形する"
                >
                  JSON整形
                </button>
                <button
                  type="button"
                  className="json-path-btn"
                  onClick={handleClear}
                  aria-label="入力と結果をクリアする"
                >
                  クリア
                </button>
              </div>

              <label htmlFor="pathQuery" className="json-path-panel-label">
                JSONPath式
              </label>
              <div className="json-path-query-section">
                <input
                  type="text"
                  id="pathQuery"
                  className="json-path-query-input"
                  value={pathQuery}
                  onChange={(e) => setPathQuery(e.target.value)}
                  placeholder="例: $.store.book[*].title"
                  aria-label="JSONPath式入力欄"
                  aria-describedby="path-query-help"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="json-path-btn json-path-btn--primary"
                  onClick={handleEvaluate}
                  aria-label="JSONPath式を評価する"
                >
                  評価
                </button>
              </div>
              <span id="path-query-help" className="sr-only">
                JSONPath式を入力してください。例: $.store.book[*].title
              </span>

              <div className="json-path-examples">
                <span className="json-path-panel-label">クイック例</span>
                <div className="json-path-example-chips" role="group" aria-label="JSONPathクイック例">
                  {EXAMPLE_PATHS.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="json-path-chip"
                      onClick={() => handleChipClick(example)}
                      aria-label={`JSONPath式を「${example}」に設定する`}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 右パネル: 結果表示 */}
            <div className="json-path-panel">
              <span className="json-path-panel-label">評価結果</span>
              <div
                className="json-path-result-area"
                role="region"
                aria-label="JSONPath評価結果"
                aria-live="polite"
              >
                {resultText ? (
                  <>
                    {results !== null && (
                      <div className="json-path-result-count">
                        {results.length === 0
                          ? "0件の結果"
                          : `${results.length}件の結果`}
                      </div>
                    )}
                    {resultText}
                  </>
                ) : (
                  <span className="json-path-result-empty">
                    {error
                      ? "エラーが発生しました"
                      : "JSONとJSONPath式を入力して「評価」ボタンを押してください"}
                  </span>
                )}
              </div>

              <div className="json-path-actions">
                <button
                  type="button"
                  className="json-path-btn"
                  onClick={handleCopyResult}
                  disabled={!resultText}
                  aria-label="評価結果をクリップボードにコピーする"
                >
                  結果をコピー
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
                "「JSONPath式」欄にJSONPath式を入力します",
                "「評価」ボタンまたはCtrl+Enterで評価を実行します",
                "クイック例のボタンで典型的なパターンを試せます",
                "結果は右パネルに表示され、コピーできます",
              ],
            },
            {
              title: "JSONPath式の例",
              items: [
                "$.store.book[*].title - 全書籍のタイトルを取得",
                "$..author - 全著者を再帰的に取得",
                "$.store.bicycle.color - 特定のネストされた値を取得",
                "$..book[?(@.price<10)].title - 価格でフィルタリング",
                "$[0] - 配列の最初の要素を取得",
                "$.* - ルートオブジェクトの全プロパティを取得",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
