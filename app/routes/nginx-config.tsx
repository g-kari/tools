import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  generateNginxConfig,
  getDefaultConfig,
  type NginxServerConfig,
} from "../utils/nginx-config";
import "../styles/tools/nginx-config.css";

export const Route = createFileRoute("/nginx-config")({
  head: () => ({
    meta: [
      { title: "Nginx 設定ジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "Nginx サーバーブロックの設定を GUI で生成。静的サイト・リバースプロキシ・HTTPSリダイレクトに対応。",
      },
      {
        property: "og:title",
        content: "Nginx 設定ジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Nginx サーバーブロックの設定を GUI で生成。静的サイト・リバースプロキシ・HTTPSリダイレクトに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/nginx-config` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Nginx 設定ジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "Nginx サーバーブロックの設定を GUI で生成するツール。",
      },
    ],
  }),
  component: NginxConfigPage,
});

/** サンプルプリセット */
const SAMPLES: Array<{
  label: string;
  config: Partial<NginxServerConfig>;
}> = [
  {
    label: "静的サイト (HTTPS)",
    config: {
      serverType: "static",
      domains: ["example.com", "www.example.com"],
      port: 443,
      ssl: true,
      sslCert: "/etc/nginx/ssl/cert.pem",
      sslKey: "/etc/nginx/ssl/key.pem",
      root: "/var/www/html",
      index: "index.html index.htm",
      gzip: true,
      cacheStaticAssets: true,
      headers: {
        xFrameOptions: "SAMEORIGIN",
        xContentTypeOptions: true,
        xssProtection: true,
        hsts: true,
        referrerPolicy: "strict-origin-when-cross-origin",
      },
    },
  },
  {
    label: "Node.js プロキシ",
    config: {
      serverType: "proxy",
      domains: ["app.example.com"],
      port: 80,
      ssl: false,
      proxyPass: "http://localhost:3000",
      proxyBuffering: false,
      proxyReadTimeout: 60,
      gzip: true,
      cacheStaticAssets: false,
      headers: {
        xFrameOptions: "SAMEORIGIN",
        xContentTypeOptions: true,
        xssProtection: false,
        hsts: false,
        referrerPolicy: "strict-origin-when-cross-origin",
      },
    },
  },
  {
    label: "HTTPSリダイレクト",
    config: {
      serverType: "redirect",
      domains: ["example.com"],
      port: 80,
      ssl: false,
      redirectTo: "https://example.com",
    },
  },
];

/** X-Frame-Options の選択肢 */
const X_FRAME_OPTIONS = [
  { value: "DENY", label: "DENY（全て拒否）" },
  { value: "SAMEORIGIN", label: "SAMEORIGIN（同一オリジンのみ許可）" },
  { value: "none", label: "設定しない" },
] as const;

/** Referrer-Policy の選択肢 */
const REFERRER_POLICIES = [
  "no-referrer",
  "no-referrer-when-downgrade",
  "origin",
  "origin-when-cross-origin",
  "same-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url",
];

/**
 * Nginx 設定ジェネレーター ページコンポーネント
 */
function NginxConfigPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [config, setConfig] = useState<NginxServerConfig>(() => getDefaultConfig());

  /** 設定を部分的に更新するヘルパー */
  const updateConfig = (patch: Partial<NginxServerConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  /** ヘッダー設定を部分的に更新するヘルパー */
  const updateHeaders = (patch: Partial<NginxServerConfig["headers"]>) => {
    setConfig((prev) => ({
      ...prev,
      headers: { ...prev.headers, ...patch },
    }));
  };

  /** ドメイン入力文字列（スペース区切り）→配列変換 */
  const domainsString = config.domains.join(" ");

  /** 生成された Nginx 設定（メモ化） */
  const generatedConfig = useMemo(() => generateNginxConfig(config), [config]);

  const handleCopy = async () => {
    const success = await copy(generatedConfig);
    if (success) {
      showToast("設定をコピーしました", "success");
      announceStatus("設定をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  };

  const handleSample = (sample: (typeof SAMPLES)[number]) => {
    setConfig((prev) => ({
      ...getDefaultConfig(),
      ...prev,
      ...sample.config,
      headers: {
        ...getDefaultConfig().headers,
        ...sample.config.headers,
      },
    }));
    announceStatus(`「${sample.label}」プリセットを読み込みました`);
  };

  const handleReset = () => {
    setConfig(getDefaultConfig());
    announceStatus("設定をリセットしました");
  };

  return (
    <>
      <div className="ngx-container">
        {/* サンプルプリセット */}
        <div className="ngx-samples" role="group" aria-label="プリセットを読み込む">
          <span className="ngx-samples-label">プリセット：</span>
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              className="ngx-sample-btn"
              onClick={() => handleSample(s)}
              aria-label={`${s.label}のプリセットを読み込む`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* サーバータイプ選択 */}
        <section className="ngx-section" aria-labelledby="ngx-server-type-heading">
          <h2 id="ngx-server-type-heading" className="ngx-section-title">
            サーバータイプ
          </h2>
          <div className="ngx-radio-group" role="radiogroup" aria-label="サーバータイプ">
            {(
              [
                { value: "static", label: "静的サイト" },
                { value: "proxy", label: "リバースプロキシ" },
                { value: "redirect", label: "HTTPSリダイレクト" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`ngx-radio-btn${config.serverType === opt.value ? " ngx-radio-btn--active" : ""}`}
              >
                <input
                  type="radio"
                  name="serverType"
                  value={opt.value}
                  checked={config.serverType === opt.value}
                  onChange={() => updateConfig({ serverType: opt.value })}
                  aria-label={opt.label}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>

        {/* 基本設定 */}
        <section className="ngx-section" aria-labelledby="ngx-basic-heading">
          <h2 id="ngx-basic-heading" className="ngx-section-title">
            基本設定
          </h2>

          <div className="ngx-field">
            <label htmlFor="ngx-domains" className="ngx-label">
              ドメイン名（スペース区切りで複数指定可）
            </label>
            <input
              id="ngx-domains"
              type="text"
              className="ngx-input"
              value={domainsString}
              onChange={(e) =>
                updateConfig({
                  domains: e.target.value.split(/\s+/).filter((d) => d.length > 0),
                })
              }
              placeholder="example.com www.example.com"
              aria-label="ドメイン名（スペース区切り）"
              autoComplete="off"
            />
          </div>

          <div className="ngx-grid-2">
            <div className="ngx-field">
              <label htmlFor="ngx-port" className="ngx-label">
                リッスンポート
              </label>
              <input
                id="ngx-port"
                type="number"
                className="ngx-input"
                value={config.port}
                min={1}
                max={65535}
                onChange={(e) => updateConfig({ port: parseInt(e.target.value, 10) || 80 })}
                aria-label="リッスンポート番号"
              />
            </div>

            <div className="ngx-field">
              <label htmlFor="ngx-client-max-body" className="ngx-label">
                クライアント最大ボディサイズ
              </label>
              <input
                id="ngx-client-max-body"
                type="text"
                className="ngx-input"
                value={config.clientMaxBodySize}
                onChange={(e) => updateConfig({ clientMaxBodySize: e.target.value })}
                placeholder="10m"
                aria-label="クライアント最大ボディサイズ"
              />
            </div>
          </div>

          <label className="ngx-checkbox-row">
            <input
              type="checkbox"
              checked={config.accessLog}
              onChange={(e) => updateConfig({ accessLog: e.target.checked })}
              aria-label="アクセスログを有効にする"
            />
            アクセスログを有効にする
          </label>
        </section>

        {/* SSL/TLS 設定 */}
        {config.serverType !== "redirect" && (
          <section className="ngx-section" aria-labelledby="ngx-ssl-heading">
            <h2 id="ngx-ssl-heading" className="ngx-section-title">
              SSL / TLS
            </h2>

            <label className="ngx-checkbox-row">
              <input
                type="checkbox"
                checked={config.ssl}
                onChange={(e) => updateConfig({ ssl: e.target.checked })}
                aria-label="SSL を有効にする"
              />
              SSL を有効にする
            </label>

            {config.ssl && (
              <>
                <div className="ngx-field">
                  <label htmlFor="ngx-ssl-cert" className="ngx-label">
                    SSL 証明書パス
                  </label>
                  <input
                    id="ngx-ssl-cert"
                    type="text"
                    className="ngx-input"
                    value={config.sslCert}
                    onChange={(e) => updateConfig({ sslCert: e.target.value })}
                    placeholder="/etc/nginx/ssl/cert.pem"
                    aria-label="SSL 証明書のファイルパス"
                  />
                </div>

                <div className="ngx-field">
                  <label htmlFor="ngx-ssl-key" className="ngx-label">
                    SSL 秘密鍵パス
                  </label>
                  <input
                    id="ngx-ssl-key"
                    type="text"
                    className="ngx-input"
                    value={config.sslKey}
                    onChange={(e) => updateConfig({ sslKey: e.target.value })}
                    placeholder="/etc/nginx/ssl/key.pem"
                    aria-label="SSL 秘密鍵のファイルパス"
                  />
                </div>
              </>
            )}
          </section>
        )}

        {/* コンテンツ設定（サーバータイプ別） */}
        {config.serverType === "static" && (
          <section className="ngx-section" aria-labelledby="ngx-content-heading">
            <h2 id="ngx-content-heading" className="ngx-section-title">
              静的サイト設定
            </h2>

            <div className="ngx-field">
              <label htmlFor="ngx-root" className="ngx-label">
                ドキュメントルート
              </label>
              <input
                id="ngx-root"
                type="text"
                className="ngx-input"
                value={config.root}
                onChange={(e) => updateConfig({ root: e.target.value })}
                placeholder="/var/www/html"
                aria-label="ドキュメントルートのパス"
              />
            </div>

            <div className="ngx-field">
              <label htmlFor="ngx-index" className="ngx-label">
                インデックスファイル
              </label>
              <input
                id="ngx-index"
                type="text"
                className="ngx-input"
                value={config.index}
                onChange={(e) => updateConfig({ index: e.target.value })}
                placeholder="index.html index.htm"
                aria-label="インデックスファイル名（スペース区切り）"
              />
            </div>
          </section>
        )}

        {config.serverType === "proxy" && (
          <section className="ngx-section" aria-labelledby="ngx-proxy-heading">
            <h2 id="ngx-proxy-heading" className="ngx-section-title">
              リバースプロキシ設定
            </h2>

            <div className="ngx-field">
              <label htmlFor="ngx-proxy-pass" className="ngx-label">
                プロキシ先 URL
              </label>
              <input
                id="ngx-proxy-pass"
                type="text"
                className="ngx-input"
                value={config.proxyPass}
                onChange={(e) => updateConfig({ proxyPass: e.target.value })}
                placeholder="http://localhost:3000"
                aria-label="プロキシ先の URL"
              />
            </div>

            <div className="ngx-field">
              <label htmlFor="ngx-proxy-read-timeout" className="ngx-label">
                プロキシ読み取りタイムアウト（秒）
              </label>
              <input
                id="ngx-proxy-read-timeout"
                type="number"
                className="ngx-input"
                value={config.proxyReadTimeout}
                min={1}
                onChange={(e) =>
                  updateConfig({
                    proxyReadTimeout: parseInt(e.target.value, 10) || 60,
                  })
                }
                aria-label="プロキシ読み取りタイムアウト（秒）"
              />
            </div>

            <label className="ngx-checkbox-row">
              <input
                type="checkbox"
                checked={config.proxyBuffering}
                onChange={(e) => updateConfig({ proxyBuffering: e.target.checked })}
                aria-label="プロキシバッファリングを有効にする"
              />
              プロキシバッファリングを有効にする
            </label>
          </section>
        )}

        {config.serverType === "redirect" && (
          <section className="ngx-section" aria-labelledby="ngx-redirect-heading">
            <h2 id="ngx-redirect-heading" className="ngx-section-title">
              リダイレクト設定
            </h2>

            <div className="ngx-field">
              <label htmlFor="ngx-redirect-to" className="ngx-label">
                リダイレクト先 URL
              </label>
              <input
                id="ngx-redirect-to"
                type="text"
                className="ngx-input"
                value={config.redirectTo}
                onChange={(e) => updateConfig({ redirectTo: e.target.value })}
                placeholder="https://example.com"
                aria-label="リダイレクト先の URL"
              />
            </div>
          </section>
        )}

        {/* パフォーマンス設定 */}
        {config.serverType !== "redirect" && (
          <section className="ngx-section" aria-labelledby="ngx-perf-heading">
            <h2 id="ngx-perf-heading" className="ngx-section-title">
              パフォーマンス
            </h2>

            <label className="ngx-checkbox-row">
              <input
                type="checkbox"
                checked={config.gzip}
                onChange={(e) => updateConfig({ gzip: e.target.checked })}
                aria-label="gzip 圧縮を有効にする"
              />
              gzip 圧縮を有効にする
            </label>

            <label className="ngx-checkbox-row">
              <input
                type="checkbox"
                checked={config.cacheStaticAssets}
                onChange={(e) => updateConfig({ cacheStaticAssets: e.target.checked })}
                aria-label="静的アセットをキャッシュする"
              />
              静的アセットをキャッシュする（1年間）
            </label>
          </section>
        )}

        {/* セキュリティヘッダー */}
        {config.serverType !== "redirect" && (
          <section className="ngx-section" aria-labelledby="ngx-headers-heading">
            <h2 id="ngx-headers-heading" className="ngx-section-title">
              セキュリティヘッダー
            </h2>

            <div className="ngx-field">
              <label htmlFor="ngx-x-frame" className="ngx-label">
                X-Frame-Options
              </label>
              <select
                id="ngx-x-frame"
                className="ngx-select"
                value={config.headers.xFrameOptions}
                onChange={(e) =>
                  updateHeaders({
                    xFrameOptions: e.target.value as "DENY" | "SAMEORIGIN" | "none",
                  })
                }
                aria-label="X-Frame-Options の設定"
              >
                {X_FRAME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ngx-field">
              <label htmlFor="ngx-referrer-policy" className="ngx-label">
                Referrer-Policy
              </label>
              <select
                id="ngx-referrer-policy"
                className="ngx-select"
                value={config.headers.referrerPolicy}
                onChange={(e) => updateHeaders({ referrerPolicy: e.target.value })}
                aria-label="Referrer-Policy の設定"
              >
                {REFERRER_POLICIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <label className="ngx-checkbox-row">
              <input
                type="checkbox"
                checked={config.headers.xContentTypeOptions}
                onChange={(e) => updateHeaders({ xContentTypeOptions: e.target.checked })}
                aria-label="X-Content-Type-Options: nosniff を付与する"
              />
              X-Content-Type-Options: nosniff
            </label>

            <label className="ngx-checkbox-row">
              <input
                type="checkbox"
                checked={config.headers.xssProtection}
                onChange={(e) => updateHeaders({ xssProtection: e.target.checked })}
                aria-label="X-XSS-Protection ヘッダーを付与する"
              />
              X-XSS-Protection: 1; mode=block
            </label>

            <label className="ngx-checkbox-row">
              <input
                type="checkbox"
                checked={config.headers.hsts}
                disabled={!config.ssl}
                onChange={(e) => updateHeaders({ hsts: e.target.checked })}
                aria-label="HSTS ヘッダーを付与する（SSL 必須）"
              />
              HSTS: Strict-Transport-Security
              {!config.ssl && <span className="ngx-placeholder">（SSL 有効時のみ）</span>}
            </label>
          </section>
        )}

        {/* 生成結果 */}
        <section className="ngx-section" aria-labelledby="ngx-output-heading">
          <h2 id="ngx-output-heading" className="ngx-section-title">
            生成された設定
          </h2>

          <div className="ngx-output-wrapper">
            <pre className="ngx-code-block" aria-label="生成された Nginx 設定" aria-live="polite">
              <code>{generatedConfig}</code>
            </pre>
          </div>

          <div className="ngx-actions">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleReset}
              aria-label="設定をリセット"
            >
              リセット
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleCopy}
              aria-label="設定をコピー"
            >
              コピー
            </Button>
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "サーバータイプを選択してフォームに入力すると、設定が自動生成されます",
                "プリセットボタンで代表的な設定をすぐに試せます",
                "「コピー」ボタンで生成された設定をクリップボードにコピーできます",
                "生成された設定は /etc/nginx/sites-available/ などに保存してください",
              ],
            },
            {
              title: "サーバータイプ",
              items: [
                "静的サイト: HTML/CSS/JS などの静的ファイルを直接配信します",
                "リバースプロキシ: Node.js / Python / Go などのアプリサーバーへプロキシします",
                "HTTPSリダイレクト: HTTP アクセスを HTTPS へ 301 リダイレクトします",
              ],
            },
            {
              title: "設定のポイント",
              items: [
                "SSL を有効にする場合は Let's Encrypt などで証明書を取得してください",
                "HSTS は SSL が有効な場合のみ付与されます",
                "gzip は text/*, application/json, application/javascript などに適用されます",
                "静的アセットキャッシュは JS/CSS/画像などに 1 年間の Cache-Control を設定します",
                "proxy_buffering off はサーバー送信イベント (SSE) や streaming に有効です",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
