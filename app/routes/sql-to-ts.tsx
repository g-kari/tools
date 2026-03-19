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
import { generateTypeScript, getSampleSql } from "../utils/sql-to-ts";

export const Route = createFileRoute("/sql-to-ts")({
  head: () => ({
    meta: [
      { title: "SQL→TypeScript型変換 | Web ツール集" },
      {
        name: "description",
        content:
          "SQL CREATE TABLE文からTypeScriptのinterface/type定義を自動生成できるオンラインツール。",
      },
      {
        property: "og:title",
        content: "SQL→TypeScript型変換 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "SQL CREATE TABLE文からTypeScriptのinterface/type定義を自動生成できるオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/sql-to-ts` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "SQL→TypeScript型変換 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "SQL CREATE TABLE文からTypeScriptのinterface/type定義を自動生成できるオンラインツール。",
      },
    ],
  }),
  component: SqlToTsConverter,
});

/**
 * SQL→TypeScript型変換のメインコンポーネント
 * SQL CREATE TABLE文を入力としてTypeScriptのinterface/type定義を生成する
 */
function SqlToTsConverter() {
  const { showToast } = useToast();
  const [sqlText, setSqlText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [useInterface, setUseInterface] = useState(true);
  const [nullableAsOptional, setNullableAsOptional] = useState(true);
  const [dateAsDate, setDateAsDate] = useState(false);
  const sqlRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleGenerate = useCallback(() => {
    setError(null);
    setOutputText("");

    try {
      const result = generateTypeScript(sqlText, {
        useInterface,
        nullableAsOptional,
        dateAsDate,
      });
      setOutputText(result);
      announceStatus("型定義を生成しました");
      showToast("型定義を生成しました", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [sqlText, useInterface, nullableAsOptional, dateAsDate, announceStatus, showToast]);

  const handleLoadSample = useCallback(() => {
    setSqlText(getSampleSql());
    setOutputText("");
    setError(null);
    announceStatus("サンプルSQLを読み込みました");
    showToast("サンプルSQLを読み込みました", "success");
  }, [announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setSqlText("");
    setOutputText("");
    setError(null);
    announceStatus("入力と結果をクリアしました");
    sqlRef.current?.focus();
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
    sqlRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="SQL→TypeScript型変換フォーム"
        >
          <div className="jts-layout">
            {/* 左パネル: SQL入力 */}
            <div className="jts-panel">
              <span className="jts-panel-label">SQL入力</span>
              <textarea
                ref={sqlRef}
                id="sqlInput"
                className="jts-textarea"
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
                placeholder={"SQL CREATE TABLE文を入力してください...\n例: CREATE TABLE users (\n  id INTEGER NOT NULL,\n  name VARCHAR(255) NOT NULL\n);"}
                aria-label="SQL入力欄"
                aria-describedby="stts-input-help"
                spellCheck={false}
              />
              <span id="stts-input-help" className="sr-only">
                TypeScript型定義を生成したいSQL CREATE TABLE文を入力してください
              </span>

              {/* オプション設定 */}
              <div className="jts-options" role="group" aria-label="型生成オプション">
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
                      checked={nullableAsOptional}
                      onChange={(e) => setNullableAsOptional(e.target.checked)}
                    />
                    NULLABLEをオプショナル（?）にする
                  </label>
                  <label className="jts-option-label">
                    <input
                      type="checkbox"
                      checked={dateAsDate}
                      onChange={(e) => setDateAsDate(e.target.checked)}
                    />
                    日付型をDateとして扱う
                  </label>
                </div>
              </div>

              <div className="jts-actions">
                <button
                  type="button"
                  className="jts-btn"
                  onClick={handleLoadSample}
                  aria-label="サンプルSQLを読み込む"
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
                      : "SQLを入力して「型変換」ボタンを押してください（Ctrl+Enter）"}
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
                "「SQL入力」欄にCREATE TABLE文を入力します",
                "「サンプル読込」ボタンでサンプルデータを読み込めます",
                "「型変換」ボタンまたはCtrl+EnterでTypeScript型定義を生成します",
                "生成された型定義は「型定義をコピー」ボタンでコピーできます",
              ],
            },
            {
              title: "オプション",
              items: [
                "interface/type: 型定義のスタイルを切り替えられます",
                "NULLABLEをオプショナル: NOT NULL制約のないカラムに ? を付与します",
                "日付型をDateとして扱う: TIMESTAMP等をstring(デフォルト)またはDateとして生成します",
              ],
            },
            {
              title: "型変換ルール",
              items: [
                "TEXT, VARCHAR, CHAR → string",
                "INTEGER, INT, BIGINT, SERIAL → number",
                "FLOAT, DOUBLE, DECIMAL, NUMERIC → number",
                "BOOLEAN, BOOL → boolean",
                "JSON, JSONB → Record<string, unknown>",
                "TIMESTAMP, DATE, DATETIME → string（または Date）",
                "BLOB, BYTEA, BINARY → Uint8Array",
                "UUID → string",
                "カラム名はcamelCase、型名はPascalCaseに自動変換されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
