/**
 * @fileoverview キーボードキーコードチェッカーユーティリティ
 * キーボードイベントの情報を整形・表示するための関数群
 */

/**
 * キーボードイベント情報
 */
export interface KeyEventInfo {
  /** キーの値（例: "a", "Enter", "ArrowUp"） */
  key: string;
  /** 物理キーのコード（例: "KeyA", "Enter", "ArrowUp"） */
  code: string;
  /** キーコード（非推奨だが参考情報として表示） */
  keyCode: number;
  /** which プロパティ（非推奨だが参考情報として表示） */
  which: number;
  /** 文字コード（非推奨だが参考情報として表示） */
  charCode: number;
  /** Ctrl キーが押されているか */
  ctrlKey: boolean;
  /** Shift キーが押されているか */
  shiftKey: boolean;
  /** Alt キーが押されているか */
  altKey: boolean;
  /** Meta（Command/Windows）キーが押されているか */
  metaKey: boolean;
  /** イベントの種類（"keydown", "keyup", "keypress"） */
  type: string;
}

/**
 * 修飾キーのセット
 */
const MODIFIER_KEYS = new Set([
  "Control",
  "Shift",
  "Alt",
  "Meta",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  "Fn",
  "FnLock",
  "Hyper",
  "Super",
  "Symbol",
  "SymbolLock",
]);

/**
 * 特殊キーの表示名マッピング
 */
const KEY_DISPLAY_NAMES: Record<string, string> = {
  " ": "Space",
  "ArrowUp": "↑ ArrowUp",
  "ArrowDown": "↓ ArrowDown",
  "ArrowLeft": "← ArrowLeft",
  "ArrowRight": "→ ArrowRight",
  "Backspace": "⌫ Backspace",
  "Delete": "⌦ Delete",
  "Enter": "↵ Enter",
  "Tab": "⇥ Tab",
  "Escape": "Esc",
  "CapsLock": "⇪ CapsLock",
  "Shift": "⇧ Shift",
  "Control": "⌃ Control",
  "Alt": "⌥ Alt",
  "Meta": "⌘ Meta",
  "Home": "⇱ Home",
  "End": "⇲ End",
  "PageUp": "⇞ PageUp",
  "PageDown": "⇟ PageDown",
  "Insert": "Insert",
  "PrintScreen": "PrtSc",
  "Pause": "Pause",
  "ContextMenu": "Menu",
};

/**
 * KeyboardEvent からキーイベント情報を取得する
 *
 * @param e - KeyboardEvent オブジェクト
 * @returns キーイベント情報
 *
 * @example
 * ```ts
 * document.addEventListener("keydown", (e) => {
 *   const info = formatKeyEventInfo(e);
 *   console.log(info.key, info.code, info.keyCode);
 * });
 * ```
 */
export function formatKeyEventInfo(e: KeyboardEvent): KeyEventInfo {
  return {
    key: e.key,
    code: e.code,
    keyCode: e.keyCode,
    which: e.which,
    charCode: e.charCode,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey,
    altKey: e.altKey,
    metaKey: e.metaKey,
    type: e.type,
  };
}

/**
 * キー名を表示用に変換する
 *
 * 特殊キーには読みやすい表示名を返し、
 * 通常のキーはそのまま返します。
 *
 * @param key - KeyboardEvent.key の値
 * @returns 表示用のキー名
 *
 * @example
 * ```ts
 * getKeyDisplayName(" ")      // => "Space"
 * getKeyDisplayName("Enter")  // => "↵ Enter"
 * getKeyDisplayName("a")      // => "a"
 * ```
 */
export function getKeyDisplayName(key: string): string {
  return KEY_DISPLAY_NAMES[key] ?? key;
}

/**
 * 指定したキーが修飾キーかどうかを判定する
 *
 * 修飾キーの例: Control, Shift, Alt, Meta, CapsLock など
 *
 * @param key - KeyboardEvent.key の値
 * @returns 修飾キーであれば true、それ以外は false
 *
 * @example
 * ```ts
 * isModifierKey("Control") // => true
 * isModifierKey("Shift")   // => true
 * isModifierKey("a")       // => false
 * isModifierKey("Enter")   // => false
 * ```
 */
export function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key);
}
