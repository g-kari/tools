/**
 * @fileoverview コピー操作とフィードバック通知を統合したカスタムフック
 * useClipboard / useToast / useStatusAnnouncement を組み合わせた便利フック
 */

import { useCallback } from "react";
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
  /**
   * テキストをクリップボードにコピーし、トースト通知とスクリーンリーダー向けアナウンスを行う関数
   * @param text - コピーするテキスト（空文字の場合は何もしない）
   * @param successMessage - 成功時のメッセージ（省略時: 'コピーしました'）
   */
  copyWithFeedback: (text: string, successMessage?: string) => Promise<void>;
}

/**
 * クリップボードコピーとフィードバック通知を統合したフック
 *
 * useClipboard・useToast・useStatusAnnouncement の3つのフックを統合し、
 * 各ページで繰り返されていたコピーボイラープレートを一元化します。
 *
 * @returns statusRef と copyWithFeedback 関数
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { statusRef, copyWithFeedback } = useCopyWithFeedback();
 *
 *   const handleCopy = () => copyWithFeedback(output, '出力をコピーしました');
 *
 *   return (
 *     <>
 *       <button onClick={handleCopy}>コピー</button>
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

  return { statusRef, announceStatus, copyWithFeedback };
}
