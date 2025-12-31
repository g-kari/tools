import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// @ffmpeg/utilのモック
vi.mock("@ffmpeg/util", () => ({
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  toBlobURL: vi.fn().mockResolvedValue("blob:mock-url"),
}));

import { loadFFmpeg, convertImagesToGif } from "../../app/routes/image-to-gif";

// FFmpegのモック型定義
interface MockFFmpeg {
  loaded: boolean;
  load: (config: unknown) => Promise<void>;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
  exec: (args: string[]) => Promise<void>;
  readFile: (path: string) => Promise<Uint8Array>;
  deleteFile: (path: string) => Promise<void>;
  on: (event: string, callback: (data: { message: string }) => void) => void;
  off: (event: string, callback: () => void) => void;
}

describe("image-to-gif", () => {
  describe("loadFFmpeg", () => {
    let ffmpeg: MockFFmpeg;

    beforeEach(() => {
      ffmpeg = {
        loaded: false,
        load: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn(),
        exec: vi.fn(),
        readFile: vi.fn(),
        deleteFile: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };
    });

    it("既にロード済みの場合はtrueを返す", async () => {
      // FFmpegが既にロード済みとマーク
      ffmpeg.loaded = true;

      const result = await loadFFmpeg(ffmpeg as any);
      expect(result).toBe(true);
    });

    it("ロード成功時にtrueを返す", async () => {
      const mockLoad = vi.fn().mockResolvedValue(undefined);
      ffmpeg.load = mockLoad;

      const onProgress = vi.fn();
      const result = await loadFFmpeg(ffmpeg as any, onProgress);

      expect(result).toBe(true);
      expect(mockLoad).toHaveBeenCalledOnce();
      expect(onProgress).toHaveBeenCalledWith("FFmpeg loaded successfully");
    });

    it("ロード失敗時にfalseを返す", async () => {
      const mockLoad = vi.fn().mockRejectedValue(new Error("Load failed"));
      ffmpeg.load = mockLoad;

      const onProgress = vi.fn();
      const result = await loadFFmpeg(ffmpeg as any, onProgress);

      expect(result).toBe(false);
      expect(onProgress).toHaveBeenCalledWith("Failed to load FFmpeg");
    });

    it("progressコールバックなしでも動作する", async () => {
      const mockLoad = vi.fn().mockResolvedValue(undefined);
      ffmpeg.load = mockLoad;

      const result = await loadFFmpeg(ffmpeg as any);
      expect(result).toBe(true);
    });
  });

  describe("convertImagesToGif", () => {
    let ffmpeg: MockFFmpeg;
    let mockImages: File[];

    beforeEach(() => {
      ffmpeg = {
        loaded: false,
        load: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockResolvedValue(new Uint8Array([71, 73, 70])),
        deleteFile: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        off: vi.fn(),
      };

      // モック画像ファイルを作成
      const blob = new Blob(["fake image data"], { type: "image/png" });
      mockImages = [
        new File([blob], "image1.png", { type: "image/png" }),
        new File([blob], "image2.png", { type: "image/png" }),
      ];
    });

    it("1枚の画像から静止画GIFを生成する", async () => {
      const singleImage = [mockImages[0]];

      const onProgress = vi.fn();
      const result = await convertImagesToGif(ffmpeg as any, singleImage, 10, 0, 80, onProgress);

      expect(result).toBeInstanceOf(Blob);
      expect(ffmpeg.writeFile).toHaveBeenCalledWith("input0.png", expect.any(Uint8Array));
      expect(ffmpeg.exec).toHaveBeenCalledWith([
        "-i",
        "input0.png",
        "-vf",
        "split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=single[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5",
        "-loop",
        "0",
        "output.gif",
      ]);
      expect(ffmpeg.readFile).toHaveBeenCalledWith("output.gif");
      expect(ffmpeg.deleteFile).toHaveBeenCalledWith("input0.png");
      expect(ffmpeg.deleteFile).toHaveBeenCalledWith("output.gif");
      expect(onProgress).toHaveBeenCalledWith("GIFの生成が完了しました");
    });

    it("複数画像からアニメーションGIFを生成する", async () => {
      const onProgress = vi.fn();
      const result = await convertImagesToGif(ffmpeg as any, mockImages, 10, 0, 80, onProgress);

      expect(result).toBeInstanceOf(Blob);
      expect(ffmpeg.writeFile).toHaveBeenCalledWith("input0.png", expect.any(Uint8Array));
      expect(ffmpeg.writeFile).toHaveBeenCalledWith("input1.png", expect.any(Uint8Array));
      expect(ffmpeg.exec).toHaveBeenCalledWith(
        expect.arrayContaining([
          "-loop", "1", "-t", expect.any(String), "-i", "input0.png",
          "-loop", "1", "-t", expect.any(String), "-i", "input1.png",
          "-filter_complex",
          "concat=n=2:v=1:a=0,fps=10,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5",
          "-loop",
          "0",
          "output.gif",
        ])
      );
      expect(onProgress).toHaveBeenCalledWith("GIFの生成が完了しました");
    });

    it("異なるフレームレートとループ設定で動作する", async () => {
      const result = await convertImagesToGif(ffmpeg as any, mockImages, 5, 3, 50);

      expect(result).toBeInstanceOf(Blob);
      expect(ffmpeg.exec).toHaveBeenCalledWith(
        expect.arrayContaining([
          "-loop", "1", "-t", expect.any(String), "-i", "input0.png",
          "-loop", "1", "-t", expect.any(String), "-i", "input1.png",
          "-filter_complex",
          "concat=n=2:v=1:a=0,fps=5,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5",
          "-loop",
          "3",
          "output.gif",
        ])
      );
    });

    it("JPEG画像でも動作する", async () => {
      const blob = new Blob(["fake jpeg data"], { type: "image/jpeg" });
      const jpegImages = [new File([blob], "photo.jpg", { type: "image/jpeg" })];

      const result = await convertImagesToGif(ffmpeg as any, jpegImages, 10, 0, 80);

      expect(result).toBeInstanceOf(Blob);
      expect(ffmpeg.writeFile).toHaveBeenCalledWith("input0.jpg", expect.any(Uint8Array));
      expect(ffmpeg.exec).toHaveBeenCalledWith([
        "-i",
        "input0.jpg",
        "-vf",
        "split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=single[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5",
        "-loop",
        "0",
        "output.gif",
      ]);
      expect(ffmpeg.deleteFile).toHaveBeenCalledWith("input0.jpg");
    });

    it("変換失敗時にnullを返す", async () => {
      ffmpeg.writeFile = vi.fn().mockRejectedValue(new Error("Write failed"));

      const onProgress = vi.fn();
      const result = await convertImagesToGif(ffmpeg as any, mockImages, 10, 0, 80, onProgress);

      expect(result).toBeNull();
      expect(onProgress).toHaveBeenCalledWith("GIFの生成に失敗しました");
    });

    it("progressコールバックなしでも動作する", async () => {
      const result = await convertImagesToGif(ffmpeg as any, mockImages, 10, 0, 80);
      expect(result).toBeInstanceOf(Blob);
    });

    it("正しいMIMEタイプでBlobを生成する", async () => {
      const result = await convertImagesToGif(ffmpeg as any, mockImages, 10, 0, 80);

      expect(result).toBeInstanceOf(Blob);
      expect(result?.type).toBe("image/gif");
    });
  });
});
