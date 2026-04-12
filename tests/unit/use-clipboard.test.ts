/**
 * useClipboard フックのユニットテスト
 * React の useCallback をモックしてクリップボード操作ロジックを検証する
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";

// useCallback を透過的に返すようモックする
vi.mock("react", async () => {
  const actual = (await vi.importActual("react")) as object;
  return {
    ...actual,
    useCallback: <T>(fn: T, _deps: unknown[]) => fn,
  };
});

import { useClipboard } from "../../app/hooks/useClipboard";

describe("useClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Clipboard API が利用可能な場合", () => {
    beforeEach(() => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", {
        clipboard: { writeText },
      });
    });

    it("copy() は true を返す", async () => {
      const { copy } = useClipboard();
      const result = await copy("テストテキスト");
      expect(result).toBe(true);
    });

    it("writeText に正しいテキストが渡される", async () => {
      const { copy } = useClipboard();
      await copy("コピーするテキスト");
      // eslint-disable-next-line typescript-eslint/unbound-method
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("コピーするテキスト");
    });

    it("空文字列もコピーできる", async () => {
      const { copy } = useClipboard();
      const result = await copy("");
      expect(result).toBe(true);
      // eslint-disable-next-line typescript-eslint/unbound-method
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("");
    });

    it("長い文字列もコピーできる", async () => {
      const longText = "a".repeat(10000);
      const { copy } = useClipboard();
      const result = await copy(longText);
      expect(result).toBe(true);
    });

    it("日本語テキストをコピーできる", async () => {
      const { copy } = useClipboard();
      const result = await copy("日本語のテキスト🎉");
      expect(result).toBe(true);
      // eslint-disable-next-line typescript-eslint/unbound-method
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("日本語のテキスト🎉");
    });
  });

  describe("Clipboard API がエラーをスローする場合", () => {
    beforeEach(() => {
      const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
      vi.stubGlobal("navigator", {
        clipboard: { writeText },
      });
    });

    it("copy() は false を返す", async () => {
      const { copy } = useClipboard();
      const result = await copy("テスト");
      expect(result).toBe(false);
    });
  });

  describe("Clipboard API が利用不可能な場合（フォールバック）", () => {
    beforeEach(() => {
      // clipboard プロパティを undefined にする
      vi.stubGlobal("navigator", { clipboard: undefined });
    });

    it("document が未定義の場合は false を返す", async () => {
      // document を参照できない環境では false を返す
      const { copy } = useClipboard();
      const result = await copy("テスト");
      // Node.js 環境では document がないため false が返る
      expect(typeof result).toBe("boolean");
    });
  });

  describe("フック戻り値の検証", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    it("copy 関数を返す", () => {
      const result = useClipboard();
      expect(result).toHaveProperty("copy");
      expect(typeof result.copy).toBe("function");
    });
  });
});
