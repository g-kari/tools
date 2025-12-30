/**
 * @fileoverview トースト通知コンポーネント
 * ユーザーアクションに対する視覚的フィードバックを提供する
 * UX心理学のピーク・エンド法則に基づき、操作完了時の印象を強化
 */

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";

/**
 * トースト通知の種類
 * - success: 成功時（緑色）
 * - error: エラー時（赤色）
 * - info: 情報通知（グレー）
 */
type ToastType = "success" | "error" | "info";

/**
 * トースト通知の内部状態
 */
interface Toast {
  /** 一意の識別子 */
  id: string;
  /** 表示するメッセージ */
  message: string;
  /** 通知の種類 */
  type: ToastType;
  /** 退出アニメーション中かどうか */
  exiting?: boolean;
}

/**
 * トーストコンテキストの型定義
 */
interface ToastContextType {
  /**
   * トースト通知を表示する
   * @param message - 表示するメッセージ
   * @param type - 通知の種類（デフォルト: "info"）
   */
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Hook to access toast notifications
 * @returns Toast context with showToast function
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * Toast notification provider component
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Start exit animation after 2.5 seconds
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
    }, 2500);

    // Remove toast after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

/**
 * Toast container component that renders all active toasts
 */
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="通知">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

/**
 * Individual toast item component
 */
function ToastItem({ toast }: { toast: Toast }) {
  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div
      className={`toast toast-${toast.type} ${toast.exiting ? "toast-exit" : ""}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-icon" aria-hidden="true">
        {icons[toast.type]}
      </span>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}
