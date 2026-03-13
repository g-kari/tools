import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { formatSql, minifySql, validateSql } from "~/utils/sql";

export const Route = createFileRoute("/sql")({
  head: () => ({
    meta: [
      { title: "SQLフォーマッター | Web ツール集" },
      {
        name: "description",
        content:
          "SQLクエリの整形・圧縮・構文検証ツール。SELECT/INSERT/UPDATE/DELETE文をブラウザ上で簡単に整形・検証できます。",
      },
      {
        property: "og:title",
        content: "SQLフォーマッター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "SQLクエリの整形・圧縮・構文検証ツール。SELECT/INSERT/UPDATE/DELETE文をブラウザ上で簡単に整形・検証できます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/sql` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "SQLフォーマッター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "SQLクエリの整形・圧縮・構文検証ツール。SELECT/INSERT/UPDATE/DELETE文をブラウザ上で簡単に整形・検証できます。",
      },
    ],
  }),
  component: SqlFormatter,
});

/** 操作モードの型定義 */
type Mode = "format" | "minify" | "validate";

const sqlPlaceholder = `SELECT
  u.id,
  u.name,
  o.amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = 1
  AND o.amount > 100
ORDER BY o.amount DESC
LIMIT 10`;

/**
 * SQLフォーマッター/バリデーターコンポーネント
 */
function SqlFormatter() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>("format");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleProcess = useCallback(() => {
    if (!inputText.trim()) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }

    try {
      if (mode === "format") {
        const result = formatSql(inputText, indent);
        setOutputText(result);
        announceStatus("SQLの整形が完了しました");
      } else if (mode === "minify") {
        const result = minifySql(inputText);
        setOutputText(result);
        announceStatus("SQLの圧縮が完了しました");
      } else {
        const result = validateSql(inputText);
        if (result.valid) {
          setOutputText("✓ 有効なSQLです");
          announceStatus("SQLは有効です");
        } else {
          setOutputText(`✗ エラー: ${result.error}`);
          announceStatus(`SQLが無効です: ${result.error}`);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "処理に失敗しました";
      announceStatus(`エラー: ${message}`);
      showToast(message, "error");
    }
  }, [inputText, mode, indent, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleCopy = useCallback(async () => {
    if (!outputText) return;
    const success = await copy(outputText);
    if (success) {
      setIsCopied(true);
      announceStatus("出力結果をコピーしました");
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    } else {
      announceStatus("コピーに失敗しました");
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, copy, announceStatus, showToast]);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setInputText("");
    setOutputText("");
  }, []);

  const processLabel =
    mode === "format" ? "整形" : mode === "minify" ? "圧縮" : "検証";

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => e.preventDefault()}
          aria-label="SQLフォーマットフォーム"
        >
          <div className="converter-section">
            <fieldset className="csv-json-mode-fieldset">
              <legend className="section-title">操作モード</legend>
              <div
                className="csv-json-mode-group"
                role="group"
                aria-label="操作モード選択"
              >
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="format"
                    checked={mode === "format"}
                    onChange={() => handleModeChange("format")}
                    aria-label="SQLを整形する"
                  />
                  <span className="format-label">整形</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="minify"
                    checked={mode === "minify"}
                    onChange={() => handleModeChange("minify")}
                    aria-label="SQLを圧縮する"
                  />
                  <span className="format-label">圧縮</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="validate"
                    checked={mode === "validate"}
                    onChange={() => handleModeChange("validate")}
                    aria-label="SQLを検証する"
                  />
                  <span className="format-label">検証</span>
                </label>
              </div>
            </fieldset>
          </div>

          {mode === "format" && (
            <div className="converter-section">
              <div className="csv-json-options">
                <div className="option-group">
                  <span className="section-title" id="sql-indent-option-label">
                    インデント幅
                  </span>
                  <div
                    className="csv-json-mode-group"
                    role="group"
                    aria-labelledby="sql-indent-option-label"
                  >
                    <label className="format-option">
                      <input
                        type="radio"
                        name="indent"
                        value="2"
                        checked={indent === 2}
                        onChange={() => setIndent(2)}
                        aria-label="インデント2スペース"
                      />
                      <span className="format-label">2スペース</span>
                    </label>
                    <label className="format-option">
                      <input
                        type="radio"
                        name="indent"
                        value="4"
                        checked={indent === 4}
                        onChange={() => setIndent(4)}
                        aria-label="インデント4スペース"
                      />
                      <span className="format-label">4スペース</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              SQL 入力
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={sqlPlaceholder}
              aria-describedby="sql-input-help"
              aria-label="変換元のSQLテキスト入力欄"
              className="csv-json-textarea sql-textarea"
            />
            <span id="sql-input-help" className="sr-only">
              SQLクエリを入力して操作ボタンを押してください
            </span>
          </div>

          <div className="button-group" role="group" aria-label="SQL操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleProcess}
              aria-label={`SQL ${processLabel}`}
            >
              {processLabel}
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

          <div className="output-section">
            <div className="csv-json-output-header">
              <label htmlFor="outputText" className="section-title">
                {mode === "validate" ? "検証結果" : "出力"}
              </label>
              <button
                type="button"
                className={`number-base-copy-btn${isCopied ? " copied" : ""}`}
                onClick={handleCopy}
                disabled={!outputText}
                aria-label="出力結果をクリップボードにコピー"
              >
                {isCopied ? "コピー済" : "コピー"}
              </button>
            </div>
            <Textarea
              id="outputText"
              value={outputText}
              readOnly
              placeholder={
                mode === "validate"
                  ? "検証結果がここに表示されます..."
                  : "処理結果がここに表示されます..."
              }
              aria-label={
                mode === "validate"
                  ? "SQL検証結果の出力欄"
                  : "SQL処理結果の出力欄"
              }
              aria-live="polite"
              className="csv-json-textarea sql-textarea"
            />
          </div>
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "操作モードを「整形」「圧縮」「検証」から選択します",
                "整形モードではインデント幅（2または4スペース）を選択できます",
                "入力欄にSQLクエリを貼り付けてボタンを押します",
                "出力結果は「コピー」ボタンでクリップボードにコピーできます",
              ],
            },
            {
              title: "対応するSQL",
              items: [
                "SELECT / FROM / WHERE / JOIN / GROUP BY / ORDER BY / HAVING / LIMIT",
                "INSERT INTO / VALUES / UPDATE SET / DELETE FROM",
                "CREATE TABLE / ALTER TABLE / DROP TABLE",
                "シングルクォート文字列リテラル、--行コメント、/* */ブロックコメント",
                "MySQL（バッククォート識別子）、PostgreSQL（ダブルクォート識別子）に対応",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
