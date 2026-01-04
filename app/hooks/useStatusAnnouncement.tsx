/**
 * @fileoverview ステータスアナウンスメント用カスタムフック
 * スクリーンリーダー向けのアクセシブルなステータス通知を提供
 */

import { useRef, useCallback, useEffect } from "react";

/**
 * useStatusAnnouncement フックの戻り値の型
 */
interface UseStatusAnnouncementReturn {
  /** ステータス要素への参照 */
  statusRef: React.RefObject<HTMLDivElement | null>;
  /** ステータスメッセージをアナウンスする関数 */
  announceStatus: (message: string) => void;
}

/**
 * スクリーンリーダー向けのステータスアナウンスメントを管理するフック
 *
 * aria-live="polite" を使用したステータス通知を提供し、
 * 指定時間後に自動的にメッセージをクリアします。
 *
 * @param timeout - メッセージをクリアするまでの時間（ミリ秒）。デフォルト: 3000
 * @returns statusRef と announceStatus 関数
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { statusRef, announceStatus } = useStatusAnnouncement();
 *
 *   const handleAction = () => {
 *     // 処理実行
 *     announceStatus("処理が完了しました");
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleAction}>実行</button>
 *       <div
 *         ref={statusRef}
 *         role="status"
 *         aria-live="polite"
 *         aria-atomic="true"
 *         className="sr-only"
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useStatusAnnouncement(
  timeout = 3000
): UseStatusAnnouncementReturn {
  const statusRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // コンポーネントのアンマウント時にタイムアウトをクリア
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const announceStatus = useCallback(
    (message: string) => {
      if (statusRef.current) {
        // 既存のタイムアウトをクリア
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // メッセージを設定
        statusRef.current.textContent = message;

        // 指定時間後にクリア
        timeoutRef.current = setTimeout(() => {
          if (statusRef.current) {
            statusRef.current.textContent = "";
          }
        }, timeout);
      }
    },
    [timeout]
  );

  return { statusRef, announceStatus };
}

/**
 * ステータスアナウンサーコンポーネントのProps
 */
interface StatusAnnouncerProps {
  /** ステータス要素への参照 */
  statusRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * スクリーンリーダー向けのステータスアナウンサーコンポーネント
 *
 * useStatusAnnouncement フックと組み合わせて使用します。
 * 視覚的には非表示ですが、スクリーンリーダーには読み上げられます。
 *
 * @example
 * ```tsx
 * const { statusRef, announceStatus } = useStatusAnnouncement();
 * return <StatusAnnouncer statusRef={statusRef} />;
 * ```
 */
export function StatusAnnouncer({ statusRef }: StatusAnnouncerProps) {
  return (
    <div
      ref={statusRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
