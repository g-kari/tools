import { Link } from "@tanstack/react-router";
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { toolCatalog } from "../routes/top";
import type { ToolItem, ToolCategory } from "../routes/top";
import { createToolSearchMatcher } from "../utils/tool-search";

// Release inert backgrounds before a new route's commit-time autofocus. Keep SSR
// free of layout effects; search is initially closed on both server and client.
const useDialogLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

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
  /** Route changes dismiss search without restoring focus to the previous page. */
  locationKey?: string;
  /** Logical fallback when a shortcut has no connected, focusable invoker. */
  returnFocusRef?: RefObject<HTMLElement>;
}

function dialogTabStops(dialog: HTMLElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]',
    ),
  ).filter((element) => {
    const style = getComputedStyle(element);
    return (
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      !element.closest("[hidden], [inert]") &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    );
  });
}

function canRestoreFocus(element: HTMLElement | null): element is HTMLElement {
  if (
    !element ||
    !element.isConnected ||
    element.matches(":disabled") ||
    !element.matches(
      'a[href], area[href], button, input:not([type="hidden"]), select, textarea, iframe, summary, [tabindex], [contenteditable="true"], [contenteditable=""]',
    )
  )
    return false;
  for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
    const style = getComputedStyle(ancestor);
    if (
      ancestor.hasAttribute("hidden") ||
      ancestor.hasAttribute("inert") ||
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse"
    )
      return false;
  }
  return true;
}

/**
 * 全文検索モーダルコンポーネント
 * Ctrl+K / Cmd+K で開き、ツールを検索してページ遷移できる
 * キーボードナビゲーション対応（↑↓ 移動、Enter で遷移、Esc で閉じる）
 */
export function SearchModal({ isOpen, onClose, locationKey, returnFocusRef }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(true);
  const activeOpeningRef = useRef(false);
  const openedLocationRef = useRef(locationKey);
  const latestRef = useRef({ onClose, locationKey, returnFocusRef });
  latestRef.current = { onClose, locationKey, returnFocusRef };

  const allTools = useMemo(() => flattenCatalog(toolCatalog), []);
  const results = useMemo(() => searchTools(allTools, query), [allTools, query]);

  // The portal makes all other body children siblings. Preserve their existing
  // inert/scroll state, including siblings added while search is open.
  useDialogLayoutEffect(() => {
    if (!isOpen) {
      activeOpeningRef.current = false;
      return;
    }
    if (!dialogRef.current) return;
    if (activeOpeningRef.current && openedLocationRef.current !== locationKey) {
      restoreFocusRef.current = false;
      latestRef.current.onClose();
      return;
    }
    activeOpeningRef.current = true;
    const dialog = dialogRef.current;
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const background = new Map<HTMLElement, string | null>();
    const overflow = document.body.style.getPropertyValue("overflow");
    const overflowPriority = document.body.style.getPropertyPriority("overflow");
    restoreFocusRef.current = true;
    openedLocationRef.current = latestRef.current.locationKey;
    setQuery("");
    setSelectedIndex(0);

    const makeBackgroundInert = () => {
      for (const element of Array.from(document.body.children)) {
        if (!(element instanceof HTMLElement) || element === dialog || background.has(element))
          continue;
        background.set(element, element.getAttribute("inert"));
        element.setAttribute("inert", "");
      }
    };
    makeBackgroundInert();
    const observer = new MutationObserver(makeBackgroundInert);
    observer.observe(document.body, { childList: true });
    document.body.style.setProperty("overflow", "hidden");
    inputRef.current?.focus({ preventScroll: true });

    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target))
        inputRef.current?.focus({ preventScroll: true });
    };
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        latestRef.current.onClose();
        return;
      }
      if (event.key !== "Tab") return;
      // Query edits add/remove the clear button and results; never cache this list.
      const stops = dialogTabStops(dialog);
      const first = stops[0];
      const last = stops.at(-1);
      const active = document.activeElement;
      if (!first || !last) {
        event.preventDefault();
        inputRef.current?.focus();
      } else if (!stops.includes(active as HTMLElement) || (event.shiftKey && active === first)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("focusin", containFocus, true);
    document.addEventListener("keydown", handleDialogKey, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", containFocus, true);
      document.removeEventListener("keydown", handleDialogKey, true);
      for (const [element, inert] of background) {
        if (inert === null) element.removeAttribute("inert");
        else element.setAttribute("inert", inert);
      }
      if (overflow) document.body.style.setProperty("overflow", overflow, overflowPriority);
      else document.body.style.removeProperty("overflow");
      if (restoreFocusRef.current && openedLocationRef.current === latestRef.current.locationKey) {
        if (canRestoreFocus(invoker)) {
          invoker.focus({ preventScroll: true });
          if (document.activeElement === invoker) return;
        }
        const fallback = latestRef.current.returnFocusRef?.current ?? null;
        if (canRestoreFocus(fallback)) fallback.focus({ preventScroll: true });
      }
    };
  }, [isOpen, locationKey]);

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
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Japanese IME confirmation belongs to the input, not result navigation.
      if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, results.length - 1)));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
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
    [results, selectedIndex],
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={dialogRef}
      className="search-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="ツール検索"
      onKeyDown={(event) => {
        // Inert blocks background focus, but global tool/game listeners would
        // still receive bubbled keys. Keep native input/button/link defaults.
        if (
          !event.nativeEvent.isComposing &&
          event.nativeEvent.keyCode !== 229 &&
          (event.ctrlKey || event.metaKey) &&
          event.key === "k"
        ) {
          event.preventDefault();
          onClose();
        }
        event.stopPropagation();
      }}
      onKeyUp={(event) => event.stopPropagation()}
    >
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
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
            onKeyDown={handleKeyDown}
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
          <button
            className="search-modal-close"
            onClick={onClose}
            aria-label="検索を閉じる"
            type="button"
            title="検索を閉じる（Esc）"
          >
            ✕
          </button>
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
                  onClick={(event) => {
                    // Modified clicks keep this page, so cancellation-style focus
                    // restoration still applies. Ordinary navigation owns new focus.
                    restoreFocusRef.current =
                      event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
                    onClose();
                  }}
                  onFocus={() => setSelectedIndex(i)}
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
    </div>,
    document.body,
  );
}
