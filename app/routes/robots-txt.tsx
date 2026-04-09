import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  generateRobotsTxt,
  generateId,
  isValidPath,
  isValidSitemapUrl,
  createAllowAllPreset,
  createBlockAllPreset,
  createWordPressPreset,
  COMMON_USER_AGENTS,
  COMMON_DISALLOW_PATHS,
  type CrawlerRule,
  type RobotsTxtOptions,
} from "~/utils/robots-txt";

export const Route = createFileRoute("/robots-txt")({
  head: () => ({
    meta: [
      { title: "robots.txt ジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "robots.txt ファイルをGUIで作成するツール。User-agent別のAllow/Disallowルール設定、Crawl-delay、Sitemapを視覚的に編集してコードを即座に生成。",
      },
      {
        property: "og:title",
        content: "robots.txt ジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "robots.txt ファイルをGUIで作成するツール。User-agent別のAllow/Disallowルール設定、Crawl-delay、Sitemapを視覚的に編集してコードを即座に生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/robots-txt` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "robots.txt ジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "robots.txt ファイルをGUIで視覚的に作成するツール。",
      },
    ],
  }),
  component: RobotsTxtGenerator,
});

/** パスリスト（Allow/Disallow）の編集コンポーネント */
function PathList({
  paths,
  type,
  ruleId,
  onUpdate,
}: {
  paths: string[];
  type: "allow" | "disallow";
  ruleId: string;
  onUpdate: (ruleId: string, type: "allow" | "disallow", paths: string[]) => void;
}) {
  const isAllow = type === "allow";
  const labelClass = isAllow
    ? "robots-paths-label robots-paths-label-allow"
    : "robots-paths-label robots-paths-label-disallow";
  const labelText = isAllow ? "Allow" : "Disallow";
  const placeholder = isAllow ? "/public/" : "/admin/";

  const handleChange = useCallback(
    (index: number, value: string) => {
      const updated = [...paths];
      updated[index] = value;
      onUpdate(ruleId, type, updated);
    },
    [paths, ruleId, type, onUpdate],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const updated = paths.filter((_, i) => i !== index);
      onUpdate(ruleId, type, updated);
    },
    [paths, ruleId, type, onUpdate],
  );

  const handleAdd = useCallback(() => {
    onUpdate(ruleId, type, [...paths, ""]);
  }, [paths, ruleId, type, onUpdate]);

  return (
    <div className="robots-paths-section">
      <span className={labelClass}>{labelText}</span>
      <div className="robots-path-list">
        {paths.map((path, index) => {
          const invalid = path.trim() !== "" && !isValidPath(path.trim());
          return (
            <div key={index} className="robots-path-row">
              <input
                type="text"
                value={path}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={placeholder}
                className={`robots-path-input${invalid ? " invalid" : ""}`}
                aria-label={`${labelText} パス ${index + 1}`}
                aria-invalid={invalid}
              />
              <button
                type="button"
                className="robots-path-remove-btn"
                onClick={() => handleRemove(index)}
                aria-label={`${labelText} パス ${index + 1} を削除`}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="robots-add-path-btn"
        onClick={handleAdd}
        aria-label={`${labelText} パスを追加`}
      >
        + {labelText}パスを追加
      </button>
    </div>
  );
}

/** robots.txt ジェネレーターページコンポーネント */
function RobotsTxtGenerator() {
  const { copy } = useClipboard();
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [options, setOptions] = useState<RobotsTxtOptions>(() => createAllowAllPreset());

  const output = useMemo(() => generateRobotsTxt(options), [options]);

  // ルール更新ヘルパー
  const updateRule = useCallback((ruleId: string, updater: (rule: CrawlerRule) => CrawlerRule) => {
    setOptions((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === ruleId ? updater(r) : r)),
    }));
  }, []);

  const handleUserAgentChange = useCallback(
    (ruleId: string, value: string) => {
      updateRule(ruleId, (r) => ({ ...r, userAgent: value }));
    },
    [updateRule],
  );

  const handleUserAgentSelect = useCallback(
    (ruleId: string, value: string) => {
      if (value) {
        updateRule(ruleId, (r) => ({ ...r, userAgent: value }));
      }
    },
    [updateRule],
  );

  const handlePathsUpdate = useCallback(
    (ruleId: string, type: "allow" | "disallow", paths: string[]) => {
      updateRule(ruleId, (r) => ({ ...r, [type]: paths }));
    },
    [updateRule],
  );

  const handleCrawlDelayChange = useCallback(
    (ruleId: string, value: string) => {
      const num = parseInt(value, 10);
      updateRule(ruleId, (r) => ({
        ...r,
        crawlDelay: value === "" || isNaN(num) || num <= 0 ? null : num,
      }));
    },
    [updateRule],
  );

  const handleAddRule = useCallback(() => {
    setOptions((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          id: generateId(),
          userAgent: "*",
          allow: [],
          disallow: [],
          crawlDelay: null,
        },
      ],
    }));
  }, []);

  const handleRemoveRule = useCallback((ruleId: string) => {
    setOptions((prev) => ({
      ...prev,
      rules: prev.rules.filter((r) => r.id !== ruleId),
    }));
  }, []);

  // サイトマップ更新ヘルパー
  const handleSitemapChange = useCallback((index: number, value: string) => {
    setOptions((prev) => {
      const updated = [...prev.sitemaps];
      updated[index] = value;
      return { ...prev, sitemaps: updated };
    });
  }, []);

  const handleSitemapRemove = useCallback((index: number) => {
    setOptions((prev) => ({
      ...prev,
      sitemaps: prev.sitemaps.filter((_, i) => i !== index),
    }));
  }, []);

  const handleAddSitemap = useCallback(() => {
    setOptions((prev) => ({
      ...prev,
      sitemaps: [...prev.sitemaps, ""],
    }));
  }, []);

  // プリセット適用
  const applyPreset = useCallback(
    (preset: RobotsTxtOptions) => {
      setOptions(preset);
      announceStatus("プリセットを適用しました");
    },
    [announceStatus],
  );

  // クイック Disallow 追加（最初のルールに追加）
  const handleQuickDisallow = useCallback(
    (path: string) => {
      if (options.rules.length === 0) return;
      const firstRule = options.rules[0];
      if (!firstRule.disallow.includes(path)) {
        updateRule(firstRule.id, (r) => ({
          ...r,
          disallow: [...r.disallow, path],
        }));
      }
    },
    [options.rules, updateRule],
  );

  // コピー
  const handleCopy = useCallback(async () => {
    if (!output) return;
    const success = await copy(output);
    if (success) {
      showToast("robots.txt をコピーしました", "success");
      announceStatus("robots.txt をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [output, copy, showToast, announceStatus]);

  // ダウンロード
  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
    showToast("robots.txt をダウンロードしました", "success");
    announceStatus("robots.txt をダウンロードしました");
  }, [output, showToast, announceStatus]);

  return (
    <>
      <div className="tool-container">
        {/* プリセット */}
        <div className="converter-section">
          <span className="section-title">プリセット</span>
          <div className="robots-preset-row" role="group" aria-label="プリセット選択">
            <span className="robots-preset-label" aria-hidden="true">
              クイック:
            </span>
            <button
              type="button"
              className="robots-preset-btn"
              onClick={() => applyPreset(createAllowAllPreset())}
            >
              全て許可
            </button>
            <button
              type="button"
              className="robots-preset-btn"
              onClick={() => applyPreset(createBlockAllPreset())}
            >
              全て拒否
            </button>
            <button
              type="button"
              className="robots-preset-btn"
              onClick={() => applyPreset(createWordPressPreset())}
            >
              WordPress
            </button>
          </div>
        </div>

        {/* クローラールール */}
        <div className="converter-section">
          <span className="section-title">
            クローラールール
            <span className="robots-rule-count">({options.rules.length} 件)</span>
          </span>

          <div className="robots-rules-list" aria-label="クローラールール一覧">
            {options.rules.map((rule, index) => (
              <div key={rule.id} className="robots-rule-card" aria-label={`ルール ${index + 1}`}>
                {/* ヘッダー: User-agent */}
                <div className="robots-rule-header">
                  <span className="robots-rule-index">#{index + 1} User-agent:</span>
                  <input
                    type="text"
                    value={rule.userAgent}
                    onChange={(e) => handleUserAgentChange(rule.id, e.target.value)}
                    className="robots-ua-input"
                    placeholder="*"
                    aria-label={`ルール ${index + 1} のユーザーエージェント`}
                  />
                  <select
                    className="robots-ua-select"
                    value=""
                    onChange={(e) => handleUserAgentSelect(rule.id, e.target.value)}
                    aria-label="よく使うユーザーエージェントを選択"
                  >
                    <option value="">よく使う▾</option>
                    {COMMON_USER_AGENTS.map((ua) => (
                      <option key={ua} value={ua}>
                        {ua}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="robots-rule-remove-btn"
                    onClick={() => handleRemoveRule(rule.id)}
                    disabled={options.rules.length <= 1}
                    aria-label={`ルール ${index + 1} を削除`}
                  >
                    削除
                  </button>
                </div>

                {/* Allow パス */}
                <PathList
                  paths={rule.allow}
                  type="allow"
                  ruleId={rule.id}
                  onUpdate={handlePathsUpdate}
                />

                {/* Disallow パス */}
                <PathList
                  paths={rule.disallow}
                  type="disallow"
                  ruleId={rule.id}
                  onUpdate={handlePathsUpdate}
                />

                {/* Crawl-delay */}
                <div className="robots-crawl-delay-row">
                  <label htmlFor={`crawl-delay-${rule.id}`} className="robots-crawl-delay-label">
                    Crawl-delay:
                  </label>
                  <input
                    id={`crawl-delay-${rule.id}`}
                    type="number"
                    min="1"
                    value={rule.crawlDelay ?? ""}
                    onChange={(e) => handleCrawlDelayChange(rule.id, e.target.value)}
                    className="robots-crawl-delay-input"
                    placeholder="なし"
                    aria-label={`ルール ${index + 1} のクロール遅延（秒）`}
                  />
                  <span className="robots-crawl-delay-unit">秒</span>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="robots-add-rule-btn" onClick={handleAddRule}>
            + ルールを追加
          </button>
        </div>

        {/* クイック Disallow */}
        {options.rules.length > 0 && (
          <div className="converter-section">
            <span className="section-title">よく使う Disallow パス</span>
            <p className="robots-quick-disallow-hint">
              クリックで最初のルールの Disallow に追加します
            </p>
            <div className="robots-preset-row">
              {COMMON_DISALLOW_PATHS.map((path) => (
                <button
                  key={path}
                  type="button"
                  className="robots-preset-btn"
                  onClick={() => handleQuickDisallow(path)}
                  aria-label={`Disallow に ${path} を追加`}
                >
                  {path}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* サイトマップ */}
        <div className="converter-section">
          <span className="section-title">Sitemap</span>
          <div className="robots-sitemap-list" aria-label="サイトマップURLリスト">
            {options.sitemaps.map((url, index) => {
              const invalid = url.trim() !== "" && !isValidSitemapUrl(url.trim());
              return (
                <div key={index} className="robots-sitemap-row">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleSitemapChange(index, e.target.value)}
                    placeholder="https://example.com/sitemap.xml"
                    className={`robots-sitemap-input${invalid ? " invalid" : ""}`}
                    aria-label={`サイトマップ URL ${index + 1}`}
                    aria-invalid={invalid}
                  />
                  <button
                    type="button"
                    className="robots-sitemap-remove-btn"
                    onClick={() => handleSitemapRemove(index)}
                    aria-label={`サイトマップ URL ${index + 1} を削除`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" className="robots-add-sitemap-btn" onClick={handleAddSitemap}>
            + Sitemap URLを追加
          </button>
        </div>

        {/* プレビュー */}
        <div className="converter-section">
          <div className="robots-preview-header">
            <span className="section-title">robots.txt プレビュー</span>
            <div className="robots-preview-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCopy}
                disabled={!output}
              >
                コピー
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleDownload}
                disabled={!output}
              >
                ダウンロード
              </button>
            </div>
          </div>
          {output ? (
            <textarea
              className="robots-preview-output"
              value={output}
              readOnly
              rows={Math.max(8, output.split("\n").length + 2)}
              aria-label="robots.txt プレビュー"
              aria-live="polite"
            />
          ) : (
            <div className="robots-preview-empty" aria-live="polite">
              <p>ルールを設定すると robots.txt が生成されます</p>
            </div>
          )}
        </div>

        <TipsCard
          sections={[
            {
              title: "robots.txt とは",
              items: [
                "Webサイトのルートディレクトリに設置するテキストファイルで、検索エンジンのクローラーに対してクロール許可・拒否を指示します",
                "検索エンジンへのインデックス制御（SEO）やサーバー負荷軽減に使用されます",
                "ファイルは https://example.com/robots.txt に配置してください",
              ],
            },
            {
              title: "主なディレクティブ",
              items: [
                "User-agent: ルールを適用するクローラー（* ですべてのクローラーに適用）",
                "Allow: クロールを許可するパス（/ で始まるか * を使用）",
                "Disallow: クロールを拒否するパス（/ ですべて拒否、空白で拒否なし）",
                "Crawl-delay: クロールのリクエスト間隔（秒）",
                "Sitemap: サイトマップの URL（任意、複数指定可）",
              ],
            },
            {
              title: "注意事項",
              items: [
                "robots.txt はクローラーへの指示であり、強制力はありません。悪意あるボットは無視する場合があります",
                "機密情報の保護にはサーバー側の認証やアクセス制御を使用してください",
                "Disallow: / でサイト全体を拒否しても、他サイトからリンクされているページはインデックスされる場合があります",
                "Googlebot は Allow と Disallow の長いほうのパスを優先します",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
