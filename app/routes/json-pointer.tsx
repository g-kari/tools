import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import {
  evaluateJsonPointer,
  enumeratePointers,
  getSampleJson,
  EXAMPLE_POINTERS,
  type PointerEntry,
} from "../utils/json-pointer";

export const Route = createFileRoute("/json-pointer")({
  head: () => ({
    meta: [
      { title: "JSON Pointer評価 | Web ツール集" },
      {
        name: "description",
        content:
          "JSON Pointer (RFC 6901) を使ってJSONデータから値を抽出・評価できるオンラインツール。",
      },
      { property: "og:title", content: "JSON Pointer評価 | Web ツール集" },
      {
        property: "og:description",
        content:
          "JSON Pointer (RFC 6901) を使ってJSONデータから値を抽出・評価できるオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-pointer` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "JSON Pointer評価 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "JSON Pointer (RFC 6901) を使ってJSONデータから値を抽出・評価できるオンラインツール。",
      },
    ],
  }),
  component: JsonPointerEvaluator,
});

/**
 * JSON Pointer評価ツールのメインコンポーネント。
 * RFC 6901 に基づいたJSON Pointerを使ってJSONドキュメントから値を取り出す。
 */
function JsonPointerEvaluator() {
  const { showToast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [pointerInput, setPointerInput] = useState("");
  const [resultText, setResultText] = useState("");
  const [resultType, setResultType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pointerList, setPointerList] = useState<PointerEntry[]>([]);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  /** JSON Pointerを評価して結果を表示する */
  const handleEvaluate = useCallback(() => {
    setError(null);
    setResultText("");
    setResultType("");

    try {
      const result = evaluateJsonPointer(jsonText, pointerInput);
      setResultText(result.formatted);
      setResultType(result.type);
      const msg = `評価完了 (型: ${result.type})`;
      announceStatus(msg);
      showToast(msg, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [jsonText, pointerInput, announceStatus, showToast]);

  /** ドキュメント内のすべてのポインターを列挙する */
  const handleEnumerate = useCallback(() => {
    setError(null);
    setPointerList([]);

    try {
      const entries = enumeratePointers(jsonText);
      setPointerList(entries);
      const msg = `${entries.length}件のJSON Pointerを列挙しました`;
      announceStatus(msg);
      showToast(msg, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [jsonText, announceStatus, showToast]);

  /** サンプルJSONを読み込む */
  const handleLoadSample = useCallback(() => {
    setJsonText(getSampleJson());
    setPointerInput("/store/book/0/title");
    setResultText("");
    setResultType("");
    setError(null);
    setPointerList([]);
    announceStatus("サンプルJSONを読み込みました");
    showToast("サンプルJSONを読み込みました", "success");
  }, [announceStatus, showToast]);

  /** 入力・結果をすべてクリアする */
  const handleClear = useCallback(() => {
    setJsonText("");
    setPointerInput("");
    setResultText("");
    setResultType("");
    setError(null);
    setPointerList([]);
    announceStatus("入力と結果をクリアしました");
    jsonRef.current?.focus();
  }, [announceStatus]);

  /** 結果をクリップボードにコピーする */
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

  /** 列挙されたポインターをクリックして入力欄に設定する */
  const handlePointerSelect = useCallback(
    (pointer: string) => {
      const actual = pointer === '""' ? "" : pointer;
      setPointerInput(actual);
      announceStatus(`JSON Pointerを設定しました: ${actual || "(ルート)"}`);
    },
    [announceStatus],
  );

  // Ctrl+Enter で評価
  useKeyboardShortcut("Enter", handleEvaluate, { ctrl: true });

  useEffect(() => {
    jsonRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="JSON Pointer評価フォーム">
          <div className="json-pointer-layout">
            {/* 左パネル: JSON入力 */}
            <div className="json-pointer-panel">
              <span className="json-pointer-panel-label">JSON入力</span>
              <textarea
                ref={jsonRef}
                id="jsonInput"
                className="json-pointer-textarea"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={'JSONを入力してください...\n例: {"name": "Alice", "age": 30}'}
                aria-label="JSON入力欄"
                aria-describedby="json-input-help"
                spellCheck={false}
              />
              <span id="json-input-help" className="sr-only">
                JSON Pointerで値を取り出したいJSONデータを入力してください
              </span>

              <div className="json-pointer-actions">
                <button
                  type="button"
                  className="json-pointer-btn"
                  onClick={handleLoadSample}
                  aria-label="サンプルJSONを読み込む"
                >
                  サンプル読込
                </button>
                <button
                  type="button"
                  className="json-pointer-btn"
                  onClick={handleEnumerate}
                  aria-label="ドキュメント内のJSON Pointerを列挙する"
                >
                  Pointer列挙
                </button>
                <button
                  type="button"
                  className="json-pointer-btn"
                  onClick={handleClear}
                  aria-label="入力と結果をクリアする"
                >
                  クリア
                </button>
              </div>

              <label htmlFor="pointerInput" className="json-pointer-panel-label">
                JSON Pointer (RFC 6901)
              </label>
              <div className="json-pointer-query-section">
                <input
                  type="text"
                  id="pointerInput"
                  className="json-pointer-query-input"
                  value={pointerInput}
                  onChange={(e) => setPointerInput(e.target.value)}
                  placeholder="例: /store/book/0/title （ルートは空文字）"
                  aria-label="JSON Pointer入力欄"
                  aria-describedby="pointer-input-help"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="json-pointer-btn json-pointer-btn--primary"
                  onClick={handleEvaluate}
                  aria-label="JSON Pointerを評価する"
                >
                  評価
                </button>
              </div>
              <span id="pointer-input-help" className="sr-only">
                JSON Pointer式を入力してください。例: /store/book/0/title
              </span>

              <div className="json-pointer-examples">
                <span className="json-pointer-panel-label">クイック例</span>
                <div
                  className="json-pointer-example-chips"
                  role="group"
                  aria-label="JSON Pointerクイック例"
                >
                  {EXAMPLE_POINTERS.map((ex) => (
                    <button
                      key={ex.pointer}
                      type="button"
                      className="json-pointer-chip"
                      onClick={() => setPointerInput(ex.pointer)}
                      aria-label={`JSON Pointerを「${ex.pointer || "(ルート)"}」に設定する`}
                      title={ex.label}
                    >
                      {ex.pointer || '""'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 右パネル: 結果表示 */}
            <div className="json-pointer-panel">
              <span className="json-pointer-panel-label">評価結果</span>
              <div
                className="json-pointer-result-area"
                role="region"
                aria-label="JSON Pointer評価結果"
                aria-live="polite"
              >
                {resultText ? (
                  <>
                    <div className="json-pointer-result-type">型: {resultType}</div>
                    <pre className="json-pointer-result-pre">{resultText}</pre>
                  </>
                ) : (
                  <span className="json-pointer-result-empty">
                    {error
                      ? "エラーが発生しました"
                      : "JSONとJSON Pointerを入力して「評価」ボタンを押してください"}
                  </span>
                )}
              </div>

              <div className="json-pointer-actions">
                <button
                  type="button"
                  className="json-pointer-btn"
                  onClick={handleCopyResult}
                  disabled={!resultText}
                  aria-label="評価結果をクリップボードにコピーする"
                >
                  結果をコピー
                </button>
              </div>

              {pointerList.length > 0 && (
                <>
                  <span className="json-pointer-panel-label">
                    列挙されたPointer ({pointerList.length}件)
                  </span>
                  <div className="json-pointer-list" role="list" aria-label="JSON Pointerの一覧">
                    {pointerList.map((entry) => (
                      <button
                        key={entry.pointer}
                        type="button"
                        role="listitem"
                        className="json-pointer-list-item"
                        onClick={() => handlePointerSelect(entry.pointer)}
                        aria-label={`JSON Pointerを「${entry.pointer}」に設定する`}
                      >
                        <span className="json-pointer-list-path">{entry.pointer}</span>
                        <span className="json-pointer-list-type">{entry.type}</span>
                        <span className="json-pointer-list-value">{entry.value}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
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
                "「JSON Pointer」欄にポインター式を入力します（例: /store/book/0）",
                "「評価」ボタンまたはCtrl+Enterで評価を実行します",
                "「Pointer列挙」ボタンでドキュメント内のすべてのパスを表示できます",
                "列挙されたPointerをクリックすると入力欄に設定できます",
              ],
            },
            {
              title: "JSON Pointerの構文 (RFC 6901)",
              items: [
                '/foo/bar - オブジェクトキー "foo" → "bar" を辿る',
                "/array/0 - 配列の0番目の要素",
                '"" (空文字) - ルートドキュメント全体を参照',
                '~1 はスラッシュ "/" のエスケープ',
                '~0 はチルダ "~" のエスケープ',
                "JSONPath ($...) とは異なりシンプルな単一値の取得に特化",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
