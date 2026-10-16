import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "~/constants/site";
import {
  type TableData,
  type AlignType,
  createEmptyTable,
  generateMarkdown,
  parseCSV,
  addColumn,
  removeColumn,
  addRow,
  removeRow,
  setColumnAlign,
  updateHeader,
  updateCell,
} from "~/utils/markdown-table";

export const Route = createFileRoute("/markdown-table")({
  head: () => ({
    meta: [
      { title: "Markdownテーブル生成 | Web ツール集" },
      {
        name: "description",
        content:
          "スプレッドシートUIでデータを入力してMarkdown形式のテーブルを生成。行・列の追加削除や整列方向の設定が可能",
      },
      {
        property: "og:title",
        content: "Markdownテーブル生成 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "スプレッドシートUIでデータを入力してMarkdown形式のテーブルを生成。行・列の追加削除や整列方向の設定が可能",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/markdown-table` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: MarkdownTableGenerator,
});

/**
 * Markdownテーブル生成コンポーネント
 * スプレッドシートUIでテーブルデータを編集し、Markdown形式で出力する
 */
function MarkdownTableGenerator() {
  const [tableData, setTableData] = useState<TableData>(createEmptyTable(3, 3));
  const [csvInput, setCsvInput] = useState("");
  const [importError, setImportError] = useState("");
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();
  const { showToast } = useToast();

  const markdownOutput = useMemo(() => generateMarkdown(tableData), [tableData]);

  const handleCopy = useCallback(async () => {
    if (!markdownOutput) return;
    const success = await copy(markdownOutput);
    if (success) {
      showToast("Markdownをコピーしました", "success");
      announceStatus("Markdownをコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [markdownOutput, copy, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setTableData(createEmptyTable(3, 3));
    setImportError("");
    announceStatus("テーブルをリセットしました");
  }, [announceStatus]);

  const handleImport = useCallback(() => {
    if (!csvInput.trim()) return;
    try {
      const parsed = parseCSV(csvInput);
      setTableData(parsed);
      setCsvInput("");
      setImportError("");
      announceStatus("CSVをインポートしました");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "CSVをインポートできませんでした");
    }
  }, [csvInput, announceStatus]);

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">Markdownテーブル生成</h2>
        <p className="markdown-table-description">
          テーブルエディターでデータを入力するとMarkdown形式のテーブルが生成されます。CSVやTSVからのインポートにも対応しています。
        </p>

        <div className="markdown-table-editor">
          <div className="markdown-table-two-col">
            {/* 左: テーブルエディター */}
            <div className="markdown-table-section">
              <div className="markdown-table-section-title">テーブルエディター</div>

              <div className="markdown-table-grid-wrapper">
                <table className="markdown-table-grid">
                  <thead>
                    <tr>
                      {tableData.columns.map((col, i) => (
                        <th key={i}>
                          <div className="markdown-table-header-cell">
                            <textarea
                              className="markdown-table-header-input"
                              rows={Math.min(4, col.header.split(/\r\n|\r|\n/).length)}
                              value={col.header}
                              onChange={(e) =>
                                setTableData(updateHeader(tableData, i, e.target.value))
                              }
                              id={`markdown-table-header-${i}`}
                              aria-label={`列${i + 1}のヘッダー`}
                              placeholder={`列${i + 1}`}
                            />
                            <select
                              className="markdown-table-align-select"
                              value={col.align}
                              onChange={(e) =>
                                setTableData(
                                  setColumnAlign(tableData, i, e.target.value as AlignType),
                                )
                              }
                              aria-label={`列${i + 1}の整列方向`}
                            >
                              <option value="none">-</option>
                              <option value="left">左</option>
                              <option value="center">中</option>
                              <option value="right">右</option>
                            </select>
                            <button
                              className="markdown-table-col-remove"
                              onClick={() => setTableData(removeColumn(tableData, i))}
                              disabled={tableData.columns.length <= 1}
                              aria-label={`列${i + 1}を削除`}
                            >
                              ×
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className="markdown-table-add-col-header">
                        <button
                          className="markdown-table-btn markdown-table-btn--add"
                          onClick={() => setTableData(addColumn(tableData))}
                          aria-label="列を追加"
                        >
                          +列
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci}>
                            <textarea
                              className="markdown-table-cell-input"
                              rows={Math.min(4, cell.split(/\r\n|\r|\n/).length)}
                              value={cell}
                              onChange={(e) =>
                                setTableData(updateCell(tableData, ri, ci, e.target.value))
                              }
                              aria-label={`行${ri + 1}列${ci + 1}`}
                            />
                          </td>
                        ))}
                        <td className="markdown-table-row-controls">
                          <button
                            className="markdown-table-row-remove"
                            onClick={() => setTableData(removeRow(tableData, ri))}
                            disabled={tableData.rows.length <= 1}
                            aria-label={`行${ri + 1}を削除`}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="markdown-table-add-row">
                <button
                  className="markdown-table-btn markdown-table-btn--add"
                  onClick={() => setTableData(addRow(tableData))}
                  aria-label="行を追加"
                >
                  + 行を追加
                </button>
              </div>
            </div>

            {/* 右: Markdown出力 */}
            <div className="markdown-table-section">
              <div className="markdown-table-section-title">Markdown出力</div>
              <textarea
                className="markdown-table-output-textarea"
                readOnly
                value={markdownOutput}
                id="markdown-table-output"
                aria-label="Markdown出力"
                aria-readonly="true"
              />
              <div className="markdown-table-output-actions">
                <button
                  className="markdown-table-btn markdown-table-btn--primary"
                  onClick={handleCopy}
                  disabled={!markdownOutput}
                  aria-label="Markdownをクリップボードにコピー"
                >
                  コピー
                </button>
                <button
                  className="markdown-table-btn markdown-table-btn--secondary"
                  onClick={handleClear}
                  aria-label="テーブルをリセット"
                >
                  クリア
                </button>
              </div>
            </div>
          </div>

          {/* CSVインポート */}
          <div className="markdown-table-import-area">
            <div className="markdown-table-section-title">CSVインポート</div>
            <textarea
              className="markdown-table-import-textarea"
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="CSVまたはTSVをここに貼り付けてください（1行目がヘッダーになります）..."
              aria-label="CSVインポート入力"
              aria-invalid={importError ? true : undefined}
              aria-describedby={importError ? "markdown-table-import-error" : undefined}
            />
            {importError && (
              <p id="markdown-table-import-error" className="error-message" role="alert">
                {importError}{" "}
                入力を修正して再度インポートしてください。現在のテーブルは保持しています。
              </p>
            )}
            <div className="markdown-table-import-actions">
              <button
                className="markdown-table-btn markdown-table-btn--primary"
                onClick={handleImport}
                disabled={!csvInput.trim()}
                aria-label="CSVをインポートしてテーブルに反映"
              >
                インポート
              </button>
              <button
                className="markdown-table-btn markdown-table-btn--secondary"
                onClick={() => {
                  setCsvInput("");
                  setImportError("");
                }}
                aria-label="CSVインポート入力をクリア"
              >
                クリア
              </button>
            </div>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "テーブルエディターのセルをクリックして直接データを入力します",
                "ヘッダー行の入力欄で列名を変更できます",
                "ドロップダウンで各列の整列方向（左・中・右）を設定できます",
                "「+列」ボタンで列を追加、×ボタンで列・行を削除できます",
                "「コピー」ボタンで生成されたMarkdownをクリップボードにコピーできます",
              ],
            },
            {
              title: "CSVインポート",
              items: [
                "スプレッドシート（Excel、Googleスプレッドシート等）からコピーしてTSVとして貼り付け可能",
                "先頭の非空ヘッダーの引用符外にタブがあればTSV、それ以外はCSVとして読み込みます",
                'CSVはダブルクォートで囲んだカンマ・改行・二重引用符（""）に対応し、内部の空白を保持します',
                "TSVの同じセル内で閉じる引用符は文字として扱います。引用符付き改行・タブや先頭の引用符が閉じないセルは拒否します。必要ならCSVに変換してください",
                "引用符で始まる曖昧なヘッダーはCSVとして検証します。不正な引用符・超過列はエラーにし、不足列は空文字で補います",
                "引用符外の前後空白と空行は除去します。セル・ヘッダーの改行はMarkdownでは<br>に変換します",
                "セルのMarkdown記法はそのまま扱います。複数行のインラインコードは未対応で、<br>が文字として表示されます。HTMLを無効にするレンダラーでも表示が異なります",
                "1行目がヘッダー行として扱われます",
                "インポート後もエディターで各セルを自由に編集できます",
              ],
            },
            {
              title: "Markdownテーブルの記法",
              items: [
                "区切り行（---）の書き方で整列方向を指定します",
                "左揃え: :--- / 中央揃え: :---: / 右揃え: ---:",
                "セル内の | は \\| で自動エスケープされます",
                "GitHub、Zenn、Qiita など多くのMarkdownレンダラーに対応しています",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
