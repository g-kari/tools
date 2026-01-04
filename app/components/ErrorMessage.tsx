/**
 * @fileoverview エラーメッセージコンポーネント
 * アクセシブルなエラー表示を提供
 */

import * as React from "react";

/**
 * ErrorMessage コンポーネントのProps
 */
interface ErrorMessageProps {
  /** 表示するエラーメッセージ */
  message: string | null | undefined;
  /** カスタムクラス名 */
  className?: string;
  /** エラーのID（フォーム要素との関連付け用） */
  id?: string;
}

/**
 * エラーメッセージコンポーネント
 *
 * エラーメッセージをアクセシブルな形式で表示します。
 * role="alert" と aria-live="assertive" により、
 * スクリーンリーダーに即座に読み上げられます。
 *
 * @example
 * ```tsx
 * const [error, setError] = useState<string | null>(null);
 *
 * return (
 *   <>
 *     <input aria-describedby="input-error" />
 *     <ErrorMessage id="input-error" message={error} />
 *   </>
 * );
 * ```
 */
export function ErrorMessage({ message, className, id }: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      id={id}
      className={`error-message ${className ?? ""}`.trim()}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}
