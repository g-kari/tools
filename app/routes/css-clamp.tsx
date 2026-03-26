import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type FluidConfig,
  type FluidUnit,
  DEFAULT_FLUID_CONFIG,
  FLUID_PRESETS,
  calculateFluid,
  validateFluidConfig,
} from "~/utils/css-clamp";
import "~/styles/tools/css-clamp.css";

export const Route = createFileRoute("/css-clamp")({
  head: () => ({
    meta: [
      { title: "CSS Fluid/Clamp 計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "CSS clamp() でレスポンシブな Fluid タイポグラフィ・スペーシングを計算。ビューポート幅に応じてリニア補間する clamp() 値を即時プレビューで生成します。",
      },
      {
        property: "og:title",
        content: "CSS Fluid/Clamp 計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS clamp() の Fluid 値を計算。ビューポート幅でリニア補間する値を即時生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-clamp` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Fluid/Clamp 計算機 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS clamp() の Fluid 値を計算。ビューポート幅でリニア補間する値を即時生成。",
      },
    ],
  }),
  component: CssClampTool,
});

/**
 * CSS Fluid/Clamp 計算機コンポーネント
 *
 * ビューポート幅の範囲でリニア補間する CSS clamp() 値を計算・プレビューします。
 * プリセット・単位切り替え・SVG グラフ・スケールテーブルに対応しています。
 *
 * @returns CSS Fluid/Clamp 計算機の React コンポーネント
 */
function CssClampTool() {
  const [config, setConfig] = useState<FluidConfig>(DEFAULT_FLUID_CONFIG);
  const { announce, statusProps } = useStatusAnnouncement();
  const { copy } = useClipboard();

  const error = useMemo(() => validateFluidConfig(config), [config]);
  const result = useMemo(
    () => (error ? null : calculateFluid(config)),
    [config, error]
  );

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      await copy(text);
      announce(`${label} をコピーしました`);
    },
    [copy, announce]
  );

  const setNum = useCallback(
    (field: keyof FluidConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v)) setConfig((c) => ({ ...c, [field]: v }));
    },
    []
  );

  // SVG グラフのパラメータ
  const svgW = 480;
  const svgH = 160;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const graphW = svgW - padL - padR;
  const graphH = svgH - padT - padB;

  const graphData = useMemo(() => {
    if (!result) return null;
    const pts = result.points;
    const vMin = pts[0].viewport;
    const vMax = pts[pts.length - 1].viewport;
    const valMin = Math.min(...pts.map((p) => p.value));
    const valMax = Math.max(...pts.map((p) => p.value));
    const valRange = valMax - valMin || 1;
    const vRange = vMax - vMin || 1;

    const toX = (vp: number) => padL + ((vp - vMin) / vRange) * graphW;
    const toY = (val: number) =>
      padT + graphH - ((val - valMin) / valRange) * graphH;

    // セグメントに分割（クランプ部分とフルイド部分を分ける）
    const path = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.viewport).toFixed(1)} ${toY(p.value).toFixed(1)}`)
      .join(" ");

    // ビューポートのガイドライン位置
    const minVpX = toX(config.minViewport);
    const maxVpX = toX(config.maxViewport);

    // ラベル
    const unit = config.unit;
    const rb = config.remBase;
    const fmtVal = (v: number) =>
      unit === "rem" ? `${(v / rb).toFixed(2)}rem` : `${v.toFixed(0)}px`;

    return {
      path,
      minVpX,
      maxVpX,
      svgH,
      svgW,
      padL,
      padB,
      graphH,
      toX,
      toY,
      vMin,
      vMax,
      valMin,
      valMax,
      fmtVal,
    };
  }, [result, config]);

  return (
    <div className="tool-container">
      <StatusAnnouncer {...statusProps} />

      <div className="tool-header">
        <h1 className="tool-title">CSS Fluid/Clamp 計算機</h1>
        <p className="tool-description">
          ビューポート幅に応じてリニア補間する CSS{" "}
          <code>clamp()</code> 値を計算します。
          フォントサイズ・パディング・マージンなどのレスポンシブな Fluid
          スタイルを即時生成できます。
        </p>
      </div>

      {/* ── プリセット ── */}
      <div className="cfc-presets" role="group" aria-label="プリセット">
        {FLUID_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="cfc-preset-btn"
            onClick={() => setConfig(preset.config)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* ── 単位セレクタ ── */}
      <div className="cfc-unit-row">
        <span className="cfc-unit-label">単位:</span>
        <div className="cfc-radio-group" role="radiogroup" aria-label="値の単位">
          {(["px", "rem"] as FluidUnit[]).map((u) => (
            <label key={u} className="cfc-radio-label">
              <input
                type="radio"
                name="fluid-unit"
                value={u}
                checked={config.unit === u}
                onChange={() => setConfig((c) => ({ ...c, unit: u }))}
              />
              {u}
            </label>
          ))}
        </div>
        {config.unit === "rem" && (
          <div className="cfc-rem-base-row">
            <label htmlFor="rem-base" className="cfc-rem-base-label">
              1rem =
            </label>
            <input
              id="rem-base"
              type="number"
              className="cfc-number-input"
              value={config.remBase}
              min={1}
              max={32}
              step={1}
              onChange={setNum("remBase")}
              aria-label="rem の基準フォントサイズ (px)"
            />
            <span className="cfc-unit-suffix">px</span>
          </div>
        )}
      </div>

      {/* ── 入力グリッド ── */}
      <div className="cfc-inputs-grid">
        {/* 値グループ */}
        <div className="cfc-fieldset">
          <div className="cfc-fieldset-legend">値</div>
          <div className="cfc-row">
            <label htmlFor="min-value" className="cfc-label">
              最小値
            </label>
            <input
              id="min-value"
              type="number"
              className="cfc-number-input"
              value={config.minValue}
              step={config.unit === "rem" ? 0.25 : 1}
              onChange={setNum("minValue")}
              aria-label={`最小値 (${config.unit})`}
            />
            <span className="cfc-unit-suffix">{config.unit}</span>
          </div>
          <div className="cfc-row">
            <label htmlFor="max-value" className="cfc-label">
              最大値
            </label>
            <input
              id="max-value"
              type="number"
              className="cfc-number-input"
              value={config.maxValue}
              step={config.unit === "rem" ? 0.25 : 1}
              onChange={setNum("maxValue")}
              aria-label={`最大値 (${config.unit})`}
            />
            <span className="cfc-unit-suffix">{config.unit}</span>
          </div>
        </div>

        {/* ビューポートグループ */}
        <div className="cfc-fieldset">
          <div className="cfc-fieldset-legend">ビューポート幅</div>
          <div className="cfc-row">
            <label htmlFor="min-vp" className="cfc-label">
              最小
            </label>
            <input
              id="min-vp"
              type="number"
              className="cfc-number-input"
              value={config.minViewport}
              min={1}
              step={10}
              onChange={setNum("minViewport")}
              aria-label="最小ビューポート幅 (px)"
            />
            <span className="cfc-unit-suffix">px</span>
          </div>
          <div className="cfc-row">
            <label htmlFor="max-vp" className="cfc-label">
              最大
            </label>
            <input
              id="max-vp"
              type="number"
              className="cfc-number-input"
              value={config.maxViewport}
              min={1}
              step={10}
              onChange={setNum("maxViewport")}
              aria-label="最大ビューポート幅 (px)"
            />
            <span className="cfc-unit-suffix">px</span>
          </div>
        </div>
      </div>

      {/* ── エラー ── */}
      {error && (
        <div className="cfc-error" role="alert">
          {error}
        </div>
      )}

      {result && (
        <>
          {/* ── SVG グラフ ── */}
          {graphData && (
            <div className="cfc-graph-wrap">
              <div className="cfc-graph-title">スケールプレビュー</div>
              <svg
                className="cfc-graph"
                viewBox={`0 0 ${svgW} ${svgH}`}
                aria-label="ビューポート幅と値のスケールグラフ"
                role="img"
              >
                {/* 軸 */}
                <line
                  className="cfc-graph-axis"
                  x1={padL}
                  y1={padT}
                  x2={padL}
                  y2={padT + graphH}
                />
                <line
                  className="cfc-graph-axis"
                  x1={padL}
                  y1={padT + graphH}
                  x2={padL + graphW}
                  y2={padT + graphH}
                />
                {/* ビューポートのガイドライン */}
                <line
                  className="cfc-graph-guideline"
                  x1={graphData.minVpX}
                  y1={padT}
                  x2={graphData.minVpX}
                  y2={padT + graphH}
                />
                <line
                  className="cfc-graph-guideline"
                  x1={graphData.maxVpX}
                  y1={padT}
                  x2={graphData.maxVpX}
                  y2={padT + graphH}
                />
                {/* スケールパス */}
                <path className="cfc-graph-path-fluid" d={graphData.path} />
                {/* ラベル */}
                <text
                  className="cfc-graph-label"
                  x={graphData.minVpX}
                  y={svgH - 4}
                  textAnchor="middle"
                >
                  {config.minViewport}px
                </text>
                <text
                  className="cfc-graph-label"
                  x={graphData.maxVpX}
                  y={svgH - 4}
                  textAnchor="middle"
                >
                  {config.maxViewport}px
                </text>
                <text
                  className="cfc-graph-label"
                  x={padL - 4}
                  y={padT + graphH}
                  textAnchor="end"
                >
                  {graphData.fmtVal(graphData.valMin)}
                </text>
                <text
                  className="cfc-graph-label"
                  x={padL - 4}
                  y={padT + 4}
                  textAnchor="end"
                >
                  {graphData.fmtVal(graphData.valMax)}
                </text>
              </svg>
            </div>
          )}

          {/* ── 出力 ── */}
          <div className="cfc-output-list">
            {[
              { label: "clamp()", value: result.clampValue },
              { label: "CSS Var", value: result.cssVar },
              { label: "SCSS", value: result.scssVar },
            ].map(({ label, value }) => (
              <div key={label} className="cfc-output-row">
                <span className="cfc-output-label">{label}</span>
                <code className="cfc-output-code" aria-label={`${label} の値`}>
                  {value}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(value, label)}
                  aria-label={`${label} をコピー`}
                >
                  コピー
                </Button>
              </div>
            ))}
          </div>

          {/* ── スケールテーブル ── */}
          <div className="cfc-table-wrap">
            <table className="cfc-table" aria-label="ビューポート幅ごとの値">
              <thead>
                <tr>
                  <th>ビューポート幅</th>
                  <th>
                    値 ({config.unit})
                  </th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {result.points.map((pt) => (
                  <tr
                    key={pt.viewport}
                    className={pt.clamped ? "cfc-row-clamped" : ""}
                  >
                    <td>{pt.viewport}px</td>
                    <td>
                      {config.unit === "rem"
                        ? `${(pt.value / config.remBase).toFixed(4)}rem`
                        : `${pt.value}px`}
                    </td>
                    <td>{pt.clamped ? "クランプ" : "フルイド"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Tips ── */}
      <TipsCard title="使い方">
        <ul>
          <li>プリセットから開始するか、値とビューポート幅を直接入力します。</li>
          <li>
            単位を <code>px</code> / <code>rem</code> で切り替えられます。
          </li>
          <li>
            生成された <code>clamp()</code> 値をコピーして CSS に貼り付けます。
          </li>
          <li>グラフのガイドラインは最小・最大ビューポート幅を示します。</li>
        </ul>
        <details>
          <summary>計算式</summary>
          <div className="cfc-formula">
            <div className="cfc-formula-code">
              slope = (maxValue - minValue) / (maxVp - minVp)
              <br />
              intercept = minValue - slope × minVp
              <br />
              preferred = slope × 100vw + intercept
              <br />
              clamp(minValue, preferred, maxValue)
            </div>
          </div>
        </details>
      </TipsCard>
    </div>
  );
}
