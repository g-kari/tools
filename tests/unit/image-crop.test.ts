import { describe, it, expect } from "vitest";

/**
 * ファイルサイズを人間が読みやすい形式にフォーマットする
 * @param bytes - バイト数
 * @returns フォーマットされた文字列（例: "1.5 MB"）
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * ダウンロード用のファイル名を生成する
 * @param originalName - 元のファイル名
 * @returns 新しいファイル名
 */
function generateFilename(originalName: string): string {
  const ext = originalName.match(/\.[^/.]+$/)?.[0] || ".png";
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}_cropped${ext}`;
}

/**
 * トリミング範囲の型定義
 */
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * リサイズハンドルの位置
 */
type ResizeHandle =
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w"
  | "move"
  | null;

/**
 * 指定位置にあるハンドルを取得
 */
function getHandleAtPosition(
  x: number,
  y: number,
  cropArea: CropArea
): ResizeHandle {
  const handleSize = 10;
  const { x: cx, y: cy, width, height } = cropArea;

  // 四隅のハンドル
  if (Math.abs(x - cx) < handleSize && Math.abs(y - cy) < handleSize)
    return "nw";
  if (
    Math.abs(x - (cx + width)) < handleSize &&
    Math.abs(y - cy) < handleSize
  )
    return "ne";
  if (
    Math.abs(x - cx) < handleSize &&
    Math.abs(y - (cy + height)) < handleSize
  )
    return "sw";
  if (
    Math.abs(x - (cx + width)) < handleSize &&
    Math.abs(y - (cy + height)) < handleSize
  )
    return "se";

  // 辺のハンドル
  if (Math.abs(y - cy) < handleSize && x > cx && x < cx + width) return "n";
  if (Math.abs(y - (cy + height)) < handleSize && x > cx && x < cx + width)
    return "s";
  if (Math.abs(x - cx) < handleSize && y > cy && y < cy + height) return "w";
  if (Math.abs(x - (cx + width)) < handleSize && y > cy && y < cy + height)
    return "e";

  // 範囲内（移動）
  if (x > cx && x < cx + width && y > cy && y < cy + height) return "move";

  return null;
}

/**
 * トリミング範囲をリサイズ
 */
function resizeCropArea(
  initial: CropArea,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  aspectRatio: number | null,
  bounds: { width: number; height: number }
): CropArea {
  let newArea = { ...initial };

  switch (handle) {
    case "nw":
      newArea.x = Math.max(0, initial.x + dx);
      newArea.y = Math.max(0, initial.y + dy);
      newArea.width = initial.width - (newArea.x - initial.x);
      newArea.height = initial.height - (newArea.y - initial.y);
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
        newArea.y = initial.y + initial.height - newArea.height;
      }
      break;
    case "ne":
      newArea.y = Math.max(0, initial.y + dy);
      newArea.width = Math.min(bounds.width - initial.x, initial.width + dx);
      newArea.height = initial.height - (newArea.y - initial.y);
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
        newArea.y = initial.y + initial.height - newArea.height;
      }
      break;
    case "sw":
      newArea.x = Math.max(0, initial.x + dx);
      newArea.width = initial.width - (newArea.x - initial.x);
      newArea.height = Math.min(bounds.height - initial.y, initial.height + dy);
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
      }
      break;
    case "se":
      newArea.width = Math.min(bounds.width - initial.x, initial.width + dx);
      newArea.height = Math.min(bounds.height - initial.y, initial.height + dy);
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
      }
      break;
    case "n":
      newArea.y = Math.max(0, initial.y + dy);
      newArea.height = initial.height - (newArea.y - initial.y);
      if (aspectRatio !== null) {
        newArea.width = newArea.height * aspectRatio;
      }
      break;
    case "s":
      newArea.height = Math.min(bounds.height - initial.y, initial.height + dy);
      if (aspectRatio !== null) {
        newArea.width = newArea.height * aspectRatio;
      }
      break;
    case "w":
      newArea.x = Math.max(0, initial.x + dx);
      newArea.width = initial.width - (newArea.x - initial.x);
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
      }
      break;
    case "e":
      newArea.width = Math.min(bounds.width - initial.x, initial.width + dx);
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
      }
      break;
  }

  // 最小サイズ制限
  newArea.width = Math.max(10, newArea.width);
  newArea.height = Math.max(10, newArea.height);

  // 範囲内に収める
  if (newArea.x + newArea.width > bounds.width) {
    newArea.width = bounds.width - newArea.x;
    if (aspectRatio !== null) {
      newArea.height = newArea.width / aspectRatio;
    }
  }
  if (newArea.y + newArea.height > bounds.height) {
    newArea.height = bounds.height - newArea.y;
    if (aspectRatio !== null) {
      newArea.width = newArea.height * aspectRatio;
    }
  }

  return newArea;
}

describe("画像トリミングツール", () => {
  describe("formatFileSize", () => {
    it("0バイトを正しくフォーマットする", () => {
      expect(formatFileSize(0)).toBe("0 B");
    });

    it("バイト単位を正しくフォーマットする", () => {
      expect(formatFileSize(500)).toBe("500 B");
    });

    it("キロバイト単位を正しくフォーマットする", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });

    it("メガバイト単位を正しくフォーマットする", () => {
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(1572864)).toBe("1.5 MB");
    });

    it("ギガバイト単位を正しくフォーマットする", () => {
      expect(formatFileSize(1073741824)).toBe("1 GB");
    });
  });

  describe("generateFilename", () => {
    it("拡張子付きのファイル名を正しく生成する", () => {
      expect(generateFilename("image.jpg")).toBe("image_cropped.jpg");
      expect(generateFilename("photo.png")).toBe("photo_cropped.png");
    });

    it("拡張子なしのファイル名にデフォルト拡張子を付ける", () => {
      expect(generateFilename("image")).toBe("image_cropped.png");
    });

    it("複数のドットを含むファイル名を正しく処理する", () => {
      expect(generateFilename("my.photo.2024.jpg")).toBe(
        "my.photo.2024_cropped.jpg"
      );
    });
  });

  describe("getHandleAtPosition", () => {
    const cropArea: CropArea = { x: 100, y: 100, width: 200, height: 150 };

    it("北西（nw）ハンドルを検出する", () => {
      expect(getHandleAtPosition(100, 100, cropArea)).toBe("nw");
      expect(getHandleAtPosition(95, 95, cropArea)).toBe("nw");
    });

    it("北東（ne）ハンドルを検出する", () => {
      expect(getHandleAtPosition(300, 100, cropArea)).toBe("ne");
      expect(getHandleAtPosition(305, 95, cropArea)).toBe("ne");
    });

    it("南西（sw）ハンドルを検出する", () => {
      expect(getHandleAtPosition(100, 250, cropArea)).toBe("sw");
      expect(getHandleAtPosition(95, 255, cropArea)).toBe("sw");
    });

    it("南東（se）ハンドルを検出する", () => {
      expect(getHandleAtPosition(300, 250, cropArea)).toBe("se");
      expect(getHandleAtPosition(305, 255, cropArea)).toBe("se");
    });

    it("北（n）ハンドルを検出する", () => {
      expect(getHandleAtPosition(200, 100, cropArea)).toBe("n");
      expect(getHandleAtPosition(150, 95, cropArea)).toBe("n");
    });

    it("南（s）ハンドルを検出する", () => {
      expect(getHandleAtPosition(200, 250, cropArea)).toBe("s");
      expect(getHandleAtPosition(150, 255, cropArea)).toBe("s");
    });

    it("西（w）ハンドルを検出する", () => {
      expect(getHandleAtPosition(100, 175, cropArea)).toBe("w");
      expect(getHandleAtPosition(95, 150, cropArea)).toBe("w");
    });

    it("東（e）ハンドルを検出する", () => {
      expect(getHandleAtPosition(300, 175, cropArea)).toBe("e");
      expect(getHandleAtPosition(305, 150, cropArea)).toBe("e");
    });

    it("範囲内で移動を検出する", () => {
      expect(getHandleAtPosition(200, 175, cropArea)).toBe("move");
      expect(getHandleAtPosition(150, 150, cropArea)).toBe("move");
    });

    it("範囲外でnullを返す", () => {
      expect(getHandleAtPosition(50, 50, cropArea)).toBe(null);
      expect(getHandleAtPosition(400, 400, cropArea)).toBe(null);
    });
  });

  describe("resizeCropArea", () => {
    const bounds = { width: 1000, height: 800 };

    it("南東（se）ハンドルで自由にリサイズする", () => {
      const initial: CropArea = { x: 100, y: 100, width: 200, height: 150 };
      const result = resizeCropArea(initial, "se", 50, 30, null, bounds);

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(250);
      expect(result.height).toBe(180);
    });

    it("南東（se）ハンドルでアスペクト比を維持してリサイズする", () => {
      const initial: CropArea = { x: 100, y: 100, width: 200, height: 200 };
      const aspectRatio = 1; // 1:1
      const result = resizeCropArea(initial, "se", 50, 30, aspectRatio, bounds);

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(250);
      expect(result.height).toBe(250); // アスペクト比維持
    });

    it("移動（move）ハンドルで位置を変更する", () => {
      const initial: CropArea = { x: 100, y: 100, width: 200, height: 150 };
      const result = resizeCropArea(initial, "move", 50, 30, null, bounds);

      // moveハンドルはresizeCropArea関数では処理されないため、変更なし
      expect(result).toEqual(initial);
    });

    it("範囲外にリサイズしようとしても境界内に収める", () => {
      const initial: CropArea = { x: 900, y: 700, width: 50, height: 50 };
      const result = resizeCropArea(initial, "se", 200, 200, null, bounds);

      expect(result.x).toBe(900);
      expect(result.y).toBe(700);
      expect(result.width).toBe(100); // boundsに収まる
      expect(result.height).toBe(100); // boundsに収まる
    });

    it("最小サイズ制限を適用する", () => {
      const initial: CropArea = { x: 100, y: 100, width: 50, height: 50 };
      const result = resizeCropArea(initial, "se", -100, -100, null, bounds);

      expect(result.width).toBeGreaterThanOrEqual(10);
      expect(result.height).toBeGreaterThanOrEqual(10);
    });

    it("北西（nw）ハンドルでアスペクト比を維持してリサイズする", () => {
      const initial: CropArea = { x: 200, y: 200, width: 200, height: 200 };
      const aspectRatio = 1; // 1:1
      const result = resizeCropArea(
        initial,
        "nw",
        -50,
        -50,
        aspectRatio,
        bounds
      );

      expect(result.x).toBe(150);
      expect(result.width).toBe(250);
      // アスペクト比が維持される
      expect(result.width).toBeCloseTo(result.height, 0);
    });

    it("4:3のアスペクト比を正しく維持する", () => {
      const initial: CropArea = { x: 100, y: 100, width: 400, height: 300 };
      const aspectRatio = 4 / 3;
      const result = resizeCropArea(initial, "e", 100, 0, aspectRatio, bounds);

      expect(result.width).toBe(500);
      expect(result.height).toBeCloseTo(375, 0); // 500 / (4/3) = 375
    });

    it("16:9のアスペクト比を正しく維持する", () => {
      const initial: CropArea = { x: 100, y: 100, width: 640, height: 360 };
      const aspectRatio = 16 / 9;
      const result = resizeCropArea(initial, "s", 0, 90, aspectRatio, bounds);

      expect(result.height).toBe(450);
      expect(result.width).toBe(800); // 450 * (16/9) = 800
    });
  });

  describe("境界値テスト", () => {
    it("画像サイズを超える範囲を指定しても収まる", () => {
      const bounds = { width: 500, height: 400 };
      const initial: CropArea = { x: 450, y: 350, width: 100, height: 100 };
      const result = resizeCropArea(initial, "se", 100, 100, null, bounds);

      expect(result.x + result.width).toBeLessThanOrEqual(bounds.width);
      expect(result.y + result.height).toBeLessThanOrEqual(bounds.height);
    });

    it("負の座標を指定しても0に収まる", () => {
      const bounds = { width: 500, height: 400 };
      const initial: CropArea = { x: 10, y: 10, width: 100, height: 100 };
      const result = resizeCropArea(initial, "nw", -50, -50, null, bounds);

      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
    });
  });
});
