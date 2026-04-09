import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useRef, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/image-to-gif")({
  head: () => ({
    meta: [
      { title: "画像→GIF変換 | Web ツール集" },
      { name: "description", content: "複数の画像ファイルをアニメーションGIFに変換するツール。" },
      { property: "og:title", content: "画像→GIF変換 | Web ツール集" },
      {
        property: "og:description",
        content: "複数の画像ファイルをアニメーションGIFに変換するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/image-to-gif` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "画像→GIF変換 | Web ツール集" },
      {
        name: "twitter:description",
        content: "複数の画像ファイルをアニメーションGIFに変換するツール。",
      },
    ],
  }),
  component: ImageToGifConverter,
});

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

/** ディザリングモードの型定義 */
export type DitherMode = "bayer" | "floyd_steinberg" | "sierra2_4a" | "none";

/**
 * FFmpegインスタンスをロードする
 * @param ffmpeg - FFmpegインスタンス
 * @param onProgress - 進捗コールバック
 * @returns ロード成功時にtrue
 */
export async function loadFFmpeg(
  ffmpeg: FFmpeg,
  onProgress?: (message: string) => void,
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
 * ディザリングモードに応じたpaletteuse部分のフィルター文字列を生成する
 * @param ditherMode - ディザリングモード
 * @param quality - 画質（1-100、高いほど高画質）
 * @returns paletteuseフィルター文字列
 */
export function buildPaletteUseFilter(ditherMode: DitherMode, quality: number): string {
  if (ditherMode === "bayer") {
    // quality 1-100 → bayer_scale 5-0 (高品質=低スケール)
    const bayerScale = Math.round((1 - (quality - 1) / 99) * 5);
    return `paletteuse=dither=bayer:bayer_scale=${bayerScale}`;
  }
  if (ditherMode === "none") {
    return "paletteuse=dither=none";
  }
  return `paletteuse=dither=${ditherMode}`;
}

/**
 * 画像ファイルからGIFを生成する
 * @param ffmpeg - FFmpegインスタンス
 * @param images - 画像ファイルの配列
 * @param framerate - フレームレート（fps）
 * @param loop - ループ回数（0=無限ループ）
 * @param quality - 画質（1-100、高いほど高画質）
 * @param ditherMode - ディザリングモード
 * @param maxColors - 最大色数（最大256）
 * @param onProgress - 進捗コールバック
 * @returns 生成されたGIFのBlob
 */
export async function convertImagesToGif(
  ffmpeg: FFmpeg,
  images: File[],
  framerate: number,
  loop: number,
  quality: number,
  ditherMode: DitherMode,
  maxColors: number,
  onProgress?: (message: string) => void,
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

    const paletteUseFilter = buildPaletteUseFilter(ditherMode, quality);

    if (images.length === 1) {
      // 1枚の場合は静止画GIFを作成
      const ext = images[0].name.split(".").pop() || "png";
      const paletteGenFilter = `palettegen=max_colors=${maxColors}:stats_mode=single`;
      const vfFilter = `split[s0][s1];[s0]${paletteGenFilter}[p];[s1][p]${paletteUseFilter}`;
      await ffmpeg.exec([
        "-i",
        `input0.${ext}`,
        "-vf",
        vfFilter,
        "-loop",
        loop.toString(),
        "output.gif",
      ]);
    } else {
      // 複数枚の場合はアニメーションGIFを作成
      // 各画像を個別に読み込み、concatフィルターで結合
      const paletteGenFilter = `palettegen=max_colors=${maxColors}:stats_mode=full`;
      const filterComplex = `concat=n=${images.length}:v=1:a=0,fps=${framerate},split[s0][s1];[s0]${paletteGenFilter}[p];[s1][p]${paletteUseFilter}`;
      await ffmpeg.exec([
        ...images.flatMap((_, i) => {
          const ext = images[i].name.split(".").pop() || "png";
          return ["-loop", "1", "-t", (1 / framerate).toString(), "-i", `input${i}.${ext}`];
        }),
        "-filter_complex",
        filterComplex,
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
 * @param ditherMode - ディザリングモード
 * @param maxColors - 最大色数
 * @returns FFmpegコマンド文字列
 */
export function generateFFmpegCommand(
  images: File[],
  framerate: number,
  loop: number,
  quality: number,
  ditherMode: DitherMode,
  maxColors: number,
): string {
  const paletteUseFilter = buildPaletteUseFilter(ditherMode, quality);

  if (images.length === 0) {
    return "# 画像を選択してください";
  }

  if (images.length === 1) {
    // 単一画像の場合
    const ext = images[0].name.split(".").pop() || "png";
    const paletteGenFilter = `palettegen=max_colors=${maxColors}:stats_mode=single`;
    const vfFilter = `split[s0][s1];[s0]${paletteGenFilter}[p];[s1][p]${paletteUseFilter}`;
    return `# 単一画像からGIF生成（品質: ${quality}、ディザリング: ${ditherMode}、最大色数: ${maxColors}）
ffmpeg -i input.${ext} \\
  -vf "${vfFilter}" \\
  -loop ${loop} \\
  output.gif`;
  } else {
    // 複数画像の場合
    const inputLines = images
      .map((img, i) => {
        const ext = img.name.split(".").pop() || "png";
        return `  -loop 1 -t ${(1 / framerate).toFixed(4)} -i input${i}.${ext}`;
      })
      .join(" \\\n");

    const paletteGenFilter = `palettegen=max_colors=${maxColors}:stats_mode=full`;
    const filterComplex = `concat=n=${images.length}:v=1:a=0,fps=${framerate},split[s0][s1];[s0]${paletteGenFilter}[p];[s1][p]${paletteUseFilter}`;

    return `# 複数画像からアニメーションGIF生成（フレームレート: ${framerate}fps、品質: ${quality}、ディザリング: ${ditherMode}、最大色数: ${maxColors}）
ffmpeg \\
${inputLines} \\
  -filter_complex "${filterComplex}" \\
  -loop ${loop} \\
  output.gif`;
  }
}

function ImageToGifConverter() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [framerate, setFramerate] = useState(10);
  const [loop, setLoop] = useState(0);
  const [quality, setQuality] = useState(80);
  const [ditherMode, setDitherMode] = useState<DitherMode>("floyd_steinberg");
  const [maxColors, setMaxColors] = useState(256);
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
      const validFiles = files.filter((file) => file.type.startsWith("image/"));

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
    [images, announceStatus],
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
    [images, announceStatus],
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
      ditherMode,
      maxColors,
      setProgress,
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
  }, [images, framerate, loop, quality, ditherMode, maxColors, outputUrl, announceStatus]);

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
      const validFiles = files.filter((file) => file.type.startsWith("image/"));

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
    [images, announceStatus],
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
              <p className="dropzone-text">クリックして画像を選択、またはドラッグ&ドロップ</p>
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
            className="visually-hidden-input"
          />

          {images.length > 0 && (
            <div className="image-preview-list" role="list" aria-label="選択された画像">
              {images.map((img, index) => (
                <div key={img.id} className="image-preview-item" role="listitem">
                  <img src={img.preview} alt={`プレビュー ${index + 1}`} loading="lazy" />
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

            <div className="option-group">
              <label htmlFor="ditherMode">ディザリング</label>
              <select
                id="ditherMode"
                value={ditherMode}
                onChange={(e) => setDitherMode(e.target.value as DitherMode)}
                disabled={isLoading}
                aria-describedby="dither-help"
              >
                <option value="floyd_steinberg">Floyd-Steinberg（高品質・推奨）</option>
                <option value="sierra2_4a">Sierra2 4A（バランス型）</option>
                <option value="bayer">Bayer（高速）</option>
                <option value="none">なし（最高速・低品質）</option>
              </select>
              <span id="dither-help" className="option-help">
                ディザリングはGIFの色数制限による見た目の劣化を軽減します
              </span>
            </div>

            <div className="option-group">
              <label htmlFor="maxColors">最大色数</label>
              <select
                id="maxColors"
                value={maxColors}
                onChange={(e) => setMaxColors(parseInt(e.target.value))}
                disabled={isLoading}
                aria-describedby="max-colors-help"
              >
                <option value={256}>256色（最高品質）</option>
                <option value={192}>192色</option>
                <option value={128}>128色（バランス）</option>
                <option value={64}>64色（小ファイル）</option>
              </select>
              <span id="max-colors-help" className="option-help">
                色数を増やすと品質が上がりますが、ファイルサイズも増加します
              </span>
            </div>
          </div>

          <div className="button-group" role="group" aria-label="操作">
            <Button
              type="button"
              onClick={handleConvert}
              disabled={isLoading || images.length === 0}
            >
              {isLoading ? "変換中..." : "GIFに変換"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-clear"
              onClick={handleClear}
              disabled={isLoading}
            >
              クリア
            </Button>
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
              <Button type="button" onClick={handleDownload}>
                ダウンロード
              </Button>
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
              <code>
                {generateFFmpegCommand(
                  images.map((img) => img.file),
                  framerate,
                  loop,
                  quality,
                  ditherMode,
                  maxColors,
                )}
              </code>
            </pre>
            <div className="button-group" role="group" aria-label="コマンド操作">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(
                    generateFFmpegCommand(
                      images.map((img) => img.file),
                      framerate,
                      loop,
                      quality,
                      ditherMode,
                      maxColors,
                    ),
                  );
                  announceStatus("コマンドをクリップボードにコピーしました");
                }}
              >
                コマンドをコピー
              </Button>
            </div>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "画像→GIF変換とは",
              items: [
                "PNG、JPEG、WebPなどの画像をアニメーションGIFに変換します",
                "1枚の画像からでもGIF形式で保存可能",
                "複数枚の画像を選択するとアニメーションGIFになります",
              ],
            },
            {
              title: "設定について",
              items: [
                "フレームレート: 1秒間に表示するフレーム数（複数枚の場合のみ有効）",
                "品質: GIFの画質（値が大きいほど高品質だがファイルサイズも増加）",
                "ループ設定: アニメーションの繰り返し回数",
                "ディザリング: Floyd-SteinbergやSierra2 4Aなど高品質なアルゴリズムが利用可能。色数制限による色の劣化を軽減します",
                "最大色数: GIFは最大256色まで対応。色数を増やすほど品質が向上しますがファイルサイズも増加します",
              ],
            },
            {
              title: "使い方",
              items: [
                "「画像を選択」から1枚以上の画像ファイルを選択",
                "フレームレート、品質、ループ設定を調整",
                "「GIFに変換」ボタンをクリック",
                "変換完了後、「ダウンロード」でGIFを保存",
              ],
            },
            {
              title: "Tips",
              items: [
                "1枚の画像でも静止画GIFとして保存できます",
                "複数枚選択時は選択した順序でアニメーション化されます",
                "フレームレートを低くするとゆっくり、高くすると速く動きます",
              ],
            },
          ]}
        />
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
