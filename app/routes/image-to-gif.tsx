import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export const Route = createFileRoute("/image-to-gif")({
  head: () => ({
    meta: [{ title: "画像→GIF変換ツール" }],
  }),
  component: ImageToGifConverter,
});

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

/**
 * FFmpegインスタンスをロードする
 * @param ffmpeg - FFmpegインスタンス
 * @param onProgress - 進捗コールバック
 * @returns ロード成功時にtrue
 */
export async function loadFFmpeg(
  ffmpeg: FFmpeg,
  onProgress?: (message: string) => void
): Promise<boolean> {
  if (ffmpeg.loaded) return true;

  try {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    onProgress?.("FFmpeg loaded successfully");
    return true;
  } catch (error) {
    console.error("Failed to load FFmpeg:", error);
    onProgress?.("Failed to load FFmpeg");
    return false;
  }
}

/**
 * 画像ファイルからGIFを生成する
 * @param ffmpeg - FFmpegインスタンス
 * @param images - 画像ファイルの配列
 * @param framerate - フレームレート（fps）
 * @param loop - ループ回数（0=無限ループ）
 * @param onProgress - 進捗コールバック
 * @returns 生成されたGIFのBlob
 */
export async function convertImagesToGif(
  ffmpeg: FFmpeg,
  images: File[],
  framerate: number,
  loop: number,
  onProgress?: (message: string) => void
): Promise<Blob | null> {
  try {
    // 画像をFFmpegファイルシステムに書き込み
    onProgress?.("画像を読み込んでいます...");
    for (let i = 0; i < images.length; i++) {
      const data = await fetchFile(images[i]);
      const ext = images[i].name.split(".").pop() || "png";
      await ffmpeg.writeFile(`input${i}.${ext}`, data);
    }

    // 1枚の場合と複数枚の場合で処理を分ける
    onProgress?.("GIFを生成しています...");
    if (images.length === 1) {
      // 1枚の場合は静止画GIFを作成
      const ext = images[0].name.split(".").pop() || "png";
      await ffmpeg.exec([
        "-i",
        `input0.${ext}`,
        "-loop",
        loop.toString(),
        "output.gif",
      ]);
    } else {
      // 複数枚の場合はアニメーションGIFを作成
      // concat用のリストファイルを作成
      const fileList = images
        .map((_, i) => {
          const ext = images[i].name.split(".").pop() || "png";
          const duration = 1 / framerate;
          return `file 'input${i}.${ext}'\nduration ${duration}`;
        })
        .join("\n");

      await ffmpeg.writeFile("filelist.txt", new TextEncoder().encode(fileList));

      await ffmpeg.exec([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "filelist.txt",
        "-vf",
        `fps=${framerate}`,
        "-loop",
        loop.toString(),
        "output.gif",
      ]);
    }

    // 生成されたGIFを読み込み
    onProgress?.("GIFを読み込んでいます...");
    const data = await ffmpeg.readFile("output.gif");

    // クリーンアップ
    for (let i = 0; i < images.length; i++) {
      const ext = images[i].name.split(".").pop() || "png";
      await ffmpeg.deleteFile(`input${i}.${ext}`);
    }
    if (images.length > 1) {
      await ffmpeg.deleteFile("filelist.txt");
    }
    await ffmpeg.deleteFile("output.gif");

    onProgress?.("GIFの生成が完了しました");
    return new Blob([data], { type: "image/gif" });
  } catch (error) {
    console.error("Failed to convert images to GIF:", error);
    onProgress?.("GIFの生成に失敗しました");
    return null;
  }
}

function ImageToGifConverter() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [framerate, setFramerate] = useState(10);
  const [loop, setLoop] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const statusRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  // FFmpegのログをプログレスに表示
  useEffect(() => {
    const ffmpeg = ffmpegRef.current;
    const logHandler = ({ message }: { message: string }) => {
      setProgress(message);
    };
    ffmpeg.on("log", logHandler);

    return () => {
      ffmpeg.off("log", logHandler);
    };
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, [images, outputUrl]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const validFiles = files.filter((file) =>
        file.type.startsWith("image/")
      );

      if (validFiles.length === 0) {
        announceStatus("有効な画像ファイルを選択してください");
        return;
      }

      // 既存のプレビューURLをクリーンアップ
      images.forEach((img) => URL.revokeObjectURL(img.preview));

      const newImages: ImageFile[] = validFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages(newImages);
      announceStatus(`${validFiles.length}枚の画像を読み込みました`);
    },
    [images, announceStatus]
  );

  const handleRemoveImage = useCallback(
    (id: string) => {
      const img = images.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.preview);
      }
      setImages((prev) => prev.filter((i) => i.id !== id));
      announceStatus("画像を削除しました");
    },
    [images, announceStatus]
  );

  const handleConvert = useCallback(async () => {
    if (images.length === 0) {
      announceStatus("画像を選択してください");
      return;
    }

    setIsLoading(true);
    setProgress("FFmpegを読み込んでいます...");

    const ffmpeg = ffmpegRef.current;
    const loaded = await loadFFmpeg(ffmpeg, setProgress);

    if (!loaded) {
      setIsLoading(false);
      announceStatus("FFmpegの読み込みに失敗しました");
      return;
    }

    const blob = await convertImagesToGif(
      ffmpeg,
      images.map((img) => img.file),
      framerate,
      loop,
      setProgress
    );

    if (blob) {
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      announceStatus("GIFを生成しました");
    } else {
      announceStatus("GIFの生成に失敗しました");
    }

    setIsLoading(false);
  }, [images, framerate, loop, outputUrl, announceStatus]);

  const handleDownload = useCallback(() => {
    if (!outputUrl) return;

    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `animated-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    announceStatus("GIFをダウンロードしました");
  }, [outputUrl, announceStatus]);

  const handleClear = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
    }
    setImages([]);
    setOutputUrl(null);
    setProgress("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    announceStatus("すべてクリアしました");
  }, [images, outputUrl, announceStatus]);

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">画像選択</h2>

          <div className="file-input-wrapper">
            <input
              ref={fileInputRef}
              type="file"
              id="imageFiles"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isLoading}
              aria-describedby="file-help"
            />
            <label htmlFor="imageFiles" className="file-input-label">
              画像を選択（複数可）
            </label>
            <span id="file-help" className="file-help">
              PNG, JPEG, WebPなどの画像ファイルに対応（1枚からでもOK）
            </span>
          </div>

          {images.length > 0 && (
            <div className="image-preview-list" role="list" aria-label="選択された画像">
              {images.map((img, index) => (
                <div key={img.id} className="image-preview-item" role="listitem">
                  <img
                    src={img.preview}
                    alt={`プレビュー ${index + 1}`}
                    loading="lazy"
                  />
                  <div className="image-preview-info">
                    <span className="image-name">{img.file.name}</span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleRemoveImage(img.id)}
                      disabled={isLoading}
                      aria-label={`${img.file.name}を削除`}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="converter-section">
          <h2 className="section-title">GIF設定</h2>

          <div className="gif-options">
            <div className="option-group">
              <label htmlFor="framerate">フレームレート: {framerate} fps</label>
              <input
                type="range"
                id="framerate"
                min="1"
                max="30"
                value={framerate}
                onChange={(e) => setFramerate(parseInt(e.target.value))}
                disabled={isLoading || images.length <= 1}
                aria-describedby="framerate-help"
              />
              <span id="framerate-help" className="option-help">
                1秒あたりのフレーム数（1枚のみの場合は無効）
              </span>
            </div>

            <div className="option-group">
              <label htmlFor="loop">ループ設定</label>
              <select
                id="loop"
                value={loop}
                onChange={(e) => setLoop(parseInt(e.target.value))}
                disabled={isLoading}
                aria-describedby="loop-help"
              >
                <option value={0}>無限ループ</option>
                <option value={1}>1回のみ</option>
                <option value={2}>2回</option>
                <option value={3}>3回</option>
                <option value={5}>5回</option>
              </select>
              <span id="loop-help" className="option-help">
                GIFのループ回数を設定
              </span>
            </div>
          </div>

          <div className="button-group" role="group" aria-label="操作">
            <button
              type="button"
              className="btn-primary"
              onClick={handleConvert}
              disabled={isLoading || images.length === 0}
            >
              {isLoading ? "変換中..." : "GIFに変換"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClear}
              disabled={isLoading}
            >
              クリア
            </button>
          </div>

          {progress && (
            <div className="progress-message" role="status" aria-live="polite">
              {progress}
            </div>
          )}
        </div>

        {outputUrl && (
          <div className="converter-section">
            <h2 className="section-title">変換結果</h2>

            <div className="output-preview">
              <img src={outputUrl} alt="生成されたGIF" />
            </div>

            <div className="button-group" role="group" aria-label="ダウンロード">
              <button
                type="button"
                className="btn-primary"
                onClick={handleDownload}
              >
                ダウンロード
              </button>
            </div>
          </div>
        )}

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">画像→GIF変換とは</h3>
          <ul>
            <li>PNG、JPEG、WebPなどの画像をアニメーションGIFに変換します</li>
            <li>1枚の画像からでもGIF形式で保存可能</li>
            <li>複数枚の画像を選択するとアニメーションGIFになります</li>
          </ul>
          <h3 id="settings-title">設定について</h3>
          <ul>
            <li>
              <strong>フレームレート:</strong> 1秒間に表示するフレーム数（複数枚の場合のみ有効）
            </li>
            <li>
              <strong>ループ設定:</strong> アニメーションの繰り返し回数
            </li>
          </ul>
          <h3 id="how-to-title">使い方</h3>
          <ul>
            <li>「画像を選択」から1枚以上の画像ファイルを選択</li>
            <li>フレームレートとループ設定を調整</li>
            <li>「GIFに変換」ボタンをクリック</li>
            <li>変換完了後、「ダウンロード」でGIFを保存</li>
          </ul>
          <h3 id="tips-title">Tips</h3>
          <ul>
            <li>1枚の画像でも静止画GIFとして保存できます</li>
            <li>複数枚選択時は選択した順序でアニメーション化されます</li>
            <li>フレームレートを低くするとゆっくり、高くすると速く動きます</li>
          </ul>
        </aside>
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <style>{`
        .file-input-wrapper {
          margin-bottom: 1.5rem;
        }

        .file-input-wrapper input[type="file"] {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        .file-input-label {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background-color: var(--md-sys-color-primary);
          color: var(--md-sys-color-on-primary);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .file-input-label:hover {
          background-color: var(--md-sys-color-primary-container);
          color: var(--md-sys-color-on-primary-container);
        }

        input[type="file"]:disabled + .file-input-label {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-help {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: var(--md-sys-color-on-surface-variant);
        }

        .image-preview-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .image-preview-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.5rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 8px;
        }

        .image-preview-item img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 4px;
        }

        .image-preview-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .image-name {
          font-size: 0.75rem;
          color: var(--md-sys-color-on-surface-variant);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-remove {
          padding: 0.25rem 0.5rem;
          background-color: var(--md-sys-color-error);
          color: var(--md-sys-color-on-error);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: background-color 0.2s;
        }

        .btn-remove:hover {
          background-color: var(--md-sys-color-error-container);
          color: var(--md-sys-color-on-error-container);
        }

        .btn-remove:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .gif-options {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .option-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .option-group label {
          font-weight: 500;
          color: var(--md-sys-color-on-surface);
        }

        .option-group input[type="range"] {
          width: 100%;
          accent-color: var(--md-sys-color-primary);
        }

        .option-group select {
          padding: 0.5rem;
          border: 1px solid var(--md-sys-color-outline);
          border-radius: 8px;
          font-size: 1rem;
          background-color: var(--md-sys-color-surface);
          color: var(--md-sys-color-on-surface);
          max-width: 200px;
        }

        .option-help {
          font-size: 0.875rem;
          color: var(--md-sys-color-on-surface-variant);
        }

        .progress-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 8px;
          font-size: 0.875rem;
          color: var(--md-sys-color-on-surface-variant);
          font-family: 'Roboto Mono', monospace;
        }

        .output-preview {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .output-preview img {
          max-width: 100%;
          max-height: 400px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 480px) {
          .image-preview-list {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }

          .image-preview-item img {
            height: 100px;
          }
        }
      `}</style>
    </>
  );
}
