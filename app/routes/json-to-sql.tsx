import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { generateSqlCreateTable, getSampleJson, type SqlDialect } from "../utils/json-to-sql";

export const Route = createFileRoute("/json-to-sql")({
  head: () => ({
    meta: [
      { title: "JSON→SQL CREATE TABLE生成 | Web ツール集" },
      {
        name: "description",
        content:
          "JSONデータからSQL CREATE TABLE文を自動生成できるオンラインツール。PostgreSQL・MySQL・SQLiteに対応。",
      },
      {
        property: "og:title",
        content: "JSON→SQL CREATE TABLE生成 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "JSONデータからSQL CREATE TABLE文を自動生成できるオンラインツール。PostgreSQL・MySQL・SQLiteに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-to-sql` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "JSON→SQL CREATE TABLE生成 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "JSONデータからSQL CREATE TABLE文を自動生成できるオンラインツール。PostgreSQL・MySQL・SQLiteに対応。",
      },
    ],
  }),
  component: JsonToSqlConverter,
});

/**
 * JSON→SQL CREATE TABLE生成のメインコンポーネント
 * JSONデータを入力としてSQL CREATE TABLE文を生成する
 */
function JsonToSqlConverter() {
  const { showToast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tableName, setTableName] = useState("my_table");
  const [dialect, setDialect] = useState<SqlDialect>("postgresql");
  const [notNull, setNotNull] = useState(true);
  const [addId, setAddId] = useState(false);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleGenerate = useCallback(() => {
    setError(null);
    setOutputText("");

    try {
      const result = generateSqlCreateTable(jsonText, {
        tableName: tableName || "my_table",
        dialect,
        notNull,
        addId,
      });
      setOutputText(result);
      announceStatus("CREATE TABLE文を生成しました");
      showToast("CREATE TABLE文を生成しました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [jsonText, tableName, dialect, notNull, addId, announceStatus, showToast]);

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
      showToast("コピーするSQL文がありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      announceStatus("SQL文をクリップボードにコピーしました");
      showToast("SQL文をコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, announceStatus, showToast]);

  // Ctrl+Enter でSQL生成実行
  useKeyboardShortcut("Enter", handleGenerate, { ctrl: true });

  useEffect(() => {
    jsonRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="JSON→SQL CREATE TABLE生成フォーム">
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
                aria-describedby="jtsql-input-help"
                spellCheck={false}
              />
              <span id="jtsql-input-help" className="sr-only">
                CREATE TABLE文を生成したいJSONデータを入力してください
              </span>

              {/* オプション設定 */}
              <div className="jts-options" role="group" aria-label="SQL生成オプション">
                <div className="jts-options-row">
                  <label className="jts-option-label" htmlFor="jtsql-table-name">
                    テーブル名:
                  </label>
                  <input
                    id="jtsql-table-name"
                    type="text"
                    className="jts-root-name-input"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    aria-label="テーブル名"
                  />
                </div>
                <div className="jts-options-row">
                  <label className="jts-option-label" htmlFor="jtsql-dialect">
                    ダイアレクト:
                  </label>
                  <select
                    id="jtsql-dialect"
                    className="jts-root-name-input"
                    value={dialect}
                    onChange={(e) => setDialect(e.target.value as SqlDialect)}
                    aria-label="SQLダイアレクト選択"
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="sqlite">SQLite</option>
                  </select>
                </div>
                <div className="jts-options-row">
                  <label className="jts-option-label">
                    <input
                      type="checkbox"
                      checked={notNull}
                      onChange={(e) => setNotNull(e.target.checked)}
                    />
                    NOT NULL を付与する（null値除く）
                  </label>
                  <label className="jts-option-label">
                    <input
                      type="checkbox"
                      checked={addId}
                      onChange={(e) => setAddId(e.target.checked)}
                    />
                    id カラムを追加する（AUTO INCREMENT）
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
                  aria-label="CREATE TABLE文を生成する"
                >
                  SQL生成
                </button>
              </div>
            </div>

            {/* 右パネル: SQL出力 */}
            <div className="jts-panel">
              <span className="jts-panel-label">生成されたCREATE TABLE文</span>
              <div
                className="jts-result-area"
                role="region"
                aria-label="生成されたCREATE TABLE文"
                aria-live="polite"
              >
                {outputText ? (
                  outputText
                ) : (
                  <span className="jts-result-empty">
                    {error
                      ? "エラーが発生しました"
                      : "JSONを入力して「SQL生成」ボタンを押してください（Ctrl+Enter）"}
                  </span>
                )}
              </div>

              <div className="jts-actions">
                <button
                  type="button"
                  className="jts-btn"
                  onClick={handleCopyOutput}
                  disabled={!outputText}
                  aria-label="生成されたSQL文をクリップボードにコピーする"
                >
                  SQL文をコピー
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
                "テーブル名とSQLダイアレクトを選択します",
                "「SQL生成」ボタンまたはCtrl+EnterでCREATE TABLE文を生成します",
                "生成されたSQL文は「SQL文をコピー」ボタンでコピーできます",
              ],
            },
            {
              title: "オプション",
              items: [
                "テーブル名: 生成されるテーブルの名前を変更できます（デフォルト: my_table）",
                "ダイアレクト: PostgreSQL・MySQL・SQLiteから選択できます",
                "NOT NULL: null値以外のカラムにNOT NULL制約を付与します",
                "idカラム: 先頭にAUTO INCREMENTなPRIMARY KEYカラムを追加します",
              ],
            },
            {
              title: "型変換ルール",
              items: [
                "string → TEXT (PostgreSQL/SQLite) / VARCHAR(255) (MySQL)",
                "number (整数) → INTEGER (PostgreSQL/SQLite) / INT (MySQL)",
                "number (小数) → DOUBLE PRECISION (PostgreSQL) / DOUBLE (MySQL) / REAL (SQLite)",
                "boolean → BOOLEAN (PostgreSQL) / TINYINT(1) (MySQL) / INTEGER (SQLite)",
                "null → TEXT（nullable）",
                "object/array → JSONB (PostgreSQL) / JSON (MySQL) / TEXT (SQLite)",
                "キー名はスネークケース（snake_case）に自動変換されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
