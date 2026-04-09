import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useToast } from "../components/Toast";
import {
  parseCssVariables,
  exportAsCss,
  exportAsJson,
  exportAsJs,
  type CssVariable,
} from "../utils/css-variables";
import "../styles/tools/css-variables.css";

export const Route = createFileRoute("/css-variables")({
  head: () => ({
    meta: [
      { title: "CSS Custom Properties エクストラクター | Web ツール集" },
      {
        name: "description",
        content:
          "CSSテキストからカスタムプロパティ（CSS変数）を抽出・一覧表示するツール。カラープレビュー付き。CSS・JSON・TypeScript形式でエクスポート可能。",
      },
      {
        property: "og:title",
        content: "CSS Custom Properties エクストラクター | Web ツール集",
      },
      {
        property: "og:description",
        content: "CSSからカスタムプロパティを抽出・可視化。カラープレビュー＆多形式エクスポート。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-variables` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Custom Properties エクストラクター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "CSSからカスタムプロパティを抽出・可視化。",
      },
    ],
  }),
  component: CssVariablesPage,
});

/** サンプルCSSデータ */
const SAMPLES: { label: string; css: string }[] = [
  {
    label: "Material Design",
    css: `:root {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-on-primary-container: #21005d;
  --md-sys-color-secondary: #625b71;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #e8def8;
  --md-sys-color-background: #fffbfe;
  --md-sys-color-surface: #fffbfe;
  --md-sys-color-on-surface: #1c1b1f;
  --md-sys-color-error: #b3261e;
  --md-sys-color-on-error: #ffffff;
}`,
  },
  {
    label: "デザイントークン",
    css: `:root {
  /* スペーシング */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 48px;

  /* フォント */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-weight-normal: 400;
  --font-weight-bold: 700;

  /* ボーダー半径 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}

.dark {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --text-primary: #c9d1d9;
  --text-secondary: #8b949e;
  --border-color: #30363d;
  --accent: #58a6ff;
}

.light {
  --bg-primary: #ffffff;
  --bg-secondary: #f6f8fa;
  --text-primary: #24292f;
  --text-secondary: #57606a;
  --border-color: #d0d7de;
  --accent: #0969da;
}`,
  },
  {
    label: "Tailwind風",
    css: `:root {
  --color-slate-50: #f8fafc;
  --color-slate-100: #f1f5f9;
  --color-slate-200: #e2e8f0;
  --color-slate-300: #cbd5e1;
  --color-slate-400: #94a3b8;
  --color-slate-500: #64748b;
  --color-slate-600: #475569;
  --color-slate-700: #334155;
  --color-slate-800: #1e293b;
  --color-slate-900: #0f172a;
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-green-500: #22c55e;
  --color-red-500: #ef4444;
  --color-yellow-500: #eab308;
}`,
  },
];

/** エクスポート形式 */
type ExportFormat = "css" | "json" | "js";

/**
 * CSS Custom Properties エクストラクターページ
 */
function CssVariablesPage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectorFilter, setSelectorFilter] = useState("");
  const [colorOnly, setColorOnly] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("css");
  const { showToast } = useToast();

  const parseResult = useMemo(() => parseCssVariables(input), [input]);

  const allSelectors = useMemo(() => {
    const set = new Set(parseResult.variables.map((v) => v.selector));
    return Array.from(set).sort();
  }, [parseResult.variables]);

  const filtered = useMemo(() => {
    return parseResult.variables.filter((v) => {
      if (search && !v.name.includes(search) && !v.value.includes(search)) return false;
      if (selectorFilter && v.selector !== selectorFilter) return false;
      if (colorOnly && !v.isColor) return false;
      return true;
    });
  }, [parseResult.variables, search, selectorFilter, colorOnly]);

  const exportText = useMemo(() => {
    if (filtered.length === 0) return "";
    switch (exportFormat) {
      case "css":
        return exportAsCss(filtered);
      case "json":
        return exportAsJson(filtered);
      case "js":
        return exportAsJs(filtered);
    }
  }, [filtered, exportFormat]);

  const colorCount = useMemo(
    () => parseResult.variables.filter((v) => v.isColor).length,
    [parseResult.variables],
  );

  const copyValue = useCallback(
    (v: CssVariable) => {
      navigator.clipboard
        .writeText(`${v.name}: ${v.value}`)
        .then(() => showToast(`コピーしました: ${v.name}`, "success"))
        .catch(() => showToast("コピーに失敗しました", "error"));
    },
    [showToast],
  );

  const copyExport = useCallback(() => {
    if (!exportText) return;
    navigator.clipboard
      .writeText(exportText)
      .then(() => showToast("エクスポートをコピーしました", "success"))
      .catch(() => showToast("コピーに失敗しました", "error"));
  }, [exportText, showToast]);

  const loadSample = useCallback((css: string) => {
    setInput(css);
  }, []);

  const clear = useCallback(() => {
    setInput("");
    setSearch("");
    setSelectorFilter("");
    setColorOnly(false);
  }, []);

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1 className="tool-title">CSS Custom Properties エクストラクター</h1>
        <p className="tool-description">
          CSSテキストからカスタムプロパティ（CSS変数）を抽出・一覧表示します。
          カラー値にはプレビューを表示し、CSS・JSON・TypeScript形式でエクスポートできます。
        </p>
      </div>

      <div className="css-variables-layout">
        {/* 左: 入力 */}
        <div className="css-variables-input-section">
          <div className="css-variables-samples">
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                className="css-variables-sample-btn"
                onClick={() => loadSample(s.css)}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>

          <textarea
            className="css-variables-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`:root {\n  --color-primary: #6750a4;\n  --spacing-md: 16px;\n  /* カスタムプロパティを貼り付けてください */\n}`}
            aria-label="CSS入力"
            spellCheck={false}
          />

          <div className="css-variables-controls">
            <button className="css-variables-btn" onClick={clear} type="button">
              クリア
            </button>
          </div>
        </div>

        {/* 右: 結果 */}
        <div className="css-variables-result-section">
          {/* 統計 */}
          {parseResult.variables.length > 0 && (
            <div className="css-variables-stats" role="status" aria-live="polite">
              <span className="css-variables-stat">
                変数:{" "}
                <span className="css-variables-stat-value">{parseResult.variables.length}</span>
              </span>
              <span className="css-variables-stat">
                カラー: <span className="css-variables-stat-value">{colorCount}</span>
              </span>
              <span className="css-variables-stat">
                セレクター: <span className="css-variables-stat-value">{allSelectors.length}</span>
              </span>
              {filtered.length !== parseResult.variables.length && (
                <span className="css-variables-stat">
                  表示中: <span className="css-variables-stat-value">{filtered.length}</span>
                </span>
              )}
            </div>
          )}

          {/* フィルター */}
          {parseResult.variables.length > 0 && (
            <div className="css-variables-filter">
              <input
                className="css-variables-search"
                type="search"
                placeholder="変数名・値で検索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="変数を検索"
              />
              <select
                className="css-variables-select"
                value={selectorFilter}
                onChange={(e) => setSelectorFilter(e.target.value)}
                aria-label="セレクターでフィルター"
              >
                <option value="">全セレクター</option>
                {allSelectors.map((sel) => (
                  <option key={sel} value={sel}>
                    {sel.length > 24 ? sel.slice(0, 24) + "…" : sel}
                  </option>
                ))}
              </select>
              <button
                className={`css-variables-btn${colorOnly ? " css-variables-btn--primary" : ""}`}
                onClick={() => setColorOnly((v) => !v)}
                type="button"
                aria-pressed={colorOnly}
              >
                🎨 カラーのみ
              </button>
            </div>
          )}

          {/* 変数リスト */}
          {parseResult.variables.length === 0 ? (
            <div className="css-variables-empty" aria-label="結果なし">
              CSSを左に貼り付けると
              <br />
              カスタムプロパティを抽出します
            </div>
          ) : filtered.length === 0 ? (
            <div className="css-variables-empty">フィルター条件に一致する変数がありません</div>
          ) : (
            <div className="css-variables-list" role="list" aria-label="抽出された変数一覧">
              {filtered.map((v, i) => (
                <div
                  key={`${v.selector}|${v.name}|${i}`}
                  className="css-variables-item"
                  role="listitem"
                >
                  <div
                    className={`css-variables-swatch${v.colorValue ? " css-variables-swatch--color" : ""}`}
                    style={v.colorValue ? { backgroundColor: v.colorValue } : undefined}
                    aria-hidden="true"
                    title={v.isColor ? v.value : undefined}
                  />
                  <div className="css-variables-item-info">
                    <span className="css-variables-name" title={v.name}>
                      {v.name}
                    </span>
                    <span className="css-variables-value" title={v.value}>
                      {v.value}
                    </span>
                  </div>
                  <span className="css-variables-selector-badge" title={v.selector}>
                    {v.selector}
                  </span>
                  <button
                    className="css-variables-copy-btn"
                    onClick={() => copyValue(v)}
                    type="button"
                    aria-label={`${v.name} の値をコピー`}
                    title="コピー"
                  >
                    コピー
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* エクスポート */}
          {filtered.length > 0 && (
            <div className="css-variables-export">
              <div
                className="css-variables-export-tabs"
                role="tablist"
                aria-label="エクスポート形式"
              >
                {(["css", "json", "js"] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    className={`css-variables-export-tab${exportFormat === fmt ? " css-variables-export-tab--active" : ""}`}
                    onClick={() => setExportFormat(fmt)}
                    type="button"
                    role="tab"
                    aria-selected={exportFormat === fmt}
                  >
                    {fmt === "css" ? "CSS" : fmt === "json" ? "JSON" : "TypeScript"}
                  </button>
                ))}
              </div>
              <textarea
                className="css-variables-export-output"
                value={exportText}
                readOnly
                aria-label="エクスポート出力"
                aria-describedby="export-format-label"
              />
              <div>
                <button
                  className="css-variables-btn css-variables-btn--primary"
                  onClick={copyExport}
                  type="button"
                >
                  エクスポートをコピー
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
