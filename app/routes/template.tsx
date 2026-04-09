import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { renderTemplate, TEMPLATE_SAMPLES, type RenderResult } from "../utils/template-engine";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import "../styles/tools/template.css";

export const Route = createFileRoute("/template")({
  head: () => ({
    meta: [
      { title: "Mustache テンプレートエンジン | Web ツール集" },
      {
        name: "description",
        content:
          "Mustache 構文のテンプレートを JSON データでレンダリングするツール。{{variable}}・{{#section}}・{{^inverted}} などの構文をブラウザ内でリアルタイム展開。",
      },
      { property: "og:title", content: "Mustache テンプレートエンジン | Web ツール集" },
      {
        property: "og:description",
        content:
          "Mustache テンプレートを JSON データでリアルタイムレンダリング。変数展開・ループ・条件分岐に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/template` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Mustache テンプレートエンジン | Web ツール集" },
      {
        name: "twitter:description",
        content: "Mustache テンプレートを JSON データでリアルタイムレンダリング。",
      },
    ],
  }),
  component: TemplatePage,
});

/**
 * Mustache テンプレートエンジンページ
 */
function TemplatePage() {
  const [templateText, setTemplateText] = useState(TEMPLATE_SAMPLES[0]!.template);
  const [jsonData, setJsonData] = useState(TEMPLATE_SAMPLES[0]!.data);
  const [result, setResult] = useState<RenderResult>({ output: "", error: null });
  const [selectedSample, setSelectedSample] = useState(0);

  const { copy } = useClipboard();

  // テンプレートまたはJSONが変更されたらリアルタイムでレンダリング
  useEffect(() => {
    const res = renderTemplate(templateText, jsonData);
    setResult(res);
  }, [templateText, jsonData]);

  const handleSampleChange = useCallback((index: number) => {
    const sample = TEMPLATE_SAMPLES[index];
    if (!sample) return;
    setSelectedSample(index);
    setTemplateText(sample.template);
    setJsonData(sample.data);
  }, []);

  const handleClear = useCallback(() => {
    setTemplateText("");
    setJsonData("{}");
    setResult({ output: "", error: null });
  }, []);

  return (
    <div className="tool-container">
      {/* サンプル選択 */}
      <div className="tmpl-samples-row">
        <span className="tmpl-samples-label">サンプル:</span>
        <div className="tmpl-samples-list" role="list">
          {TEMPLATE_SAMPLES.map((sample, index) => (
            <button
              key={sample.name}
              type="button"
              role="listitem"
              className={`tmpl-sample-btn${selectedSample === index ? " active" : ""}`}
              onClick={() => handleSampleChange(index)}
              aria-pressed={selectedSample === index}
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* 入力エリア: テンプレートとJSONデータを横並び */}
      <div className="tmpl-input-grid">
        {/* テンプレート入力 */}
        <div className="tmpl-input-panel">
          <div className="tmpl-panel-header">
            <label className="tmpl-panel-title" htmlFor="tmpl-template-input">
              テンプレート
              <span className="tmpl-panel-badge">Mustache</span>
            </label>
            <span
              className="tmpl-char-count"
              aria-label={`テンプレート文字数: ${templateText.length}`}
            >
              {templateText.length} 文字
            </span>
          </div>
          <textarea
            id="tmpl-template-input"
            className="tmpl-textarea"
            placeholder={`例:\nこんにちは、{{name}} さん！\n{{#items}}\n- {{.}}\n{{/items}}`}
            value={templateText}
            onChange={(e) => setTemplateText(e.target.value)}
            aria-label="Mustache テンプレート入力"
            spellCheck={false}
          />
        </div>

        {/* JSONデータ入力 */}
        <div className="tmpl-input-panel">
          <div className="tmpl-panel-header">
            <label className="tmpl-panel-title" htmlFor="tmpl-json-input">
              データ
              <span className="tmpl-panel-badge">JSON</span>
            </label>
          </div>
          <textarea
            id="tmpl-json-input"
            className="tmpl-textarea"
            placeholder={`{\n  "name": "山田太郎"\n}`}
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            aria-label="JSON データ入力"
            spellCheck={false}
          />
        </div>
      </div>

      {/* アクションボタン */}
      <div className="tmpl-action-row">
        <button type="button" className="btn-secondary" onClick={handleClear}>
          クリア
        </button>
      </div>

      {/* 出力エリア */}
      <div className="tmpl-output-section">
        <div className="tmpl-output-header">
          <span className="tmpl-output-title">レンダリング結果</span>
          {result.output && !result.error && (
            <button
              type="button"
              className="btn-copy"
              onClick={() => copy(result.output)}
              aria-label="結果をコピー"
            >
              コピー
            </button>
          )}
        </div>

        {/* エラー表示 */}
        {result.error && (
          <div className="tmpl-error" role="alert" aria-live="assertive">
            <span className="tmpl-error-icon" aria-hidden="true">
              ⚠️
            </span>
            <span>{result.error}</span>
          </div>
        )}

        {/* 出力表示 */}
        {!result.error && (
          <pre className="tmpl-output" aria-label="レンダリング結果" aria-live="polite">
            {result.output || (
              <span className="tmpl-output-placeholder">
                テンプレートとデータを入力するとここにレンダリング結果が表示されます
              </span>
            )}
          </pre>
        )}
      </div>

      <TipsCard
        sections={[
          {
            title: "Mustache 構文リファレンス",
            items: [
              "{{variable}} — 変数を展開（< > & などはHTMLエスケープ済み）",
              "{{{variable}}} または {{&variable}} — HTMLエスケープなしで展開",
              "{{#section}}...{{/section}} — セクション: truthy なら表示、配列ならループ",
              "{{^inverted}}...{{/inverted}} — 逆セクション: falsy なら表示",
              "{{! comment }} — コメント（出力されない）",
              "{{.}} — 現在のコンテキスト（配列ループ内で各要素を参照）",
              "{{a.b.c}} — ドット記法でネストされたプロパティを参照",
            ],
          },
          {
            title: "よく使う例",
            items: [
              "変数展開: Hello, {{name}}! → Hello, 山田太郎!",
              "配列ループ: {{#items}}- {{name}}: {{price}}円{{/items}}",
              "条件表示: {{#isLoggedIn}}ログイン中{{/isLoggedIn}}",
              "非表示条件: {{^hasError}}正常です{{/hasError}}",
              "ネストアクセス: {{user.address.city}} → 東京",
              "HTMLそのまま出力: {{{htmlContent}}}",
            ],
          },
        ]}
      />
    </div>
  );
}
