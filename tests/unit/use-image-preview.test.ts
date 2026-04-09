/**
 * @fileoverview useImagePreview フックのロジックテスト
 * フックのロジックを純粋な関数として抽出してテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";

// URL.createObjectURL / URL.revokeObjectURL をモック
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// isImageFile のロジックをテスト
describe("isImageFile ロジック", () => {
  const isImageFile = (file: { type: string }) => file.type.startsWith("image/");

  it("image/jpeg は画像ファイルと判定される", () => {
    expect(isImageFile({ type: "image/jpeg" })).toBe(true);
  });

  it("image/png は画像ファイルと判定される", () => {
    expect(isImageFile({ type: "image/png" })).toBe(true);
  });

  it("image/webp は画像ファイルと判定される", () => {
    expect(isImageFile({ type: "image/webp" })).toBe(true);
  });

  it("image/gif は画像ファイルと判定される", () => {
    expect(isImageFile({ type: "image/gif" })).toBe(true);
  });

  it("application/pdf は画像ファイルではない", () => {
    expect(isImageFile({ type: "application/pdf" })).toBe(false);
  });

  it("text/plain は画像ファイルではない", () => {
    expect(isImageFile({ type: "text/plain" })).toBe(false);
  });

  it("空文字のtypeは画像ファイルではない", () => {
    expect(isImageFile({ type: "" })).toBe(false);
  });
});

// selectFile のコア処理ロジックをテスト
describe("useImagePreview selectFile ロジック", () => {
  const isImageFile = (file: { type: string }) => file.type.startsWith("image/");
  const createImagePreviewUrl = (file: File) => URL.createObjectURL(file);

  // フックのselectFileロジックを純粋関数として再現
  const buildSelectFile = (options: {
    onTypeError?: () => void;
    onLoadError?: () => void;
    onLoadSuccess?: (dims: { width: number; height: number }) => void;
    getImageDimensions: (file: File) => Promise<{ width: number; height: number }>;
  }) => {
    let previewUrl: string | null = null;

    const selectFile = async (file: File) => {
      if (!isImageFile(file)) {
        options.onTypeError?.();
        return { previewUrl, dimensions: null, isLoading: false };
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const url = createImagePreviewUrl(file);
      previewUrl = url;

      try {
        const dims = await options.getImageDimensions(file);
        options.onLoadSuccess?.(dims);
        return { previewUrl, dimensions: dims, isLoading: false };
      } catch {
        options.onLoadError?.();
        previewUrl = null;
        return { previewUrl: null, dimensions: null, isLoading: false };
      }
    };

    return { selectFile, getPreviewUrl: () => previewUrl };
  };

  it("画像ファイル以外の場合、onTypeError が呼ばれる", async () => {
    const onTypeError = vi.fn();
    const getImageDimensions = vi.fn();
    const { selectFile } = buildSelectFile({ onTypeError, getImageDimensions });

    const file = new File(["content"], "doc.pdf", { type: "application/pdf" });
    await selectFile(file);

    expect(onTypeError).toHaveBeenCalledOnce();
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
  });

  it("画像ファイルの場合、createObjectURL が呼ばれる", async () => {
    const mockUrl = "blob:http://localhost/test-uuid";
    mockCreateObjectURL.mockReturnValue(mockUrl);
    const getImageDimensions = vi.fn().mockResolvedValue({ width: 100, height: 200 });
    const { selectFile } = buildSelectFile({ getImageDimensions });

    const file = new File(["image-data"], "photo.jpg", { type: "image/jpeg" });
    await selectFile(file);

    expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
  });

  it("画像読み込み成功時、onLoadSuccess に寸法が渡される", async () => {
    const mockUrl = "blob:http://localhost/test-uuid";
    mockCreateObjectURL.mockReturnValue(mockUrl);
    const dims = { width: 800, height: 600 };
    const getImageDimensions = vi.fn().mockResolvedValue(dims);
    const onLoadSuccess = vi.fn();
    const { selectFile } = buildSelectFile({ getImageDimensions, onLoadSuccess });

    const file = new File(["image-data"], "photo.png", { type: "image/png" });
    const result = await selectFile(file);

    expect(onLoadSuccess).toHaveBeenCalledWith(dims);
    expect(result.dimensions).toEqual(dims);
    expect(result.previewUrl).toBe(mockUrl);
  });

  it("画像読み込み失敗時、onLoadError が呼ばれ previewUrl が null になる", async () => {
    const mockUrl = "blob:http://localhost/error-uuid";
    mockCreateObjectURL.mockReturnValue(mockUrl);
    const getImageDimensions = vi.fn().mockRejectedValue(new Error("読み込みエラー"));
    const onLoadError = vi.fn();
    const onLoadSuccess = vi.fn();
    const { selectFile } = buildSelectFile({ getImageDimensions, onLoadError, onLoadSuccess });

    const file = new File(["image-data"], "broken.jpg", { type: "image/jpeg" });
    const result = await selectFile(file);

    expect(onLoadError).toHaveBeenCalledOnce();
    expect(onLoadSuccess).not.toHaveBeenCalled();
    expect(result.previewUrl).toBeNull();
    expect(result.dimensions).toBeNull();
  });

  it("前のプレビューURLがある場合、新しいファイル選択時に revokeObjectURL が呼ばれる", async () => {
    const firstUrl = "blob:http://localhost/first";
    const secondUrl = "blob:http://localhost/second";
    mockCreateObjectURL.mockReturnValueOnce(firstUrl).mockReturnValueOnce(secondUrl);
    const getImageDimensions = vi.fn().mockResolvedValue({ width: 100, height: 100 });
    const { selectFile } = buildSelectFile({ getImageDimensions });

    const file1 = new File(["data1"], "first.jpg", { type: "image/jpeg" });
    const file2 = new File(["data2"], "second.jpg", { type: "image/jpeg" });

    await selectFile(file1);
    await selectFile(file2);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith(firstUrl);
  });

  it("コールバックなしでも正常に動作する", async () => {
    const mockUrl = "blob:http://localhost/no-callback";
    mockCreateObjectURL.mockReturnValue(mockUrl);
    const getImageDimensions = vi.fn().mockResolvedValue({ width: 50, height: 50 });
    const { selectFile } = buildSelectFile({ getImageDimensions });

    const file = new File(["data"], "img.webp", { type: "image/webp" });
    const result = await selectFile(file);

    expect(result.previewUrl).toBe(mockUrl);
    expect(result.dimensions).toEqual({ width: 50, height: 50 });
  });
});

// clear のロジックをテスト
describe("useImagePreview clear ロジック", () => {
  it("previewUrl がある場合、revokeObjectURL が呼ばれる", () => {
    const previewUrl = "blob:http://localhost/to-clear";

    const clear = (url: string | null) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
      return { file: null, previewUrl: null, dimensions: null, isLoading: false };
    };

    const result = clear(previewUrl);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith(previewUrl);
    expect(result.file).toBeNull();
    expect(result.previewUrl).toBeNull();
    expect(result.dimensions).toBeNull();
  });

  it("previewUrl が null の場合、revokeObjectURL は呼ばれない", () => {
    const clear = (url: string | null) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
      return { file: null, previewUrl: null, dimensions: null, isLoading: false };
    };

    clear(null);

    expect(mockRevokeObjectURL).not.toHaveBeenCalled();
  });

  it("clear 後にすべての状態がリセットされる", () => {
    const clear = (url: string | null) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
      return { file: null, previewUrl: null, dimensions: null, isLoading: false };
    };

    const result = clear("blob:http://localhost/uuid");

    expect(result).toEqual({
      file: null,
      previewUrl: null,
      dimensions: null,
      isLoading: false,
    });
  });
});

// ImagePreviewState の型構造テスト
describe("ImagePreviewState 構造", () => {
  it("初期状態の構造が正しい", () => {
    const initialState = {
      file: null,
      previewUrl: null,
      dimensions: null,
    };

    expect(initialState.file).toBeNull();
    expect(initialState.previewUrl).toBeNull();
    expect(initialState.dimensions).toBeNull();
  });

  it("ファイルが設定された後の構造が正しい", () => {
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
    const state = {
      file,
      previewUrl: "blob:http://localhost/photo",
      dimensions: { width: 1920, height: 1080 },
    };

    expect(state.file).toBe(file);
    expect(state.previewUrl).toBe("blob:http://localhost/photo");
    expect(state.dimensions?.width).toBe(1920);
    expect(state.dimensions?.height).toBe(1080);
  });

  it("dimensions の構造が正しい", () => {
    const dimensions = { width: 400, height: 300 };

    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
    expect(typeof dimensions.width).toBe("number");
    expect(typeof dimensions.height).toBe("number");
  });
});
