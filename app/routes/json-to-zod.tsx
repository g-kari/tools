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
import { generateZodSchema, getSampleJson } from "../utils/json-to-zod";

export const Route = createFileRoute("/json-to-zod")({
  head: () => ({
    meta: [
      { title: "JSON→Zodスキーマ生成 | Web ツール集" },
      {
        name: "description",
        content:
          "JSONデータからZodスキーマを自動生成できるオンラインツール。",
      },
      {
        property: "og:title",
        content: "JSON→Zodスキーマ生成 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "JSONデータからZodスキーマを自動生成できるオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-to-zod` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "JSON→Zodスキーマ生成 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "JSONデータからZodスキーマを自動生成できるオンラインツール。",
      },
    ],
  }),
  component: JsonToZodConverter,
});

/**
 * JSON→Zodスキーマ生成のメインコンポーネント
 * JSONデータを入力としてZodスキーマを生成する
 */
function JsonToZodConverter() {
  const { showToast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rootName, setRootName] = useState("schema");
  const [addImport, setAddImport] = useState(true);
  const [optional, setOptional] = useState(false);
  const [nullable, setNullable] = useState(false);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleGenerate = useCallback(() => {
    setError(null);
    setOutputText("");

    try {
      const result = generateZodSchema(jsonText, {
        rootName: rootName || "schema",
        addImport,
        optional,
        nullable,
      });
      setOutputText(result);
      announceStatus("スキーマを生成しました");
      showToast("スキーマを生成しました", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [jsonText, rootName, addImport, optional, nullable, announceStatus, showToast]);

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
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="JSON→Zodスキーマ生成フォーム"
        >
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
                aria-describedby="jtz-input-help"
                spellCheck={false}
              />
              <span id="jtz-input-help" className="sr-only">
                Zodスキーマを生成したいJSONデータを入力してください
              </span>

              {/* オプション設定 */}
              <div className="jts-options" role="group" aria-label="スキーマ生成オプション">
                <div className="jts-options-row">
                  <label className="jts-option-label" htmlFor="jtz-root-name">
                    ルート変数名:
                  </label>
                  <input
                    id="jtz-root-name"
                    type="text"
                    className="jts-root-name-input"
                    value={rootName}
                    onChange={(e) => setRootName(e.target.value)}
                    aria-label="ルート変数名"
                  />
                </div>
                <div className="jts-options-row">
                  <label className="jts-option-label">
                    <input
                      type="checkbox"
                      checked={addImport}
                      onChange={(e) => setAddImport(e.target.checked)}
                    />
                    import文を追加
                  </label>
                  <label className="jts-option-label">
                    <input
                      type="checkbox"
                      checked={optional}
                      onChange={(e) => setOptional(e.target.checked)}
                    />
                    プロパティをオプショナルにする
                  </label>
                  <label className="jts-option-label">
                    <input
                      type="checkbox"
                      checked={nullable}
                      onChange={(e) => setNullable(e.target.checked)}
                    />
                    nullをnullable()にする
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
                  aria-label="Zodスキーマを生成する"
                >
                  スキーマ生成
                </button>
              </div>
            </div>

            {/* 右パネル: Zodスキーマ出力 */}
            <div className="jts-panel">
              <span className="jts-panel-label">生成されたZodスキーマ</span>
              <div
                className="jts-result-area"
                role="region"
                aria-label="生成されたZodスキーマ"
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
                  aria-label="生成されたZodスキーマをクリップボードにコピーする"
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
                "「スキーマ生成」ボタンまたはCtrl+EnterでZodスキーマを生成します",
                "生成されたスキーマは「スキーマをコピー」ボタンでコピーできます",
              ],
            },
            {
              title: "オプション",
              items: [
                "ルート変数名: 生成されるルート変数の名前を変更できます（デフォルト: schema）",
                "import文を追加: import { z } from \"zod\"; を先頭に追加します",
                "プロパティをオプショナルにする: 全プロパティに .optional() を付与します",
                "nullをnullable()にする: null値のフィールドに .nullable() を適用します",
              ],
            },
            {
              title: "Zodスキーマ構文",
              items: [
                "z.string() - 文字列型",
                "z.number() - 数値型",
                "z.boolean() - 真偽値型",
                "z.null() - null型",
                "z.array(schema) - 配列型",
                "z.object({ ... }) - オブジェクト型",
                "schema.optional() - オプショナル（undefinedを許容）",
                "schema.nullable() - null許容",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
