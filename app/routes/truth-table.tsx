import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { generateTruthTable, exportTruthTableCSV } from "../utils/truth-table";
import "../styles/tools/truth-table.css";

export const Route = createFileRoute("/truth-table")({
  head: () => ({
    meta: [
      { title: "論理式真理値表 | Web ツール集" },
      {
        name: "description",
        content:
          "ブール論理式から真理値表を生成するツール。AND・OR・NOT・XOR・NAND・NOR・XNOR に対応。A, B, C などの変数を使って式を入力すると全組み合わせの真偽値を表形式で表示。CSV 出力にも対応。",
      },
      { property: "og:title", content: "論理式真理値表 | Web ツール集" },
      {
        property: "og:description",
        content:
          "ブール論理式から真理値表を生成するツール。AND・OR・NOT・XOR・NAND・NOR・XNOR に対応。A, B, C などの変数を使って式を入力すると全組み合わせの真偽値を表形式で表示。CSV 出力にも対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/truth-table` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "論理式真理値表 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ブール論理式から真理値表を生成するツール。AND・OR・NOT・XOR・NAND・NOR・XNOR に対応。A, B, C などの変数を使って式を入力すると全組み合わせの真偽値を表形式で表示。CSV 出力にも対応。",
      },
    ],
  }),
  component: TruthTablePage,
});

/** サンプル論理式 */
const SAMPLE_EXPRESSIONS: { label: string; expr: string }[] = [
  { label: "NOT A", expr: "NOT A" },
  { label: "A AND B", expr: "A AND B" },
  { label: "A OR B", expr: "A OR B" },
  { label: "A XOR B", expr: "A XOR B" },
  { label: "A NAND B", expr: "A NAND B" },
  { label: "A NOR B", expr: "A NOR B" },
  { label: "(A OR B) AND C", expr: "(A OR B) AND C" },
  { label: "NOT (A AND B)", expr: "NOT (A AND B)" },
  { label: "ド・モルガン", expr: "(NOT A) AND (NOT B)" },
];

/**
 * 論理式真理値表ページ
 */
function TruthTablePage() {
  const [input, setInput] = useState("A AND B");
  const { copy } = useClipboard();

  /** 真理値表を useMemo で計算（入力変更ごとに再計算） */
  const result = useMemo(() => {
    try {
      return { data: generateTruthTable(input), error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  }, [input]);

  const handleSample = useCallback((expr: string) => {
    setInput(expr);
  }, []);

  /** CSV をクリップボードにコピーする */
  const handleCopyCSV = useCallback(() => {
    if (!result.data) return;
    copy(exportTruthTableCSV(result.data));
  }, [result.data, copy]);

  /** CSV ファイルとしてダウンロードする */
  const handleExportCSV = useCallback(() => {
    if (!result.data) return;
    const csv = exportTruthTableCSV(result.data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "truth-table.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [result.data]);

  return (
    <div className="tool-container">
      <h2 className="section-title">論理式真理値表</h2>

      <div className="truth-table-layout">
        {/* 入力エリア */}
        <div className="truth-table-input-section">
          <label htmlFor="truth-input" className="truth-table-input-label">
            論理式を入力
          </label>
          <input
            id="truth-input"
            type="text"
            className="truth-table-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例: A AND B, (A OR B) AND NOT C"
            aria-label="論理式を入力"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="truth-table-input-hint">
            変数: A, B, C ... ／ 演算子:
            AND（&amp;&amp;）・OR（||）・NOT（!）・XOR（^）・NAND・NOR・XNOR
          </p>
          <div className="truth-table-samples">
            <span className="truth-table-samples-label">サンプル:</span>
            {SAMPLE_EXPRESSIONS.map((s) => (
              <Button
                key={s.label}
                variant="outline"
                size="sm"
                onClick={() => handleSample(s.expr)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        {/* エラー表示 */}
        {result.error && (
          <div className="truth-table-error" role="alert">
            ⚠ {result.error}
          </div>
        )}

        {/* 正規化された式の表示 */}
        {result.data && (
          <div className="truth-table-expr-display">
            <span className="truth-table-expr-label">正規化:</span>
            <span className="truth-table-expr-value">{result.data.expression}</span>
          </div>
        )}

        {/* 真理値表 */}
        {result.data ? (
          <div className="truth-table-result">
            <div className="truth-table-result-header">
              <span className="truth-table-result-info">
                {result.data.variables.length} 変数 ／ {result.data.rows.length} 行
              </span>
              <div className="truth-table-result-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCSV}
                  aria-label="CSV をクリップボードにコピー"
                >
                  CSV コピー
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  aria-label="CSV ファイルをダウンロード"
                >
                  CSV ダウンロード
                </Button>
              </div>
            </div>

            <div className="truth-table-scroll">
              <table className="truth-table" aria-label="論理式の真理値表">
                <thead>
                  <tr>
                    {result.data.variables.map((v) => (
                      <th key={v} scope="col">
                        {v}
                      </th>
                    ))}
                    <th scope="col" className="output-col">
                      {result.data.expression}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.rows.map((row, i) => (
                    <tr key={i}>
                      {result.data!.variables.map((v) => (
                        <td key={v} className={row.inputs[v] ? "truth-true" : "truth-false"}>
                          {row.inputs[v] ? "1" : "0"}
                        </td>
                      ))}
                      <td className={`output-col ${row.output ? "output-true" : "output-false"}`}>
                        {row.output ? "1" : "0"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !result.error && (
            <div className="truth-table-empty">
              <span className="truth-table-empty-icon">⊞</span>
              <p>論理式を入力すると真理値表が表示されます</p>
            </div>
          )
        )}

        <TipsCard
          sections={[
            {
              title: "Tips",
              items: [
                "使用可能な変数: A〜Z（1文字の大文字、小文字も可）",
                "AND: && / & / AND / ∧ ／ OR: || / | / OR / ∨ ／ NOT: ! / ~ / NOT / ¬",
                "XOR: ^ / ⊕ / XOR ／ NAND ／ NOR ／ XNOR にも対応",
                "変数が増えると行数が 2ⁿ 倍増加します（最大 5 変数 = 32 行）",
                "括弧 () で演算の優先順位を明示できます",
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}
