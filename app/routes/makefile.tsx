import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo } from "react";
import { useToast } from "~/components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  generateMakefile,
  getTemplates,
  type ProjectType,
} from "~/utils/makefile";

export const Route = createFileRoute("/makefile")({
  head: () => ({
    meta: [
      { title: "Makefileジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "Node.js・Python・Go・Rust・C/C++など主要プロジェクト向けのMakefileを自動生成します。Docker・リントターゲットのオプション付き。",
      },
      {
        property: "og:title",
        content: "Makefileジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Node.js・Python・Go・Rust・C/C++など主要プロジェクト向けのMakefileを自動生成します。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/makefile` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Makefileジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "Node.js・Python・Go・Rust・C/C++など主要プロジェクト向けのMakefileを自動生成します。",
      },
    ],
  }),
  component: MakefilePage,
});

function MakefilePage() {
  const { showToast } = useToast();
  const [projectType, setProjectType] = useState<ProjectType>("nodejs");
  const [appName, setAppName] = useState("app");
  const [includeDocker, setIncludeDocker] = useState(false);
  const [includeLint, setIncludeLint] = useState(true);

  const templates = useMemo(() => getTemplates(), []);

  const output = useMemo(
    () =>
      generateMakefile({ projectType, appName, includeDocker, includeLint }),
    [projectType, appName, includeDocker, includeLint]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      showToast("クリップボードにコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Makefile";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Makefileをダウンロードしました", "success");
  };

  const selectedTemplate = templates.find((t) => t.id === projectType);

  return (
    <div className="tool-container">
      {/* 設定セクション */}
      <div className="converter-section">
        <h2 className="section-title">設定</h2>

        {/* プロジェクト種別 */}
        <div className="makefile-field-group">
          <label className="makefile-field-label" id="project-type-label">
            プロジェクト種別
          </label>
          <div
            className="makefile-type-grid"
            role="radiogroup"
            aria-labelledby="project-type-label"
          >
            {templates.map((template) => (
              <label
                key={template.id}
                className={`makefile-type-item ${projectType === template.id ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="projectType"
                  value={template.id}
                  checked={projectType === template.id}
                  onChange={() => setProjectType(template.id)}
                  className="makefile-type-radio"
                  aria-label={`${template.label}（${template.description}）`}
                />
                <span className="makefile-type-name">{template.label}</span>
                <span className="makefile-type-desc">
                  {template.description}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* アプリ名 */}
        <div className="makefile-field-group">
          <label htmlFor="app-name" className="makefile-field-label">
            アプリケーション名
          </label>
          <input
            id="app-name"
            type="text"
            className="makefile-text-input"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="app"
            aria-describedby="app-name-hint"
          />
          <p id="app-name-hint" className="makefile-field-hint">
            バイナリ名やアプリ名として使用されます
          </p>
        </div>

        {/* オプション */}
        <div className="makefile-field-group">
          <span className="makefile-field-label" id="options-label">
            オプション
          </span>
          <div
            className="makefile-options-group"
            role="group"
            aria-labelledby="options-label"
          >
            <label className="makefile-option-item">
              <input
                type="checkbox"
                className="makefile-option-checkbox"
                checked={includeLint}
                onChange={(e) => setIncludeLint(e.target.checked)}
                aria-label="リント・フォーマットターゲットを含む"
              />
              <span className="makefile-option-label">
                リント・フォーマットターゲットを含む
              </span>
            </label>
            <label className="makefile-option-item">
              <input
                type="checkbox"
                className="makefile-option-checkbox"
                checked={includeDocker}
                onChange={(e) => setIncludeDocker(e.target.checked)}
                aria-label="Dockerターゲットを含む"
              />
              <span className="makefile-option-label">
                Dockerターゲットを含む
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 出力セクション */}
      <div className="converter-section">
        <div className="makefile-output-header">
          <h2 className="section-title">
            生成された Makefile
            {selectedTemplate && (
              <span className="makefile-type-badge">
                {selectedTemplate.label}
              </span>
            )}
          </h2>
          <div className="makefile-action-buttons">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopy}
              aria-label="Makefileをクリップボードにコピー"
            >
              コピー
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              aria-label="Makefileをダウンロード"
            >
              ダウンロード
            </button>
          </div>
        </div>
        <textarea
          className="makefile-output-area"
          value={output}
          readOnly
          aria-label="生成されたMakefileの内容"
          aria-readonly="true"
        />
      </div>

      {/* ヒント */}
      <TipsCard>
        <ul>
          <li>
            <strong>タブ文字必須</strong>:
            Makefileのレシピ行はスペースではなくタブ文字で始まる必要があります。
          </li>
          <li>
            <strong>.PHONY</strong>:
            ファイルを生成しないターゲットは<code>.PHONY</code>に登録しましょう。
          </li>
          <li>
            <strong>help ターゲット</strong>:
            <code>make help</code>で利用可能なターゲット一覧を表示できます。
          </li>
          <li>
            <strong>変数のオーバーライド</strong>:{" "}
            <code>make build APP_NAME=myapp</code>のようにコマンドラインから変数を上書きできます。
          </li>
        </ul>
      </TipsCard>
    </div>
  );
}
