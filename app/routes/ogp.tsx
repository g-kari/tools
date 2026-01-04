import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchOgp, type OgpData } from "../functions/ogp";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/ogp")({
  head: () => ({
    meta: [{ title: "OGPチェッカー - Webツール集" }],
  }),
  component: OgpChecker,
});

function OgpChecker() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<OgpData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  const handleCheck = useCallback(async () => {
    if (!url.trim()) {
      setError("URLを入力してください");
      announceStatus("エラー: URLを入力してください");
      inputRef.current?.focus();
      return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);
    announceStatus("取得中...");

    try {
      const data = await fetchOgp({ data: url.trim() });

      if (data.error) {
        setError(data.error);
        announceStatus("エラー: " + data.error);
        return;
      }

      setResult(data);
      announceStatus("OGP情報を取得しました");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "通信エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
    } finally {
      setIsLoading(false);
    }
  }, [url, announceStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.target as HTMLElement)?.id === "urlInput") {
        e.preventDefault();
        handleCheck();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCheck]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Get display values with fallbacks
  const getTitle = (data: OgpData): string => {
    return data.title || data.twitterTitle || data.metaTitle || "タイトルなし";
  };

  const getDescription = (data: OgpData): string => {
    return (
      data.description ||
      data.twitterDescription ||
      data.metaDescription ||
      "説明なし"
    );
  };

  const getImage = (data: OgpData): string | undefined => {
    return data.image || data.twitterImage;
  };

  const getSiteName = (data: OgpData): string => {
    if (data.siteName) return data.siteName;
    try {
      return new URL(data.fetchedUrl).hostname;
    } catch {
      return data.fetchedUrl;
    }
  };

  const getTwitterCardType = (data: OgpData): string => {
    return data.twitterCard || "summary";
  };

  // Twitter Card - summary (small thumbnail left, text right)
  const renderTwitterSummary = (data: OgpData) => {
    const title = getTitle(data);
    const description = getDescription(data);
    const image = getImage(data);
    const siteName = getSiteName(data);

    return (
      <div className="ogp-card-x ogp-card-x-summary">
        {image && (
          <div className="ogp-image-container-x-summary">
            <img src={image} alt="" className="ogp-image-x-summary" />
          </div>
        )}
        <div className="ogp-content-x-summary">
          <div className="ogp-site-x">{siteName}</div>
          <div className="ogp-title-x">{title}</div>
          <div className="ogp-description-x">{description}</div>
        </div>
      </div>
    );
  };

  // Twitter Card - summary_large_image (large image top, text bottom)
  const renderTwitterSummaryLargeImage = (data: OgpData) => {
    const title = getTitle(data);
    const description = getDescription(data);
    const image = getImage(data);
    const siteName = getSiteName(data);

    return (
      <div className="ogp-card-x ogp-card-x-large">
        {image && (
          <div className="ogp-image-container-x">
            <img src={image} alt="" className="ogp-image-x" />
          </div>
        )}
        <div className="ogp-content-x">
          <div className="ogp-site-x">{siteName}</div>
          <div className="ogp-title-x">{title}</div>
          <div className="ogp-description-x">{description}</div>
        </div>
      </div>
    );
  };

  // Twitter Card - player (video/audio player)
  const renderTwitterPlayer = (data: OgpData) => {
    const title = getTitle(data);
    const description = getDescription(data);
    const image = getImage(data);
    const siteName = getSiteName(data);

    return (
      <div className="ogp-card-x ogp-card-x-player">
        {image && (
          <div className="ogp-image-container-x ogp-player-container">
            <img src={image} alt="" className="ogp-image-x" />
            <div className="ogp-player-overlay">
              <button
                type="button"
                className="ogp-play-button"
                aria-label="動画を再生"
                tabIndex={-1}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
          </div>
        )}
        <div className="ogp-content-x">
          <div className="ogp-site-x">{siteName}</div>
          <div className="ogp-title-x">{title}</div>
          <div className="ogp-description-x">{description}</div>
        </div>
      </div>
    );
  };

  // Twitter Card - app (app download card)
  const renderTwitterApp = (data: OgpData) => {
    const title = getTitle(data);
    const description = getDescription(data);
    const image = getImage(data);
    const siteName = getSiteName(data);

    return (
      <div className="ogp-card-x ogp-card-x-app">
        <div className="ogp-app-icon-container">
          {image && <img src={image} alt="" className="ogp-app-icon" />}
        </div>
        <div className="ogp-content-x-app">
          <div className="ogp-title-x">{title}</div>
          <div className="ogp-description-x">{description}</div>
          <div className="ogp-site-x">{siteName}</div>
        </div>
      </div>
    );
  };

  // Render all X/Twitter card types
  const renderXPreview = (data: OgpData) => {
    const cardType = getTwitterCardType(data);

    return (
      <div className="ogp-preview ogp-preview-x">
        <div className="ogp-preview-label">
          X (Twitter) プレビュー
          <span className="ogp-card-type-badge">{cardType}</span>
        </div>

        <div className="ogp-twitter-cards-grid">
          <div className="ogp-twitter-card-item">
            <div className="ogp-card-type-label">summary</div>
            {renderTwitterSummary(data)}
          </div>

          <div className="ogp-twitter-card-item">
            <div className="ogp-card-type-label">summary_large_image</div>
            {renderTwitterSummaryLargeImage(data)}
          </div>

          <div className="ogp-twitter-card-item">
            <div className="ogp-card-type-label">player</div>
            {renderTwitterPlayer(data)}
          </div>

          <div className="ogp-twitter-card-item">
            <div className="ogp-card-type-label">app</div>
            {renderTwitterApp(data)}
          </div>
        </div>
      </div>
    );
  };

  // Facebook preview
  const renderFacebookPreview = (data: OgpData) => {
    const title = getTitle(data);
    const description = getDescription(data);
    const image = getImage(data);
    const siteName = getSiteName(data);

    return (
      <div className="ogp-preview ogp-preview-facebook">
        <div className="ogp-preview-label">Facebook プレビュー</div>
        <div className="ogp-card-facebook">
          {image && (
            <div className="ogp-image-container-facebook">
              <img src={image} alt="" className="ogp-image-facebook" />
            </div>
          )}
          <div className="ogp-content-facebook">
            <div className="ogp-site-facebook">{siteName}</div>
            <div className="ogp-title-facebook">{title}</div>
            <div className="ogp-description-facebook">{description}</div>
          </div>
        </div>
      </div>
    );
  };

  // Slack preview
  const renderSlackPreview = (data: OgpData) => {
    const title = getTitle(data);
    const description = getDescription(data);
    const image = getImage(data);
    const siteName = getSiteName(data);

    return (
      <div className="ogp-preview ogp-preview-slack">
        <div className="ogp-preview-label">Slack プレビュー</div>
        <div className="ogp-card-slack">
          <div className="ogp-content-slack">
            <div className="ogp-site-slack">{siteName}</div>
            <div className="ogp-title-slack">{title}</div>
            <div className="ogp-description-slack">{description}</div>
          </div>
          {image && (
            <div className="ogp-image-container-slack">
              <img src={image} alt="" className="ogp-image-slack" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Discord preview
  const renderDiscordPreview = (data: OgpData) => {
    const title = getTitle(data);
    const description = getDescription(data);
    const image = getImage(data);
    const siteName = getSiteName(data);

    return (
      <div className="ogp-preview ogp-preview-discord">
        <div className="ogp-preview-label">Discord プレビュー</div>
        <div className="ogp-card-discord">
          <div className="ogp-content-discord">
            <div className="ogp-site-discord">{siteName}</div>
            <div className="ogp-title-discord">{title}</div>
            <div className="ogp-description-discord">{description}</div>
          </div>
          {image && (
            <div className="ogp-image-container-discord">
              <img src={image} alt="" className="ogp-image-discord" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOgpDetails = (data: OgpData) => {
    const rows: Array<{ label: string; value: string | undefined }> = [
      { label: "og:title", value: data.title },
      { label: "og:description", value: data.description },
      { label: "og:image", value: data.image },
      { label: "og:url", value: data.url },
      { label: "og:type", value: data.type },
      { label: "og:site_name", value: data.siteName },
      { label: "og:locale", value: data.locale },
      { label: "twitter:card", value: data.twitterCard },
      { label: "twitter:title", value: data.twitterTitle },
      { label: "twitter:description", value: data.twitterDescription },
      { label: "twitter:image", value: data.twitterImage },
      { label: "twitter:site", value: data.twitterSite },
      { label: "twitter:creator", value: data.twitterCreator },
      { label: "title", value: data.metaTitle },
      { label: "meta description", value: data.metaDescription },
    ];

    return (
      <div className="result-card">
        {rows
          .filter((row) => row.value)
          .map((row, index) => (
            <div key={index} className="result-row">
              <div className="result-label">{row.label}</div>
              <div className="result-value ogp-value">{row.value}</div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="OGPチェックフォーム"
        >
          <div className="converter-section">
            <div className="search-form-row">
              <div className="search-input-wrapper">
                <label htmlFor="urlInput">URL</label>
                <Input
                  type="text"
                  id="urlInput"
                  ref={inputRef}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  aria-describedby="url-help"
                  aria-label="チェックするURL"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <Button
                type="submit"
                className="btn-primary"
                onClick={handleCheck}
                disabled={isLoading}
                aria-label="OGP情報を取得"
              >
                チェック
              </Button>
            </div>
            <span id="url-help" className="sr-only">
              OGP情報を取得したいWebページのURLを入力してください
            </span>
          </div>
        </form>

        {isLoading && (
          <div className="loading" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <span>取得中...</span>
          </div>
        )}

        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {result && !error && (
          <>
            <section aria-labelledby="preview-title">
              <h2 id="preview-title" className="section-title">
                プレビュー
              </h2>
              <div className="ogp-previews-grid">
                {renderXPreview(result)}
                {renderFacebookPreview(result)}
                {renderSlackPreview(result)}
                {renderDiscordPreview(result)}
              </div>
            </section>

            <section aria-labelledby="details-title">
              <h2 id="details-title" className="section-title">
                OGPタグ詳細
              </h2>
              {renderOgpDetails(result)}
            </section>
          </>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "URLを入力して「チェック」ボタンをクリック",
                "X、Facebook、Slack、Discordでのプレビュー表示を確認",
                "Xカードは4種類（summary, summary_large_image, player, app）を同時表示",
                "OGPタグの設定値を一覧で確認可能",
                "キーボードショートカット: Enterキーでチェック実行",
              ],
            },
          ]}
        />
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
