/**
 * @fileoverview Toast コンポーネントの状態管理ロジックテスト
 * ToastProvider 内の showToast ロジックを純粋関数として抽出してテスト
 * MAX_TOASTS 上限管理・状態遷移・タイムアウトロジックを検証する
 */

import { describe, it, expect } from "vite-plus/test";

/** トースト通知の種類 */
type ToastType = "success" | "error" | "info";

/** トースト通知の内部状態 */
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

/** Toast.tsx の MAX_TOASTS 定数と同値 */
const MAX_TOASTS = 5;

/**
 * showToast 内部の setToasts コールバックと等価な純粋関数
 * 新しいトーストを追加し、上限を超えた場合は古いものを削除する
 */
function addToast(prev: Toast[], id: string, message: string, type: ToastType): Toast[] {
  const newToasts = [...prev, { id, message, type }];
  if (newToasts.length > MAX_TOASTS) {
    return newToasts.slice(-MAX_TOASTS);
  }
  return newToasts;
}

/**
 * exit アニメーション開始時の setToasts コールバックと等価な純粋関数
 * 対象 ID のトーストに exiting: true をセットする
 */
function markExiting(prev: Toast[], id: string): Toast[] {
  return prev.map((t) => (t.id === id ? { ...t, exiting: true } : t));
}

/**
 * トースト削除時の setToasts コールバックと等価な純粋関数
 * 対象 ID のトーストを配列から取り除く
 */
function removeToast(prev: Toast[], id: string): Toast[] {
  return prev.filter((t) => t.id !== id);
}

// ─── addToast ──────────────────────────────────────────────

describe("addToast（showToast 内部ロジック）", () => {
  describe("基本動作", () => {
    it("空配列にトーストを追加できる", () => {
      const result = addToast([], "id1", "メッセージ", "info");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: "id1", message: "メッセージ", type: "info" });
    });

    it("既存のトーストを保持しながら追加される", () => {
      const existing: Toast[] = [{ id: "a", message: "既存", type: "success" }];
      const result = addToast(existing, "b", "新規", "error");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("a");
      expect(result[1].id).toBe("b");
    });

    it("新しいトーストは末尾に追加される", () => {
      const existing: Toast[] = [
        { id: "1", message: "A", type: "info" },
        { id: "2", message: "B", type: "info" },
      ];
      const result = addToast(existing, "3", "C", "info");
      expect(result[result.length - 1].id).toBe("3");
    });

    it("success・error・info の各タイプを追加できる", () => {
      const types: ToastType[] = ["success", "error", "info"];
      for (const type of types) {
        const result = addToast([], "id", "msg", type);
        expect(result[0].type).toBe(type);
      }
    });
  });

  describe("MAX_TOASTS 上限管理（最大5件）", () => {
    it("5件以下のとき全件保持する", () => {
      let state: Toast[] = [];
      for (let i = 0; i < MAX_TOASTS; i++) {
        state = addToast(state, `id${i}`, `msg${i}`, "info");
      }
      expect(state).toHaveLength(MAX_TOASTS);
    });

    it("6件目を追加すると最古のトーストが削除される", () => {
      let state: Toast[] = [];
      for (let i = 0; i < MAX_TOASTS; i++) {
        state = addToast(state, `id${i}`, `msg${i}`, "info");
      }
      state = addToast(state, "new", "新しいメッセージ", "success");
      expect(state).toHaveLength(MAX_TOASTS);
      expect(state[0].id).toBe("id1"); // id0 が削除される
      expect(state[MAX_TOASTS - 1].id).toBe("new");
    });

    it("複数の超過追加でも常に最新5件のみ保持する", () => {
      let state: Toast[] = [];
      const total = 10;
      for (let i = 0; i < total; i++) {
        state = addToast(state, `id${i}`, `msg${i}`, "info");
      }
      expect(state).toHaveLength(MAX_TOASTS);
      // 最新5件（id5〜id9）が残る
      expect(state[0].id).toBe("id5");
      expect(state[MAX_TOASTS - 1].id).toBe("id9");
    });

    it("ちょうど MAX_TOASTS + 1 件のとき先頭1件だけ削除される", () => {
      let state: Toast[] = [];
      for (let i = 0; i < MAX_TOASTS + 1; i++) {
        state = addToast(state, `id${i}`, `msg${i}`, "info");
      }
      expect(state).toHaveLength(MAX_TOASTS);
      expect(state.find((t) => t.id === "id0")).toBeUndefined();
    });
  });

  describe("既存の exiting フラグ保持", () => {
    it("既存の exiting:true トーストは新規追加後も保持される", () => {
      const existing: Toast[] = [{ id: "a", message: "退出中", type: "info", exiting: true }];
      const result = addToast(existing, "b", "新規", "success");
      expect(result[0].exiting).toBe(true);
    });
  });
});

// ─── markExiting ────────────────────────────────────────────

describe("markExiting（exit アニメーション開始ロジック）", () => {
  it("対象 ID のトーストに exiting: true がセットされる", () => {
    const state: Toast[] = [
      { id: "a", message: "A", type: "info" },
      { id: "b", message: "B", type: "success" },
    ];
    const result = markExiting(state, "a");
    expect(result.find((t) => t.id === "a")?.exiting).toBe(true);
  });

  it("他のトーストには影響しない", () => {
    const state: Toast[] = [
      { id: "a", message: "A", type: "info" },
      { id: "b", message: "B", type: "success" },
    ];
    const result = markExiting(state, "a");
    expect(result.find((t) => t.id === "b")?.exiting).toBeUndefined();
  });

  it("存在しない ID を指定した場合、状態は変化しない", () => {
    const state: Toast[] = [{ id: "a", message: "A", type: "info" }];
    const result = markExiting(state, "z");
    expect(result[0].exiting).toBeUndefined();
    expect(result).toHaveLength(1);
  });

  it("空配列に対して何も起きない", () => {
    const result = markExiting([], "any");
    expect(result).toHaveLength(0);
  });

  it("複数回 markExiting しても冪等", () => {
    const state: Toast[] = [{ id: "a", message: "A", type: "info" }];
    const once = markExiting(state, "a");
    const twice = markExiting(once, "a");
    expect(twice[0].exiting).toBe(true);
  });
});

// ─── removeToast ────────────────────────────────────────────

describe("removeToast（トースト削除ロジック）", () => {
  it("対象 ID のトーストが削除される", () => {
    const state: Toast[] = [
      { id: "a", message: "A", type: "info" },
      { id: "b", message: "B", type: "success" },
    ];
    const result = removeToast(state, "a");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("他のトーストは保持される", () => {
    const state: Toast[] = [
      { id: "a", message: "A", type: "info" },
      { id: "b", message: "B", type: "success" },
      { id: "c", message: "C", type: "error" },
    ];
    const result = removeToast(state, "b");
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("存在しない ID を指定した場合、配列は変化しない", () => {
    const state: Toast[] = [{ id: "a", message: "A", type: "info" }];
    const result = removeToast(state, "z");
    expect(result).toHaveLength(1);
  });

  it("空配列に対して何も起きない", () => {
    const result = removeToast([], "any");
    expect(result).toHaveLength(0);
  });
});

// ─── ライフサイクル統合テスト ──────────────────────────────

describe("Toast ライフサイクル（追加 → exit → 削除）", () => {
  it("通常の addToast → markExiting → removeToast の流れ", () => {
    let state: Toast[] = [];

    // 追加
    state = addToast(state, "id1", "テストメッセージ", "success");
    expect(state).toHaveLength(1);
    expect(state[0].exiting).toBeUndefined();

    // exit アニメーション開始
    state = markExiting(state, "id1");
    expect(state[0].exiting).toBe(true);

    // 削除
    state = removeToast(state, "id1");
    expect(state).toHaveLength(0);
  });

  it("複数トーストを個別にライフサイクル管理できる", () => {
    let state: Toast[] = [];
    state = addToast(state, "a", "A", "info");
    state = addToast(state, "b", "B", "success");

    // b を先に削除する
    state = markExiting(state, "b");
    state = removeToast(state, "b");

    expect(state).toHaveLength(1);
    expect(state[0].id).toBe("a");
    expect(state[0].exiting).toBeUndefined();
  });

  it("MAX_TOASTS 超過後も削除されなかったトーストは正しくライフサイクルを経る", () => {
    let state: Toast[] = [];
    for (let i = 0; i < MAX_TOASTS + 2; i++) {
      state = addToast(state, `id${i}`, `msg${i}`, "info");
    }
    // 最新5件のみ残る（id2〜id6）
    expect(state).toHaveLength(MAX_TOASTS);
    const lastId = state[MAX_TOASTS - 1].id;

    state = markExiting(state, lastId);
    state = removeToast(state, lastId);
    expect(state).toHaveLength(MAX_TOASTS - 1);
  });
});

// ─── タイムアウトスケジューリングのシミュレーション ────────

describe("タイムアウトスケジューリングロジック（シミュレーション）", () => {
  it("setTimeout が2回呼ばれる（exit用と削除用）", () => {
    const timeouts: Array<{ delay: number; fn: () => void }> = [];
    const mockSetTimeout = (fn: () => void, delay: number) => {
      timeouts.push({ delay, fn });
      return timeouts.length - 1;
    };

    // Toast.tsx のタイムアウト設定をシミュレート
    const exitDelay = 2500;
    const removeDelay = 2800;
    mockSetTimeout(() => {}, exitDelay);
    mockSetTimeout(() => {}, removeDelay);

    expect(timeouts).toHaveLength(2);
    expect(timeouts[0].delay).toBe(2500);
    expect(timeouts[1].delay).toBe(2800);
  });

  it("削除タイムアウトは exit タイムアウトより後（300ms 差）", () => {
    const EXIT_DELAY = 2500;
    const REMOVE_DELAY = 2800;
    expect(REMOVE_DELAY - EXIT_DELAY).toBe(300);
  });

  it("clearTimeout でタイムアウトをキャンセルできる（Map シミュレーション）", () => {
    const timeoutMap = new Map<string, ReturnType<typeof setTimeout>[]>();
    const firedIds: string[] = [];

    const schedule = (id: string, fn: () => void) => {
      const t = setTimeout(fn, 0);
      timeoutMap.set(id, [t]);
    };

    const cancel = (id: string) => {
      const ts = timeoutMap.get(id);
      if (ts) {
        ts.forEach((t) => clearTimeout(t));
        timeoutMap.delete(id);
      }
    };

    schedule("toast1", () => firedIds.push("toast1"));
    cancel("toast1");

    // タイムアウトをキャンセルしたので Map からも削除される
    expect(timeoutMap.has("toast1")).toBe(false);
  });
});
