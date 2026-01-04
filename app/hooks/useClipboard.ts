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

      // フォールバック: execCommand を使用
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.setAttribute("readonly", "");
      document.body.appendChild(textArea);

      textArea.select();
      textArea.setSelectionRange(0, text.length);

      const success = document.execCommand("copy");
      document.body.removeChild(textArea);

      return success;
    } catch {
      return false;
    }
  }, []);

  return { copy };
}
