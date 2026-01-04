/**
 * @fileoverview キーボードショートカット用カスタムフック
 * キーボードショートカット処理を統一的に管理
 */

import { useEffect, useCallback } from "react";

/**
 * ショートカットオプションの型定義
 */
interface ShortcutOptions {
  /** Ctrlキーを必要とするか */
  ctrl?: boolean;
  /** Metaキー（Cmd）を必要とするか */
  meta?: boolean;
  /** Shiftキーを必要とするか */
  shift?: boolean;
  /** Altキーを必要とするか */
  alt?: boolean;
  /** ショートカットを無効にするか */
  disabled?: boolean;
}

/**
 * キーボードショートカットを管理するフック
 *
 * 指定されたキーとモディファイアキーの組み合わせで
 * コールバック関数を実行します。
 *
 * @param key - トリガーするキー（例: "Enter", "s", "Escape"）
 * @param callback - ショートカット発動時に実行する関数
 * @param options - ショートカットのオプション
 *
 * @example
 * ```tsx
 * // Ctrl+Enter で送信
 * useKeyboardShortcut("Enter", handleSubmit, { ctrl: true });
 *
 * // Cmd/Ctrl+S で保存
 * useKeyboardShortcut("s", handleSave, { ctrl: true, meta: true });
 *
 * // Escapeで閉じる
 * useKeyboardShortcut("Escape", handleClose);
 * ```
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {}
): void {
  const { ctrl = false, meta = false, shift = false, alt = false, disabled = false } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // モディファイアキーのチェック
      const ctrlOrMeta = ctrl || meta;
      const hasCtrlOrMeta = event.ctrlKey || event.metaKey;

      // 条件に応じたモディファイアキーの検証
      if (ctrlOrMeta && !hasCtrlOrMeta) return;
      if (!ctrlOrMeta && hasCtrlOrMeta) return;
      if (shift && !event.shiftKey) return;
      if (!shift && event.shiftKey) return;
      if (alt && !event.altKey) return;
      if (!alt && event.altKey) return;

      // キーのチェック（大文字小文字を無視）
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      event.preventDefault();
      callback();
    },
    [key, callback, ctrl, meta, shift, alt, disabled]
  );

  useEffect(() => {
    if (disabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, disabled]);
}

/**
 * 複数のキーボードショートカットを管理するフック
 *
 * @param shortcuts - ショートカット定義の配列
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: "Enter", callback: handleSubmit, options: { ctrl: true } },
 *   { key: "Escape", callback: handleClose },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{
    key: string;
    callback: () => void;
    options?: ShortcutOptions;
  }>
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const { key, callback, options = {} } = shortcut;
        const { ctrl = false, meta = false, shift = false, alt = false, disabled = false } = options;

        if (disabled) continue;

        const ctrlOrMeta = ctrl || meta;
        const hasCtrlOrMeta = event.ctrlKey || event.metaKey;

        if (ctrlOrMeta && !hasCtrlOrMeta) continue;
        if (!ctrlOrMeta && hasCtrlOrMeta) continue;
        if (shift && !event.shiftKey) continue;
        if (!shift && event.shiftKey) continue;
        if (alt && !event.altKey) continue;
        if (!alt && event.altKey) continue;

        if (event.key.toLowerCase() !== key.toLowerCase()) continue;

        event.preventDefault();
        callback();
        return;
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
