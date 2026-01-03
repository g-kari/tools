import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
 * @param quality - 画質（1-100、高いほど高画質）
 * @param onProgress - 進捗コールバック
 * @returns 生成されたGIFのBlob
 */
export async function convertImagesToGif(
  ffmpeg: FFmpeg,
  images: File[],
  framerate: number,
  loop: number,
  quality: number,
  onProgress?: (message: string) => void
): Promise<Blob | null> {
  try {
    // 画像をFFmpegファイルシステムに書き込み
    for (let i = 0; i < images.length; i++) {
      onProgress?.(`画像を読み込んでいます... (${i + 1}/${images.length})`);
      const data = await fetchFile(images[i]);
      const ext = images[i].name.split(".").pop() || "png";
      await ffmpeg.writeFile(`input${i}.${ext}`, data);
    }

    // GIF生成
    onProgress?.("GIFを生成しています...");

    // 画質パラメータの計算（1-100 を 100-1 に反転、値が小さいほど高画質）
    const gifQuality = Math.round(101 - quality);

    if (images.length === 1) {
      // 1枚の場合は静止画GIFを作成
      const ext = images[0].name.split(".").pop() || "png";
      await ffmpeg.exec([
        "-i",
        `input0.${ext}`,
        "-vf",
        `split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=single[p];[s1][p]paletteuse=dither=bayer:bayer_scale=${gifQuality > 5 ? 5 : gifQuality}`,
        "-loop",
        loop.toString(),
        "output.gif",
      ]);
    } else {
      // 複数枚の場合はアニメーションGIFを作成
      // 各画像を個別に読み込み、concatフィルターで結合
      await ffmpeg.exec([
        ...images.flatMap((_, i) => {
          const ext = images[i].name.split(".").pop() || "png";
          return ["-loop", "1", "-t", (1/framerate).toString(), "-i", `input${i}.${ext}`];
        }),
        "-filter_complex",
        `concat=n=${images.length}:v=1:a=0,fps=${framerate},split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=${gifQuality > 5 ? 5 : gifQuality}`,
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
    await ffmpeg.deleteFile("output.gif");

    onProgress?.("GIFの生成が完了しました");
    return new Blob([data], { type: "image/gif" });
  } catch (error) {
    console.error("Failed to convert images to GIF:", error);
    onProgress?.("GIFの生成に失敗しました");
    return null;
  }
}

/**
 * ローカルCLI環境で実行可能なFFmpegコマンドを生成する
 * @param images - 変換する画像ファイル
 * @param framerate - フレームレート
 * @param loop - ループ回数
 * @param quality - 品質（1-100）
 * @returns FFmpegコマンド文字列
 */
export function generateFFmpegCommand(
  images: File[],
  framerate: number,
  loop: number,
  quality: number
): string {
  // 品質パラメータの計算
  const gifQuality = Math.round(101 - quality);
  const bayerScale = gifQuality > 5 ? 5 : gifQuality;

  if (images.length === 0) {
    return "# 画像を選択してください";
  }

  if (images.length === 1) {
    // 単一画像の場合
    const ext = images[0].name.split(".").pop() || "png";
    return `# 単一画像からGIF生成（品質: ${quality}）
ffmpeg -i input.${ext} \\
  -vf "split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=single[p];[s1][p]paletteuse=dither=bayer:bayer_scale=${bayerScale}" \\
  -loop ${loop} \\
  output.gif`;
  } else {
    // 複数画像の場合
    const inputLines = images.map((img, i) => {
      const ext = img.name.split(".").pop() || "png";
      return `  -loop 1 -t ${(1/framerate).toFixed(4)} -i input${i}.${ext}`;
    }).join(" \\\n");

    return `# 複数画像からアニメーションGIF生成（フレームレート: ${framerate}fps、品質: ${quality}）
ffmpeg \\
${inputLines} \\
  -filter_complex "concat=n=${images.length}:v=1:a=0,fps=${framerate},split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=${bayerScale}" \\
  -loop ${loop} \\
  output.gif`;
  }
}

function ImageToGifConverter() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [framerate, setFramerate] = useState(10);
  const [loop, setLoop] = useState(0);
  const [quality, setQuality] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      quality,
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
  }, [images, framerate, loop, quality, outputUrl, announceStatus]);

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files || []);
      const validFiles = files.filter((file) =>
        file.type.startsWith("image/")
      );

      if (validFiles.length === 0) {
        announceStatus("有効な画像ファイルをドロップしてください");
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

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">画像選択</h2>

          <div
            className={`dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="画像ファイルをアップロード"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="dropzone-content">
              <svg
                className="upload-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="dropzone-text">
                クリックして画像を選択、またはドラッグ&ドロップ
              </p>
              <p className="dropzone-hint">PNG, JPEG, WebP など（複数選択可）</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            id="imageFiles"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isLoading}
            style={{ display: "none" }}
          />

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
              <label htmlFor="quality">品質: {quality}</label>
              <input
                type="range"
                id="quality"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                disabled={isLoading}
                aria-describedby="quality-help"
              />
              <span id="quality-help" className="option-help">
                GIFの品質（1: 低品質、100: 高品質）
              </span>
            </div>

            <div className="option-group">
              <label htmlFor="loop">ループ設定</label>
              <Select
                value={loop.toString()}
                onValueChange={(value) => setLoop(parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger id="loop" aria-describedby="loop-help">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">無限ループ</SelectItem>
                  <SelectItem value="1">1回のみ</SelectItem>
                  <SelectItem value="2">2回</SelectItem>
                  <SelectItem value="3">3回</SelectItem>
                  <SelectItem value="5">5回</SelectItem>
                </SelectContent>
              </Select>
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

        {images.length > 0 && (
          <div className="converter-section">
            <h2 className="section-title">FFmpegコマンド（CLI用）</h2>
            <p className="section-description">
              ローカル環境でFFmpegを使用する場合は、以下のコマンドで同様の変換が可能です
            </p>
            <pre className="command-output">
              <code>{generateFFmpegCommand(images.map(img => img.file), framerate, loop, quality)}</code>
            </pre>
            <div className="button-group" role="group" aria-label="コマンド操作">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(
                    generateFFmpegCommand(images.map(img => img.file), framerate, loop, quality)
                  );
                  announceStatus("コマンドをクリップボードにコピーしました");
                }}
              >
                コマンドをコピー
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
              <strong>品質:</strong> GIFの画質（値が大きいほど高品質だがファイルサイズも増加）
            </li>
            <li>
              <strong>ループ設定:</strong> アニメーションの繰り返し回数
            </li>
          </ul>
          <h3 id="how-to-title">使い方</h3>
          <ul>
            <li>「画像を選択」から1枚以上の画像ファイルを選択</li>
            <li>フレームレート、品質、ループ設定を調整</li>
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
