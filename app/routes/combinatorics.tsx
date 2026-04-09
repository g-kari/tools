import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  calculateCombinatorics,
  permutationSteps,
  combinationSteps,
  generatePascalTriangle,
  formatBigInt,
  validateInputs,
  PASCAL_MAX_ROWS,
} from "../utils/combinatorics";

export const Route = createFileRoute("/combinatorics")({
  head: () => ({
    meta: [
      { title: "順列・組合せ計算ツール | Web ツール集" },
      {
        name: "description",
        content:
          "順列 nPr・組合せ nCr・階乗 n! をブラウザ内で計算するツール。計算手順のステップ表示、パスカルの三角形の可視化に対応。確率・統計・競技プログラミングに便利。",
      },
      { property: "og:title", content: "順列・組合せ計算ツール | Web ツール集" },
      {
        property: "og:description",
        content:
          "順列 nPr・組合せ nCr・階乗 n! をブラウザ内で計算するツール。計算手順のステップ表示、パスカルの三角形の可視化に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/combinatorics` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "順列・組合せ計算ツール | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "順列 nPr・組合せ nCr・階乗 n! をブラウザ内で計算するツール。パスカルの三角形の可視化に対応。",
      },
    ],
  }),
  component: CombinatoricsPage,
});

/** プリセット定義 */
const PRESETS: { label: string; n: number; r: number }[] = [
  { label: "10C3", n: 10, r: 3 },
  { label: "52C5 (ポーカー)", n: 52, r: 5 },
  { label: "6P3", n: 6, r: 3 },
  { label: "12C4", n: 12, r: 4 },
  { label: "20P2", n: 20, r: 2 },
];

/** タブの種別 */
type StepTab = "permutation" | "combination";

/**
 * 数値の桁数を返す
 */
function digitCount(value: bigint): number {
  return value === 0n ? 1 : value.toString().length;
}

/**
 * 順列・組合せ計算ページ
 */
function CombinatoricsPage() {
  const [nInput, setNInput] = useState("10");
  const [rInput, setRInput] = useState("3");
  const [activeTab, setActiveTab] = useState<StepTab>("combination");

  const n = parseInt(nInput, 10);
  const r = parseInt(rInput, 10);

  const validationError = useMemo(() => {
    const nVal = parseInt(nInput, 10);
    const rVal = parseInt(rInput, 10);
    if (nInput === "" || rInput === "") return null;
    if (isNaN(nVal) || isNaN(rVal)) return "整数を入力してください";
    return validateInputs(nVal, rVal);
  }, [nInput, rInput]);

  const result = useMemo(() => {
    if (validationError !== null) return null;
    if (nInput === "" || rInput === "") return null;
    if (isNaN(n) || isNaN(r)) return null;
    try {
      return calculateCombinatorics(n, r);
    } catch {
      return null;
    }
  }, [n, r, validationError, nInput, rInput]);

  const permSteps = useMemo(() => {
    if (!result) return [];
    return permutationSteps(n, r);
  }, [result, n, r]);

  const combSteps = useMemo(() => {
    if (!result) return [];
    return combinationSteps(n, r);
  }, [result, n, r]);

  const pascalRows = useMemo(() => generatePascalTriangle(Math.min(PASCAL_MAX_ROWS, n + 1)), [n]);

  const handlePreset = useCallback((preset: { n: number; r: number }) => {
    setNInput(String(preset.n));
    setRInput(String(preset.r));
  }, []);

  return (
    <div className="tool-container">
      <h2 className="section-title">順列・組合せ計算ツール</h2>

      <div className="combinatorics-layout">
        {/* 入力パネル */}
        <div className="combinatorics-input-panel">
          <div className="combinatorics-input-row">
            <div className="combinatorics-input-group">
              <label htmlFor="comb-n" className="combinatorics-input-label">
                n（全体の数）
              </label>
              <input
                id="comb-n"
                type="number"
                min="0"
                max="170"
                className="combinatorics-input"
                value={nInput}
                onChange={(e) => setNInput(e.target.value)}
                aria-label="n（全体の数）"
              />
            </div>
            <div className="combinatorics-input-group">
              <label htmlFor="comb-r" className="combinatorics-input-label">
                r（選ぶ数）
              </label>
              <input
                id="comb-r"
                type="number"
                min="0"
                className="combinatorics-input"
                value={rInput}
                onChange={(e) => setRInput(e.target.value)}
                aria-label="r（選ぶ数）"
              />
            </div>
          </div>

          {/* プリセット */}
          <div className="combinatorics-presets">
            <span className="combinatorics-presets-label">例:</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="combinatorics-preset-btn"
                onClick={() => handlePreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* バリデーションエラー */}
          {validationError && (
            <p className="combinatorics-input-error" role="alert">
              ⚠ {validationError}
            </p>
          )}
        </div>

        {/* 計算結果 */}
        {result === null ? (
          <div className="combinatorics-empty">
            <span className="combinatorics-empty-icon">🔢</span>
            <p>n と r を入力すると結果が表示されます</p>
          </div>
        ) : (
          <>
            {/* 主要結果 */}
            <div className="combinatorics-results">
              <div className="combinatorics-result-card highlight">
                <p className="combinatorics-result-label">組合せ (nCr) — 順序なし</p>
                <p className="combinatorics-result-formula">
                  ₍{n}₎C₍{r}₎ = {n}! / ({r}! × {n - r}!)
                </p>
                <p className="combinatorics-result-value">{formatBigInt(result.combination)}</p>
                <p className="combinatorics-result-digits">{digitCount(result.combination)} 桁</p>
              </div>

              <div className="combinatorics-result-card highlight">
                <p className="combinatorics-result-label">順列 (nPr) — 順序あり</p>
                <p className="combinatorics-result-formula">
                  ₍{n}₎P₍{r}₎ = {n}! / {n - r}!
                </p>
                <p className="combinatorics-result-value">{formatBigInt(result.permutation)}</p>
                <p className="combinatorics-result-digits">{digitCount(result.permutation)} 桁</p>
              </div>
            </div>

            {/* 階乗の補足 */}
            <div>
              <p className="combinatorics-section-title">使用した階乗</p>
              <div className="combinatorics-factorials">
                <div className="combinatorics-factorial-card">
                  <p className="combinatorics-factorial-label">{n}!</p>
                  <p className="combinatorics-factorial-value">{formatBigInt(result.nFactorial)}</p>
                </div>
                <div className="combinatorics-factorial-card">
                  <p className="combinatorics-factorial-label">{r}!</p>
                  <p className="combinatorics-factorial-value">{formatBigInt(result.rFactorial)}</p>
                </div>
                {n - r !== r && (
                  <div className="combinatorics-factorial-card">
                    <p className="combinatorics-factorial-label">
                      ({n}-{r})! = {n - r}!
                    </p>
                    <p className="combinatorics-factorial-value">
                      {formatBigInt(result.nMinusRFactorial)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 計算ステップ */}
            <div>
              <div className="combinatorics-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "combination"}
                  className={`combinatorics-tab ${activeTab === "combination" ? "active" : ""}`}
                  onClick={() => setActiveTab("combination")}
                >
                  組合せ nCr の計算手順
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "permutation"}
                  className={`combinatorics-tab ${activeTab === "permutation" ? "active" : ""}`}
                  onClick={() => setActiveTab("permutation")}
                >
                  順列 nPr の計算手順
                </button>
              </div>

              <div
                className="combinatorics-steps"
                role="region"
                aria-label={activeTab === "combination" ? "組合せの計算手順" : "順列の計算手順"}
              >
                {(activeTab === "combination" ? combSteps : permSteps).map((step, i) => (
                  <div key={i} className="combinatorics-step">
                    <span className="combinatorics-step-label">{step.label}</span>
                    <span className="combinatorics-step-formula">{step.formula}</span>
                    <span className="combinatorics-step-result">= {step.result}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* パスカルの三角形 */}
            {n <= PASCAL_MAX_ROWS && (
              <div>
                <p className="combinatorics-section-title">パスカルの三角形（0 〜 {n} 行目）</p>
                <p className="combinatorics-input-hint">
                  ハイライトされたセルが ₍{n}₎C₍{r}₎ = {formatBigInt(result.combination)} の位置です
                </p>
                <div className="combinatorics-pascal-wrapper">
                  <div className="combinatorics-pascal-container" aria-label="パスカルの三角形">
                    {pascalRows.map((row) => (
                      <div key={row.rowIndex} className="combinatorics-pascal-row-wrap">
                        <span className="combinatorics-pascal-row-label">n={row.rowIndex}</span>
                        <div className="combinatorics-pascal-row">
                          {row.values.map((val, j) => (
                            <span
                              key={j}
                              className={`combinatorics-pascal-cell ${row.rowIndex === n && j === r ? "highlighted" : ""}`}
                              title={`₍${row.rowIndex}₎C₍${j}₎ = ${val.toString()}`}
                            >
                              {val.toString()}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <TipsCard
          sections={[
            {
              title: "Tips",
              items: [
                "順列 nPr: n 個の中から r 個を順序を区別して選ぶ場合の数。nPr = n! / (n-r)!",
                "組合せ nCr: n 個の中から r 個を順序を区別せずに選ぶ場合の数。nCr = n! / (r! × (n-r)!)",
                "関係: nPr = nCr × r!（順列は組合せに並び順を掛けたもの）",
                "パスカルの三角形: 各セルは左上と右上の値の和。n 行 r 列目の値が ₍ₙ₎Cᵣ に対応する",
                `n ≤ ${PASCAL_MAX_ROWS} のときパスカルの三角形を表示します`,
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}
