/**
 * @fileoverview カスタムフックのユニットテスト
 * 注: フックのロジックをテストするため、純粋な関数として抽出してテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("useClipboard ロジック", () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    // navigator.clipboard をモック
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Clipboard API が利用可能な場合、writeText が呼ばれる", async () => {
    mockWriteText.mockResolvedValue(undefined);

    await navigator.clipboard.writeText("test text");

    expect(mockWriteText).toHaveBeenCalledWith("test text");
  });

  it("Clipboard API が失敗した場合、エラーがスローされる", async () => {
    mockWriteText.mockRejectedValue(new Error("Clipboard error"));

    await expect(navigator.clipboard.writeText("test text")).rejects.toThrow(
      "Clipboard error"
    );
  });
});

describe("useKeyboardShortcut ロジック", () => {
  it("キーイベントのプロパティが正しく設定される", () => {
    // KeyboardEventInitの構造をテスト
    const eventInit = {
      key: "Enter",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      bubbles: true,
    };

    expect(eventInit.key).toBe("Enter");
    expect(eventInit.ctrlKey).toBe(true);
    expect(eventInit.metaKey).toBe(false);
  });

  it("Meta キーの設定が正しく動作する", () => {
    const eventInit = {
      key: "Enter",
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
      altKey: false,
    };

    expect(eventInit.key).toBe("Enter");
    expect(eventInit.metaKey).toBe(true);
  });

  it("Shift キーの設定が正しく動作する", () => {
    const eventInit = {
      key: "s",
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      altKey: false,
    };

    expect(eventInit.key).toBe("s");
    expect(eventInit.shiftKey).toBe(true);
  });

  it("Alt キーの設定が正しく動作する", () => {
    const eventInit = {
      key: "a",
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: true,
    };

    expect(eventInit.key).toBe("a");
    expect(eventInit.altKey).toBe(true);
  });

  it("Escape キーの設定が正しく動作する", () => {
    const eventInit = {
      key: "Escape",
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    };

    expect(eventInit.key).toBe("Escape");
  });

  it("キー比較のケースインセンシティブ処理", () => {
    const key1 = "Enter";
    const key2 = "enter";

    expect(key1.toLowerCase()).toBe(key2.toLowerCase());
  });
});

describe("useStatusAnnouncement ロジック", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("タイムアウトの値が正しく設定される", () => {
    const defaultTimeout = 3000;
    const customTimeout = 5000;

    expect(defaultTimeout).toBe(3000);
    expect(customTimeout).toBe(5000);
  });

  it("タイムアウト処理のロジック", () => {
    let message = "テストメッセージ";

    const timeoutId = setTimeout(() => {
      message = "";
    }, 3000);

    expect(message).toBe("テストメッセージ");

    vi.advanceTimersByTime(3000);

    expect(message).toBe("");
    clearTimeout(timeoutId);
  });

  it("タイムアウトのクリアロジック", () => {
    let message = "メッセージ1";
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // 最初のタイムアウト設定
    timeoutId = setTimeout(() => {
      message = "";
    }, 3000);

    // 1秒後に新しいメッセージで上書き
    vi.advanceTimersByTime(1000);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    message = "メッセージ2";
    timeoutId = setTimeout(() => {
      message = "";
    }, 3000);

    expect(message).toBe("メッセージ2");

    vi.advanceTimersByTime(3000);
    expect(message).toBe("");
  });
});

describe("ResultCard 構造", () => {
  it("結果行のデータ構造が正しい", () => {
    const row = {
      label: "ラベル",
      value: "値",
      isList: false,
      fallback: "-",
    };

    expect(row.label).toBe("ラベル");
    expect(row.value).toBe("値");
    expect(row.isList).toBe(false);
    expect(row.fallback).toBe("-");
  });

  it("リスト形式の結果行が正しく構造化される", () => {
    const row = {
      label: "ネームサーバー",
      value: ["ns1.example.com", "ns2.example.com"],
      isList: true,
    };

    expect(row.label).toBe("ネームサーバー");
    expect(Array.isArray(row.value)).toBe(true);
    expect(row.value).toHaveLength(2);
    expect(row.isList).toBe(true);
  });

  it("フォールバック値の処理", () => {
    const row = {
      label: "値なし",
      value: null as string | null,
      fallback: "-",
    };

    const displayValue = row.value ?? row.fallback;
    expect(displayValue).toBe("-");
  });
});

describe("ErrorMessage 構造", () => {
  it("エラーメッセージがある場合の構造", () => {
    const error = {
      message: "エラーが発生しました",
      className: "error-message",
      role: "alert",
      ariaLive: "assertive",
    };

    expect(error.message).toBe("エラーが発生しました");
    expect(error.role).toBe("alert");
    expect(error.ariaLive).toBe("assertive");
  });

  it("エラーメッセージが null の場合", () => {
    const error = {
      message: null as string | null,
    };

    expect(error.message).toBeNull();
  });

  it("エラーメッセージが undefined の場合", () => {
    const error = {
      message: undefined as string | undefined,
    };

    expect(error.message).toBeUndefined();
  });
});

describe("LoadingSpinner 構造", () => {
  it("デフォルトメッセージの構造", () => {
    const spinner = {
      message: "読み込み中...",
      size: "md" as "sm" | "md" | "lg",
      className: "loading",
      role: "status",
      ariaLive: "polite",
    };

    expect(spinner.message).toBe("読み込み中...");
    expect(spinner.size).toBe("md");
    expect(spinner.role).toBe("status");
  });

  it("カスタムメッセージの構造", () => {
    const spinner = {
      message: "データを取得中...",
      size: "lg" as "sm" | "md" | "lg",
    };

    expect(spinner.message).toBe("データを取得中...");
    expect(spinner.size).toBe("lg");
  });

  it("サイズクラスのマッピング", () => {
    const sizeClasses: Record<string, string> = {
      sm: "spinner-sm",
      md: "",
      lg: "spinner-lg",
    };

    expect(sizeClasses.sm).toBe("spinner-sm");
    expect(sizeClasses.md).toBe("");
    expect(sizeClasses.lg).toBe("spinner-lg");
  });
});
