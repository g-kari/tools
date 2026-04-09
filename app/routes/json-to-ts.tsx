import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { generateTypeScript, getSampleJson } from "../utils/json-to-ts";

export const Route = createFileRoute("/json-to-ts")({
  head: () => ({
    meta: [
      { title: "JSON→TypeScript型変換 | Web ツール集" },
      {
        name: "description",
        content: "JSONデータからTypeScriptのinterface/type定義を自動生成できるオンラインツール。",
      },
      {
        property: "og:title",
        content: "JSON→TypeScript型変換 | Web ツール集",
      },
      {
        property: "og:description",
        content: "JSONデータからTypeScriptのinterface/type定義を自動生成できるオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-to-ts` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "JSON→TypeScript型変換 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "JSONデータからTypeScriptのinterface/type定義を自動生成できるオンラインツール。",
      },
    ],
  }),
  component: JsonToTsConverter,
});

/**
 * JSON→TypeScript型変換のメインコンポーネント
 * JSONデータを入力としてTypeScriptのinterface/type定義を生成する
 */
function JsonToTsConverter() {
  const { showToast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rootName, setRootName] = useState("Root");
  const [useInterface, setUseInterface] = useState(true);
  const [optional, setOptional] = useState(false);
  const [includeNull, setIncludeNull] = useState(true);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleGenerate = useCallback(() => {
    setError(null);
    setOutputText("");

    try {
      const result = generateTypeScript(jsonText, {
        rootName: rootName || "Root",
        useInterface,
        optional,
        includeNull,
      });
      setOutputText(result);
      announceStatus("型定義を生成しました");
      showToast("型定義を生成しました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [jsonText, rootName, useInterface, optional, includeNull, announceStatus, showToast]);

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
      showToast("コピーする型定義がありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      announceStatus("型定義をクリップボードにコピーしました");
      showToast("型定義をコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, announceStatus, showToast]);

  // Ctrl+Enter で型変換実行
  useKeyboardShortcut("Enter", handleGenerate, { ctrl: true });

  useEffect(() => {
    jsonRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="JSON→TypeScript型変換フォーム">
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
                aria-describedby="jts-input-help"
                spellCheck={false}
              />
              <span id="jts-input-help" className="sr-only">
                TypeScript型定義を生成したいJSONデータを入力してください
              </span>

              {/* オプション設定 */}
              <div className="jts-options" role="group" aria-label="型生成オプション">
                <div className="jts-options-row">
                  <label className="jts-option-label" htmlFor="jts-root-name">
                    ルート型名:
                  </label>
                  <input
                    id="jts-root-name"
                    type="text"
                    className="jts-root-name-input"
                    value={rootName}
                    onChange={(e) => setRootName(e.target.value)}
                    aria-label="ルート型名"
                  />
                </div>
                <div className="jts-options-row">
                  <label className="jts-option-label">
                    <input
                      type="radio"
                      name="typeStyle"
                      checked={useInterface}
                      onChange={() => setUseInterface(true)}
                    />
                    interface
                  </label>
                  <label className="jts-option-label">
                    <input
                      type="radio"
                      name="typeStyle"
                      checked={!useInterface}
                      onChange={() => setUseInterface(false)}
                    />
                    type
                  </label>
                </div>
                <div className="jts-options-row">
                  <label className="jts-option-label">
                    <input
                      type="checkbox"
                      checked={optional}
                      onChange={(e) => setOptional(e.target.checked)}
                    />
                    オプショナル（?）
                  </label>
                  <label className="jts-option-label">
                    <input
                      type="checkbox"
                      checked={includeNull}
                      onChange={(e) => setIncludeNull(e.target.checked)}
                    />
                    null型を含む
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
                  aria-label="TypeScript型定義を生成する"
                >
                  型変換
                </button>
              </div>
            </div>

            {/* 右パネル: TypeScript型定義出力 */}
            <div className="jts-panel">
              <span className="jts-panel-label">生成された型定義</span>
              <div
                className="jts-result-area"
                role="region"
                aria-label="生成されたTypeScript型定義"
                aria-live="polite"
              >
                {outputText ? (
                  outputText
                ) : (
                  <span className="jts-result-empty">
                    {error
                      ? "エラーが発生しました"
                      : "JSONを入力して「型変換」ボタンを押してください（Ctrl+Enter）"}
                  </span>
                )}
              </div>

              <div className="jts-actions">
                <button
                  type="button"
                  className="jts-btn"
                  onClick={handleCopyOutput}
                  disabled={!outputText}
                  aria-label="生成された型定義をクリップボードにコピーする"
                >
                  型定義をコピー
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
                "「型変換」ボタンまたはCtrl+EnterでTypeScript型定義を生成します",
                "生成された型定義は「型定義をコピー」ボタンでコピーできます",
              ],
            },
            {
              title: "オプション",
              items: [
                "ルート型名: 生成されるルート型の名前を変更できます（デフォルト: Root）",
                "interface/type: 型定義のスタイルを切り替えられます",
                "オプショナル: 全プロパティに ? を付与します",
                "null型を含む: null値のプロパティに null 型を生成します",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
