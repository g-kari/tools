/**
 * @fileoverview クリップボード操作用カスタムフック
 * Clipboard API とフォールバック処理を統一的に提供
 */

import { useCallback } from "react";

/**
 * useClipboard フックの戻り値の型
 */
interface UseClipboardReturn {
  /** テキストをクリップボードにコピーする関数 */
  copy: (text: string) => Promise<boolean>;
}

/**
 * クリップボード操作を管理するフック
 *
 * Clipboard API を使用し、サポートされていない環境では
 * execCommand を使用したフォールバック処理を提供します。
 *
 * @returns copy 関数を含むオブジェクト
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { copy } = useClipboard();
 *
 *   const handleCopy = async () => {
 *     const success = await copy("コピーするテキスト");
 *     if (success) {
 *       console.log("コピーしました");
 *     } else {
 *       console.log("コピーに失敗しました");
 *     }
 *   };
 *
 *   return <button onClick={handleCopy}>コピー</button>;
 * }
 * ```
 */
export function useClipboard(): UseClipboardReturn {
  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      // Clipboard API が利用可能な場合
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      // フォールバック中だけ一時的に選択を借り、キーボード操作と編集位置を戻す。
      const previousFocus = document.activeElement;
      const input =
        previousFocus instanceof HTMLInputElement || previousFocus instanceof HTMLTextAreaElement
          ? previousFocus
          : null;
      const inputSelection = input
        ? {
            start: input.selectionStart,
            end: input.selectionEnd,
            direction: input.selectionDirection,
            scrollTop: input.scrollTop,
            scrollLeft: input.scrollLeft,
          }
        : null;
      const selection = document.getSelection();
      const ranges = selection
        ? Array.from({ length: selection.rangeCount }, (_, i) =>
            selection.getRangeAt(i).cloneRange(),
          )
        : [];
      const anchorNode = selection?.anchorNode;
      const anchorOffset = selection?.anchorOffset ?? 0;
      const focusNode = selection?.focusNode;
      const focusOffset = selection?.focusOffset ?? 0;
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.setAttribute("readonly", "");
      textArea.tabIndex = -1;
      document.body.appendChild(textArea);

      try {
        textArea.focus({ preventScroll: true });
        textArea.select();
        textArea.setSelectionRange(0, text.length);
        return document.execCommand("copy");
      } finally {
        // copy イベント側で別要素へ移動したフォーカスを奪い返さない。
        const ownsFocus = document.activeElement === textArea;
        textArea.remove();
        if (ownsFocus) {
          if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
            previousFocus.focus({ preventScroll: true });
          }
          if (selection) {
            selection.removeAllRanges();
            if (
              ranges.length === 1 &&
              anchorNode?.isConnected &&
              focusNode?.isConnected &&
              typeof selection.setBaseAndExtent === "function"
            ) {
              selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
            } else {
              for (const range of ranges) {
                if (range.startContainer.isConnected && range.endContainer.isConnected) {
                  selection.addRange(range);
                }
              }
            }
          }
          if (input?.isConnected && inputSelection) {
            if (inputSelection.start !== null && inputSelection.end !== null) {
              input.setSelectionRange(
                inputSelection.start,
                inputSelection.end,
                inputSelection.direction ?? "none",
              );
            }
            input.scrollTop = inputSelection.scrollTop;
            input.scrollLeft = inputSelection.scrollLeft;
          }
        }
      }
    } catch {
      return false;
    }
  }, []);

  return { copy };
}
