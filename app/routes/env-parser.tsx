import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { parseEnv, toJSON, toYAML, toExports } from "~/utils/env-parser";
import type { EnvEntry, ParseResult } from "~/utils/env-parser";

export const Route = createFileRoute("/env-parser")({
  head: () => ({
    meta: [
      { title: ".envパーサー・コンバーター | Web ツール集" },
      {
        name: "description",
        content:
          ".envファイルの内容をパースしてJSON/YAML/Shell export形式に変換するオンラインツール。重複キーの検出や構文エラーの確認も可能。",
      },
      {
        property: "og:title",
        content: ".envパーサー・コンバーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          ".envファイルの内容をパースしてJSON/YAML/Shell export形式に変換するオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/env-parser` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: ".envパーサー・コンバーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          ".envファイルの内容をパースしてJSON/YAML/Shell export形式に変換するオンラインツール。",
      },
    ],
  }),
  component: EnvParser,
});

/**
 * エクスポートタブの種類
 */
type ExportTab = "json" | "yaml" | "shell";

/**
 * エクスポートタブのラベルを取得する
 * @param tab - タブの種類
 * @returns ラベル文字列
 */
function getTabLabel(tab: ExportTab): string {
  switch (tab) {
    case "json":
      return "JSON";
    case "yaml":
      return "YAML";
    case "shell":
      return "Shell export";
  }
}

/**
 * パース結果からエクスポート文字列を生成する
 * @param tab - エクスポート形式
 * @param entries - エントリ一覧
 * @returns エクスポート文字列
 */
function getExportOutput(tab: ExportTab, entries: EnvEntry[]): string {
  if (entries.length === 0) return "";
  switch (tab) {
    case "json":
      return toJSON(entries);
    case "yaml":
      return toYAML(entries);
    case "shell":
      return toExports(entries);
  }
}

/**
 * .envパーサー・コンバーターコンポーネント
 */
function EnvParser() {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activeTab, setActiveTab] = useState<ExportTab>("json");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  /** .envテキストをパースする */
  const handleParse = useCallback(() => {
    if (!inputText.trim()) {
      announceStatus("エラー: .envの内容を入力してください");
      showToast(".envの内容を入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    const result = parseEnv(inputText);
    setParseResult(result);

    if (result.entries.length === 0 && result.errors.length === 0) {
      announceStatus("パース完了: 有効なエントリが見つかりませんでした（コメント・空行のみ）");
      showToast("有効なエントリが見つかりませんでした", "info");
    } else {
      const msgs = [`${result.entries.length}件のエントリをパースしました`];
      if (result.errors.length > 0) msgs.push(`エラー${result.errors.length}件`);
      if (result.duplicates.length > 0) msgs.push(`重複キー${result.duplicates.length}件`);
      announceStatus(msgs.join("、"));
    }
  }, [inputText, announceStatus, showToast]);

  /** クリアボタン */
  const handleClear = useCallback(() => {
    setInputText("");
    setParseResult(null);
    announceStatus("入力と結果をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  /** コピーボタン */
  const handleCopy = useCallback(() => {
    if (!parseResult || parseResult.entries.length === 0) {
      showToast("コピーする内容がありません", "error");
      return;
    }
    const output = getExportOutput(activeTab, parseResult.entries);
    navigator.clipboard
      .writeText(output)
      .then(() => {
        showToast(`${getTabLabel(activeTab)}形式でコピーしました`, "success");
        announceStatus(`${getTabLabel(activeTab)}形式でコピーしました`);
      })
      .catch(() => {
        showToast("コピーに失敗しました", "error");
        announceStatus("エラー: コピーに失敗しました");
      });
  }, [parseResult, activeTab, showToast, announceStatus]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const exportOutput =
    parseResult && parseResult.entries.length > 0
      ? getExportOutput(activeTab, parseResult.entries)
      : "";

  const EXPORT_TABS: ExportTab[] = ["json", "yaml", "shell"];

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label=".envパーサーフォーム">
          {/* 入力エリア */}
          <div className="converter-section">
            <label htmlFor="envInput" className="section-title">
              .env の内容
            </label>
            <Textarea
              id="envInput"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                '# .envファイルの内容を貼り付けてください\nDATABASE_URL=postgresql://localhost:5432/mydb\nAPI_KEY="secret-api-key-123"\nDEBUG=true\nPORT=3000'
              }
              aria-describedby="env-input-help"
              aria-label=".envファイルの内容を入力するテキストエリア"
              rows={8}
            />
            <span id="env-input-help" className="sr-only">
              .env形式（KEY=VALUE）の環境変数を入力してください。コメント行（#）や空行はスキップされます。
            </span>
          </div>

          {/* ボタン群 */}
          <div className="button-group" role="group" aria-label="パース操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleParse}
              aria-label=".envの内容をパース"
            >
              パース
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と結果をクリア"
            >
              クリア
            </Button>
          </div>
        </form>

        {/* バリデーション結果 */}
        {parseResult && (parseResult.errors.length > 0 || parseResult.duplicates.length > 0) && (
          <section className="env-parser-validation" aria-label="バリデーション結果">
            {parseResult.errors.map((err) => (
              <div
                key={`${err.line}-${err.content}`}
                className="env-parser-error-item"
                role="alert"
              >
                <span className="env-parser-error-icon" aria-hidden="true">
                  ✕
                </span>
                <span>
                  行 {err.line}: 無効な形式 — <code>{err.content || "(空)"}</code>
                </span>
              </div>
            ))}
            {parseResult.duplicates.map((key) => (
              <div key={`dup-${key}`} className="env-parser-warning-item" role="alert">
                <span className="env-parser-warning-icon" aria-hidden="true">
                  ⚠
                </span>
                <span>
                  重複キー: <code>{key}</code> が複数回定義されています（最後の値が使用されます）
                </span>
              </div>
            ))}
          </section>
        )}

        {/* パース結果テーブル */}
        {parseResult && (
          <section className="output-section" aria-label="パース結果テーブル">
            <div className="env-parser-section-header">
              <span className="section-title">パース結果</span>
              {parseResult.entries.length > 0 && (
                <span
                  className="env-parser-count-badge"
                  aria-label={`${parseResult.entries.length}件`}
                >
                  {parseResult.entries.length}
                </span>
              )}
            </div>

            {parseResult.entries.length === 0 ? (
              <div className="env-parser-empty" role="status">
                有効なエントリがありません
              </div>
            ) : (
              <div className="env-parser-table-wrapper">
                <table className="env-parser-table" aria-label="環境変数一覧テーブル">
                  <thead>
                    <tr>
                      <th scope="col">Key</th>
                      <th scope="col">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.entries.map((entry, idx) => {
                      const isDuplicate = parseResult.duplicates.includes(entry.key);
                      return (
                        <tr key={`${entry.key}-${idx}`}>
                          <td>
                            <span
                              className={
                                isDuplicate ? "env-parser-duplicate-key" : "env-parser-table-key"
                              }
                              title={isDuplicate ? "このキーは重複して定義されています" : undefined}
                            >
                              {entry.key}
                              {isDuplicate && (
                                <span className="sr-only" aria-label="重複キー">
                                  （重複）
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="env-parser-table-value">
                            {entry.value === "" ? <em aria-label="空の値">（空）</em> : entry.value}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* エクスポートタブ */}
        {parseResult && parseResult.entries.length > 0 && (
          <section aria-label="エクスポート形式">
            <div className="section-title">エクスポート</div>
            <div className="env-parser-tabs" role="tablist" aria-label="エクスポート形式タブ">
              {EXPORT_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-controls={`tabpanel-${tab}`}
                  id={`tab-${tab}`}
                  className={`env-parser-tab${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {getTabLabel(tab)}
                </button>
              ))}
            </div>

            <div className="env-parser-output-wrapper">
              <div className="env-parser-output-header">
                <Button
                  type="button"
                  variant="outline"
                  className="btn-secondary"
                  onClick={handleCopy}
                  aria-label={`${getTabLabel(activeTab)}形式でコピー`}
                >
                  コピー
                </Button>
              </div>
              {EXPORT_TABS.map((tab) => (
                <div
                  key={tab}
                  id={`tabpanel-${tab}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${tab}`}
                  hidden={activeTab !== tab}
                >
                  <textarea
                    className="env-parser-output-textarea"
                    readOnly
                    value={activeTab === tab ? exportOutput : ""}
                    aria-label={`${getTabLabel(tab)}形式の出力結果`}
                    aria-live="polite"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                ".envの内容（KEY=VALUE形式）をテキストエリアに貼り付けます",
                "「パース」ボタンをクリックすると結果がテーブル表示されます",
                "コメント行（#で始まる行）は自動的にスキップされます",
                "クォート付きの値（シングル・ダブルクォート）も正しく処理されます",
                "エクスポートタブでJSON / YAML / Shell export形式に切り替えられます",
                "「コピー」ボタンで選択中の形式をクリップボードにコピーします",
              ],
            },
            {
              title: "バリデーション",
              items: [
                "=が含まれない行はエラーとして表示されます",
                "無効な変数名（数字始まりなど）はエラーとして表示されます",
                "同じキーが複数定義されている場合は警告が表示されます",
                "重複キーは最後に定義された値が使用されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
