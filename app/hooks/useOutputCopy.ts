/**
 * @fileoverview 出力コピー操作とisCopied状態管理を統合したカスタムフック
 * 変換ツール共通のコピーボタンフィードバックパターンを一元化します
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "~/components/Toast";
import { useClipboard } from "./useClipboard";
import { useStatusAnnouncement } from "./useStatusAnnouncement";
import type React from "react";

/**
 * useOutputCopy フックの戻り値の型
 */
interface UseOutputCopyReturn {
  /** ステータス要素への参照（StatusAnnouncer コンポーネントに渡す） */
  statusRef: React.RefObject<HTMLDivElement | null>;
  /** スクリーンリーダー向けにステータスメッセージをアナウンスする関数 */
  announceStatus: (message: string) => void;
  /** トースト通知を表示する関数 */
  showToast: (message: string, type: "success" | "error" | "info") => void;
  /** コピー完了状態（ボタンの視覚的フィードバック用） */
  isCopied: boolean;
  /**
   * テキストをクリップボードにコピーし、isCopied状態・トースト・アナウンスを管理する関数
   * @param text - コピーするテキスト（空文字の場合は何もしない）
   */
  handleCopy: (text: string) => Promise<void>;
}

/**
 * 出力コピー操作を統合したフック
 *
 * 変換ツールで繰り返し実装されていた以下のパターンを一元化します:
 * - isCopied ステート管理
 * - copiedTimeoutRef によるタイマー管理
 * - コピー成功時の視覚的フィードバック（2秒後にリセット）
 * - コピー失敗時のトースト通知
 * - スクリーンリーダー向けアナウンス
 *
 * @returns statusRef, announceStatus, showToast, isCopied, handleCopy
 *
 * @example
 * ```tsx
 * function MyConverter() {
 *   const { statusRef, announceStatus, showToast, isCopied, handleCopy } = useOutputCopy();
 *   const [outputText, setOutputText] = useState("");
 *
 *   return (
 *     <>
 *       <button
 *         className={`copy-btn${isCopied ? " copied" : ""}`}
 *         onClick={() => handleCopy(outputText)}
 *         disabled={!outputText}
 *       >
 *         {isCopied ? "コピー済" : "コピー"}
 *       </button>
 *       <StatusAnnouncer statusRef={statusRef} />
 *     </>
 *   );
 * }
 * ```
 */
export function useOutputCopy(): UseOutputCopyReturn {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const [isCopied, setIsCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(
    async (text: string) => {
      if (!text) return;
      const success = await copy(text);
      if (success) {
        setIsCopied(true);
        announceStatus("出力結果をコピーしました");
        if (copiedTimeoutRef.current) {
          clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
      } else {
        announceStatus("コピーに失敗しました");
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, announceStatus, showToast]
  );

  return { statusRef, announceStatus, showToast, isCopied, handleCopy };
}
