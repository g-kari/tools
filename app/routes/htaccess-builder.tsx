import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { generateHtaccess, getDefaultConfig, type HtaccessConfig } from "../utils/htaccess-builder";
import "../styles/tools/htaccess-builder.css";

export const Route = createFileRoute("/htaccess-builder")({
  head: () => ({
    meta: [
      { title: "Apache .htaccess ビルダー | Web ツール集" },
      {
        name: "description",
        content:
          "Apache .htaccess ファイルを GUI で生成。HTTPS リダイレクト・キャッシュ制御・セキュリティヘッダー・カスタムエラーページに対応。",
      },
      {
        property: "og:title",
        content: "Apache .htaccess ビルダー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Apache .htaccess ファイルを GUI で生成。HTTPS リダイレクト・キャッシュ制御・セキュリティヘッダー・カスタムエラーページに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/htaccess-builder` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Apache .htaccess ビルダー | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "Apache .htaccess ファイルを GUI で生成するツール。",
      },
    ],
  }),
  component: HtaccessBuilderPage,
});

/** サンプルプリセット */
const SAMPLES: Array<{
  label: string;
  config: Partial<HtaccessConfig>;
}> = [
  {
    label: "静的サイト (HTTPS + セキュリティ)",
    config: {
      basic: {
        directoryIndex: "index.html",
        options: { noIndexes: true, followSymLinks: true },
        charset: "UTF-8",
      },
      redirect: {
        httpsRedirect: true,
        wwwRedirect: "none",
        customRedirects: [],
      },
      cache: {
        enabled: true,
        images: "1 month",
        cssJs: "1 week",
        html: "1 day",
        fonts: "1 year",
      },
      security: {
        blockHtaccess: true,
        blockSensitiveFiles: true,
        xFrameOptions: "SAMEORIGIN",
        xContentTypeOptions: true,
        xssProtection: true,
        referrerPolicy: "strict-origin-when-cross-origin",
        serverSignature: true,
        noEtag: false,
      },
      compression: { enabled: true },
      errorPages: { e404: "/404.html", e500: "/500.html", e403: "" },
    },
  },
  {
    label: "WordPress",
    config: {
      basic: {
        directoryIndex: "index.php index.html",
        options: { noIndexes: true, followSymLinks: true },
        charset: "UTF-8",
      },
      redirect: {
        httpsRedirect: true,
        wwwRedirect: "remove-www",
        customRedirects: [],
      },
      cache: {
        enabled: true,
        images: "1 month",
        cssJs: "1 week",
        html: "1 hour",
        fonts: "1 year",
      },
      security: {
        blockHtaccess: true,
        blockSensitiveFiles: true,
        xFrameOptions: "SAMEORIGIN",
        xContentTypeOptions: true,
        xssProtection: false,
        referrerPolicy: "strict-origin-when-cross-origin",
        serverSignature: true,
        noEtag: true,
      },
      compression: { enabled: true },
      errorPages: { e404: "", e500: "", e403: "" },
    },
  },
  {
    label: "セキュリティのみ",
    config: {
      basic: {
        directoryIndex: "index.html",
        options: { noIndexes: true, followSymLinks: false },
        charset: "UTF-8",
      },
      redirect: {
        httpsRedirect: false,
        wwwRedirect: "none",
        customRedirects: [],
      },
      cache: {
        enabled: false,
        images: "1 month",
        cssJs: "1 week",
        html: "1 day",
        fonts: "1 year",
      },
      security: {
        blockHtaccess: true,
        blockSensitiveFiles: true,
        xFrameOptions: "DENY",
        xContentTypeOptions: true,
        xssProtection: true,
        referrerPolicy: "no-referrer",
        serverSignature: true,
        noEtag: true,
      },
      compression: { enabled: false },
      errorPages: { e404: "", e500: "", e403: "" },
    },
  },
];

/** www リダイレクトオプション */
const WWW_REDIRECT_OPTIONS: Array<{
  value: HtaccessConfig["redirect"]["wwwRedirect"];
  label: string;
}> = [
  { value: "none", label: "なし" },
  { value: "add-www", label: "www を追加" },
  { value: "remove-www", label: "www を削除" },
];

/** X-Frame-Options オプション */
const X_FRAME_OPTIONS: Array<{
  value: HtaccessConfig["security"]["xFrameOptions"];
  label: string;
}> = [
  { value: "none", label: "なし" },
  { value: "SAMEORIGIN", label: "SAMEORIGIN（同一オリジンのみ許可）" },
  { value: "DENY", label: "DENY（全て拒否）" },
];

/** キャッシュ期間オプション */
const CACHE_DURATION_OPTIONS = [
  "1 hour",
  "6 hours",
  "12 hours",
  "1 day",
  "3 days",
  "1 week",
  "2 weeks",
  "1 month",
  "3 months",
  "6 months",
  "1 year",
];

/** .htaccess ビルダーページコンポーネント */
function HtaccessBuilderPage(): React.ReactElement {
  const [config, setConfig] = useState<HtaccessConfig>(getDefaultConfig());
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();

  const output = useMemo(() => generateHtaccess(config), [config]);

  function applyPreset(preset: Partial<HtaccessConfig>): void {
    setConfig((prev) => ({
      ...prev,
      ...preset,
      basic: { ...prev.basic, ...preset.basic },
      redirect: { ...prev.redirect, ...preset.redirect },
      cache: { ...prev.cache, ...preset.cache },
      security: { ...prev.security, ...preset.security },
      errorPages: { ...prev.errorPages, ...preset.errorPages },
      compression: { ...prev.compression, ...preset.compression },
    }));
    announceStatus("プリセットを適用しました");
  }

  function handleCopy(): void {
    copy(output);
    showToast(".htaccess をクリップボードにコピーしました", "success");
    announceStatus(".htaccess をクリップボードにコピーしました");
  }

  function handleDownload(): void {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".htaccess";
    a.click();
    URL.revokeObjectURL(url);
    showToast(".htaccess をダウンロードしました", "success");
    announceStatus(".htaccess をダウンロードしました");
  }

  function addRedirect(): void {
    setConfig((prev) => ({
      ...prev,
      redirect: {
        ...prev.redirect,
        customRedirects: [...prev.redirect.customRedirects, { from: "", to: "", type: "301" }],
      },
    }));
  }

  function updateRedirect(
    index: number,
    field: keyof HtaccessConfig["redirect"]["customRedirects"][number],
    value: string,
  ): void {
    setConfig((prev) => ({
      ...prev,
      redirect: {
        ...prev.redirect,
        customRedirects: prev.redirect.customRedirects.map((r, i) =>
          i === index ? { ...r, [field]: value } : r,
        ),
      },
    }));
  }

  function removeRedirect(index: number): void {
    setConfig((prev) => ({
      ...prev,
      redirect: {
        ...prev.redirect,
        customRedirects: prev.redirect.customRedirects.filter((_, i) => i !== index),
      },
    }));
  }

  return (
    <div className="htx-container">
      <StatusAnnouncer statusRef={statusRef} />

      <h1 className="tool-title">Apache .htaccess ビルダー</h1>
      <p className="tool-description">
        Apache .htaccess ファイルを GUI で生成します。HTTPS
        リダイレクト・キャッシュ制御・セキュリティヘッダー・カスタムエラーページに対応しています。
      </p>

      {/* プリセット */}
      <div className="htx-samples" aria-label="プリセット">
        <span className="htx-samples-label">プリセット:</span>
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            className="htx-sample-btn"
            onClick={() => applyPreset(s.config)}
            type="button"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 基本設定 */}
      <div className="htx-section" aria-labelledby="htx-basic-title">
        <h2 className="htx-section-title" id="htx-basic-title">
          基本設定
        </h2>
        <div className="htx-grid-2">
          <div className="htx-field">
            <label className="htx-label" htmlFor="htx-directory-index">
              DirectoryIndex
            </label>
            <input
              id="htx-directory-index"
              className="htx-input"
              type="text"
              value={config.basic.directoryIndex}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  basic: { ...prev.basic, directoryIndex: e.target.value },
                }))
              }
              placeholder="index.html index.php"
            />
          </div>
          <div className="htx-field">
            <label className="htx-label" htmlFor="htx-charset">
              文字コード
            </label>
            <input
              id="htx-charset"
              className="htx-input"
              type="text"
              value={config.basic.charset}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  basic: { ...prev.basic, charset: e.target.value },
                }))
              }
              placeholder="UTF-8"
            />
          </div>
        </div>
        <div className="htx-grid-2">
          <label className="htx-checkbox-row">
            <input
              type="checkbox"
              checked={config.basic.options.noIndexes}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  basic: {
                    ...prev.basic,
                    options: {
                      ...prev.basic.options,
                      noIndexes: e.target.checked,
                    },
                  },
                }))
              }
            />
            ディレクトリ一覧を非表示 (-Indexes)
          </label>
          <label className="htx-checkbox-row">
            <input
              type="checkbox"
              checked={config.basic.options.followSymLinks}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  basic: {
                    ...prev.basic,
                    options: {
                      ...prev.basic.options,
                      followSymLinks: e.target.checked,
                    },
                  },
                }))
              }
            />
            シンボリックリンクを許可 (+FollowSymLinks)
          </label>
        </div>
      </div>

      {/* リダイレクト */}
      <div className="htx-section" aria-labelledby="htx-redirect-title">
        <h2 className="htx-section-title" id="htx-redirect-title">
          リダイレクト
        </h2>
        <label className="htx-checkbox-row">
          <input
            type="checkbox"
            checked={config.redirect.httpsRedirect}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                redirect: {
                  ...prev.redirect,
                  httpsRedirect: e.target.checked,
                },
              }))
            }
          />
          HTTP → HTTPS リダイレクト (301)
        </label>

        <div className="htx-field">
          <span className="htx-label" id="htx-www-label">
            www リダイレクト
          </span>
          <div className="htx-radio-group" role="group" aria-labelledby="htx-www-label">
            {WWW_REDIRECT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`htx-radio-btn${config.redirect.wwwRedirect === opt.value ? " htx-radio-btn--active" : ""}`}
              >
                <input
                  type="radio"
                  name="www-redirect"
                  value={opt.value}
                  checked={config.redirect.wwwRedirect === opt.value}
                  onChange={() =>
                    setConfig((prev) => ({
                      ...prev,
                      redirect: {
                        ...prev.redirect,
                        wwwRedirect: opt.value,
                      },
                    }))
                  }
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="htx-field">
          <span className="htx-label">カスタムリダイレクト</span>
          <div className="htx-redirect-list">
            {config.redirect.customRedirects.map((r, i) => (
              <div key={i} className="htx-redirect-row">
                <input
                  className="htx-input"
                  type="text"
                  value={r.from}
                  onChange={(e) => updateRedirect(i, "from", e.target.value)}
                  placeholder="/old-path"
                  aria-label={`リダイレクト元 ${i + 1}`}
                />
                <input
                  className="htx-input"
                  type="text"
                  value={r.to}
                  onChange={(e) => updateRedirect(i, "to", e.target.value)}
                  placeholder="https://example.com/new"
                  aria-label={`リダイレクト先 ${i + 1}`}
                />
                <select
                  className="htx-redirect-type"
                  value={r.type}
                  onChange={(e) => updateRedirect(i, "type", e.target.value as "301" | "302")}
                  aria-label={`リダイレクトタイプ ${i + 1}`}
                >
                  <option value="301">301</option>
                  <option value="302">302</option>
                </select>
                <button
                  className="htx-remove-btn"
                  type="button"
                  onClick={() => removeRedirect(i)}
                  aria-label={`リダイレクト ${i + 1} を削除`}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
          <button className="htx-add-btn" type="button" onClick={addRedirect}>
            + リダイレクトを追加
          </button>
        </div>
      </div>

      {/* キャッシュ制御 */}
      <div className="htx-section" aria-labelledby="htx-cache-title">
        <h2 className="htx-section-title" id="htx-cache-title">
          キャッシュ制御
        </h2>
        <label className="htx-checkbox-row">
          <input
            type="checkbox"
            checked={config.cache.enabled}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                cache: { ...prev.cache, enabled: e.target.checked },
              }))
            }
          />
          mod_expires によるキャッシュ制御を有効にする
        </label>
        {config.cache.enabled && (
          <div className="htx-grid-2">
            {(
              [
                { key: "images", label: "画像" },
                { key: "cssJs", label: "CSS / JS" },
                { key: "html", label: "HTML" },
                { key: "fonts", label: "フォント" },
              ] as const
            ).map(({ key, label }) => (
              <div className="htx-field" key={key}>
                <label className="htx-label" htmlFor={`htx-cache-${key}`}>
                  {label}
                </label>
                <select
                  id={`htx-cache-${key}`}
                  className="htx-select"
                  value={config.cache[key]}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      cache: { ...prev.cache, [key]: e.target.value },
                    }))
                  }
                >
                  {CACHE_DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GZIP 圧縮 */}
      <div className="htx-section" aria-labelledby="htx-compression-title">
        <h2 className="htx-section-title" id="htx-compression-title">
          GZIP 圧縮
        </h2>
        <label className="htx-checkbox-row">
          <input
            type="checkbox"
            checked={config.compression.enabled}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                compression: { enabled: e.target.checked },
              }))
            }
          />
          mod_deflate による GZIP 圧縮を有効にする
        </label>
      </div>

      {/* セキュリティ */}
      <div className="htx-section" aria-labelledby="htx-security-title">
        <h2 className="htx-section-title" id="htx-security-title">
          セキュリティ
        </h2>
        <div className="htx-grid-2">
          <label className="htx-checkbox-row">
            <input
              type="checkbox"
              checked={config.security.blockHtaccess}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  security: {
                    ...prev.security,
                    blockHtaccess: e.target.checked,
                  },
                }))
              }
            />
            .htaccess へのアクセスを禁止
          </label>
          <label className="htx-checkbox-row">
            <input
              type="checkbox"
              checked={config.security.blockSensitiveFiles}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  security: {
                    ...prev.security,
                    blockSensitiveFiles: e.target.checked,
                  },
                }))
              }
            />
            機密ファイル (.env, .log 等) を禁止
          </label>
          <label className="htx-checkbox-row">
            <input
              type="checkbox"
              checked={config.security.serverSignature}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  security: {
                    ...prev.security,
                    serverSignature: e.target.checked,
                  },
                }))
              }
            />
            サーバー署名を非表示 (ServerSignature Off)
          </label>
          <label className="htx-checkbox-row">
            <input
              type="checkbox"
              checked={config.security.noEtag}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  security: {
                    ...prev.security,
                    noEtag: e.target.checked,
                  },
                }))
              }
            />
            ETag を無効化
          </label>
        </div>

        <div className="htx-field">
          <label className="htx-label" htmlFor="htx-x-frame">
            X-Frame-Options
          </label>
          <select
            id="htx-x-frame"
            className="htx-select"
            value={config.security.xFrameOptions}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                security: {
                  ...prev.security,
                  xFrameOptions: e.target.value as HtaccessConfig["security"]["xFrameOptions"],
                },
              }))
            }
          >
            {X_FRAME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="htx-grid-2">
          <label className="htx-checkbox-row">
            <input
              type="checkbox"
              checked={config.security.xContentTypeOptions}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  security: {
                    ...prev.security,
                    xContentTypeOptions: e.target.checked,
                  },
                }))
              }
            />
            X-Content-Type-Options: nosniff
          </label>
          <label className="htx-checkbox-row">
            <input
              type="checkbox"
              checked={config.security.xssProtection}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  security: {
                    ...prev.security,
                    xssProtection: e.target.checked,
                  },
                }))
              }
            />
            X-XSS-Protection: 1; mode=block
          </label>
        </div>

        <div className="htx-field">
          <label className="htx-label" htmlFor="htx-referrer-policy">
            Referrer-Policy
          </label>
          <select
            id="htx-referrer-policy"
            className="htx-select"
            value={config.security.referrerPolicy}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                security: {
                  ...prev.security,
                  referrerPolicy: e.target.value,
                },
              }))
            }
          >
            <option value="">なし</option>
            <option value="no-referrer">no-referrer</option>
            <option value="no-referrer-when-downgrade">no-referrer-when-downgrade</option>
            <option value="strict-origin">strict-origin</option>
            <option value="strict-origin-when-cross-origin">strict-origin-when-cross-origin</option>
            <option value="origin">origin</option>
            <option value="origin-when-cross-origin">origin-when-cross-origin</option>
            <option value="same-origin">same-origin</option>
            <option value="unsafe-url">unsafe-url</option>
          </select>
        </div>
      </div>

      {/* カスタムエラーページ */}
      <div className="htx-section" aria-labelledby="htx-error-title">
        <h2 className="htx-section-title" id="htx-error-title">
          カスタムエラーページ
        </h2>
        <p className="htx-hint">空欄のエラーコードはデフォルトのエラーページが使用されます。</p>
        <div className="htx-grid-2">
          {(
            [
              { key: "e403", label: "403 Forbidden" },
              { key: "e404", label: "404 Not Found" },
              { key: "e500", label: "500 Internal Server Error" },
            ] as const
          ).map(({ key, label }) => (
            <div className="htx-field" key={key}>
              <label className="htx-label" htmlFor={`htx-error-${key}`}>
                {label}
              </label>
              <input
                id={`htx-error-${key}`}
                className="htx-input"
                type="text"
                value={config.errorPages[key]}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    errorPages: {
                      ...prev.errorPages,
                      [key]: e.target.value,
                    },
                  }))
                }
                placeholder="/error.html"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 出力 */}
      <div className="htx-section" aria-labelledby="htx-output-title">
        <h2 className="htx-section-title" id="htx-output-title">
          生成された .htaccess
        </h2>
        <div className="htx-output-wrapper">
          <pre className="htx-code-block" aria-label=".htaccess 出力">
            {output || (
              <span className="htx-placeholder">設定を変更すると .htaccess が生成されます</span>
            )}
          </pre>
        </div>
        <div className="htx-actions">
          <Button variant="outline" onClick={handleCopy}>
            コピー
          </Button>
          <Button onClick={handleDownload}>ダウンロード</Button>
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: ".htaccess とは",
            items: [
              ".htaccess は Apache HTTP サーバーのディレクトリ単位の設定ファイルです。",
              "サーバー全体の設定を変更せずに、特定のディレクトリのみの動作を制御できます。",
              "レンタルサーバーなどで広く利用されており、リダイレクトやアクセス制御に使われます。",
            ],
          },
          {
            title: "使い方",
            items: [
              "各セクションで設定を入力すると、下部の出力エリアにリアルタイムで .htaccess が生成されます。",
              "プリセットを選択すると、よく使われる設定を一括で適用できます。",
              "「ダウンロード」ボタンで .htaccess ファイルとして保存できます。",
              "生成した .htaccess は、Web サーバーのドキュメントルートに配置してください。",
            ],
          },
        ]}
      />
    </div>
  );
}
