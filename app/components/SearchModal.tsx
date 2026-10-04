import { Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toolCatalog } from "../routes/top";
import type { ToolItem, ToolCategory } from "../routes/top";
import { createToolSearchMatcher } from "../utils/tool-search";

/**
 * カテゴリ情報を付加したツールアイテム
 */
export interface FlatToolItem extends ToolItem {
  categoryName: string;
  categoryIcon: string;
}

/**
 * カタログをフラット化してカテゴリ情報を付加する
 */
export function flattenCatalog(catalog: ToolCategory[]): FlatToolItem[] {
  return catalog.flatMap((cat) =>
    cat.items.map((item) => ({
      ...item,
      categoryName: cat.name,
      categoryIcon: cat.icon,
    })),
  );
}

/**
 * ラベル・説明・カテゴリ・パスを共通のローカルAND検索で絞り込む。
 */
export function searchTools(tools: FlatToolItem[], query: string): FlatToolItem[] {
  const matches = createToolSearchMatcher(query);
  if (!matches) return tools.slice(0, 8);
  return tools.filter((tool) => matches(tool, tool.categoryName)).slice(0, 12);
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 全文検索モーダルコンポーネント
 * Ctrl+K / Cmd+K で開き、ツールを検索してページ遷移できる
 * キーボードナビゲーション対応（↑↓ 移動、Enter で遷移、Esc で閉じる）
 */
export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const allTools = useMemo(() => flattenCatalog(toolCatalog), []);
  const results = useMemo(() => searchTools(allTools, query), [allTools, query]);

  // モーダルが開いたときに入力欄をフォーカス
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      // DOMが更新された後にフォーカス
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // 選択インデックスが変わったときにスクロール追従
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Japanese IME confirmation belongs to the input, not result navigation.
      if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Enter": {
          e.preventDefault();
          const selected = results[selectedIndex];
          if (selected) {
            // Linkの遷移はクリックイベントで行う
            const anchor = listRef.current?.children[selectedIndex]?.querySelector("a");
            anchor?.click();
          }
          break;
        }
      }
    },
    [results, selectedIndex, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      className="search-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="ツール検索"
    >
      <div className="search-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* 検索入力欄 */}
        <div className="search-modal-input-wrapper">
          <span className="search-modal-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="ツールを検索（例: JSON 圧縮）"
            className="search-modal-input"
            aria-label="ツールを検索"
            aria-autocomplete="list"
            aria-controls="search-results-list"
            aria-activedescendant={
              results[selectedIndex] ? `search-result-${selectedIndex}` : undefined
            }
          />
          {query && (
            <button
              className="search-modal-clear"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              aria-label="検索をクリア"
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        {/* 検索結果リスト */}
        <ul
          id="search-results-list"
          className="search-modal-results"
          ref={listRef}
          role="listbox"
          aria-label="検索結果"
        >
          {results.length > 0 ? (
            results.map((tool, i) => (
              <li
                key={tool.path}
                id={`search-result-${i}`}
                role="option"
                aria-selected={i === selectedIndex}
              >
                <Link
                  to={tool.path}
                  className={`search-result-item${i === selectedIndex ? " selected" : ""}`}
                  onClick={onClose}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <span className="search-result-icon" aria-hidden="true">
                    {tool.icon}
                  </span>
                  <div className="search-result-text">
                    <span className="search-result-label">{tool.label}</span>
                    <span className="search-result-desc">{tool.description}</span>
                  </div>
                  <span
                    className="search-result-category"
                    aria-label={`カテゴリ: ${tool.categoryName}`}
                  >
                    <span aria-hidden="true">{tool.categoryIcon}</span>
                    {tool.categoryName}
                  </span>
                </Link>
              </li>
            ))
          ) : (
            <li className="search-no-results" role="status">
              「{query}」に一致するツールが見つかりません
            </li>
          )}
        </ul>

        {/* フッター: キーボードショートカットのヒント */}
        <div className="search-modal-footer" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> 移動
          </span>
          <span>
            <kbd>Enter</kbd> 開く
          </span>
          <span>
            <kbd>Esc</kbd> 閉じる
          </span>
        </div>
      </div>
    </div>
  );
}
