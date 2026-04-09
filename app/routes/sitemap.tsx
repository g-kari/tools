import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useId } from "react";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  generateSitemapXml,
  isValidSitemapUrl,
  isValidPriority,
  normalizeDate,
  formatPriority,
  CHANGEFREQ_LABELS,
  CHANGEFREQ_OPTIONS,
  type SitemapEntry,
  type ChangeFreq,
} from "~/utils/sitemap";

export const Route = createFileRoute("/sitemap")({
  head: () => ({
    meta: [
      { title: "Sitemap XMLジェネレーター | Tools" },
      {
        name: "description",
        content:
          "サイトマップXML（sitemap.xml）を簡単に生成。URL・最終更新日・変更頻度・優先度を設定してSEO対応のサイトマップを作成できます。",
      },
      {
        property: "og:title",
        content: "Sitemap XMLジェネレーター | Tools",
      },
      {
        property: "og:description",
        content:
          "サイトマップXML（sitemap.xml）を簡単に生成。URL・最終更新日・変更頻度・優先度を設定してSEO対応のサイトマップを作成できます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/sitemap` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: SitemapPage,
});

/** 新規エントリの初期値を返す */
function createEntry(): SitemapEntry & { id: string } {
  return {
    id: Math.random().toString(36).slice(2),
    loc: "",
    lastmod: "",
    changefreq: undefined,
    priority: undefined,
  };
}

type EntryWithId = SitemapEntry & { id: string };

/**
 * Sitemap XMLジェネレーターページコンポーネント
 */
function SitemapPage() {
  const { copy } = useClipboard();
  const { showToast } = useToast();
  const titleId = useId();

  const [entries, setEntries] = useState<EntryWithId[]>([createEntry()]);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  /** URLのバリデーションエラーを取得 */
  const getLocError = useCallback(
    (entry: EntryWithId): string | null => {
      if (!touched.has(entry.id)) return null;
      if (!entry.loc.trim()) return "URLは必須項目です";
      if (!isValidSitemapUrl(entry.loc))
        return "有効なURLを入力してください（http:// または https:// で始まるURL）";
      return null;
    },
    [touched],
  );

  /** エントリのフィールドを更新 */
  const updateEntry = useCallback((id: string, updates: Partial<SitemapEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  /** エントリを追加 */
  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, createEntry()]);
  }, []);

  /** エントリを削除 */
  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setTouched((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /** フィールドのブラー時にtouchedを登録 */
  const markTouched = useCallback((id: string) => {
    setTouched((prev) => new Set([...prev, id]));
  }, []);

  /** 有効なエントリのみ（URLが入力されているもの） */
  const validEntries = useMemo(
    () => entries.filter((e) => e.loc.trim() && isValidSitemapUrl(e.loc)),
    [entries],
  );

  /** 生成されたXML */
  const generatedXml = useMemo(() => {
    if (validEntries.length === 0) return "";
    return generateSitemapXml(validEntries);
  }, [validEntries]);

  /** XMLをコピー */
  const handleCopy = useCallback(async () => {
    if (!generatedXml) return;
    const success = await copy(generatedXml);
    if (success) {
      showToast("XMLをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [generatedXml, copy, showToast]);

  /** XMLをダウンロード */
  const handleDownload = useCallback(() => {
    if (!generatedXml) return;
    const blob = new Blob([generatedXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
    showToast("sitemap.xml をダウンロードしました", "success");
  }, [generatedXml, showToast]);

  return (
    <div className="tool-container">
      <section aria-labelledby={titleId}>
        <h2 id={titleId} className="sitemap-result-label" style={{ marginBottom: "16px" }}>
          URLエントリ
        </h2>

        {/* エントリ統計 */}
        <div className="sitemap-stats" aria-live="polite">
          <span className="sitemap-stat-item">
            エントリ数: <span className="sitemap-stat-value">{entries.length}</span>
          </span>
          <span className="sitemap-stat-item">
            有効なURL: <span className="sitemap-stat-value">{validEntries.length}</span>
          </span>
        </div>

        {/* エントリリスト */}
        <div className="sitemap-entry-list" role="list">
          {entries.map((entry, index) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={index}
              locError={getLocError(entry)}
              onUpdate={updateEntry}
              onRemove={removeEntry}
              onBlur={markTouched}
              canRemove={entries.length > 1}
            />
          ))}
        </div>

        {/* エントリ追加ボタン */}
        <button className="sitemap-add-btn" onClick={addEntry} aria-label="URLエントリを追加">
          + URLを追加
        </button>
      </section>

      {/* 生成結果 */}
      <section className="sitemap-result" aria-label="生成されたSitemap XML">
        <div className="sitemap-result-header">
          <span className="sitemap-result-label">生成された sitemap.xml</span>
          <div className="sitemap-result-actions">
            <button
              className="sitemap-action-btn"
              onClick={handleCopy}
              disabled={!generatedXml}
              aria-label="XMLをクリップボードにコピー"
            >
              コピー
            </button>
            <button
              className="sitemap-action-btn"
              onClick={handleDownload}
              disabled={!generatedXml}
              aria-label="sitemap.xmlとしてダウンロード"
            >
              ダウンロード
            </button>
          </div>
        </div>
        <div className="sitemap-xml-output" role="region" aria-label="XML出力" aria-live="polite">
          {generatedXml ? (
            generatedXml
          ) : (
            <span className="sitemap-xml-placeholder">
              有効なURLを1つ以上入力するとXMLが生成されます
            </span>
          )}
        </div>
      </section>

      <TipsCard
        sections={[
          {
            title: "サイトマップXMLとは",
            items: [
              "サイトマップXMLはサイト内のURLをGoogleなどの検索エンジンに伝えるためのファイルです",
              "検索エンジンがすべてのページをクロールしやすくなり、SEO改善に役立ちます",
              "sitemapプロトコル（sitemaps.org）に準拠したXML形式で生成されます",
              "生成したXMLをサイトのルートに sitemap.xml として配置し、robots.txtで参照してください",
            ],
          },
          {
            title: "各フィールドの説明",
            items: [
              "URL（必須）: クロールさせたいページの完全なURL（https://example.com/page）",
              "最終更新日: ページの内容が最後に変更された日付（YYYY-MM-DD）",
              "変更頻度: ページがどの程度の頻度で更新されるかのヒント（検索エンジンへの参考情報）",
              "優先度（0.0〜1.0）: サイト内の他のURLと比較した相対的な重要度（デフォルト: 0.5）",
            ],
          },
          {
            title: "使い方",
            items: [
              "URLを入力してエントリを追加（必須フィールド）",
              "必要に応じて最終更新日・変更頻度・優先度を設定",
              "「+ URLを追加」で複数のURLを管理できます",
              "「コピー」または「ダウンロード」でXMLを取得",
            ],
          },
        ]}
      />
    </div>
  );
}

interface EntryCardProps {
  entry: EntryWithId;
  index: number;
  locError: string | null;
  onUpdate: (id: string, updates: Partial<SitemapEntry>) => void;
  onRemove: (id: string) => void;
  onBlur: (id: string) => void;
  canRemove: boolean;
}

/**
 * 個別URLエントリの入力カードコンポーネント
 */
function EntryCard({
  entry,
  index,
  locError,
  onUpdate,
  onRemove,
  onBlur,
  canRemove,
}: EntryCardProps) {
  const locId = `sitemap-loc-${entry.id}`;
  const lastmodId = `sitemap-lastmod-${entry.id}`;
  const changefreqId = `sitemap-changefreq-${entry.id}`;
  const priorityId = `sitemap-priority-${entry.id}`;

  const hasPriority = entry.priority !== undefined;
  const priorityValue = entry.priority ?? 0.5;

  const handlePriorityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && isValidPriority(val)) {
        onUpdate(entry.id, { priority: val });
      }
    },
    [entry.id, onUpdate],
  );

  const handleLastmodChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const normalized = normalizeDate(e.target.value);
      onUpdate(entry.id, { lastmod: normalized || e.target.value });
    },
    [entry.id, onUpdate],
  );

  return (
    <div className="sitemap-entry-card" role="listitem">
      <div className="sitemap-entry-header">
        <span className="sitemap-entry-number">URL #{index + 1}</span>
        {canRemove && (
          <button
            className="sitemap-entry-remove-btn"
            onClick={() => onRemove(entry.id)}
            aria-label={`URL #${index + 1} を削除`}
          >
            削除
          </button>
        )}
      </div>

      <div className="sitemap-entry-fields">
        {/* URL */}
        <div className="sitemap-field sitemap-entry-field-loc">
          <label htmlFor={locId} className="sitemap-field-label sitemap-field-label-required">
            URL
          </label>
          <input
            id={locId}
            type="url"
            className={`sitemap-input${locError ? " sitemap-input--error" : ""}`}
            value={entry.loc}
            onChange={(e) => onUpdate(entry.id, { loc: e.target.value })}
            onBlur={() => onBlur(entry.id)}
            placeholder="https://example.com/page"
            aria-required="true"
            aria-describedby={locError ? `${locId}-error` : `${locId}-hint`}
          />
          {locError ? (
            <span id={`${locId}-error`} className="sitemap-error-message" role="alert">
              {locError}
            </span>
          ) : (
            <span id={`${locId}-hint`} className="sitemap-hint">
              クロール対象ページの完全なURL
            </span>
          )}
        </div>

        {/* 最終更新日 */}
        <div className="sitemap-field">
          <label htmlFor={lastmodId} className="sitemap-field-label">
            最終更新日
          </label>
          <input
            id={lastmodId}
            type="date"
            className="sitemap-input"
            value={entry.lastmod ?? ""}
            onChange={handleLastmodChange}
            aria-describedby={`${lastmodId}-hint`}
          />
          <span id={`${lastmodId}-hint`} className="sitemap-hint">
            ページの最終更新日（任意）
          </span>
        </div>

        {/* 変更頻度 */}
        <div className="sitemap-field">
          <label htmlFor={changefreqId} className="sitemap-field-label">
            変更頻度
          </label>
          <select
            id={changefreqId}
            className="sitemap-select"
            value={entry.changefreq ?? ""}
            onChange={(e) =>
              onUpdate(entry.id, {
                changefreq: (e.target.value as ChangeFreq) || undefined,
              })
            }
            aria-describedby={`${changefreqId}-hint`}
          >
            <option value="">（未設定）</option>
            {CHANGEFREQ_OPTIONS.map((freq) => (
              <option key={freq} value={freq}>
                {CHANGEFREQ_LABELS[freq]}
              </option>
            ))}
          </select>
          <span id={`${changefreqId}-hint`} className="sitemap-hint">
            更新頻度のヒント（任意）
          </span>
        </div>

        {/* 優先度 */}
        <div className="sitemap-field">
          <label htmlFor={priorityId} className="sitemap-field-label">
            優先度
          </label>
          <div className="sitemap-priority-wrapper">
            <input
              id={priorityId}
              type="checkbox"
              checked={hasPriority}
              onChange={(e) =>
                onUpdate(entry.id, {
                  priority: e.target.checked ? 0.5 : undefined,
                })
              }
              aria-label="優先度を設定する"
            />
            <input
              type="range"
              className="sitemap-priority-slider"
              min="0"
              max="1"
              step="0.1"
              value={priorityValue}
              disabled={!hasPriority}
              onChange={handlePriorityChange}
              aria-label={`優先度: ${formatPriority(priorityValue)}`}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={priorityValue}
            />
            <span
              className={`sitemap-priority-value${!hasPriority ? " sitemap-priority-unset" : ""}`}
              aria-live="polite"
            >
              {hasPriority ? formatPriority(priorityValue) : "—"}
            </span>
          </div>
          <span className="sitemap-hint">チェックを入れると優先度を設定できます（0.0〜1.0）</span>
        </div>
      </div>
    </div>
  );
}
