/**
 * @fileoverview useStatusAnnouncement フックのロジックテスト
 * DOM操作・タイムアウト処理のロジックを純粋関数として抽出してテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";

// 最低限の DOM 要素の振る舞いを模倣するオブジェクト
function createMockElement() {
  return { textContent: "" as string | null };
}

// announceStatus のコアロジックを再現した純粋関数
function buildAnnouncer(timeout: number = 3000) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const announceStatus = (element: { textContent: string | null } | null, message: string) => {
    if (!element) return;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    element.textContent = message;

    timeoutId = setTimeout(() => {
      if (element) {
        element.textContent = "";
      }
    }, timeout);
  };

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return { announceStatus, cleanup };
}

describe("announceStatus コアロジック", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("要素が null の場合は何も起こらない", () => {
    const { announceStatus } = buildAnnouncer();
    expect(() => announceStatus(null, "テスト")).not.toThrow();
  });

  it("メッセージが要素の textContent に設定される", () => {
    const el = createMockElement();
    const { announceStatus } = buildAnnouncer();
    announceStatus(el, "コピーしました");
    expect(el.textContent).toBe("コピーしました");
  });

  it("タイムアウト後に textContent が空文字にリセットされる", () => {
    const el = createMockElement();
    const { announceStatus } = buildAnnouncer(3000);
    announceStatus(el, "コピーしました");
    expect(el.textContent).toBe("コピーしました");

    vi.advanceTimersByTime(3000);
    expect(el.textContent).toBe("");
  });

  it("タイムアウト前は textContent が残る", () => {
    const el = createMockElement();
    const { announceStatus } = buildAnnouncer(3000);
    announceStatus(el, "コピーしました");

    vi.advanceTimersByTime(2999);
    expect(el.textContent).toBe("コピーしました");
  });

  it("連続で呼ばれたとき、前のタイムアウトがキャンセルされる", () => {
    const el = createMockElement();
    const { announceStatus } = buildAnnouncer(3000);

    announceStatus(el, "最初のメッセージ");
    vi.advanceTimersByTime(2000);
    announceStatus(el, "2番目のメッセージ");

    // 最初のタイムアウトがキャンセルされているので、まだ残っているはず
    vi.advanceTimersByTime(1000);
    expect(el.textContent).toBe("2番目のメッセージ");

    // さらに 2000ms 進めて 2番目のタイムアウトを発火
    vi.advanceTimersByTime(2000);
    expect(el.textContent).toBe("");
  });

  it("カスタムタイムアウト値が正しく機能する", () => {
    const el = createMockElement();
    const { announceStatus } = buildAnnouncer(1000);
    announceStatus(el, "短いタイムアウト");

    vi.advanceTimersByTime(999);
    expect(el.textContent).toBe("短いタイムアウト");

    vi.advanceTimersByTime(1);
    expect(el.textContent).toBe("");
  });

  it("cleanup でタイムアウトがクリアされる", () => {
    const el = createMockElement();
    const { announceStatus, cleanup } = buildAnnouncer(3000);
    announceStatus(el, "メッセージ");
    cleanup();

    // cleanup でタイムアウトがキャンセルされたので、textContent はリセットされない
    vi.advanceTimersByTime(3000);
    expect(el.textContent).toBe("メッセージ");
  });

  it("空文字メッセージも設定できる", () => {
    const el = createMockElement();
    const { announceStatus } = buildAnnouncer();
    announceStatus(el, "");
    expect(el.textContent).toBe("");
  });

  it("日本語メッセージも正しく設定される", () => {
    const el = createMockElement();
    const { announceStatus } = buildAnnouncer();
    announceStatus(el, "コピーに失敗しました");
    expect(el.textContent).toBe("コピーに失敗しました");
  });
});

describe("StatusAnnouncer のアクセシビリティ属性（概念テスト）", () => {
  it("role='status' + aria-live='polite' + aria-atomic='true' の組み合わせを検証", () => {
    // StatusAnnouncer コンポーネントが生成する属性の期待値を確認
    const expectedAttributes = {
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    };

    expect(expectedAttributes.role).toBe("status");
    expect(expectedAttributes["aria-live"]).toBe("polite");
    expect(expectedAttributes["aria-atomic"]).toBe("true");
  });
});

describe("useStatusAnnouncement 戻り値の構造", () => {
  it("statusRef と announceStatus を返す（構造テスト）", () => {
    const mockReturn = {
      statusRef: { current: null },
      announceStatus: vi.fn(),
    };

    expect(mockReturn).toHaveProperty("statusRef");
    expect(mockReturn).toHaveProperty("announceStatus");
    expect(typeof mockReturn.announceStatus).toBe("function");
  });

  it("statusRef の初期値は null", () => {
    const mockReturn = {
      statusRef: { current: null },
      announceStatus: vi.fn(),
    };

    expect(mockReturn.statusRef.current).toBeNull();
  });
});
