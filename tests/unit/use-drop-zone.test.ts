/**
 * useDropZone フックのユニットテスト
 * React の useState / useCallback をモックしてドラッグ&ドロップロジックを検証する
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";

// isDragging 状態を外部で追跡するための変数
let isDraggingState = false;
let setIsDragging: (val: boolean) => void = () => {};

vi.mock("react", async () => {
  const actual = (await vi.importActual("react")) as object;
  return {
    ...actual,
    useState: (initial: boolean) => {
      isDraggingState = initial;
      setIsDragging = (val: boolean) => {
        isDraggingState = val;
      };
      return [isDraggingState, setIsDragging];
    },
    useCallback: <T>(fn: T, _deps: unknown[]) => fn,
  };
});

import { useDropZone } from "../../app/hooks/useDropZone";

/**
 * モック用 DragEvent を生成するヘルパー
 */
function createMockDragEvent(files: File[] = []): {
  preventDefault: ReturnType<typeof vi.fn>;
  dataTransfer: { files: File[] };
} {
  return {
    preventDefault: vi.fn(),
    dataTransfer: { files },
  };
}

describe("useDropZone", () => {
  beforeEach(() => {
    isDraggingState = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初期状態", () => {
    it("isDragging は false として返される", () => {
      const { isDragging } = useDropZone({ onFileSelect: vi.fn() });
      expect(isDragging).toBe(false);
    });

    it("必要なハンドラーが全て返される", () => {
      const result = useDropZone({ onFileSelect: vi.fn() });
      expect(typeof result.handleDragOver).toBe("function");
      expect(typeof result.handleDragLeave).toBe("function");
      expect(typeof result.handleDrop).toBe("function");
    });
  });

  describe("handleDragOver", () => {
    it("preventDefault を呼び出す", () => {
      const { handleDragOver } = useDropZone({ onFileSelect: vi.fn() });
      const event = createMockDragEvent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleDragOver(event as any);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("isDragging を true に設定する", () => {
      const { handleDragOver } = useDropZone({ onFileSelect: vi.fn() });
      const event = createMockDragEvent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleDragOver(event as any);
      expect(isDraggingState).toBe(true);
    });
  });

  describe("handleDragLeave", () => {
    it("preventDefault を呼び出す", () => {
      const { handleDragLeave } = useDropZone({ onFileSelect: vi.fn() });
      const event = createMockDragEvent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleDragLeave(event as any);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("isDragging を false に設定する", () => {
      const { handleDragLeave } = useDropZone({ onFileSelect: vi.fn() });
      // ドラッグ中にしてから離れる
      isDraggingState = true;
      const event = createMockDragEvent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleDragLeave(event as any);
      expect(isDraggingState).toBe(false);
    });
  });

  describe("handleDrop", () => {
    it("preventDefault を呼び出す", () => {
      const onFileSelect = vi.fn();
      const { handleDrop } = useDropZone({ onFileSelect });
      const file = new File([""], "test.png", { type: "image/png" });
      const event = createMockDragEvent([file]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleDrop(event as any);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("isDragging を false に設定する", () => {
      const onFileSelect = vi.fn();
      const { handleDrop } = useDropZone({ onFileSelect });
      isDraggingState = true;
      const file = new File([""], "test.png", { type: "image/png" });
      const event = createMockDragEvent([file]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleDrop(event as any);
      expect(isDraggingState).toBe(false);
    });

    it("ファイルがない場合は onFileSelect を呼ばない", () => {
      const onFileSelect = vi.fn();
      const { handleDrop } = useDropZone({ onFileSelect });
      const event = createMockDragEvent([]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleDrop(event as any);
      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it("ファイルがある場合は onFileSelect を呼ぶ", () => {
      const onFileSelect = vi.fn();
      const { handleDrop } = useDropZone({ onFileSelect });
      const file = new File([""], "test.png", { type: "image/png" });
      const event = createMockDragEvent([file]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleDrop(event as any);
      expect(onFileSelect).toHaveBeenCalledWith([file]);
    });

    describe("multiple オプション", () => {
      it("multiple=false の場合は最初のファイルのみ渡す", () => {
        const onFileSelect = vi.fn();
        const { handleDrop } = useDropZone({ onFileSelect, multiple: false });
        const file1 = new File([""], "a.png", { type: "image/png" });
        const file2 = new File([""], "b.png", { type: "image/png" });
        const event = createMockDragEvent([file1, file2]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleDrop(event as any);
        expect(onFileSelect).toHaveBeenCalledWith([file1]);
      });

      it("multiple=true の場合は全ファイルを渡す", () => {
        const onFileSelect = vi.fn();
        const { handleDrop } = useDropZone({ onFileSelect, multiple: true });
        const file1 = new File([""], "a.png", { type: "image/png" });
        const file2 = new File([""], "b.png", { type: "image/png" });
        const event = createMockDragEvent([file1, file2]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleDrop(event as any);
        expect(onFileSelect).toHaveBeenCalledWith([file1, file2]);
      });
    });

    describe("acceptType フィルタリング", () => {
      it("acceptType に一致するファイルのみ onFileSelect に渡す", () => {
        const onFileSelect = vi.fn();
        const { handleDrop } = useDropZone({ onFileSelect, acceptType: "image/", multiple: true });
        const img = new File([""], "test.png", { type: "image/png" });
        const pdf = new File([""], "test.pdf", { type: "application/pdf" });
        const event = createMockDragEvent([img, pdf]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleDrop(event as any);
        expect(onFileSelect).toHaveBeenCalledWith([img]);
      });

      it("全ファイルが不正な場合は onFileSelect を呼ばない", () => {
        const onFileSelect = vi.fn();
        const { handleDrop } = useDropZone({ onFileSelect, acceptType: "image/" });
        const pdf = new File([""], "test.pdf", { type: "application/pdf" });
        const event = createMockDragEvent([pdf]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleDrop(event as any);
        expect(onFileSelect).not.toHaveBeenCalled();
      });

      it("不正なファイルがある場合は onTypeError を呼ぶ", () => {
        const onFileSelect = vi.fn();
        const onTypeError = vi.fn();
        const { handleDrop } = useDropZone({
          onFileSelect,
          acceptType: "image/",
          onTypeError,
          multiple: true,
        });
        const img = new File([""], "test.png", { type: "image/png" });
        const pdf = new File([""], "test.pdf", { type: "application/pdf" });
        const event = createMockDragEvent([img, pdf]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleDrop(event as any);
        expect(onTypeError).toHaveBeenCalled();
      });

      it("全ファイルが不正な場合も onTypeError を呼ぶ", () => {
        const onFileSelect = vi.fn();
        const onTypeError = vi.fn();
        const { handleDrop } = useDropZone({ onFileSelect, acceptType: "image/", onTypeError });
        const pdf = new File([""], "test.pdf", { type: "application/pdf" });
        const event = createMockDragEvent([pdf]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleDrop(event as any);
        expect(onTypeError).toHaveBeenCalled();
        expect(onFileSelect).not.toHaveBeenCalled();
      });

      it("acceptType 未指定なら全ファイルタイプを受け付ける", () => {
        const onFileSelect = vi.fn();
        const { handleDrop } = useDropZone({ onFileSelect, multiple: true });
        const pdf = new File([""], "test.pdf", { type: "application/pdf" });
        const txt = new File([""], "note.txt", { type: "text/plain" });
        const event = createMockDragEvent([pdf, txt]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleDrop(event as any);
        expect(onFileSelect).toHaveBeenCalledWith([pdf, txt]);
      });

      it("acceptType 一致 + multiple=false では最初の有効ファイルのみ渡す", () => {
        const onFileSelect = vi.fn();
        const { handleDrop } = useDropZone({ onFileSelect, acceptType: "image/", multiple: false });
        const img1 = new File([""], "a.png", { type: "image/png" });
        const img2 = new File([""], "b.jpg", { type: "image/jpeg" });
        const event = createMockDragEvent([img1, img2]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleDrop(event as any);
        expect(onFileSelect).toHaveBeenCalledWith([img1]);
      });
    });
  });
});
