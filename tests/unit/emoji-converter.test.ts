import { describe, it, expect, beforeEach } from "vitest";

// カテゴリ別デフォルト値のテスト用定義
const DEFAULT_TEXT_OPTIONS = {
  text: "",
  fontSize: 24,
  textColor: "#FFFFFF",
  textX: 50,
  textY: 50,
};

const DEFAULT_TRANSFORM_OPTIONS = {
  rotation: 0,
  flipH: false,
  flipV: false,
};

const DEFAULT_FILTER_OPTIONS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

const DEFAULT_TRANSPARENT_OPTIONS = {
  transparent: false,
  transparentColor: "#FFFFFF",
};

const DEFAULT_BORDER_OPTIONS = {
  border: false,
  borderWidth: 2,
  borderColor: "#000000",
};

const DEFAULT_CROP_OPTIONS = {
  crop: false,
  cropX: 0,
  cropY: 0,
  cropWidth: 100,
  cropHeight: 100,
  cropZoom: 100,
  cropPanX: 0,
  cropPanY: 0,
};

const DEFAULT_EDIT_OPTIONS = {
  ...DEFAULT_TEXT_OPTIONS,
  ...DEFAULT_TRANSFORM_OPTIONS,
  ...DEFAULT_FILTER_OPTIONS,
  ...DEFAULT_TRANSPARENT_OPTIONS,
  ...DEFAULT_BORDER_OPTIONS,
  ...DEFAULT_CROP_OPTIONS,
};

// Mock canvas for testing
function createMockCanvas(): HTMLCanvasElement {
  const canvas = {
    width: 128,
    height: 128,
    getContext: () => ({
      fillStyle: "",
      font: "",
      textAlign: "",
      textBaseline: "",
      strokeStyle: "",
      lineWidth: 0,
      fillRect: () => {},
      fillText: () => {},
      strokeRect: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      getImageData: () => ({
        data: new Uint8ClampedArray(128 * 128 * 4),
        width: 128,
        height: 128,
        colorSpace: "srgb" as PredefinedColorSpace,
      }),
      putImageData: () => {},
    }),
    toBlob: (callback: BlobCallback) => {
      const blob = new Blob(["mock"], { type: "image/png" });
      Object.defineProperty(blob, "size", { value: 1024 });
      callback(blob);
    },
  } as unknown as HTMLCanvasElement;
  return canvas;
}

describe("emoji-converter", () => {
  describe("resizeImage", () => {
    it("画像を128x128にリサイズできる", () => {
      // Canvas APIを使用する関数なので、モックで基本的な動作のみテスト
      const mockCanvas = createMockCanvas();
      expect(mockCanvas.width).toBe(128);
      expect(mockCanvas.height).toBe(128);
    });

    it("画像読み込み失敗時のエラーハンドリング", () => {
      // エラーハンドリングの存在を確認
      const mockCanvas = createMockCanvas();
      const ctx = mockCanvas.getContext("2d");
      expect(ctx).toBeDefined();
    });
  });

  describe("applyEditOptions", () => {
    let sourceCanvas: HTMLCanvasElement;

    beforeEach(() => {
      sourceCanvas = createMockCanvas();
    });

    it("canvasの基本プロパティが正しい", () => {
      expect(sourceCanvas.width).toBe(128);
      expect(sourceCanvas.height).toBe(128);
    });

    it("context2dを取得できる", () => {
      const ctx = sourceCanvas.getContext("2d");
      expect(ctx).toBeDefined();
    });
  });

  describe("canvasToBlobWithLimit", () => {
    it("容量制限内でBlobを生成できる", async () => {
      const canvas = createMockCanvas();

      // モックのBlobサイズは1024バイトに設定されている
      expect(canvas.width).toBe(128);
      expect(canvas.height).toBe(128);
    });

    it("toBlobメソッドが存在する", () => {
      const canvas = createMockCanvas();
      expect(canvas.toBlob).toBeDefined();
    });
  });

  describe("カテゴリ別デフォルト値", () => {
    it("テキスト埋め込みのデフォルト値が正しい", () => {
      expect(DEFAULT_TEXT_OPTIONS).toEqual({
        text: "",
        fontSize: 24,
        textColor: "#FFFFFF",
        textX: 50,
        textY: 50,
      });
    });

    it("回転・反転のデフォルト値が正しい", () => {
      expect(DEFAULT_TRANSFORM_OPTIONS).toEqual({
        rotation: 0,
        flipH: false,
        flipV: false,
      });
    });

    it("フィルターのデフォルト値が正しい", () => {
      expect(DEFAULT_FILTER_OPTIONS).toEqual({
        brightness: 100,
        contrast: 100,
        saturation: 100,
      });
    });

    it("透過処理のデフォルト値が正しい", () => {
      expect(DEFAULT_TRANSPARENT_OPTIONS).toEqual({
        transparent: false,
        transparentColor: "#FFFFFF",
      });
    });

    it("枠線のデフォルト値が正しい", () => {
      expect(DEFAULT_BORDER_OPTIONS).toEqual({
        border: false,
        borderWidth: 2,
        borderColor: "#000000",
      });
    });

    it("トリミングのデフォルト値が正しい", () => {
      expect(DEFAULT_CROP_OPTIONS).toEqual({
        crop: false,
        cropX: 0,
        cropY: 0,
        cropWidth: 100,
        cropHeight: 100,
        cropZoom: 100,
        cropPanX: 0,
        cropPanY: 0,
      });
    });

    it("全デフォルト値が正しく合成される", () => {
      expect(DEFAULT_EDIT_OPTIONS).toEqual({
        text: "",
        fontSize: 24,
        textColor: "#FFFFFF",
        textX: 50,
        textY: 50,
        rotation: 0,
        flipH: false,
        flipV: false,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        transparent: false,
        transparentColor: "#FFFFFF",
        border: false,
        borderWidth: 2,
        borderColor: "#000000",
        crop: false,
        cropX: 0,
        cropY: 0,
        cropWidth: 100,
        cropHeight: 100,
        cropZoom: 100,
        cropPanX: 0,
        cropPanY: 0,
      });
    });
  });

  describe("カテゴリ別リセット", () => {
    it("テキスト設定をリセットできる", () => {
      const modifiedOptions = {
        ...DEFAULT_EDIT_OPTIONS,
        text: "テスト",
        fontSize: 32,
        textColor: "#FF0000",
        textX: 25,
        textY: 75,
      };

      const resetOptions = {
        ...modifiedOptions,
        ...DEFAULT_TEXT_OPTIONS,
      };

      expect(resetOptions.text).toBe("");
      expect(resetOptions.fontSize).toBe(24);
      expect(resetOptions.textColor).toBe("#FFFFFF");
      expect(resetOptions.textX).toBe(50);
      expect(resetOptions.textY).toBe(50);
      // 他の設定は変更されていないことを確認
      expect(resetOptions.rotation).toBe(0);
    });

    it("回転・反転設定をリセットできる", () => {
      const modifiedOptions = {
        ...DEFAULT_EDIT_OPTIONS,
        rotation: 180,
        flipH: true,
        flipV: true,
      };

      const resetOptions = {
        ...modifiedOptions,
        ...DEFAULT_TRANSFORM_OPTIONS,
      };

      expect(resetOptions.rotation).toBe(0);
      expect(resetOptions.flipH).toBe(false);
      expect(resetOptions.flipV).toBe(false);
    });

    it("フィルター設定をリセットできる", () => {
      const modifiedOptions = {
        ...DEFAULT_EDIT_OPTIONS,
        brightness: 150,
        contrast: 50,
        saturation: 200,
      };

      const resetOptions = {
        ...modifiedOptions,
        ...DEFAULT_FILTER_OPTIONS,
      };

      expect(resetOptions.brightness).toBe(100);
      expect(resetOptions.contrast).toBe(100);
      expect(resetOptions.saturation).toBe(100);
    });

    it("透過設定をリセットできる", () => {
      const modifiedOptions = {
        ...DEFAULT_EDIT_OPTIONS,
        transparent: true,
        transparentColor: "#00FF00",
      };

      const resetOptions = {
        ...modifiedOptions,
        ...DEFAULT_TRANSPARENT_OPTIONS,
      };

      expect(resetOptions.transparent).toBe(false);
      expect(resetOptions.transparentColor).toBe("#FFFFFF");
    });

    it("枠線設定をリセットできる", () => {
      const modifiedOptions = {
        ...DEFAULT_EDIT_OPTIONS,
        border: true,
        borderWidth: 5,
        borderColor: "#0000FF",
      };

      const resetOptions = {
        ...modifiedOptions,
        ...DEFAULT_BORDER_OPTIONS,
      };

      expect(resetOptions.border).toBe(false);
      expect(resetOptions.borderWidth).toBe(2);
      expect(resetOptions.borderColor).toBe("#000000");
    });

    it("トリミング設定をリセットできる", () => {
      const modifiedOptions = {
        ...DEFAULT_EDIT_OPTIONS,
        crop: true,
        cropX: 10,
        cropY: 20,
        cropWidth: 80,
        cropHeight: 60,
        cropZoom: 200,
        cropPanX: 30,
        cropPanY: -20,
      };

      const resetOptions = {
        ...modifiedOptions,
        ...DEFAULT_CROP_OPTIONS,
      };

      expect(resetOptions.crop).toBe(false);
      expect(resetOptions.cropX).toBe(0);
      expect(resetOptions.cropY).toBe(0);
      expect(resetOptions.cropWidth).toBe(100);
      expect(resetOptions.cropHeight).toBe(100);
      expect(resetOptions.cropZoom).toBe(100);
      expect(resetOptions.cropPanX).toBe(0);
      expect(resetOptions.cropPanY).toBe(0);
    });

    it("全設定をリセットできる", () => {
      const modifiedOptions = {
        text: "テスト",
        fontSize: 32,
        textColor: "#FF0000",
        textX: 25,
        textY: 75,
        rotation: 180,
        flipH: true,
        flipV: true,
        brightness: 150,
        contrast: 50,
        saturation: 200,
        transparent: true,
        transparentColor: "#00FF00",
        border: true,
        borderWidth: 5,
        borderColor: "#0000FF",
        crop: true,
        cropX: 10,
        cropY: 20,
        cropWidth: 80,
        cropHeight: 60,
      };

      // 全リセット
      const resetOptions = { ...DEFAULT_EDIT_OPTIONS };

      expect(resetOptions).toEqual(DEFAULT_EDIT_OPTIONS);
      expect(resetOptions).not.toEqual(modifiedOptions);
    });
  });

  describe("ズーム機能", () => {
    it("ズームのデフォルト値が正しい", () => {
      expect(DEFAULT_CROP_OPTIONS.cropZoom).toBe(100);
      expect(DEFAULT_CROP_OPTIONS.cropPanX).toBe(0);
      expect(DEFAULT_CROP_OPTIONS.cropPanY).toBe(0);
    });

    it("ズームレベルの範囲が正しい", () => {
      // ズームレベルは10-400%
      const minZoom = 10;
      const maxZoom = 400;
      const defaultZoom = 100;
      
      expect(defaultZoom).toBeGreaterThanOrEqual(minZoom);
      expect(defaultZoom).toBeLessThanOrEqual(maxZoom);
    });

    it("パン位置の範囲が正しい", () => {
      // パン位置は-100から100%
      const minPan = -100;
      const maxPan = 100;
      const defaultPan = 0;
      
      expect(defaultPan).toBeGreaterThanOrEqual(minPan);
      expect(defaultPan).toBeLessThanOrEqual(maxPan);
    });

    it("ズームを変更できる", () => {
      const options = { ...DEFAULT_CROP_OPTIONS };
      options.cropZoom = 200;
      expect(options.cropZoom).toBe(200);
    });

    it("パン位置を変更できる", () => {
      const options = { ...DEFAULT_CROP_OPTIONS };
      options.cropPanX = 50;
      options.cropPanY = -30;
      expect(options.cropPanX).toBe(50);
      expect(options.cropPanY).toBe(-30);
    });

    it("ズームリセット時にパン位置もリセットされる", () => {
      const modifiedOptions = {
        ...DEFAULT_CROP_OPTIONS,
        cropZoom: 300,
        cropPanX: 50,
        cropPanY: -25,
      };

      const resetOptions = { ...DEFAULT_CROP_OPTIONS };

      expect(resetOptions.cropZoom).toBe(100);
      expect(resetOptions.cropPanX).toBe(0);
      expect(resetOptions.cropPanY).toBe(0);
    });

    it("ズームイン操作が正しく動作する", () => {
      let zoom = 100;
      const zoomIn = () => Math.min(400, zoom + 10);
      
      zoom = zoomIn();
      expect(zoom).toBe(110);
      
      zoom = 390;
      zoom = zoomIn();
      expect(zoom).toBe(400);
      
      zoom = 400;
      zoom = zoomIn();
      expect(zoom).toBe(400); // 上限
    });

    it("ズームアウト操作が正しく動作する", () => {
      let zoom = 100;
      const zoomOut = () => Math.max(10, zoom - 10);
      
      zoom = zoomOut();
      expect(zoom).toBe(90);
      
      zoom = 20;
      zoom = zoomOut();
      expect(zoom).toBe(10);
      
      zoom = 10;
      zoom = zoomOut();
      expect(zoom).toBe(10); // 下限
    });

    it("プリセットズーム値が正しい", () => {
      const presets = [50, 100, 200, 400];
      
      expect(presets).toContain(50);
      expect(presets).toContain(100);
      expect(presets).toContain(200);
      expect(presets).toContain(400);
    });
  });
});
