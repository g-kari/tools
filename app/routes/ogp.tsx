import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchOgp, type OgpData } from "../functions/ogp";

export const Route = createFileRoute("/ogp")({
  head: () => ({
    meta: [{ title: "OGPチェッカー - Webツール集" }],
  }),
  component: OgpChecker,
});

type Platform = "x" | "facebook" | "slack" | "discord";

function OgpChecker() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<OgpData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform>("x");
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

  const renderPlatformPreview = (data: OgpData, platform: Platform) => {
    const title = getTitle(data);
    const description = getDescription(data);
    const image = getImage(data);
    const siteName = getSiteName(data);

    switch (platform) {
      case "x":
        return (
          <div className="ogp-preview ogp-preview-x">
            <div className="ogp-preview-label">X (Twitter) プレビュー</div>
            <div className="ogp-card-x">
              {image && (
                <div className="ogp-image-container-x">
                  <img src={image} alt="" className="ogp-image-x" />
                </div>
              )}
              <div className="ogp-content-x">
                <div className="ogp-title-x">{title}</div>
                <div className="ogp-description-x">{description}</div>
                <div className="ogp-site-x">{siteName}</div>
              </div>
            </div>
          </div>
        );

      case "facebook":
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

      case "slack":
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

      case "discord":
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
    }
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

  const platforms: { id: Platform; label: string }[] = [
    { id: "x", label: "X" },
    { id: "facebook", label: "Facebook" },
    { id: "slack", label: "Slack" },
    { id: "discord", label: "Discord" },
  ];

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="OGPチェックフォーム">
          <div className="converter-section">
            <div className="search-form-row">
              <div className="search-input-wrapper">
                <label htmlFor="urlInput">URL</label>
                <input
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
              <button
                type="submit"
                className="btn-primary"
                onClick={handleCheck}
                disabled={isLoading}
                aria-label="OGP情報を取得"
              >
                チェック
              </button>
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
              <div
                className="platform-tabs"
                role="tablist"
                aria-label="プラットフォーム選択"
              >
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={activePlatform === p.id}
                    className={`platform-tab ${activePlatform === p.id ? "active" : ""}`}
                    onClick={() => setActivePlatform(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div role="tabpanel" aria-label={`${activePlatform}のプレビュー`}>
                {renderPlatformPreview(result, activePlatform)}
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

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>URLを入力して「チェック」ボタンをクリック</li>
            <li>X、Facebook、Slack、Discordでのプレビュー表示を確認</li>
            <li>OGPタグの設定値を一覧で確認可能</li>
            <li>キーボードショートカット: Enterキーでチェック実行</li>
          </ul>
        </aside>
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
