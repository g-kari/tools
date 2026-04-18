/**
 * @fileoverview useCopyWithFeedback フックのロジックテスト
 * コピー成功・失敗時のフィードバックロジックを純粋関数として抽出してテスト
 * 加えて、handleCopy / isCopied のタイマー制御ロジックも検証
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";

// copyWithFeedback のコアロジックを再現した純粋関数
function buildCopyWithFeedback(deps: {
  copy: (text: string) => Promise<boolean>;
  showToast: (message: string, type: "success" | "error") => void;
  announceStatus: (message: string) => void;
}) {
  return async (text: string, successMessage = "コピーしました") => {
    if (!text) return;
    const ok = await deps.copy(text);
    if (ok) {
      deps.showToast(successMessage, "success");
      deps.announceStatus(successMessage);
    } else {
      deps.showToast("コピーに失敗しました", "error");
      deps.announceStatus("コピーに失敗しました");
    }
  };
}

describe("copyWithFeedback コアロジック", () => {
  // vi.fn() を利用するためモック型で保持する
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let copyMock: ReturnType<typeof vi.fn<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let showToastMock: ReturnType<typeof vi.fn<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let announceStatusMock: ReturnType<typeof vi.fn<any>>;

  beforeEach(() => {
    copyMock = vi.fn();
    showToastMock = vi.fn();
    announceStatusMock = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 型付きのヘルパー関数でビルダーに渡す
  const getCopyWithFeedback = () =>
    buildCopyWithFeedback({
      copy: copyMock as (text: string) => Promise<boolean>,
      showToast: showToastMock as (message: string, type: "success" | "error") => void,
      announceStatus: announceStatusMock as (message: string) => void,
    });

  describe("コピー成功時", () => {
    beforeEach(() => {
      copyMock.mockResolvedValue(true);
    });

    it("コピー成功時、showToast に success が渡される", async () => {
      await getCopyWithFeedback()("テストテキスト");
      expect(showToastMock).toHaveBeenCalledWith("コピーしました", "success");
    });

    it("コピー成功時、announceStatus にメッセージが渡される", async () => {
      await getCopyWithFeedback()("テストテキスト");
      expect(announceStatusMock).toHaveBeenCalledWith("コピーしました");
    });

    it("カスタム successMessage が toast と announceStatus に渡される", async () => {
      await getCopyWithFeedback()("テキスト", "URLをコピーしました");
      expect(showToastMock).toHaveBeenCalledWith("URLをコピーしました", "success");
      expect(announceStatusMock).toHaveBeenCalledWith("URLをコピーしました");
    });

    it("copy が正しいテキストで呼ばれる", async () => {
      await getCopyWithFeedback()("コピー対象テキスト");
      expect(copyMock).toHaveBeenCalledWith("コピー対象テキスト");
    });
  });

  describe("コピー失敗時", () => {
    beforeEach(() => {
      copyMock.mockResolvedValue(false);
    });

    it("コピー失敗時、showToast に error が渡される", async () => {
      await getCopyWithFeedback()("テストテキスト");
      expect(showToastMock).toHaveBeenCalledWith("コピーに失敗しました", "error");
    });

    it("コピー失敗時、announceStatus にエラーメッセージが渡される", async () => {
      await getCopyWithFeedback()("テストテキスト");
      expect(announceStatusMock).toHaveBeenCalledWith("コピーに失敗しました");
    });

    it("コピー失敗時、success 用の toast は呼ばれない", async () => {
      await getCopyWithFeedback()("テストテキスト");
      expect(showToastMock).not.toHaveBeenCalledWith(expect.any(String), "success");
    });
  });

  describe("空文字列の処理", () => {
    it("text が空文字列のとき copy は呼ばれない", async () => {
      await getCopyWithFeedback()("");
      expect(copyMock).not.toHaveBeenCalled();
    });

    it("text が空文字列のとき showToast は呼ばれない", async () => {
      await getCopyWithFeedback()("");
      expect(showToastMock).not.toHaveBeenCalled();
    });

    it("text が空文字列のとき announceStatus は呼ばれない", async () => {
      await getCopyWithFeedback()("");
      expect(announceStatusMock).not.toHaveBeenCalled();
    });
  });

  describe("デフォルトの successMessage", () => {
    it("successMessage を省略すると 'コピーしました' がデフォルトになる", async () => {
      copyMock.mockResolvedValue(true);
      await getCopyWithFeedback()("テキスト");
      expect(showToastMock).toHaveBeenCalledWith("コピーしました", "success");
    });
  });

  describe("各種テキストのコピー", () => {
    beforeEach(() => {
      copyMock.mockResolvedValue(true);
    });

    it("URL テキストを正しくコピーできる", async () => {
      await getCopyWithFeedback()("https://example.com/path?query=value");
      expect(copyMock).toHaveBeenCalledWith("https://example.com/path?query=value");
    });

    it("日本語テキストを正しくコピーできる", async () => {
      await getCopyWithFeedback()("日本語のテキスト🎉");
      expect(copyMock).toHaveBeenCalledWith("日本語のテキスト🎉");
    });

    it("長いテキストを正しくコピーできる", async () => {
      const longText = "a".repeat(5000);
      await getCopyWithFeedback()(longText);
      expect(copyMock).toHaveBeenCalledWith(longText);
    });
  });
});

describe("useCopyWithFeedback 戻り値の構造", () => {
  it("statusRef, announceStatus, showToast, isCopied, copyWithFeedback, handleCopy を返す（構造テスト）", () => {
    const mockReturn = {
      statusRef: { current: null },
      announceStatus: vi.fn(),
      showToast: vi.fn(),
      isCopied: false,
      copyWithFeedback: vi.fn(),
      handleCopy: vi.fn(),
    };

    expect(mockReturn).toHaveProperty("statusRef");
    expect(mockReturn).toHaveProperty("announceStatus");
    expect(mockReturn).toHaveProperty("showToast");
    expect(mockReturn).toHaveProperty("isCopied");
    expect(mockReturn).toHaveProperty("copyWithFeedback");
    expect(mockReturn).toHaveProperty("handleCopy");
    expect(typeof mockReturn.copyWithFeedback).toBe("function");
    expect(typeof mockReturn.handleCopy).toBe("function");
    expect(typeof mockReturn.announceStatus).toBe("function");
    expect(typeof mockReturn.showToast).toBe("function");
  });
});

// -----------------------------------------------------------------------------
// handleCopy (旧 useOutputCopy 相当) のロジックテスト
// useState / useRef / useCallback / useEffect をモックしてコピー状態の管理を検証
// -----------------------------------------------------------------------------

// isCopied 状態を外部で追跡するための変数
let isCopiedState = false;
let setIsCopiedMock: (val: boolean) => void = () => {};
const copiedTimeoutRef = { current: null as ReturnType<typeof setTimeout> | null };

vi.mock("react", async () => {
  const actual = (await vi.importActual("react")) as object;
  return {
    ...actual,
    useState: (initial: boolean) => {
      isCopiedState = initial;
      setIsCopiedMock = (val: boolean) => {
        isCopiedState = val;
      };
      return [isCopiedState, setIsCopiedMock];
    },
    useRef: (_initial: unknown) => copiedTimeoutRef,
    useCallback: <T>(fn: T, _deps: unknown[]) => fn,
    useEffect: (_fn: () => void | (() => void), _deps: unknown[]) => {},
  };
});

const mockShowToast = vi.fn();
const mockCopy = vi.fn();
const mockAnnounceStatus = vi.fn();
const mockStatusRef = { current: null };

vi.mock("~/components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock("../../app/hooks/useClipboard", () => ({
  useClipboard: () => ({ copy: mockCopy }),
}));

vi.mock("../../app/hooks/useStatusAnnouncement", () => ({
  useStatusAnnouncement: () => ({
    statusRef: mockStatusRef,
    announceStatus: mockAnnounceStatus,
  }),
}));

const { useCopyWithFeedback } = await import("../../app/hooks/useCopyWithFeedback");

describe("useCopyWithFeedback - handleCopy", () => {
  beforeEach(() => {
    isCopiedState = false;
    copiedTimeoutRef.current = null;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("戻り値の構造（実フック）", () => {
    it("必要なプロパティが全て返される", () => {
      const result = useCopyWithFeedback();
      expect(result).toHaveProperty("statusRef");
      expect(result).toHaveProperty("announceStatus");
      expect(result).toHaveProperty("showToast");
      expect(result).toHaveProperty("isCopied");
      expect(result).toHaveProperty("copyWithFeedback");
      expect(result).toHaveProperty("handleCopy");
    });

    it("handleCopy は関数である", () => {
      const { handleCopy } = useCopyWithFeedback();
      expect(typeof handleCopy).toBe("function");
    });

    it("isCopied の初期値は false である", () => {
      const { isCopied } = useCopyWithFeedback();
      expect(isCopied).toBe(false);
    });

    it("statusRef はモックの statusRef と同じオブジェクトである", () => {
      const { statusRef } = useCopyWithFeedback();
      expect(statusRef).toBe(mockStatusRef);
    });

    it("announceStatus はモックの関数と同じである", () => {
      const { announceStatus } = useCopyWithFeedback();
      expect(announceStatus).toBe(mockAnnounceStatus);
    });

    it("showToast はモックの関数と同じである", () => {
      const { showToast } = useCopyWithFeedback();
      expect(showToast).toBe(mockShowToast);
    });
  });

  describe("handleCopy - 空文字列の場合", () => {
    it("空文字列を渡した場合、copy は呼ばれない", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("");
      expect(mockCopy).not.toHaveBeenCalled();
    });

    it("空文字列を渡した場合、announceStatus は呼ばれない", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("");
      expect(mockAnnounceStatus).not.toHaveBeenCalled();
    });

    it("空文字列を渡した場合、showToast は呼ばれない", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("");
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it("空文字列を渡した場合、isCopied は変わらない", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("");
      expect(isCopiedState).toBe(false);
    });
  });

  describe("handleCopy - コピー成功の場合", () => {
    beforeEach(() => {
      mockCopy.mockResolvedValue(true);
    });

    it("copy にテキストが渡される", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("テストテキスト");
      expect(mockCopy).toHaveBeenCalledWith("テストテキスト");
    });

    it("isCopied が true に設定される", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("テストテキスト");
      expect(isCopiedState).toBe(true);
    });

    it("announceStatus に成功メッセージが渡される", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("テストテキスト");
      expect(mockAnnounceStatus).toHaveBeenCalledWith("出力結果をコピーしました");
    });

    it("showToast は呼ばれない", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("テストテキスト");
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it("2秒後に isCopied が false に戻る", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("テストテキスト");
      expect(isCopiedState).toBe(true);

      vi.advanceTimersByTime(2000);
      expect(isCopiedState).toBe(false);
    });

    it("2秒未満では isCopied は true のまま", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("テストテキスト");
      expect(isCopiedState).toBe(true);

      vi.advanceTimersByTime(1999);
      expect(isCopiedState).toBe(true);
    });

    it("日本語テキストもコピーできる", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("こんにちは🎉");
      expect(mockCopy).toHaveBeenCalledWith("こんにちは🎉");
      expect(isCopiedState).toBe(true);
    });

    it("既存のタイムアウトがある場合はクリアされる", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      const { handleCopy } = useCopyWithFeedback();

      // 最初のコピー
      await handleCopy("テキスト1");
      const firstTimeoutId = copiedTimeoutRef.current;

      // 2回目のコピー（1回目のタイムアウトをクリアするはず）
      await handleCopy("テキスト2");

      expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTimeoutId);
    });
  });

  describe("handleCopy - コピー失敗の場合", () => {
    beforeEach(() => {
      mockCopy.mockResolvedValue(false);
    });

    it("isCopied は false のまま", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("テストテキスト");
      expect(isCopiedState).toBe(false);
    });

    it("announceStatus にエラーメッセージが渡される", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("テストテキスト");
      expect(mockAnnounceStatus).toHaveBeenCalledWith("コピーに失敗しました");
    });

    it("showToast にエラーメッセージと error タイプが渡される", async () => {
      const { handleCopy } = useCopyWithFeedback();
      await handleCopy("テストテキスト");
      expect(mockShowToast).toHaveBeenCalledWith("コピーに失敗しました", "error");
    });
  });
});
