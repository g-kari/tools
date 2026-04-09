/**
 * useOutputCopy フックのユニットテスト
 * React の useState / useRef / useCallback / useEffect をモックしてコピーロジックを検証する
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";

// isCopied 状態を外部で追跡するための変数
let isCopiedState = false;
let setIsCopied: (val: boolean) => void = () => {};
const copiedTimeoutRef = { current: null as ReturnType<typeof setTimeout> | null };

vi.mock("react", async () => {
  const actual = (await vi.importActual("react")) as object;
  return {
    ...actual,
    useState: (initial: boolean) => {
      isCopiedState = initial;
      setIsCopied = (val: boolean) => {
        isCopiedState = val;
      };
      return [isCopiedState, setIsCopied];
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

import { useOutputCopy } from "../../app/hooks/useOutputCopy";

describe("useOutputCopy", () => {
  beforeEach(() => {
    isCopiedState = false;
    copiedTimeoutRef.current = null;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("戻り値の構造", () => {
    it("必要なプロパティが全て返される", () => {
      const result = useOutputCopy();
      expect(result).toHaveProperty("statusRef");
      expect(result).toHaveProperty("announceStatus");
      expect(result).toHaveProperty("showToast");
      expect(result).toHaveProperty("isCopied");
      expect(result).toHaveProperty("handleCopy");
    });

    it("handleCopy は関数である", () => {
      const { handleCopy } = useOutputCopy();
      expect(typeof handleCopy).toBe("function");
    });

    it("isCopied の初期値は false である", () => {
      const { isCopied } = useOutputCopy();
      expect(isCopied).toBe(false);
    });

    it("statusRef はモックの statusRef と同じオブジェクトである", () => {
      const { statusRef } = useOutputCopy();
      expect(statusRef).toBe(mockStatusRef);
    });

    it("announceStatus はモックの関数と同じである", () => {
      const { announceStatus } = useOutputCopy();
      expect(announceStatus).toBe(mockAnnounceStatus);
    });

    it("showToast はモックの関数と同じである", () => {
      const { showToast } = useOutputCopy();
      expect(showToast).toBe(mockShowToast);
    });
  });

  describe("handleCopy - 空文字列の場合", () => {
    it("空文字列を渡した場合、copy は呼ばれない", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("");
      expect(mockCopy).not.toHaveBeenCalled();
    });

    it("空文字列を渡した場合、announceStatus は呼ばれない", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("");
      expect(mockAnnounceStatus).not.toHaveBeenCalled();
    });

    it("空文字列を渡した場合、showToast は呼ばれない", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("");
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it("空文字列を渡した場合、isCopied は変わらない", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("");
      expect(isCopiedState).toBe(false);
    });
  });

  describe("handleCopy - コピー成功の場合", () => {
    beforeEach(() => {
      mockCopy.mockResolvedValue(true);
    });

    it("copy にテキストが渡される", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("テストテキスト");
      expect(mockCopy).toHaveBeenCalledWith("テストテキスト");
    });

    it("isCopied が true に設定される", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("テストテキスト");
      expect(isCopiedState).toBe(true);
    });

    it("announceStatus に成功メッセージが渡される", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("テストテキスト");
      expect(mockAnnounceStatus).toHaveBeenCalledWith("出力結果をコピーしました");
    });

    it("showToast は呼ばれない", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("テストテキスト");
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it("2秒後に isCopied が false に戻る", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("テストテキスト");
      expect(isCopiedState).toBe(true);

      vi.advanceTimersByTime(2000);
      expect(isCopiedState).toBe(false);
    });

    it("2秒未満では isCopied は true のまま", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("テストテキスト");
      expect(isCopiedState).toBe(true);

      vi.advanceTimersByTime(1999);
      expect(isCopiedState).toBe(true);
    });

    it("日本語テキストもコピーできる", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("こんにちは🎉");
      expect(mockCopy).toHaveBeenCalledWith("こんにちは🎉");
      expect(isCopiedState).toBe(true);
    });

    it("既存のタイムアウトがある場合はクリアされる", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      const { handleCopy } = useOutputCopy();

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
      const { handleCopy } = useOutputCopy();
      await handleCopy("テストテキスト");
      expect(isCopiedState).toBe(false);
    });

    it("announceStatus にエラーメッセージが渡される", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("テストテキスト");
      expect(mockAnnounceStatus).toHaveBeenCalledWith("コピーに失敗しました");
    });

    it("showToast にエラーメッセージと error タイプが渡される", async () => {
      const { handleCopy } = useOutputCopy();
      await handleCopy("テストテキスト");
      expect(mockShowToast).toHaveBeenCalledWith("コピーに失敗しました", "error");
    });
  });
});
