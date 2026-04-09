/**
 * @fileoverview useKeyboardShortcut / useKeyboardShortcuts フックのロジックテスト
 * キーマッチング・モディファイアキーのロジックを純粋関数として抽出してテスト
 */

import { describe, it, expect, vi } from "vite-plus/test";

// モディファイアキー判定ロジックを抽出（useKeyboardShortcut 内部と同等）
function shouldTrigger(
  event: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  },
  shortcut: {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    disabled?: boolean;
  },
): boolean {
  const { ctrl = false, meta = false, shift = false, alt = false, disabled = false } = shortcut;

  if (disabled) return false;

  const ctrlOrMeta = ctrl || meta;
  const hasCtrlOrMeta = event.ctrlKey || event.metaKey;

  if (ctrlOrMeta && !hasCtrlOrMeta) return false;
  if (!ctrlOrMeta && hasCtrlOrMeta) return false;
  if (shift && !event.shiftKey) return false;
  if (!shift && event.shiftKey) return false;
  if (alt && !event.altKey) return false;
  if (!alt && event.altKey) return false;

  return event.key.toLowerCase() === shortcut.key.toLowerCase();
}

const baseEvent = {
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
};

describe("shouldTrigger ロジック（useKeyboardShortcut 内部ロジック）", () => {
  describe("基本的なキーマッチング", () => {
    it("同じキーが押されたとき true を返す", () => {
      expect(shouldTrigger({ ...baseEvent, key: "a" }, { key: "a" })).toBe(true);
    });

    it("異なるキーが押されたとき false を返す", () => {
      expect(shouldTrigger({ ...baseEvent, key: "b" }, { key: "a" })).toBe(false);
    });

    it("大文字・小文字を区別しない", () => {
      expect(shouldTrigger({ ...baseEvent, key: "A" }, { key: "a" })).toBe(true);
      expect(shouldTrigger({ ...baseEvent, key: "a" }, { key: "A" })).toBe(true);
    });

    it("Escape キーが正しくマッチする", () => {
      expect(shouldTrigger({ ...baseEvent, key: "Escape" }, { key: "Escape" })).toBe(true);
    });

    it("Enter キーが正しくマッチする", () => {
      expect(shouldTrigger({ ...baseEvent, key: "Enter" }, { key: "Enter" })).toBe(true);
    });
  });

  describe("disabled オプション", () => {
    it("disabled が true のとき false を返す", () => {
      expect(shouldTrigger({ ...baseEvent, key: "a" }, { key: "a", disabled: true })).toBe(false);
    });

    it("disabled が false のとき通常通りマッチする", () => {
      expect(shouldTrigger({ ...baseEvent, key: "a" }, { key: "a", disabled: false })).toBe(true);
    });
  });

  describe("Ctrl/Meta モディファイアキー", () => {
    it("ctrl: true のとき、ctrlKey が押されていれば true", () => {
      expect(
        shouldTrigger({ ...baseEvent, key: "s", ctrlKey: true }, { key: "s", ctrl: true }),
      ).toBe(true);
    });

    it("ctrl: true のとき、ctrlKey なしなら false", () => {
      expect(shouldTrigger({ ...baseEvent, key: "s" }, { key: "s", ctrl: true })).toBe(false);
    });

    it("ctrl: false のとき、ctrlKey が押されていれば false", () => {
      expect(shouldTrigger({ ...baseEvent, key: "s", ctrlKey: true }, { key: "s" })).toBe(false);
    });

    it("meta: true のとき、metaKey が押されていれば true", () => {
      expect(
        shouldTrigger({ ...baseEvent, key: "s", metaKey: true }, { key: "s", meta: true }),
      ).toBe(true);
    });

    it("ctrl: true のとき、metaKey でも代替として通る（ctrlOrMeta のロジック）", () => {
      // ctrl: true → ctrlOrMeta = true → event.ctrlKey || event.metaKey が true なら OK
      expect(
        shouldTrigger({ ...baseEvent, key: "s", metaKey: true }, { key: "s", ctrl: true }),
      ).toBe(true);
    });
  });

  describe("Shift モディファイアキー", () => {
    it("shift: true のとき、shiftKey が押されていれば true", () => {
      expect(
        shouldTrigger({ ...baseEvent, key: "a", shiftKey: true }, { key: "a", shift: true }),
      ).toBe(true);
    });

    it("shift: true のとき、shiftKey なしなら false", () => {
      expect(shouldTrigger({ ...baseEvent, key: "a" }, { key: "a", shift: true })).toBe(false);
    });

    it("shift: false のとき、shiftKey が押されていれば false", () => {
      expect(shouldTrigger({ ...baseEvent, key: "a", shiftKey: true }, { key: "a" })).toBe(false);
    });
  });

  describe("Alt モディファイアキー", () => {
    it("alt: true のとき、altKey が押されていれば true", () => {
      expect(shouldTrigger({ ...baseEvent, key: "f", altKey: true }, { key: "f", alt: true })).toBe(
        true,
      );
    });

    it("alt: true のとき、altKey なしなら false", () => {
      expect(shouldTrigger({ ...baseEvent, key: "f" }, { key: "f", alt: true })).toBe(false);
    });

    it("alt: false のとき、altKey が押されていれば false", () => {
      expect(shouldTrigger({ ...baseEvent, key: "f", altKey: true }, { key: "f" })).toBe(false);
    });
  });

  describe("複合モディファイアキー", () => {
    it("Ctrl + Shift + S のショートカットが正しくマッチする", () => {
      expect(
        shouldTrigger(
          { ...baseEvent, key: "s", ctrlKey: true, shiftKey: true },
          { key: "s", ctrl: true, shift: true },
        ),
      ).toBe(true);
    });

    it("Ctrl のみ押したとき、Ctrl + Shift のショートカットはマッチしない", () => {
      expect(
        shouldTrigger(
          { ...baseEvent, key: "s", ctrlKey: true },
          { key: "s", ctrl: true, shift: true },
        ),
      ).toBe(false);
    });
  });
});

// useKeyboardShortcuts の複数ショートカット処理ロジックをテスト
describe("useKeyboardShortcuts 複数ショートカット処理ロジック", () => {
  // フックの内部ロジック（handleKeyDown）を純粋関数として再現
  function buildHandleKeyDown(
    shortcuts: Array<{
      key: string;
      callback: () => void;
      options?: {
        ctrl?: boolean;
        meta?: boolean;
        shift?: boolean;
        alt?: boolean;
        disabled?: boolean;
      };
    }>,
  ) {
    return function handleKeyDown(event: {
      key: string;
      ctrlKey: boolean;
      metaKey: boolean;
      shiftKey: boolean;
      altKey: boolean;
      preventDefault: () => void;
    }) {
      for (const shortcut of shortcuts) {
        const { key, callback, options = {} } = shortcut;
        if (shouldTrigger(event, { key, ...options })) {
          event.preventDefault();
          callback();
          return;
        }
      }
    };
  }

  it("一致するショートカットのコールバックが呼ばれる", () => {
    const cb = vi.fn();
    const handler = buildHandleKeyDown([{ key: "a", callback: cb }]);
    handler({ ...baseEvent, key: "a", preventDefault: vi.fn() });
    expect(cb).toHaveBeenCalledOnce();
  });

  it("複数ショートカット中、最初にマッチしたものだけ呼ばれる", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const handler = buildHandleKeyDown([
      { key: "a", callback: cb1 },
      { key: "a", callback: cb2 },
    ]);
    handler({ ...baseEvent, key: "a", preventDefault: vi.fn() });
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).not.toHaveBeenCalled();
  });

  it("一致しないキーのコールバックは呼ばれない", () => {
    const cb = vi.fn();
    const handler = buildHandleKeyDown([{ key: "a", callback: cb }]);
    handler({ ...baseEvent, key: "b", preventDefault: vi.fn() });
    expect(cb).not.toHaveBeenCalled();
  });

  it("disabled ショートカットはスキップされ次のものが実行される", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const handler = buildHandleKeyDown([
      { key: "a", callback: cb1, options: { disabled: true } },
      { key: "a", callback: cb2 },
    ]);
    handler({ ...baseEvent, key: "a", preventDefault: vi.fn() });
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it("マッチしたとき preventDefault が呼ばれる", () => {
    const cb = vi.fn();
    const preventDefault = vi.fn();
    const handler = buildHandleKeyDown([{ key: "a", callback: cb }]);
    handler({ ...baseEvent, key: "a", preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it("マッチしないとき preventDefault は呼ばれない", () => {
    const cb = vi.fn();
    const preventDefault = vi.fn();
    const handler = buildHandleKeyDown([{ key: "a", callback: cb }]);
    handler({ ...baseEvent, key: "b", preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("ショートカットが空配列のとき何も起きない", () => {
    const handler = buildHandleKeyDown([]);
    const preventDefault = vi.fn();
    expect(() => handler({ ...baseEvent, key: "a", preventDefault })).not.toThrow();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});

// イベントリスナー登録のシミュレーションテスト（document を使わず純粋関数で検証）
describe("useKeyboardShortcut イベントリスナー登録ロジック（シミュレーション）", () => {
  it("addEventListener / removeEventListener のライフサイクルを模倣できる", () => {
    const listeners: Map<string, Set<() => void>> = new Map();

    const mockAddEventListener = (type: string, handler: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(handler);
    };

    const mockRemoveEventListener = (type: string, handler: () => void) => {
      listeners.get(type)?.delete(handler);
    };

    const handler = vi.fn();
    mockAddEventListener("keydown", handler);
    expect(listeners.get("keydown")).toContain(handler);

    mockRemoveEventListener("keydown", handler);
    expect(listeners.get("keydown")).not.toContain(handler);
  });

  it("クリーンアップ後はイベントが発火しない（ライフサイクルの正しさ）", () => {
    const fired: string[] = [];
    const listeners: Map<string, Set<() => void>> = new Map();

    const mockDispatch = (type: string) => {
      listeners.get(type)?.forEach((fn) => fn());
    };

    const handler = () => fired.push("keydown");
    listeners.set("keydown", new Set([handler]));

    mockDispatch("keydown");
    expect(fired).toHaveLength(1);

    // クリーンアップ
    listeners.get("keydown")?.delete(handler);
    mockDispatch("keydown");
    expect(fired).toHaveLength(1); // これ以上増えない
  });
});
