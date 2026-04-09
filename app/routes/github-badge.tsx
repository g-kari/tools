import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  type BadgeConfig,
  type BadgeStyle,
  BADGE_STYLES,
  BADGE_COLORS,
  POPULAR_LOGOS,
  generateBadgeUrl,
  generateBadgeMarkdown,
  generateBadgeHtml,
} from "../utils/github-badge";

export const Route = createFileRoute("/github-badge")({
  head: () => ({
    meta: [
      { title: "GitHubバッジジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "shields.io を使った GitHub README バッジを簡単に生成。ラベル・メッセージ・色・スタイル・ロゴをカスタマイズしてMarkdown/HTML/URLをワンクリックコピー。",
      },
      {
        property: "og:title",
        content: "GitHubバッジジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "shields.io を使った GitHub README バッジを簡単に生成。ラベル・メッセージ・色・スタイル・ロゴをカスタマイズしてMarkdown/HTML/URLをワンクリックコピー。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/github-badge` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: GithubBadgeGenerator,
});

/** コピー対象のタブ */
type CopyTab = "markdown" | "html" | "url";

/** プリセットバッジ */
const PRESET_BADGES: { label: string; config: BadgeConfig }[] = [
  {
    label: "MIT License",
    config: {
      label: "license",
      message: "MIT",
      color: "yellow",
      style: "flat",
    },
  },
  {
    label: "Build Passing",
    config: {
      label: "build",
      message: "passing",
      color: "brightgreen",
      style: "flat",
    },
  },
  {
    label: "TypeScript",
    config: {
      label: "",
      message: "TypeScript",
      color: "3178c6",
      style: "flat",
      logo: "typescript",
      logoColor: "white",
    },
  },
  {
    label: "PRs Welcome",
    config: {
      label: "PRs",
      message: "welcome",
      color: "brightgreen",
      style: "flat",
    },
  },
  {
    label: "Version",
    config: {
      label: "version",
      message: "1.0.0",
      color: "blue",
      style: "flat",
    },
  },
];

/**
 * GitHubバッジジェネレーターコンポーネント
 */
function GithubBadgeGenerator() {
  const [label, setLabel] = useState("build");
  const [message, setMessage] = useState("passing");
  const [color, setColor] = useState("brightgreen");
  const [labelColor, setLabelColor] = useState("");
  const [style, setStyle] = useState<BadgeStyle>("flat");
  const [logo, setLogo] = useState("");
  const [logoColor, setLogoColor] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [activeTab, setActiveTab] = useState<CopyTab>("markdown");
  const [imgError, setImgError] = useState(false);

  const { copy } = useClipboard();
  const { showToast } = useToast();

  const config: BadgeConfig = useMemo(
    () => ({
      label,
      message,
      color,
      labelColor: labelColor || undefined,
      style,
      logo: logo || undefined,
      logoColor: logoColor || undefined,
    }),
    [label, message, color, labelColor, style, logo, logoColor],
  );

  const badgeUrl = useMemo(() => generateBadgeUrl(config), [config]);
  const markdown = useMemo(
    () => generateBadgeMarkdown(config, linkUrl || undefined),
    [config, linkUrl],
  );
  const html = useMemo(() => generateBadgeHtml(config, linkUrl || undefined), [config, linkUrl]);

  const outputMap: Record<CopyTab, string> = {
    markdown,
    html,
    url: badgeUrl,
  };

  const handleCopy = async () => {
    const text = outputMap[activeTab];
    if (!text) return;
    const success = await copy(text);
    showToast(success ? "コピーしました" : "コピーに失敗しました", success ? "success" : "error");
  };

  const applyPreset = (presetConfig: BadgeConfig) => {
    setLabel(presetConfig.label);
    setMessage(presetConfig.message);
    setColor(presetConfig.color);
    setLabelColor(presetConfig.labelColor ?? "");
    setStyle(presetConfig.style);
    setLogo(presetConfig.logo ?? "");
    setLogoColor(presetConfig.logoColor ?? "");
    setImgError(false);
  };

  return (
    <div className="tool-container">
      <h2 className="section-title">GitHubバッジジェネレーター</h2>

      {/* プリセット */}
      <div className="github-badge-section">
        <p className="github-badge-section-label">プリセット</p>
        <div className="github-badge-preset-list">
          {PRESET_BADGES.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              onClick={() => applyPreset(preset.config)}
              aria-label={`${preset.label} プリセットを適用`}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 設定フォーム */}
      <div className="github-badge-form">
        <div className="github-badge-form-grid">
          {/* ラベル */}
          <div className="github-badge-field">
            <label htmlFor="badge-label" className="github-badge-field-label">
              ラベル（左側）
            </label>
            <input
              id="badge-label"
              type="text"
              className="github-badge-input"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setImgError(false);
              }}
              placeholder="例: build, license, version"
            />
          </div>

          {/* メッセージ */}
          <div className="github-badge-field">
            <label htmlFor="badge-message" className="github-badge-field-label">
              メッセージ（右側）<span className="github-badge-required">*</span>
            </label>
            <input
              id="badge-message"
              type="text"
              className="github-badge-input"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setImgError(false);
              }}
              placeholder="例: passing, MIT, 1.0.0"
            />
          </div>

          {/* 色 */}
          <div className="github-badge-field">
            <label htmlFor="badge-color" className="github-badge-field-label">
              右側の色
            </label>
            <div className="github-badge-color-row">
              <input
                id="badge-color"
                type="text"
                className="github-badge-input github-badge-input--color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  setImgError(false);
                }}
                placeholder="例: brightgreen, #ff0000"
              />
              <div className="github-badge-color-swatches" role="group" aria-label="色のプリセット">
                {BADGE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`github-badge-swatch ${color === c.value ? "github-badge-swatch--active" : ""}`}
                    style={{ "--swatch-color": c.hex } as React.CSSProperties}
                    onClick={() => {
                      setColor(c.value);
                      setImgError(false);
                    }}
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={color === c.value}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ラベルカラー */}
          <div className="github-badge-field">
            <label htmlFor="badge-label-color" className="github-badge-field-label">
              左側の色（省略可）
            </label>
            <input
              id="badge-label-color"
              type="text"
              className="github-badge-input"
              value={labelColor}
              onChange={(e) => {
                setLabelColor(e.target.value);
                setImgError(false);
              }}
              placeholder="例: grey, #333333"
            />
          </div>

          {/* スタイル */}
          <div className="github-badge-field">
            <label htmlFor="badge-style" className="github-badge-field-label">
              スタイル
            </label>
            <select
              id="badge-style"
              className="github-badge-select"
              value={style}
              onChange={(e) => {
                setStyle(e.target.value as BadgeStyle);
                setImgError(false);
              }}
            >
              {BADGE_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* ロゴ */}
          <div className="github-badge-field">
            <label htmlFor="badge-logo" className="github-badge-field-label">
              ロゴ（Simple Icons）
            </label>
            <div className="github-badge-logo-row">
              <select
                id="badge-logo"
                className="github-badge-select"
                value={logo}
                onChange={(e) => {
                  setLogo(e.target.value);
                  setImgError(false);
                }}
              >
                {POPULAR_LOGOS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="github-badge-input"
                value={logo}
                onChange={(e) => {
                  setLogo(e.target.value);
                  setImgError(false);
                }}
                placeholder="または直接入力（例: react）"
                aria-label="ロゴ名を直接入力"
              />
            </div>
          </div>

          {/* ロゴカラー */}
          <div className="github-badge-field">
            <label htmlFor="badge-logo-color" className="github-badge-field-label">
              ロゴの色（省略可）
            </label>
            <input
              id="badge-logo-color"
              type="text"
              className="github-badge-input"
              value={logoColor}
              onChange={(e) => {
                setLogoColor(e.target.value);
                setImgError(false);
              }}
              placeholder="例: white, #ffffff"
            />
          </div>

          {/* リンクURL */}
          <div className="github-badge-field">
            <label htmlFor="badge-link" className="github-badge-field-label">
              リンク先URL（省略可）
            </label>
            <input
              id="badge-link"
              type="url"
              className="github-badge-input"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="例: https://github.com/yourname/yourrepo"
            />
          </div>
        </div>
      </div>

      {/* プレビュー */}
      <div className="github-badge-preview-section">
        <p className="github-badge-section-label">プレビュー</p>
        <div className="github-badge-preview" aria-label="バッジプレビュー">
          {badgeUrl && !imgError ? (
            <img
              src={badgeUrl}
              alt={label ? `${label}: ${message}` : message}
              onError={() => setImgError(true)}
              className="github-badge-preview-img"
            />
          ) : (
            <span className="github-badge-preview-empty">
              {imgError
                ? "画像の読み込みに失敗しました"
                : "メッセージを入力するとプレビューが表示されます"}
            </span>
          )}
        </div>
      </div>

      {/* 出力 */}
      <div className="github-badge-output-section">
        <div className="github-badge-output-tabs" role="tablist" aria-label="出力形式">
          {(["markdown", "html", "url"] as CopyTab[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`github-badge-tab ${activeTab === tab ? "github-badge-tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "markdown" ? "Markdown" : tab === "html" ? "HTML" : "URL"}
            </button>
          ))}
        </div>
        <div className="github-badge-output-body" role="tabpanel">
          <pre className="github-badge-output-code" aria-label={`${activeTab}出力`}>
            <code>{outputMap[activeTab] || "（メッセージを入力してください）"}</code>
          </pre>
          <Button
            variant="default"
            onClick={handleCopy}
            disabled={!outputMap[activeTab]}
            aria-label={`${activeTab}をクリップボードにコピー`}
          >
            コピー
          </Button>
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "使い方",
            items: [
              "ラベル（左側）とメッセージ（右側）にテキストを入力します",
              "色・スタイル・ロゴを設定してバッジをカスタマイズします",
              "プレビューでリアルタイムに確認できます",
              "Markdown / HTML / URL タブから目的の形式をコピーします",
            ],
          },
          {
            title: "ヒント",
            items: [
              "プリセットから素早くよく使うバッジを生成できます",
              "ロゴには Simple Icons（simpleicons.org）のアイコン名を使用します",
              "色は色名（brightgreen など）または HEX コード（#ff0000）が使えます",
              "リンク先URLを設定するとバッジにハイパーリンクが付きます",
            ],
          },
          {
            title: "shields.io について",
            items: [
              "shields.io は GitHub READMEで広く使われるバッジサービスです",
              "生成したURLは shields.io のサーバーから画像が配信されます",
              "for-the-badge スタイルは大きめのデザインで存在感があります",
              "動的バッジ（CI/CD連携など）は shields.io 公式ドキュメントを参照してください",
            ],
          },
        ]}
      />
    </div>
  );
}
