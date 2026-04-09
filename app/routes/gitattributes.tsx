import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useToast } from "~/components/Toast";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "~/constants/site";
import {
  generateGitAttributesContent,
  getTemplates,
  getCategoryLabel,
  CATEGORY_ORDER,
  type GitAttributesCategory,
} from "~/utils/gitattributes";
import "~/styles/tools/gitattributes.css";

export const Route = createFileRoute("/gitattributes")({
  head: () => ({
    meta: [
      { title: ".gitattributes ジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "改行コード正規化・バイナリ設定・Git LFS・GitHub Linguist ルールを選択して .gitattributes ファイルを自動生成します",
      },
      { property: "og:title", content: ".gitattributes ジェネレーター | Web ツール集" },
      {
        property: "og:description",
        content:
          "改行コード正規化・Git LFS・GitHub Linguist ルールを選択して .gitattributes を自動生成",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/gitattributes` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: ".gitattributes ジェネレーター | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "改行コード正規化・Git LFS・GitHub Linguist ルールを選択して .gitattributes を自動生成",
      },
    ],
  }),
  component: GitAttributesPage,
});

/**
 * .gitattributes ジェネレーターページ
 */
function GitAttributesPage() {
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const allTemplates = useMemo(() => getTemplates(), []);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return allTemplates;
    const q = searchQuery.toLowerCase();
    return allTemplates.filter((t) => t.label.toLowerCase().includes(q));
  }, [allTemplates, searchQuery]);

  const output = useMemo(() => generateGitAttributesContent(selectedIds), [selectedIds]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleClear = () => {
    setSelectedIds([]);
    showToast("選択をクリアしました", "info");
  };

  const handleCopy = async () => {
    if (!output) {
      showToast("コピーするコンテンツがありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      showToast("クリップボードにコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  };

  const handleDownload = () => {
    if (!output) {
      showToast("ダウンロードするコンテンツがありません", "error");
      return;
    }
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".gitattributes";
    a.click();
    URL.revokeObjectURL(url);
    showToast(".gitattributes をダウンロードしました", "success");
  };

  return (
    <div className="tool-container">
      {/* 検索バー */}
      <div className="gattr-search-row">
        <input
          type="search"
          className="gattr-search-input"
          placeholder="テンプレートを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="テンプレートを検索"
        />
        <button
          type="button"
          className="btn-secondary gattr-clear-btn"
          onClick={handleClear}
          disabled={selectedIds.length === 0}
          aria-label="選択をすべてクリア"
        >
          クリア
        </button>
      </div>

      {/* カテゴリ別チップ */}
      <div className="gattr-categories" role="group" aria-label="テンプレートカテゴリ">
        {CATEGORY_ORDER.map((category: GitAttributesCategory) => {
          const items = filteredTemplates.filter((t) => t.category === category);
          if (items.length === 0) return null;
          return (
            <div key={category} className="gattr-category-block">
              <h3 className="gattr-category-title">{getCategoryLabel(category)}</h3>
              <div className="gattr-chips">
                {items.map((template) => {
                  const isActive = selectedIds.includes(template.id);
                  return (
                    <button
                      key={template.id}
                      type="button"
                      className={`gattr-chip${isActive ? " active" : ""}`}
                      onClick={() => handleToggle(template.id)}
                      aria-pressed={isActive}
                      aria-label={`${template.label}${isActive ? "（選択中）" : ""}`}
                    >
                      {isActive && (
                        <span className="gattr-chip-check" aria-hidden="true">
                          ✓
                        </span>
                      )}
                      {template.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <p className="gattr-no-results" role="status" aria-live="polite">
            「{searchQuery}」に一致するテンプレートが見つかりませんでした
          </p>
        )}
      </div>

      {/* 出力セクション */}
      <div className="gattr-output-section">
        <div className="gattr-output-header">
          <h2 className="gattr-output-title">
            生成された .gitattributes
            {selectedIds.length > 0 && (
              <span className="gattr-selected-count">（{selectedIds.length} 件選択中）</span>
            )}
          </h2>
          <div className="gattr-action-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopy}
              disabled={!output}
              aria-label="生成した .gitattributes をクリップボードにコピー"
            >
              コピー
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              disabled={!output}
              aria-label=".gitattributes ファイルをダウンロード"
            >
              ダウンロード
            </button>
          </div>
        </div>
        <pre
          className="gattr-output"
          aria-label="生成された .gitattributes の内容"
          aria-live="polite"
        >
          {output || (
            <span className="gattr-output-placeholder">
              テンプレートを選択すると .gitattributes の内容がここに表示されます
            </span>
          )}
        </pre>
      </div>
    </div>
  );
}
