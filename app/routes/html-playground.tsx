import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { buildDocument, SAMPLES, PANEL_TAB_LABELS, type PanelTab } from "../utils/html-playground";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import "../styles/tools/html-playground.css";

export const Route = createFileRoute("/html-playground")({
  head: () => ({
    meta: [
      { title: "HTML/CSS/JS プレイグラウンド | Web ツール集" },
      {
        name: "description",
        content:
          "HTML・CSS・JavaScript をブラウザ内で編集してリアルタイムにプレビューできるライブエディター。サンドボックス環境で安全に動作。スタンドアロン HTML としてエクスポート可能。",
      },
      { property: "og:title", content: "HTML/CSS/JS プレイグラウンド | Web ツール集" },
      {
        property: "og:description",
        content:
          "HTML・CSS・JavaScript をブラウザ内で編集してリアルタイムプレビュー。サンドボックス環境で安全に動作。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/html-playground` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "HTML/CSS/JS プレイグラウンド | Web ツール集" },
      {
        name: "twitter:description",
        content: "HTML・CSS・JavaScript をブラウザ内で編集してリアルタイムプレビュー。",
      },
    ],
  }),
  component: HtmlPlaygroundPage,
});

/**
 * HTML/CSS/JS プレイグラウンドページ
 */
function HtmlPlaygroundPage() {
  const [activeTab, setActiveTab] = useState<PanelTab>("html");
  const [htmlCode, setHtmlCode] = useState(SAMPLES[0].html);
  const [cssCode, setCssCode] = useState(SAMPLES[0].css);
  const [jsCode, setJsCode] = useState(SAMPLES[0].js);
  const [selectedSample, setSelectedSample] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { copy } = useClipboard();

  // -------------------------------------------------------------------------
  // プレビュー更新
  // -------------------------------------------------------------------------
  const updatePreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = buildDocument(htmlCode, cssCode, jsCode);
    iframe.srcdoc = doc;
  }, [htmlCode, cssCode, jsCode]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // -------------------------------------------------------------------------
  // サンプル選択
  // -------------------------------------------------------------------------
  const handleSampleChange = useCallback((index: number) => {
    const sample = SAMPLES[index];
    setSelectedSample(index);
    setHtmlCode(sample.html);
    setCssCode(sample.css);
    setJsCode(sample.js);
  }, []);

  // -------------------------------------------------------------------------
  // クリア
  // -------------------------------------------------------------------------
  const handleClear = useCallback(() => {
    setHtmlCode("");
    setCssCode("");
    setJsCode("");
    setSelectedSample(-1);
  }, []);

  // -------------------------------------------------------------------------
  // HTML エクスポート（スタンドアロン HTML をコピー）
  // -------------------------------------------------------------------------
  const handleExportHtml = useCallback(() => {
    const doc = buildDocument(htmlCode, cssCode, jsCode);
    copy(doc);
  }, [htmlCode, cssCode, jsCode, copy]);

  // -------------------------------------------------------------------------
  // 現在のタブのコード値と setter
  // -------------------------------------------------------------------------
  const codeValue = activeTab === "html" ? htmlCode : activeTab === "css" ? cssCode : jsCode;

  const setCodeValue = useCallback(
    (value: string) => {
      if (activeTab === "html") setHtmlCode(value);
      else if (activeTab === "css") setCssCode(value);
      else setJsCode(value);
    },
    [activeTab],
  );

  const tabPlaceholders: Record<PanelTab, string> = {
    html: '<div class="hello">\n  <h1>Hello, World!</h1>\n</div>',
    css: ".hello {\n  font-family: sans-serif;\n  color: #333;\n}",
    js: 'console.log("Hello!");',
  };

  return (
    <div className="tool-container">
      {/* ツールバー */}
      <div className="hp-toolbar">
        <label htmlFor="hp-sample-select" className="hp-sample-label">
          サンプル:
        </label>
        <select
          id="hp-sample-select"
          className="hp-sample-select"
          value={selectedSample}
          onChange={(e) => handleSampleChange(Number(e.target.value))}
          aria-label="サンプルコードを選択"
        >
          {SAMPLES.map((s, i) => (
            <option key={s.name} value={i}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleExportHtml}
          aria-label="スタンドアロン HTML をクリップボードにコピー"
        >
          HTML をコピー
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleClear}
          aria-label="すべてのコードをクリア"
        >
          クリア
        </button>
      </div>

      {/* メインレイアウト */}
      <div className="hp-layout">
        {/* エディターパネル */}
        <div className="hp-editor-panel">
          {/* タブ切替 */}
          <div className="hp-tabs" role="tablist" aria-label="コードエディタータブ">
            {(["html", "css", "js"] as PanelTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                className={`hp-tab-btn${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
                aria-selected={activeTab === tab}
                aria-controls={`hp-panel-${tab}`}
                id={`hp-tab-${tab}`}
              >
                {PANEL_TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* コードエディター */}
          <textarea
            id={`hp-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`hp-tab-${activeTab}`}
            className="hp-code-area"
            value={codeValue}
            onChange={(e) => setCodeValue(e.target.value)}
            placeholder={tabPlaceholders[activeTab]}
            spellCheck={false}
            aria-label={`${PANEL_TAB_LABELS[activeTab]} コードエディター`}
            aria-multiline="true"
          />
        </div>

        {/* プレビューパネル */}
        <div className="hp-preview-panel">
          <div className="hp-preview-header">
            <span className="hp-preview-title">▶ プレビュー</span>
            <div className="hp-preview-actions">
              <button
                type="button"
                className="btn-copy"
                onClick={updatePreview}
                aria-label="プレビューを手動更新"
              >
                更新
              </button>
            </div>
          </div>
          <iframe
            ref={iframeRef}
            className="hp-iframe"
            title="HTML プレビュー"
            sandbox="allow-scripts"
            aria-label="HTML/CSS/JS プレビュー領域"
          />
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "使い方",
            items: [
              "HTML・CSS・JavaScript タブでそれぞれのコードを編集すると、右側にリアルタイムでプレビューが表示されます",
              "「サンプル」セレクターからプリセットコードを読み込めます",
              "「HTML をコピー」でスタンドアロンの HTML ファイルとしてクリップボードにコピーできます",
              "「更新」ボタンでプレビューを手動で再レンダリングします",
            ],
          },
          {
            title: "注意事項",
            items: [
              "プレビューは sandbox 属性付き iframe で実行されるため、外部リソース（CDN, 画像 URL など）の読み込みはできません",
              "alert() / confirm() / prompt() などのダイアログは sandbox 制限により動作しません",
              "外部 API へのフェッチリクエストは CORS 制限により制限されます",
              "コードはすべてブラウザ内で処理されるため、外部に送信されることはありません",
            ],
          },
        ]}
      />
    </div>
  );
}
