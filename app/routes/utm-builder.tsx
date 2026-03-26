import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  buildUtmUrl,
  parseUtmUrl,
  isValidUrl,
  type UtmParams,
} from "~/utils/utm";

export const Route = createFileRoute("/utm-builder")({
  head: () => ({
    meta: [
      { title: "UTMパラメータビルダー | Tools" },
      {
        name: "description",
        content:
          "Google AnalyticsのUTMパラメータを簡単に生成・解析。マーケティングキャンペーンのURL追跡に必要なパラメータを直感的に設定できます。",
      },
      {
        property: "og:title",
        content: "UTMパラメータビルダー | Tools",
      },
      {
        property: "og:description",
        content:
          "Google AnalyticsのUTMパラメータを簡単に生成・解析。マーケティングキャンペーンのURL追跡に必要なパラメータを直感的に設定できます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/utm-builder` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: UtmBuilderPage,
});

/** ソースのクイック選択プリセット */
const SOURCE_PRESETS = [
  "google",
  "facebook",
  "twitter",
  "instagram",
  "linkedin",
  "email",
  "youtube",
];

/** メディアのクイック選択プリセット */
const MEDIUM_PRESETS = [
  "cpc",
  "organic",
  "email",
  "social",
  "referral",
  "display",
  "affiliate",
];

/** UTMパラメータの説明 */
const UTM_DESCRIPTIONS: Record<keyof UtmParams, string> = {
  source:
    "トラフィックの送信元（例: google, newsletter, facebook）",
  medium: "マーケティングメディア（例: cpc, email, social）",
  campaign: "キャンペーン名（例: spring_sale, product_launch）",
  term: "有料検索で使用したキーワード（例: running+shoes）",
  content: "A/Bテストや同一広告内の異なるリンク識別（例: logolink, textlink）",
};

/**
 * UTMパラメータビルダーページコンポーネント
 */
function UtmBuilderPage() {
  const [mode, setMode] = useState<"build" | "parse">("build");

  return (
    <div className="tool-container">
      <div
        className="utm-builder-mode-tabs"
        role="tablist"
        aria-label="モード切替"
      >
        <button
          className={`utm-builder-mode-tab${mode === "build" ? " utm-builder-mode-tab--active" : ""}`}
          role="tab"
          aria-selected={mode === "build"}
          aria-controls="utm-build-panel"
          onClick={() => setMode("build")}
        >
          ビルドモード
        </button>
        <button
          className={`utm-builder-mode-tab${mode === "parse" ? " utm-builder-mode-tab--active" : ""}`}
          role="tab"
          aria-selected={mode === "parse"}
          aria-controls="utm-parse-panel"
          onClick={() => setMode("parse")}
        >
          パースモード
        </button>
      </div>

      {mode === "build" && (
        <div id="utm-build-panel" role="tabpanel" aria-label="UTM URLビルドモード">
          <BuildMode />
        </div>
      )}
      {mode === "parse" && (
        <div id="utm-parse-panel" role="tabpanel" aria-label="UTM URLパースモード">
          <ParseMode />
        </div>
      )}

      <TipsCard
        sections={[
          {
            title: "UTMパラメータとは",
            items: [
              "UTM（Urchin Tracking Module）パラメータはURLに追加するクエリ文字列で、Google Analyticsなどでトラフィックの発生源を追跡するために使用されます",
              "utm_source（必須）: 訪問者の送信元（google, facebook等）",
              "utm_medium（必須）: マーケティングメディアの種類（cpc, email, social等）",
              "utm_campaign（推奨）: キャンペーン名（spring_sale等）",
              "utm_term（任意）: 有料広告のキーワード",
              "utm_content（任意）: 同じURLを指す異なる広告やリンクの識別に使用",
            ],
          },
          {
            title: "使い方",
            items: [
              "ビルドモード: ベースURLとUTMパラメータを入力してURLを生成",
              "パースモード: UTMパラメータ付きURLを貼り付けて各値を解析",
              "クイック選択チップで一般的なsource・mediumを素早く入力できます",
              "生成されたURLは「コピー」ボタンでクリップボードにコピーできます",
            ],
          },
        ]}
      />
    </div>
  );
}

/**
 * ビルドモードコンポーネント - フォームからUTMパラメータ付きURLを生成
 */
function BuildMode() {
  const { copy } = useClipboard();
  const { showToast } = useToast();

  const [baseUrl, setBaseUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const [touched, setTouched] = useState({ baseUrl: false, source: false, medium: false });

  const baseUrlError = touched.baseUrl && baseUrl && !isValidUrl(baseUrl)
    ? "有効なURLを入力してください（http:// または https:// で始まるURL）"
    : null;

  const sourceError = touched.source && !source.trim()
    ? "utm_source は必須項目です"
    : null;

  const mediumError = touched.medium && !medium.trim()
    ? "utm_medium は必須項目です"
    : null;

  const generatedUrl = useMemo(() => {
    if (!baseUrl.trim() || !source.trim() || !medium.trim()) return "";
    if (!isValidUrl(baseUrl)) return "";
    return buildUtmUrl(baseUrl, { source, medium, campaign, term, content });
  }, [baseUrl, source, medium, campaign, term, content]);

  const handleCopy = useCallback(async () => {
    if (!generatedUrl) return;
    const success = await copy(generatedUrl);
    if (success) {
      showToast("URLをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [generatedUrl, copy, showToast]);

  return (
    <div className="utm-builder-form">
      <div className="utm-builder-field">
        <label htmlFor="utm-base-url" className="utm-builder-label utm-builder-label-required">
          ベースURL
        </label>
        <input
          id="utm-base-url"
          type="url"
          className={`utm-builder-input${baseUrlError ? " utm-builder-input--error" : ""}`}
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, baseUrl: true }))}
          placeholder="https://example.com/landing-page"
          aria-required="true"
          aria-describedby={baseUrlError ? "utm-base-url-error" : "utm-base-url-hint"}
        />
        {baseUrlError ? (
          <span id="utm-base-url-error" className="utm-builder-error-message" role="alert">
            {baseUrlError}
          </span>
        ) : (
          <span id="utm-base-url-hint" className="utm-builder-hint">
            トラッキングしたいページのURL
          </span>
        )}
      </div>

      <div className="utm-builder-field">
        <label htmlFor="utm-source" className="utm-builder-label utm-builder-label-required">
          utm_source
        </label>
        <div className="utm-builder-presets" role="group" aria-label="utm_source クイック選択">
          {SOURCE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`utm-builder-preset-chip${source === preset ? " utm-builder-preset-chip--active" : ""}`}
              onClick={() => setSource(preset)}
              aria-pressed={source === preset}
            >
              {preset}
            </button>
          ))}
        </div>
        <input
          id="utm-source"
          type="text"
          className={`utm-builder-input${sourceError ? " utm-builder-input--error" : ""}`}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, source: true }))}
          placeholder="google"
          aria-required="true"
          aria-describedby={sourceError ? "utm-source-error" : "utm-source-hint"}
        />
        {sourceError ? (
          <span id="utm-source-error" className="utm-builder-error-message" role="alert">
            {sourceError}
          </span>
        ) : (
          <span id="utm-source-hint" className="utm-builder-hint">
            {UTM_DESCRIPTIONS.source}
          </span>
        )}
      </div>

      <div className="utm-builder-field">
        <label htmlFor="utm-medium" className="utm-builder-label utm-builder-label-required">
          utm_medium
        </label>
        <div className="utm-builder-presets" role="group" aria-label="utm_medium クイック選択">
          {MEDIUM_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`utm-builder-preset-chip${medium === preset ? " utm-builder-preset-chip--active" : ""}`}
              onClick={() => setMedium(preset)}
              aria-pressed={medium === preset}
            >
              {preset}
            </button>
          ))}
        </div>
        <input
          id="utm-medium"
          type="text"
          className={`utm-builder-input${mediumError ? " utm-builder-input--error" : ""}`}
          value={medium}
          onChange={(e) => setMedium(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, medium: true }))}
          placeholder="cpc"
          aria-required="true"
          aria-describedby={mediumError ? "utm-medium-error" : "utm-medium-hint"}
        />
        {mediumError ? (
          <span id="utm-medium-error" className="utm-builder-error-message" role="alert">
            {mediumError}
          </span>
        ) : (
          <span id="utm-medium-hint" className="utm-builder-hint">
            {UTM_DESCRIPTIONS.medium}
          </span>
        )}
      </div>

      <div className="utm-builder-field">
        <label htmlFor="utm-campaign" className="utm-builder-label">
          utm_campaign
        </label>
        <input
          id="utm-campaign"
          type="text"
          className="utm-builder-input"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          placeholder="spring_sale"
          aria-describedby="utm-campaign-hint"
        />
        <span id="utm-campaign-hint" className="utm-builder-hint">
          {UTM_DESCRIPTIONS.campaign}
        </span>
      </div>

      <div className="utm-builder-field">
        <label htmlFor="utm-term" className="utm-builder-label">
          utm_term
        </label>
        <input
          id="utm-term"
          type="text"
          className="utm-builder-input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="running+shoes"
          aria-describedby="utm-term-hint"
        />
        <span id="utm-term-hint" className="utm-builder-hint">
          {UTM_DESCRIPTIONS.term}
        </span>
      </div>

      <div className="utm-builder-field">
        <label htmlFor="utm-content" className="utm-builder-label">
          utm_content
        </label>
        <input
          id="utm-content"
          type="text"
          className="utm-builder-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="logolink"
          aria-describedby="utm-content-hint"
        />
        <span id="utm-content-hint" className="utm-builder-hint">
          {UTM_DESCRIPTIONS.content}
        </span>
      </div>

      <div className="utm-builder-result" aria-live="polite" aria-label="生成されたURL">
        <div className="utm-builder-result-label">生成されたURL</div>
        <div
          className={`utm-builder-result-url${!generatedUrl ? " utm-builder-result-url--placeholder" : ""}`}
        >
          {generatedUrl || "ベースURL・utm_source・utm_medium を入力するとURLが生成されます"}
        </div>
        <div className="utm-builder-copy-row">
          <button
            className="utm-builder-copy-btn"
            onClick={handleCopy}
            disabled={!generatedUrl}
            aria-label="生成されたURLをクリップボードにコピー"
          >
            コピー
          </button>
        </div>
      </div>
    </div>
  );
}

/** パースモードで表示するパラメータ情報 */
const PARSE_FIELDS: Array<{ key: keyof UtmParams; label: string; desc: string }> = [
  { key: "source", label: "utm_source", desc: "トラフィックの送信元" },
  { key: "medium", label: "utm_medium", desc: "マーケティングメディア" },
  { key: "campaign", label: "utm_campaign", desc: "キャンペーン名" },
  { key: "term", label: "utm_term", desc: "検索キーワード" },
  { key: "content", label: "utm_content", desc: "コンテンツ識別子" },
];

/**
 * パースモードコンポーネント - 既存UTM URLを解析して各パラメータを表示
 */
function ParseMode() {
  const [inputUrl, setInputUrl] = useState("");

  const parseResult = useMemo(() => {
    if (!inputUrl.trim()) return null;
    return parseUtmUrl(inputUrl.trim());
  }, [inputUrl]);

  const hasResult = parseResult !== null && parseResult.baseUrl !== '';

  return (
    <div className="utm-builder-parse-input-area">
      <div className="utm-builder-field">
        <label htmlFor="utm-parse-input" className="utm-builder-label">
          解析するURL
        </label>
        <input
          id="utm-parse-input"
          type="url"
          className="utm-builder-input"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale"
          aria-describedby="utm-parse-hint"
        />
        <span id="utm-parse-hint" className="utm-builder-hint">
          UTMパラメータ付きURLを貼り付けると各パラメータを解析します
        </span>
      </div>

      {inputUrl.trim() && (
        <div
          className="utm-builder-parse-result"
          aria-live="polite"
          aria-label="解析結果"
        >
          {hasResult ? (
            <>
              <div className="utm-builder-base-url-card">
                <div className="utm-builder-parse-card-label">ベースURL</div>
                <div className="utm-builder-parse-card-value">
                  {parseResult.baseUrl}
                </div>
                <div className="utm-builder-parse-card-desc">
                  UTMパラメータを除いたURL
                </div>
              </div>

              <div className="utm-builder-parse-result-grid">
                {PARSE_FIELDS.map(({ key, label, desc }) => {
                  const value = parseResult.params[key];
                  return (
                    <div key={key} className="utm-builder-parse-card">
                      <div className="utm-builder-parse-card-label">{label}</div>
                      <div
                        className={`utm-builder-parse-card-value${!value ? " utm-builder-parse-card-value--empty" : ""}`}
                      >
                        {value || "（未設定）"}
                      </div>
                      <div className="utm-builder-parse-card-desc">{desc}</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="utm-builder-parse-card">
              <div className="utm-builder-parse-card-value utm-builder-parse-card-value--empty">
                有効なURLを入力してください
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
