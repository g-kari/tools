import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useId } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  RESPONSE_DIRECTIVES,
  REQUEST_DIRECTIVES,
  RESPONSE_PRESETS,
  type CacheControlDirectiveEntry,
  type DirectiveTarget,
  parseCacheControl,
  buildCacheControl,
  validateCacheControl,
  findResponseDirectiveInfo,
  findRequestDirectiveInfo,
  formatSeconds,
} from "~/utils/cache-control";

export const Route = createFileRoute("/cache-control")({
  head: () => ({
    meta: [
      { title: "Cache-Control ヘッダービルダー | Web ツール集" },
      {
        name: "description",
        content:
          "Cache-Control HTTPヘッダーをGUIで構築・パース・検証するツール。max-age・no-store・no-cache・immutable・stale-while-revalidate など全ディレクティブに対応。よく使うプリセット付き。",
      },
      { property: "og:title", content: "Cache-Control ヘッダービルダー | Web ツール集" },
      {
        property: "og:description",
        content:
          "Cache-Control HTTPヘッダーをGUIで構築・パース・検証するツール。よく使うプリセット付き。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/cache-control` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Cache-Control ヘッダービルダー | Web ツール集" },
      {
        name: "twitter:description",
        content: "Cache-Control HTTPヘッダーをGUIで構築・パース・検証するツール。",
      },
    ],
  }),
  component: CacheControlPage,
});

/** モード定義 */
type Mode = "build" | "parse";

/** ディレクティブ行コンポーネント */
function DirectiveRow({
  entry,
  target,
  onToggle,
  onUpdateValue,
  onRemove,
}: {
  entry: CacheControlDirectiveEntry;
  target: DirectiveTarget;
  onToggle: (name: string) => void;
  onUpdateValue: (name: string, value: number | undefined) => void;
  onRemove: (name: string) => void;
}) {
  const info =
    target === "response"
      ? findResponseDirectiveInfo(entry.name)
      : findRequestDirectiveInfo(entry.name);
  const inputId = useId();

  return (
    <div className={`cc-directive-row ${!entry.enabled ? "cc-directive-row-disabled" : ""}`}>
      <div className="cc-directive-row-header">
        <label className="cc-directive-toggle" title={entry.enabled ? "無効化" : "有効化"}>
          <input
            type="checkbox"
            checked={entry.enabled}
            onChange={() => onToggle(entry.name)}
            aria-label={`${entry.name} を${entry.enabled ? "無効化" : "有効化"}`}
          />
        </label>
        <div className="cc-directive-name-wrap">
          <code className="cc-directive-name">{entry.name}</code>
          {info?.valueType !== "none" && entry.enabled && (
            <span className="cc-directive-value-badge">
              {entry.value !== undefined ? formatSeconds(entry.value) : "値なし"}
            </span>
          )}
        </div>
        <button
          type="button"
          className="cc-remove-btn"
          onClick={() => onRemove(entry.name)}
          aria-label={`${entry.name} を削除`}
          title="削除"
        >
          ✕
        </button>
      </div>
      {info && <p className="cc-directive-description">{info.description}</p>}
      {info && info.valueType !== "none" && (
        <div className="cc-value-input-wrap">
          <label htmlFor={inputId} className="cc-value-label">
            {info.valueType === "optional-number" ? "値（省略可）" : "値"}
            {info.unit && ` (${info.unit})`}
          </label>
          <div className="cc-value-input-row">
            <input
              id={inputId}
              type="number"
              min="0"
              className="cc-value-input"
              value={entry.value ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onUpdateValue(entry.name, v === "" ? undefined : parseInt(v, 10));
              }}
              disabled={!entry.enabled}
              placeholder={
                info.valueType === "optional-number"
                  ? `省略可（例: ${info.defaultValue}）`
                  : `例: ${info.defaultValue}`
              }
              aria-label={`${entry.name} の値（秒）`}
            />
            {/* クイック秒数チップ */}
            {entry.enabled && (
              <div className="cc-quick-chips" aria-label="クイック入力">
                {[60, 300, 3600, 86400, 604800, 2592000, 31536000].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    className={`cc-quick-chip ${entry.value === sec ? "cc-quick-chip-active" : ""}`}
                    onClick={() => onUpdateValue(entry.name, sec)}
                    title={formatSeconds(sec)}
                    aria-label={`${sec} 秒（${formatSeconds(sec)}）を設定`}
                  >
                    {formatSeconds(sec)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Cache-Control ビルダーメインコンポーネント */
function CacheControlPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>("build");
  const [target, setTarget] = useState<DirectiveTarget>("response");
  const [directives, setDirectives] = useState<CacheControlDirectiveEntry[]>([
    { name: "public", enabled: true },
    { name: "max-age", enabled: true, value: 3600 },
  ]);
  const [parseInput, setParseInput] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [addDirectiveName, setAddDirectiveName] = useState("");

  // ビルド済みヘッダー値
  const headerValue = buildCacheControl(directives, target as "request" | "response");

  // 検証結果
  const validation = validateCacheControl(directives);

  // ディレクティブのトグル
  const handleToggle = useCallback((name: string) => {
    setDirectives((prev) => prev.map((d) => (d.name === name ? { ...d, enabled: !d.enabled } : d)));
  }, []);

  // 値の更新
  const handleUpdateValue = useCallback((name: string, value: number | undefined) => {
    setDirectives((prev) => prev.map((d) => (d.name === name ? { ...d, value } : d)));
  }, []);

  // ディレクティブ削除
  const handleRemove = useCallback((name: string) => {
    setDirectives((prev) => prev.filter((d) => d.name !== name));
  }, []);

  // ディレクティブ追加
  const handleAddDirective = useCallback(() => {
    const name = addDirectiveName.trim().toLowerCase();
    if (!name) return;
    if (directives.some((d) => d.name === name)) {
      showToast(`"${name}" はすでに追加されています`, "error");
      return;
    }
    const allDirs = target === "response" ? RESPONSE_DIRECTIVES : REQUEST_DIRECTIVES;
    const info = allDirs.find((d) => d.name === name);
    const defaultValue = info?.valueType !== "none" ? (info?.defaultValue ?? 0) : undefined;
    setDirectives((prev) => [...prev, { name, enabled: true, value: defaultValue }]);
    setAddDirectiveName("");
    announceStatus(`${name} を追加しました`);
  }, [addDirectiveName, directives, target, showToast, announceStatus]);

  // プリセット適用
  const handleApplyPreset = useCallback(
    (presetIndex: number) => {
      const preset = RESPONSE_PRESETS[presetIndex];
      if (!preset) return;
      setDirectives(preset.directives.map((d) => ({ ...d })));
      setTarget("response");
      announceStatus(`"${preset.name}" プリセットを適用しました`);
      showToast(`"${preset.name}" プリセットを適用しました`, "success");
    },
    [announceStatus, showToast],
  );

  // クリア
  const handleClear = useCallback(() => {
    setDirectives([]);
    setParseInput("");
    setParseErrors([]);
    announceStatus("クリアしました");
  }, [announceStatus]);

  // パース実行
  const handleParse = useCallback(() => {
    const { directives: parsed, errors } = parseCacheControl(
      parseInput,
      target as "request" | "response",
    );
    if (parsed.length === 0 && errors.length === 0) {
      showToast("Cache-Control ヘッダー値を入力してください", "error");
      return;
    }
    setDirectives(parsed);
    setParseErrors(errors);
    setMode("build");
    announceStatus(`${parsed.length} 件のディレクティブをパースしました`);
    if (errors.length > 0) {
      showToast(`${errors.length} 件の警告があります`, "error");
    } else {
      showToast(`${parsed.length} 件のディレクティブをパースしました`, "success");
    }
  }, [parseInput, target, showToast, announceStatus]);

  // クリップボードコピー
  const handleCopy = useCallback(async () => {
    if (!headerValue) return;
    const success = await copy(headerValue);
    if (success) {
      showToast("Cache-Control ヘッダー値をコピーしました", "success");
      announceStatus("クリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [headerValue, copy, showToast, announceStatus]);

  // 既存のディレクティブ名セット
  const usedNames = new Set(directives.map((d) => d.name));
  const allDirs = target === "response" ? RESPONSE_DIRECTIVES : REQUEST_DIRECTIVES;
  const availableDirectives = allDirs.filter((d) => !usedNames.has(d.name));

  return (
    <>
      <div className="tool-container">
        <h2 className="tool-title">Cache-Control ヘッダービルダー</h2>
        <p className="tool-description">
          HTTP キャッシュ制御ヘッダーを視覚的に構築・パース・検証するツールです。
          ディレクティブを選択・設定して Cache-Control ヘッダー値を即座に生成します。
        </p>

        {/* モード切替 */}
        <div className="csp-mode-tabs" role="tablist" aria-label="モード選択">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "build"}
            className={`csp-mode-tab ${mode === "build" ? "csp-mode-tab-active" : ""}`}
            onClick={() => setMode("build")}
          >
            ビルド
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "parse"}
            className={`csp-mode-tab ${mode === "parse" ? "csp-mode-tab-active" : ""}`}
            onClick={() => setMode("parse")}
          >
            パース
          </button>
        </div>

        {/* ターゲット切替 */}
        <div className="cc-target-section" role="group" aria-label="ヘッダー種別">
          <span className="cc-target-label">種別:</span>
          <label className="cc-target-radio">
            <input
              type="radio"
              name="cc-target"
              value="response"
              checked={target === "response"}
              onChange={() => {
                setTarget("response");
                setDirectives([]);
              }}
            />
            レスポンスヘッダー
          </label>
          <label className="cc-target-radio">
            <input
              type="radio"
              name="cc-target"
              value="request"
              checked={target === "request"}
              onChange={() => {
                setTarget("request");
                setDirectives([]);
              }}
            />
            リクエストヘッダー
          </label>
        </div>

        {/* パースモード */}
        {mode === "parse" && (
          <div className="csp-parse-section">
            <label htmlFor="cc-parse-input" className="section-title">
              既存の Cache-Control ヘッダー値を貼り付け
            </label>
            <textarea
              id="cc-parse-input"
              className="csp-parse-textarea"
              value={parseInput}
              onChange={(e) => setParseInput(e.target.value)}
              placeholder="例: public, max-age=3600, stale-while-revalidate=60"
              rows={3}
              spellCheck={false}
              autoComplete="off"
              aria-label="パースする Cache-Control ヘッダー値"
            />
            <div className="csp-parse-actions">
              <button
                type="button"
                className="button-primary"
                onClick={handleParse}
                disabled={!parseInput.trim()}
              >
                パースしてビルダーに反映
              </button>
            </div>
          </div>
        )}

        {/* ビルドモード */}
        {mode === "build" && (
          <>
            {/* プリセット（レスポンスのみ表示） */}
            {target === "response" && (
              <div className="cc-presets-section">
                <span className="csp-templates-label">プリセット:</span>
                <div className="cc-presets-grid">
                  {RESPONSE_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      className="cc-preset-btn"
                      onClick={() => handleApplyPreset(idx)}
                      title={preset.useCase}
                    >
                      <span className="cc-preset-name">{preset.name}</span>
                      <span className="cc-preset-desc">{preset.useCase}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="cc-preset-btn cc-preset-btn-danger"
                    onClick={handleClear}
                    title="すべてクリア"
                  >
                    <span className="cc-preset-name">クリア</span>
                    <span className="cc-preset-desc">設定をすべてリセット</span>
                  </button>
                </div>
              </div>
            )}

            {/* ディレクティブ一覧 */}
            <section className="csp-category-section" aria-labelledby="cc-directives-heading">
              <h3 id="cc-directives-heading" className="csp-category-heading">
                {target === "response" ? "レスポンス" : "リクエスト"}ディレクティブ
                <span className="csp-category-desc">
                  {directives.filter((d) => d.enabled).length} 件有効
                </span>
              </h3>
              <div className="csp-directives-list">
                {directives.length === 0 ? (
                  <p className="csp-empty-hint">
                    ディレクティブがありません。下の「ディレクティブを追加」から追加してください。
                  </p>
                ) : (
                  directives.map((entry) => (
                    <DirectiveRow
                      key={entry.name}
                      entry={entry}
                      target={target}
                      onToggle={handleToggle}
                      onUpdateValue={handleUpdateValue}
                      onRemove={handleRemove}
                    />
                  ))
                )}
              </div>
            </section>

            {/* ディレクティブ追加 */}
            <div className="csp-add-section">
              <label htmlFor="cc-add-directive" className="csp-add-label">
                ディレクティブを追加
              </label>
              <div className="csp-add-row">
                <select
                  id="cc-add-directive"
                  className="csp-add-select"
                  value={addDirectiveName}
                  onChange={(e) => setAddDirectiveName(e.target.value)}
                  aria-label="追加するディレクティブを選択"
                >
                  <option value="">-- ディレクティブを選択 --</option>
                  {availableDirectives.length > 0 ? (
                    availableDirectives.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                        {d.valueType !== "none" ? ` (=${d.defaultValue ?? "値"})` : ""}
                      </option>
                    ))
                  ) : (
                    <option disabled>利用可能なディレクティブがありません</option>
                  )}
                </select>
                <button
                  type="button"
                  className="button-primary csp-add-btn"
                  onClick={handleAddDirective}
                  disabled={!addDirectiveName}
                  aria-label="選択したディレクティブを追加"
                >
                  追加
                </button>
              </div>
            </div>
          </>
        )}

        {/* 生成結果 */}
        {mode === "build" && (
          <div className="csp-output-section">
            <div className="csp-output-header">
              <h3 className="section-title">生成された Cache-Control ヘッダー値</h3>
              <div className="csp-output-controls">
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleCopy}
                  disabled={!headerValue}
                  aria-label="Cache-Control ヘッダー値をクリップボードにコピー"
                >
                  コピー
                </button>
              </div>
            </div>

            {headerValue ? (
              <>
                <div
                  className="csp-output-box"
                  role="region"
                  aria-label="生成された Cache-Control 値"
                >
                  <code className="csp-output-code" aria-label="Cache-Control の値">
                    {headerValue}
                  </code>
                </div>
                <div className="csp-http-example">
                  <p className="csp-http-example-label">HTTP レスポンスヘッダー例:</p>
                  <code className="csp-output-code">Cache-Control: {headerValue}</code>
                </div>
              </>
            ) : (
              <div className="csp-output-empty">有効なディレクティブが設定されていません</div>
            )}
          </div>
        )}

        {/* パースエラー */}
        {parseErrors.length > 0 && (
          <div className="csp-errors-section" role="alert">
            <h3 className="csp-validation-heading csp-validation-heading-error">パースエラー</h3>
            <ul className="csp-validation-list">
              {parseErrors.map((e, i) => (
                <li key={i} className="csp-validation-item csp-validation-item-error">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 検証結果 */}
        {mode === "build" &&
          headerValue &&
          (validation.warnings.length > 0 || validation.suggestions.length > 0) && (
            <div className="csp-validation-section" role="region" aria-label="検証結果">
              {validation.warnings.length > 0 && (
                <div className="csp-validation-group">
                  <h3 className="csp-validation-heading csp-validation-heading-warning">
                    ⚠️ 警告 ({validation.warnings.length})
                  </h3>
                  <ul className="csp-validation-list">
                    {validation.warnings.map((w, i) => (
                      <li key={i} className="csp-validation-item csp-validation-item-warning">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {validation.suggestions.length > 0 && (
                <div className="csp-validation-group">
                  <h3 className="csp-validation-heading csp-validation-heading-suggestion">
                    💡 改善提案 ({validation.suggestions.length})
                  </h3>
                  <ul className="csp-validation-list">
                    {validation.suggestions.map((s, i) => (
                      <li key={i} className="csp-validation-item csp-validation-item-suggestion">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        <TipsCard
          sections={[
            {
              title: "Cache-Control とは",
              items: [
                "Cache-Control は HTTP/1.1 で定義されたヘッダーで、ブラウザや CDN にキャッシュ方法を指示します",
                "レスポンスヘッダーとしてサーバーが送信し、リクエストヘッダーとしてクライアントが送信できます",
                '"max-age" は秒数で指定し、その間はキャッシュからレスポンスが返されます',
                '"no-cache" はキャッシュを禁止するのではなく、「毎回再検証せよ」という意味です',
                '"no-store" が本当の「キャッシュ禁止」で、どこにも保存しません',
              ],
            },
            {
              title: "よく使うパターン",
              items: [
                "機密情報（ログイン後のページ）: no-store",
                "HTMLページ（毎回最新を確認）: no-cache",
                "静的アセット（JS/CSS/画像）: public, max-age=31536000, immutable",
                "API レスポンス（短期キャッシュ）: public, max-age=60, stale-while-revalidate=300",
                "CDN を使う場合: public, max-age=3600, s-maxage=86400",
              ],
            },
            {
              title: "immutable を使う場合の注意",
              items: [
                '"immutable" はファイル名にコンテンツハッシュを含む場合のみ安全に使えます',
                "例: main.a1b2c3d4.js のようにビルドごとにファイル名が変わる場合",
                '"immutable" を使うと、ブラウザは有効期限内の条件付きリクエスト（304チェック）を送らず、パフォーマンスが向上します',
                "React/Vite/webpack 等の現代的なビルドツールは自動的にコンテンツハッシュを付与します",
              ],
            },
            {
              title: "stale-while-revalidate の活用",
              items: [
                '"stale-while-revalidate=60" は「60秒間は古いレスポンスを返しつつ、バックグラウンドで更新する」という意味です',
                "UX（ロード速度）とデータの新鮮さのバランスを取るのに最適です",
                "Next.js の ISR（Incremental Static Regeneration）や SWR ライブラリと相性が良いです",
                "CDN（Cloudflare, Fastly 等）も対応しており、オリジンへのリクエスト数を削減できます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
