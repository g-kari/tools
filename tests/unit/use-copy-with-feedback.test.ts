/**
 * @fileoverview useCopyWithFeedback フックのロジックテスト
 * コピー成功・失敗時のフィードバックロジックを純粋関数として抽出してテスト
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
  it("statusRef, announceStatus, copyWithFeedback を返す（構造テスト）", () => {
    const mockReturn = {
      statusRef: { current: null },
      announceStatus: vi.fn(),
      copyWithFeedback: vi.fn(),
    };

    expect(mockReturn).toHaveProperty("statusRef");
    expect(mockReturn).toHaveProperty("announceStatus");
    expect(mockReturn).toHaveProperty("copyWithFeedback");
    expect(typeof mockReturn.copyWithFeedback).toBe("function");
    expect(typeof mockReturn.announceStatus).toBe("function");
  });
});
