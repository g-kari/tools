/**
 * @fileoverview ローディングスピナーコンポーネント
 * 読み込み中の状態を視覚的に表示
 */

import * as React from "react";

/**
 * LoadingSpinner コンポーネントのProps
 */
interface LoadingSpinnerProps {
  /** 表示するメッセージ */
  message?: string;
  /** カスタムクラス名 */
  className?: string;
  /** スピナーのサイズ */
  size?: "sm" | "md" | "lg";
}

/**
 * ローディングスピナーコンポーネント
 *
 * 読み込み中の状態をユーザーに視覚的に伝えます。
 * aria-live="polite" により、スクリーンリーダーにも通知されます。
 *
 * @example
 * ```tsx
 * {isLoading && <LoadingSpinner message="データを取得中..." />}
 * ```
 */
export function LoadingSpinner({
  message = "読み込み中...",
  className,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "spinner-sm",
    md: "",
    lg: "spinner-lg",
  };

  return (
    <div
      className={`loading ${className ?? ""}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div
        className={`spinner ${sizeClasses[size]}`.trim()}
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}
