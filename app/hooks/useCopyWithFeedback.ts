/**
 * @fileoverview コピー操作とフィードバック通知を統合したカスタムフック
 * useClipboard / useToast / useStatusAnnouncement を組み合わせた便利フック
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "~/components/Toast";
import { useClipboard } from "./useClipboard";
import { useStatusAnnouncement } from "./useStatusAnnouncement";
import type React from "react";

/**
 * useCopyWithFeedback フックの戻り値の型
 */
interface UseCopyWithFeedbackReturn {
  /** ステータス要素への参照（StatusAnnouncer コンポーネントに渡す） */
  statusRef: React.RefObject<HTMLDivElement | null>;
  /** スクリーンリーダー向けにステータスメッセージをアナウンスする関数 */
  announceStatus: (message: string) => void;
  /** トースト通知を表示する関数 */
  showToast: (message: string, type: "success" | "error" | "info") => void;
  /** コピー完了状態（ボタンの視覚的フィードバック用、2秒で自動リセット） */
  isCopied: boolean;
  /**
   * テキストをクリップボードにコピーし、トースト通知とスクリーンリーダー向けアナウンスを行う関数
   * @param text - コピーするテキスト（空文字の場合は何もしない）
   * @param successMessage - 成功時のメッセージ（省略時: 'コピーしました'）
   */
  copyWithFeedback: (text: string, successMessage?: string) => Promise<void>;
  /**
   * 出力結果のコピー用関数。isCopied 状態（2秒）+ アナウンスのみ。
   * ボタン自身が "コピー済" 状態を表示するため、成功時のトーストは出さない。
   * @param text - コピーするテキスト（空文字の場合は何もしない）
   */
  handleCopy: (text: string) => Promise<void>;
}

const COPIED_RESET_MS = 2000;

/**
 * クリップボードコピーとフィードバック通知を統合したフック
 *
 * useClipboard・useToast・useStatusAnnouncement の3つのフックを統合し、
 * 各ページで繰り返されていたコピーボイラープレートを一元化します。
 *
 * 2 系統の API を提供します:
 * - `copyWithFeedback(text, msg?)`: 成功時に toast + announce（汎用）
 * - `handleCopy(text)`: 成功時に isCopied=true（2秒）+ announce（ボタン状態表示向け）
 *
 * @returns statusRef, announceStatus, showToast, isCopied, copyWithFeedback, handleCopy
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { statusRef, copyWithFeedback } = useCopyWithFeedback();
 *   const handleCopy = () => copyWithFeedback(output, '出力をコピーしました');
 *   return (
 *     <>
 *       <button onClick={handleCopy}>コピー</button>
 *       <StatusAnnouncer statusRef={statusRef} />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function MyConverter() {
 *   const { statusRef, isCopied, handleCopy } = useCopyWithFeedback();
 *   return (
 *     <>
 *       <button
 *         className={`copy-btn${isCopied ? " copied" : ""}`}
 *         onClick={() => handleCopy(outputText)}
 *       >
 *         {isCopied ? "コピー済" : "コピー"}
 *       </button>
 *       <StatusAnnouncer statusRef={statusRef} />
 *     </>
 *   );
 * }
 * ```
 */
export function useCopyWithFeedback(): UseCopyWithFeedbackReturn {
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

  const copyWithFeedback = useCallback(
    async (text: string, successMessage = "コピーしました") => {
      if (!text) return;
      const ok = await copy(text);
      if (ok) {
        showToast(successMessage, "success");
        announceStatus(successMessage);
      } else {
        showToast("コピーに失敗しました", "error");
        announceStatus("コピーに失敗しました");
      }
    },
    [copy, showToast, announceStatus],
  );

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
        copiedTimeoutRef.current = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
      } else {
        announceStatus("コピーに失敗しました");
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, announceStatus, showToast],
  );

  return {
    statusRef,
    announceStatus,
    showToast,
    isCopied,
    copyWithFeedback,
    handleCopy,
  };
}
