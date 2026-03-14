import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useToast } from "~/components/Toast";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "~/constants/site";
import {
  generateGitignoreContent,
  getTemplates,
  getCategoryLabel,
  CATEGORY_ORDER,
  type GitignoreCategory,
} from "~/utils/gitignore";

export const Route = createFileRoute("/gitignore")({
  head: () => ({
    meta: [
      { title: "Gitignoreジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "プログラミング言語・フレームワーク・IDE・OSを選択して.gitignoreファイルを自動生成します",
      },
      {
        property: "og:title",
        content: "Gitignoreジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "プログラミング言語・フレームワーク・IDE・OSを選択して.gitignoreファイルを自動生成します",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/gitignore` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Gitignoreジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "プログラミング言語・フレームワーク・IDE・OSを選択して.gitignoreファイルを自動生成します",
      },
    ],
  }),
  component: GitignorePage,
});

function GitignorePage() {
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const allTemplates = useMemo(() => getTemplates(), []);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return allTemplates;
    const q = searchQuery.toLowerCase();
    return allTemplates.filter((t) => t.label.toLowerCase().includes(q));
  }, [allTemplates, searchQuery]);

  const output = useMemo(
    () => generateGitignoreContent(selectedIds),
    [selectedIds]
  );

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
    a.download = ".gitignore";
    a.click();
    URL.revokeObjectURL(url);
    showToast(".gitignoreをダウンロードしました", "success");
  };

  return (
    <div className="tool-container">
      {/* テンプレート選択セクション */}
      <div className="converter-section">
        <h2 className="section-title">テンプレート選択</h2>

        {/* 検索フィルター */}
        <div className="gitignore-search-row">
          <label htmlFor="gitignore-search" className="sr-only">
            テンプレートを検索
          </label>
          <input
            id="gitignore-search"
            type="text"
            className="gitignore-search-input"
            placeholder="テンプレートを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="テンプレートを検索"
          />
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="btn-secondary gitignore-clear-btn"
              onClick={handleClear}
              aria-label="選択をすべてクリア"
            >
              クリア ({selectedIds.length})
            </button>
          )}
        </div>

        {/* カテゴリ別チェックボックス */}
        <div
          className="gitignore-categories"
          role="group"
          aria-label="テンプレートカテゴリ"
        >
          {CATEGORY_ORDER.map((category: GitignoreCategory) => {
            const items = filteredTemplates.filter(
              (t) => t.category === category
            );
            if (items.length === 0) return null;
            return (
              <div key={category} className="gitignore-category-block">
                <h3 className="gitignore-category-title">
                  {getCategoryLabel(category)}
                </h3>
                <div className="gitignore-template-grid">
                  {items.map((template) => (
                    <label
                      key={template.id}
                      className={`gitignore-template-item ${selectedIds.includes(template.id) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="gitignore-template-checkbox"
                        checked={selectedIds.includes(template.id)}
                        onChange={() => handleToggle(template.id)}
                        aria-label={`${template.label}を選択`}
                      />
                      <span className="gitignore-template-label">
                        {template.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <p
              className="gitignore-no-results"
              role="status"
              aria-live="polite"
            >
              「{searchQuery}」に一致するテンプレートが見つかりませんでした
            </p>
          )}
        </div>
      </div>

      {/* 出力セクション */}
      <div className="converter-section">
        <div className="gitignore-output-header">
          <h2 className="section-title">
            生成された .gitignore
            {selectedIds.length > 0 && (
              <span className="gitignore-selected-count">
                （{selectedIds.length} 件選択中）
              </span>
            )}
          </h2>
          <div className="gitignore-action-buttons">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopy}
              disabled={!output}
              aria-label="生成した.gitignoreをクリップボードにコピー"
            >
              コピー
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              disabled={!output}
              aria-label=".gitignoreファイルをダウンロード"
            >
              ダウンロード
            </button>
          </div>
        </div>
        <textarea
          className="gitignore-output-area"
          value={output}
          readOnly
          placeholder="テンプレートを選択すると.gitignoreの内容がここに表示されます..."
          aria-label="生成された.gitignoreの内容"
          aria-live="polite"
          rows={20}
        />
      </div>
    </div>
  );
}
