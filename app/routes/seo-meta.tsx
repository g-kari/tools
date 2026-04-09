import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  generateAllMetaTags,
  truncateTitle,
  truncateDescription,
  type BasicSeoData,
  type OgData,
  type TwitterData,
  type OgType,
  type TwitterCard,
  type RobotsDirective,
} from "~/utils/seo-meta";

export const Route = createFileRoute("/seo-meta")({
  head: () => ({
    meta: [
      { title: "SEOメタタグ生成 | Web ツール集" },
      {
        name: "description",
        content:
          "SEO・OGP・Twitterカードのメタタグを一括生成するツール。検索結果プレビューとSNSシェアプレビューつき。ブラウザ内完結でデータは外部に送信されません。",
      },
      {
        property: "og:title",
        content: "SEOメタタグ生成 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "SEO・OGP・Twitterカードのメタタグを一括生成するツール。検索結果プレビューとSNSシェアプレビューつき。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/seo-meta` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "SEOメタタグ生成 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "SEO・OGP・Twitterカードのメタタグを一括生成するツール。検索結果プレビューとSNSシェアプレビューつき。",
      },
    ],
  }),
  component: SeoMetaTool,
});

type TabType = "basic" | "og" | "twitter" | "preview" | "output";

const OG_TYPES: { value: OgType; label: string }[] = [
  { value: "website", label: "website" },
  { value: "article", label: "article" },
  { value: "product", label: "product" },
  { value: "profile", label: "profile" },
  { value: "book", label: "book" },
  { value: "music.song", label: "music.song" },
  { value: "video.movie", label: "video.movie" },
];

const TWITTER_CARDS: { value: TwitterCard; label: string }[] = [
  { value: "summary", label: "summary（小カード）" },
  { value: "summary_large_image", label: "summary_large_image（大画像）" },
  { value: "app", label: "app（アプリカード）" },
  { value: "player", label: "player（メディアカード）" },
];

const ROBOTS_DIRECTIVES: { value: RobotsDirective; label: string }[] = [
  { value: "index, follow", label: "index, follow（推奨）" },
  { value: "noindex, follow", label: "noindex, follow" },
  { value: "index, nofollow", label: "index, nofollow" },
  { value: "noindex, nofollow", label: "noindex, nofollow" },
];

const DEFAULT_BASIC: BasicSeoData = {
  title: "",
  description: "",
  keywords: "",
  author: "",
  canonicalUrl: "",
  robots: "index, follow",
};

const DEFAULT_OG: OgData = {
  title: "",
  description: "",
  url: "",
  image: "",
  type: "website",
  siteName: "",
  locale: "ja_JP",
};

const DEFAULT_TWITTER: TwitterData = {
  card: "summary_large_image",
  title: "",
  description: "",
  image: "",
  site: "",
  creator: "",
};

/**
 * SEOメタタグ生成ツールコンポーネント
 */
function SeoMetaTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [basic, setBasic] = useState<BasicSeoData>(DEFAULT_BASIC);
  const [og, setOg] = useState<OgData>(DEFAULT_OG);
  const [twitter, setTwitter] = useState<TwitterData>(DEFAULT_TWITTER);

  const [includeBasic, setIncludeBasic] = useState(true);
  const [includeOg, setIncludeOg] = useState(true);
  const [includeTwitter, setIncludeTwitter] = useState(true);

  const outputRef = useRef<HTMLPreElement>(null);

  const generatedCode = generateAllMetaTags(
    { basic, og, twitter },
    { includeBasic, includeOg, includeTwitter },
  );

  const handleCopy = useCallback(async () => {
    if (!generatedCode) {
      showToast("コピーするコードがありません", "error");
      return;
    }
    const success = await copy(generatedCode);
    if (success) {
      announceStatus("メタタグをコピーしました");
      showToast("メタタグをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [generatedCode, copy, announceStatus, showToast]);

  const handleReset = useCallback(() => {
    setBasic(DEFAULT_BASIC);
    setOg(DEFAULT_OG);
    setTwitter(DEFAULT_TWITTER);
    setIncludeBasic(true);
    setIncludeOg(true);
    setIncludeTwitter(true);
    announceStatus("入力をリセットしました");
    showToast("入力をリセットしました", "success");
  }, [announceStatus, showToast]);

  // Open Graphのタイトル/descriptionは基本SEOから引き継ぐ便利機能
  const handleSyncFromBasic = useCallback(() => {
    setOg((prev) => ({
      ...prev,
      title: prev.title || basic.title,
      description: prev.description || basic.description,
    }));
    setTwitter((prev) => ({
      ...prev,
      title: prev.title || basic.title,
      description: prev.description || basic.description,
    }));
    announceStatus("基本SEOからOGP・Twitterにタイトルとdescriptionを反映しました");
    showToast("基本SEOから反映しました", "success");
  }, [basic, announceStatus, showToast]);

  const previewTitle = og.title || basic.title;
  const previewDescription = og.description || basic.description;
  const previewUrl = og.url || basic.canonicalUrl;

  return (
    <>
      <div className="tool-container">
        {/* タブ */}
        <div className="hash-input-tabs" role="tablist" aria-label="設定タブ">
          <button
            role="tab"
            aria-selected={activeTab === "basic"}
            className={`hash-input-tab ${activeTab === "basic" ? "active" : ""}`}
            onClick={() => setActiveTab("basic")}
          >
            基本 SEO
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "og"}
            className={`hash-input-tab ${activeTab === "og" ? "active" : ""}`}
            onClick={() => setActiveTab("og")}
          >
            Open Graph
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "twitter"}
            className={`hash-input-tab ${activeTab === "twitter" ? "active" : ""}`}
            onClick={() => setActiveTab("twitter")}
          >
            Twitter Card
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "preview"}
            className={`hash-input-tab ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            プレビュー
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "output"}
            className={`hash-input-tab ${activeTab === "output" ? "active" : ""}`}
            onClick={() => setActiveTab("output")}
          >
            コード出力
          </button>
        </div>

        {/* 基本SEOタブ */}
        {activeTab === "basic" && (
          <div className="converter-section">
            <div className="seo-meta-form">
              <div className="seo-meta-field">
                <label htmlFor="seo-title" className="seo-meta-label">
                  ページタイトル
                  <span className="seo-meta-char-count">
                    {basic.title.length}/60
                    {basic.title.length > 60 && <span className="seo-meta-over"> 超過</span>}
                  </span>
                </label>
                <input
                  id="seo-title"
                  type="text"
                  value={basic.title}
                  onChange={(e) => setBasic((p) => ({ ...p, title: e.target.value }))}
                  placeholder="例: ページタイトル | サイト名"
                  aria-label="ページタイトル入力（推奨60文字以内）"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="seo-description" className="seo-meta-label">
                  メタ説明（description）
                  <span className="seo-meta-char-count">
                    {basic.description.length}/160
                    {basic.description.length > 160 && <span className="seo-meta-over"> 超過</span>}
                  </span>
                </label>
                <textarea
                  id="seo-description"
                  value={basic.description}
                  onChange={(e) => setBasic((p) => ({ ...p, description: e.target.value }))}
                  placeholder="例: このページの内容を160文字以内で説明します。"
                  rows={3}
                  aria-label="メタ説明入力（推奨160文字以内）"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="seo-keywords" className="seo-meta-label">
                  キーワード（keywords）
                </label>
                <input
                  id="seo-keywords"
                  type="text"
                  value={basic.keywords}
                  onChange={(e) => setBasic((p) => ({ ...p, keywords: e.target.value }))}
                  placeholder="例: キーワード1, キーワード2, キーワード3"
                  aria-label="メタキーワード入力（カンマ区切り）"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="seo-author" className="seo-meta-label">
                  著者（author）
                </label>
                <input
                  id="seo-author"
                  type="text"
                  value={basic.author}
                  onChange={(e) => setBasic((p) => ({ ...p, author: e.target.value }))}
                  placeholder="例: 山田 太郎"
                  aria-label="著者名入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="seo-canonical" className="seo-meta-label">
                  正規URL（canonical）
                </label>
                <input
                  id="seo-canonical"
                  type="text"
                  value={basic.canonicalUrl}
                  onChange={(e) => setBasic((p) => ({ ...p, canonicalUrl: e.target.value }))}
                  placeholder="例: https://example.com/page"
                  aria-label="正規URL入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="seo-robots" className="seo-meta-label">
                  Robots ディレクティブ
                </label>
                <select
                  id="seo-robots"
                  value={basic.robots}
                  onChange={(e) =>
                    setBasic((p) => ({
                      ...p,
                      robots: e.target.value as RobotsDirective,
                    }))
                  }
                  aria-label="Robotsディレクティブ選択"
                >
                  {ROBOTS_DIRECTIVES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Open Graph タブ */}
        {activeTab === "og" && (
          <div className="converter-section">
            <div className="button-group">
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary"
                onClick={handleSyncFromBasic}
                aria-label="基本SEOからタイトルとdescriptionを引き継ぐ"
              >
                基本SEOから反映
              </Button>
            </div>

            <div className="seo-meta-form">
              <div className="seo-meta-field">
                <label htmlFor="og-title" className="seo-meta-label">
                  og:title
                </label>
                <input
                  id="og-title"
                  type="text"
                  value={og.title}
                  onChange={(e) => setOg((p) => ({ ...p, title: e.target.value }))}
                  placeholder="SNSシェア時に表示されるタイトル"
                  aria-label="og:title入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="og-description" className="seo-meta-label">
                  og:description
                </label>
                <textarea
                  id="og-description"
                  value={og.description}
                  onChange={(e) => setOg((p) => ({ ...p, description: e.target.value }))}
                  placeholder="SNSシェア時に表示される説明文"
                  rows={3}
                  aria-label="og:description入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="og-url" className="seo-meta-label">
                  og:url
                </label>
                <input
                  id="og-url"
                  type="text"
                  value={og.url}
                  onChange={(e) => setOg((p) => ({ ...p, url: e.target.value }))}
                  placeholder="例: https://example.com/page"
                  aria-label="og:url入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="og-image" className="seo-meta-label">
                  og:image（OGP画像URL）
                </label>
                <input
                  id="og-image"
                  type="text"
                  value={og.image}
                  onChange={(e) => setOg((p) => ({ ...p, image: e.target.value }))}
                  placeholder="例: https://example.com/ogp.png（推奨: 1200×630px）"
                  aria-label="og:image URL入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="og-type" className="seo-meta-label">
                  og:type
                </label>
                <select
                  id="og-type"
                  value={og.type}
                  onChange={(e) => setOg((p) => ({ ...p, type: e.target.value as OgType }))}
                  aria-label="og:type選択"
                >
                  {OG_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="seo-meta-field">
                <label htmlFor="og-site-name" className="seo-meta-label">
                  og:site_name
                </label>
                <input
                  id="og-site-name"
                  type="text"
                  value={og.siteName}
                  onChange={(e) => setOg((p) => ({ ...p, siteName: e.target.value }))}
                  placeholder="例: サイト名"
                  aria-label="og:site_name入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="og-locale" className="seo-meta-label">
                  og:locale
                </label>
                <input
                  id="og-locale"
                  type="text"
                  value={og.locale}
                  onChange={(e) => setOg((p) => ({ ...p, locale: e.target.value }))}
                  placeholder="例: ja_JP"
                  aria-label="og:locale入力"
                />
              </div>
            </div>
          </div>
        )}

        {/* Twitter Card タブ */}
        {activeTab === "twitter" && (
          <div className="converter-section">
            <div className="button-group">
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary"
                onClick={handleSyncFromBasic}
                aria-label="基本SEOからタイトルとdescriptionを引き継ぐ"
              >
                基本SEOから反映
              </Button>
            </div>

            <div className="seo-meta-form">
              <div className="seo-meta-field">
                <label htmlFor="twitter-card" className="seo-meta-label">
                  twitter:card
                </label>
                <select
                  id="twitter-card"
                  value={twitter.card}
                  onChange={(e) =>
                    setTwitter((p) => ({
                      ...p,
                      card: e.target.value as TwitterCard,
                    }))
                  }
                  aria-label="twitter:card選択"
                >
                  {TWITTER_CARDS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="seo-meta-field">
                <label htmlFor="twitter-title" className="seo-meta-label">
                  twitter:title
                </label>
                <input
                  id="twitter-title"
                  type="text"
                  value={twitter.title}
                  onChange={(e) => setTwitter((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Twitter/Xでシェア時のタイトル"
                  aria-label="twitter:title入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="twitter-description" className="seo-meta-label">
                  twitter:description
                </label>
                <textarea
                  id="twitter-description"
                  value={twitter.description}
                  onChange={(e) => setTwitter((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Twitter/Xでシェア時の説明文"
                  rows={3}
                  aria-label="twitter:description入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="twitter-image" className="seo-meta-label">
                  twitter:image（画像URL）
                </label>
                <input
                  id="twitter-image"
                  type="text"
                  value={twitter.image}
                  onChange={(e) => setTwitter((p) => ({ ...p, image: e.target.value }))}
                  placeholder="例: https://example.com/card.png"
                  aria-label="twitter:image URL入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="twitter-site" className="seo-meta-label">
                  twitter:site（サイトの@アカウント）
                </label>
                <input
                  id="twitter-site"
                  type="text"
                  value={twitter.site}
                  onChange={(e) => setTwitter((p) => ({ ...p, site: e.target.value }))}
                  placeholder="例: @example"
                  aria-label="twitter:site入力"
                />
              </div>

              <div className="seo-meta-field">
                <label htmlFor="twitter-creator" className="seo-meta-label">
                  twitter:creator（著者の@アカウント）
                </label>
                <input
                  id="twitter-creator"
                  type="text"
                  value={twitter.creator}
                  onChange={(e) => setTwitter((p) => ({ ...p, creator: e.target.value }))}
                  placeholder="例: @author"
                  aria-label="twitter:creator入力"
                />
              </div>
            </div>
          </div>
        )}

        {/* プレビュータブ */}
        {activeTab === "preview" && (
          <div className="converter-section">
            {/* Google 検索結果プレビュー */}
            <div className="seo-preview-section">
              <h3 className="seo-preview-heading">🔍 Google 検索結果プレビュー</h3>
              <div className="seo-search-preview" aria-label="Google検索結果プレビュー">
                <div className="seo-search-url">
                  {previewUrl
                    ? previewUrl
                        .replace(/^https?:\/\//, "")
                        .split("/")
                        .join(" › ")
                    : "example.com › page"}
                </div>
                <div className="seo-search-title">
                  {truncateTitle(previewTitle || "ページタイトルが未入力です")}
                </div>
                <div className="seo-search-description">
                  {truncateDescription(
                    previewDescription ||
                      "メタ説明が未入力です。検索エンジンはページのコンテンツから自動生成する場合があります。",
                  )}
                </div>
              </div>
            </div>

            {/* OGPカードプレビュー */}
            <div className="seo-preview-section">
              <h3 className="seo-preview-heading">📱 SNSシェアカードプレビュー</h3>
              <div className="seo-ogp-card" aria-label="OGPカードプレビュー">
                {og.image ? (
                  <div className="seo-ogp-image-wrapper">
                    <img
                      src={og.image}
                      alt="OGP画像プレビュー"
                      className="seo-ogp-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="seo-ogp-image-placeholder">
                    <span>OGP画像 (og:image)</span>
                    <span className="seo-ogp-image-hint">推奨: 1200×630px</span>
                  </div>
                )}
                <div className="seo-ogp-body">
                  <div className="seo-ogp-domain">
                    {og.url ? og.url.replace(/^https?:\/\//, "").split("/")[0] : "example.com"}
                  </div>
                  <div className="seo-ogp-title">{og.title || basic.title || "タイトル未入力"}</div>
                  <div className="seo-ogp-description">
                    {og.description || basic.description || "説明文未入力"}
                  </div>
                </div>
              </div>
            </div>

            {/* Twitterカードプレビュー */}
            <div className="seo-preview-section">
              <h3 className="seo-preview-heading">🐦 Twitter/X カードプレビュー</h3>
              <div
                className={`seo-twitter-card ${twitter.card === "summary_large_image" ? "seo-twitter-card--large" : ""}`}
                aria-label="Twitterカードプレビュー"
              >
                {twitter.card === "summary_large_image" ? (
                  <>
                    {twitter.image || og.image ? (
                      <div className="seo-twitter-image-wrapper">
                        <img
                          src={twitter.image || og.image}
                          alt="Twitterカード画像プレビュー"
                          className="seo-twitter-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="seo-ogp-image-placeholder">
                        <span>カード画像 (twitter:image)</span>
                      </div>
                    )}
                    <div className="seo-ogp-body">
                      <div className="seo-ogp-domain">
                        {og.url || basic.canonicalUrl
                          ? (og.url || basic.canonicalUrl).replace(/^https?:\/\//, "").split("/")[0]
                          : "example.com"}
                      </div>
                      <div className="seo-ogp-title">
                        {twitter.title || og.title || basic.title || "タイトル未入力"}
                      </div>
                      <div className="seo-ogp-description">
                        {twitter.description ||
                          og.description ||
                          basic.description ||
                          "説明文未入力"}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="seo-twitter-summary">
                    <div className="seo-twitter-summary-image">
                      {twitter.image || og.image ? (
                        <img
                          src={twitter.image || og.image}
                          alt="Twitterカード画像プレビュー"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="seo-twitter-summary-placeholder">📄</span>
                      )}
                    </div>
                    <div className="seo-ogp-body">
                      <div className="seo-ogp-domain">
                        {og.url || basic.canonicalUrl
                          ? (og.url || basic.canonicalUrl).replace(/^https?:\/\//, "").split("/")[0]
                          : "example.com"}
                      </div>
                      <div className="seo-ogp-title">
                        {twitter.title || og.title || basic.title || "タイトル未入力"}
                      </div>
                      <div className="seo-ogp-description">
                        {twitter.description ||
                          og.description ||
                          basic.description ||
                          "説明文未入力"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* コード出力タブ */}
        {activeTab === "output" && (
          <div className="converter-section">
            {/* 出力オプション */}
            <div className="seo-output-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeBasic}
                  onChange={(e) => setIncludeBasic(e.target.checked)}
                  aria-label="基本SEOタグを含める"
                />
                基本SEO
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeOg}
                  onChange={(e) => setIncludeOg(e.target.checked)}
                  aria-label="Open Graphタグを含める"
                />
                Open Graph
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeTwitter}
                  onChange={(e) => setIncludeTwitter(e.target.checked)}
                  aria-label="Twitter Cardタグを含める"
                />
                Twitter Card
              </label>
            </div>

            <div className="button-group">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleCopy}
                disabled={!generatedCode}
                aria-label="生成されたメタタグをコピー"
              >
                コピー
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleReset}
                aria-label="全フィールドをリセット"
              >
                リセット
              </Button>
            </div>

            {generatedCode ? (
              <pre
                ref={outputRef}
                className="seo-meta-output"
                aria-label="生成されたメタタグコード"
              >
                <code>{generatedCode}</code>
              </pre>
            ) : (
              <div className="seo-meta-output-empty">
                各タブで情報を入力するとここにメタタグが生成されます
              </div>
            )}
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "【基本SEO】タイトル・description・keywordsなど基本的なメタタグを設定",
                "【Open Graph】Facebook・LinkedIn等SNSシェア時のOGPタグを設定",
                "【Twitter Card】Twitter/X シェア時のカードタイプと表示内容を設定",
                "【プレビュー】Google検索結果・SNSカードの見え方をリアルタイム確認",
                "【コード出力】生成されたHTMLメタタグをコピーして<head>に貼り付け",
                "「基本SEOから反映」ボタンでOGP・Twitterにタイトルとdescriptionを一括転記",
              ],
            },
            {
              title: "SEOのポイント",
              items: [
                "タイトルは60文字以内を推奨（超過分はGoogleが省略する場合あり）",
                "description は 120〜160文字程度を推奨",
                "OGP画像は1200×630pxが推奨サイズ（最低200×200px）",
                "og:type は一般ページなら 'website'、ブログ記事なら 'article'",
                "twitter:card は大きな画像で目立たせるなら 'summary_large_image'",
                "canonical URLは重複コンテンツを防ぐために重要",
              ],
            },
            {
              title: "注意事項",
              items: [
                "ブラウザ内で完結し、入力データはサーバーに送信されません",
                "プレビューはあくまで参考表示です（実際の見え方はプラットフォームにより異なる）",
                "OGPカードのキャッシュはFacebookデバッガー等でクリアできます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
