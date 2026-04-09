import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  CSS_UNITS,
  DEFAULT_CONTEXT,
  convertAllUnits,
  formatCssValue,
  type CssUnitId,
  type CssConversionContext,
} from "~/utils/css-unit";

export const Route = createFileRoute("/css-unit")({
  head: () => ({
    meta: [
      { title: "CSS単位変換 | Web ツール集" },
      {
        name: "description",
        content:
          "px・rem・em・vw・vh・%・pt・cm・mm・in などの CSS 単位をリアルタイムで相互変換。ベースフォントサイズやビューポートサイズも設定可能。",
      },
      { property: "og:title", content: "CSS単位変換 | Web ツール集" },
      {
        property: "og:description",
        content: "CSS 単位（px/rem/em/vw/vh/%/pt/cm/mm/in）をリアルタイム相互変換するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-unit` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "CSS単位変換 | Web ツール集" },
      {
        name: "twitter:description",
        content: "CSS 単位をリアルタイムで相互変換するツール。",
      },
    ],
  }),
  component: CssUnitConverter,
});

/** 数値入力のパース（正の有限数のみ許可） */
function parsePositiveNumber(s: string): number | null {
  if (s.trim() === "") return null;
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** 入力値のパース（任意の有限数を許可） */
function parseFiniteNumber(s: string): number | null {
  if (s.trim() === "") return null;
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

function CssUnitConverter() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();

  // 入力値と変換元単位
  const [inputValue, setInputValue] = useState("16");
  const [fromUnit, setFromUnit] = useState<CssUnitId>("px");

  // 設定パネルの開閉
  const [settingsOpen, setSettingsOpen] = useState(false);

  // コンテキスト設定
  const [rootFontSizeStr, setRootFontSizeStr] = useState("16");
  const [parentFontSizeStr, setParentFontSizeStr] = useState("16");
  const [viewportWidthStr, setViewportWidthStr] = useState("1920");
  const [viewportHeightStr, setViewportHeightStr] = useState("1080");
  const [parentSizeStr, setParentSizeStr] = useState("1000");

  // コンテキストオブジェクト
  const ctx: CssConversionContext = useMemo(
    () => ({
      rootFontSize: parsePositiveNumber(rootFontSizeStr) ?? DEFAULT_CONTEXT.rootFontSize,
      parentFontSize: parsePositiveNumber(parentFontSizeStr) ?? DEFAULT_CONTEXT.parentFontSize,
      viewportWidth: parsePositiveNumber(viewportWidthStr) ?? DEFAULT_CONTEXT.viewportWidth,
      viewportHeight: parsePositiveNumber(viewportHeightStr) ?? DEFAULT_CONTEXT.viewportHeight,
      parentSize: parsePositiveNumber(parentSizeStr) ?? DEFAULT_CONTEXT.parentSize,
    }),
    [rootFontSizeStr, parentFontSizeStr, viewportWidthStr, viewportHeightStr, parentSizeStr],
  );

  // 入力値の数値パース
  const parsedInput = useMemo(() => parseFiniteNumber(inputValue), [inputValue]);

  // 全単位への変換結果
  const results = useMemo(() => {
    if (parsedInput === null) return null;
    return convertAllUnits(parsedInput, fromUnit, ctx);
  }, [parsedInput, fromUnit, ctx]);

  const handleCopy = useCallback(
    async (unitId: CssUnitId, value: number) => {
      const text = `${formatCssValue(value)}${unitId}`;
      const success = await copy(text);
      if (success) {
        showToast(`${text} をコピーしました`, "success");
        announceStatus(`${text} をコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus],
  );

  const handleUnitClick = useCallback((unitId: CssUnitId, value: number | null) => {
    if (value === null) return;
    setFromUnit(unitId);
    setInputValue(formatCssValue(value));
  }, []);

  return (
    <>
      <div className="tool-container">
        {/* 入力エリア */}
        <div className="css-unit-input-row">
          <div className="css-unit-input-group">
            <label htmlFor="css-unit-value" className="css-unit-input-label">
              値
            </label>
            <input
              id="css-unit-value"
              type="number"
              className="css-unit-value-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="例: 16"
              aria-label="変換する値"
            />
          </div>

          <div className="css-unit-input-group">
            <label className="css-unit-input-label">単位</label>
            <div className="css-unit-selector" role="group" aria-label="変換元の単位を選択">
              {CSS_UNITS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`css-unit-tab${fromUnit === u.id ? " active" : ""}`}
                  onClick={() => setFromUnit(u.id)}
                  aria-pressed={fromUnit === u.id}
                  aria-label={`${u.name}: ${u.description}`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 設定パネル */}
        <details
          className="css-unit-settings"
          open={settingsOpen}
          onToggle={(e) => setSettingsOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="css-unit-settings-summary">
            <span>⚙ 設定（コンテキスト依存単位の基準値）</span>
            <span className="css-unit-settings-arrow" aria-hidden="true">
              {settingsOpen ? "▲" : "▼"}
            </span>
          </summary>
          <div className="css-unit-settings-grid">
            <div className="css-unit-setting-field">
              <label htmlFor="css-unit-root-font">
                ルートフォントサイズ
                <span className="css-unit-setting-hint">rem の基準</span>
              </label>
              <div className="css-unit-setting-input-wrap">
                <input
                  id="css-unit-root-font"
                  type="number"
                  min={1}
                  value={rootFontSizeStr}
                  onChange={(e) => setRootFontSizeStr(e.target.value)}
                  aria-label="ルートフォントサイズ（px）"
                />
                <span className="css-unit-setting-unit">px</span>
              </div>
            </div>

            <div className="css-unit-setting-field">
              <label htmlFor="css-unit-parent-font">
                親フォントサイズ
                <span className="css-unit-setting-hint">em の基準</span>
              </label>
              <div className="css-unit-setting-input-wrap">
                <input
                  id="css-unit-parent-font"
                  type="number"
                  min={1}
                  value={parentFontSizeStr}
                  onChange={(e) => setParentFontSizeStr(e.target.value)}
                  aria-label="親フォントサイズ（px）"
                />
                <span className="css-unit-setting-unit">px</span>
              </div>
            </div>

            <div className="css-unit-setting-field">
              <label htmlFor="css-unit-vw">
                ビューポート幅
                <span className="css-unit-setting-hint">vw の基準</span>
              </label>
              <div className="css-unit-setting-input-wrap">
                <input
                  id="css-unit-vw"
                  type="number"
                  min={1}
                  value={viewportWidthStr}
                  onChange={(e) => setViewportWidthStr(e.target.value)}
                  aria-label="ビューポート幅（px）"
                />
                <span className="css-unit-setting-unit">px</span>
              </div>
            </div>

            <div className="css-unit-setting-field">
              <label htmlFor="css-unit-vh">
                ビューポート高さ
                <span className="css-unit-setting-hint">vh の基準</span>
              </label>
              <div className="css-unit-setting-input-wrap">
                <input
                  id="css-unit-vh"
                  type="number"
                  min={1}
                  value={viewportHeightStr}
                  onChange={(e) => setViewportHeightStr(e.target.value)}
                  aria-label="ビューポート高さ（px）"
                />
                <span className="css-unit-setting-unit">px</span>
              </div>
            </div>

            <div className="css-unit-setting-field">
              <label htmlFor="css-unit-parent-size">
                親要素サイズ
                <span className="css-unit-setting-hint">% の基準</span>
              </label>
              <div className="css-unit-setting-input-wrap">
                <input
                  id="css-unit-parent-size"
                  type="number"
                  min={1}
                  value={parentSizeStr}
                  onChange={(e) => setParentSizeStr(e.target.value)}
                  aria-label="親要素サイズ（px）"
                />
                <span className="css-unit-setting-unit">px</span>
              </div>
            </div>
          </div>
        </details>

        {/* 変換結果グリッド */}
        {results !== null ? (
          <div className="css-unit-results" role="list" aria-label="CSS 単位変換結果">
            {CSS_UNITS.map((unit) => {
              const value = results[unit.id];
              const formatted = value !== null ? formatCssValue(value) : null;
              const isActive = unit.id === fromUnit;

              return (
                <div
                  key={unit.id}
                  className={`css-unit-result-item${isActive ? " active" : ""}`}
                  role="listitem"
                >
                  <div className="css-unit-result-header">
                    <span className="css-unit-result-name">{unit.name}</span>
                    {unit.contextDependent && (
                      <span
                        className="css-unit-result-badge"
                        title="コンテキスト設定の影響を受ける単位"
                        aria-label="コンテキスト依存"
                      >
                        ctx
                      </span>
                    )}
                  </div>
                  <div className="css-unit-result-desc">{unit.description}</div>
                  <div className="css-unit-result-value-row">
                    <button
                      type="button"
                      className="css-unit-result-value"
                      onClick={() => value !== null && handleUnitClick(unit.id, value)}
                      disabled={value === null}
                      aria-label={
                        formatted !== null
                          ? `${formatted}${unit.id} をクリックして入力欄に設定`
                          : "計算できません"
                      }
                      title="クリックすると入力欄にセット"
                    >
                      <code>{formatted !== null ? `${formatted}${unit.id}` : "—"}</code>
                    </button>
                    <button
                      type="button"
                      className="css-unit-copy-btn"
                      onClick={() => value !== null && handleCopy(unit.id, value)}
                      disabled={value === null}
                      aria-label={`${unit.name} の値をコピー`}
                    >
                      コピー
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="css-unit-empty" aria-live="polite">
            <p>値を入力すると、全 CSS 単位への変換結果が表示されます</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「値」に数値を入力し、変換元の単位を選択すると全単位への変換結果を一覧表示します",
                "結果の値をクリックすると、その値を入力欄に反映して別単位から再変換できます",
                "「コピー」ボタンで「値+単位」をクリップボードにコピーします",
                "「設定」を開くと rem・em・vw・vh・% の基準値を変更できます",
              ],
            },
            {
              title: "単位の説明",
              items: [
                "px — 画面のピクセル数。最も基本的な絶対単位",
                "rem — ルート要素（html）のフォントサイズ基準（通常 16px）",
                "em — 親要素のフォントサイズ基準（ネスト構造に注意）",
                "vw / vh — ビューポートの幅 / 高さの 1%",
                "% — 親要素のサイズの 1%",
                "pt / pc — 印刷用単位（1pt ≈ 1.333px、1pc = 16px）",
                "cm / mm / in — 実際の物理的な長さ（96dpi 基準）",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
