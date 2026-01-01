import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export const Route = createFileRoute("/video-converter")({
  head: () => ({
    meta: [{ title: "動画変換ツール" }],
  }),
  component: VideoConverter,
});

/**
 * 動画変換オプション
 */
interface ConversionOptions {
  /** ビデオビットレート（kbps） */
  videoBitrate: string;
  /** オーディオビットレート（kbps） */
  audioBitrate: string;
  /** フレームレート（fps） */
  framerate: string;
  /** 解像度（幅） */
  width: string;
  /** 解像度（高さ） */
  height: string;
  /** ビデオコーデック */
  videoCodec: string;
  /** オーディオコーデック */
  audioCodec: string;
}

/**
 * ffmpeg.wasmを使用して動画ファイルを変換する
 * @param file - 変換元のファイル
 * @param format - 変換先のフォーマット ('mp4' | 'webm' | 'avi' | 'mov' | 'gif')
 * @param options - 変換オプション
 * @param onProgress - 進捗コールバック
 * @returns 変換後のBlobとファイル名
 */
export async function convertVideoWithFFmpeg(
  file: File,
  format: "mp4" | "webm" | "avi" | "mov" | "gif",
  options: ConversionOptions,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  // ファイルサイズチェック（ブラウザメモリ制限を考慮して500MB以下を推奨）
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `ファイルサイズが大きすぎます。${MAX_FILE_SIZE / 1024 / 1024}MB以下のファイルを選択してください。`
    );
  }

  const ffmpeg = new FFmpeg();

  // 進捗ログの処理
  ffmpeg.on("log", ({ message }) => {
    console.log(message);
  });

  // 進捗の処理
  ffmpeg.on("progress", ({ progress }) => {
    if (onProgress) {
      onProgress(Math.round(progress * 100));
    }
  });

  // ffmpeg-coreのロード
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  // 入力ファイルを書き込み
  const inputName = "input" + file.name.substring(file.name.lastIndexOf("."));
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // 出力ファイル名
  const outputName = `output.${format}`;

  // GIF形式の場合は特別な処理
  if (format === "gif") {
    const args: string[] = ["-i", inputName];

    // フレームレート
    if (options.framerate !== "auto") {
      args.push("-r", options.framerate);
    }

    // 解像度
    if (options.width !== "auto" && options.height !== "auto") {
      args.push("-s", `${options.width}x${options.height}`);
    }

    // GIF用のフィルター（高品質なパレット生成）
    args.push("-vf", "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse");

    // ループ設定（0 = 無限ループ）
    args.push("-loop", "0");

    args.push(outputName);

    await ffmpeg.exec(args);
  } else {
    // 共通のビデオ・オーディオオプション
    const commonArgs: string[] = [];

    // ビデオコーデック
    commonArgs.push("-c:v", options.videoCodec);

    // ビデオビットレート
    if (options.videoBitrate !== "auto") {
      commonArgs.push("-b:v", `${options.videoBitrate}k`);
    }

    // フレームレート
    if (options.framerate !== "auto") {
      commonArgs.push("-r", options.framerate);
    }

    // 解像度
    if (options.width !== "auto" && options.height !== "auto") {
      commonArgs.push("-s", `${options.width}x${options.height}`);
    }

    // オーディオコーデック
    commonArgs.push("-c:a", options.audioCodec);

    // オーディオビットレート
    if (options.audioBitrate !== "auto") {
      commonArgs.push("-b:a", `${options.audioBitrate}k`);
    }

    // フォーマットに応じた変換コマンド
    const args = ["-i", inputName, ...commonArgs, outputName];

    await ffmpeg.exec(args);
  }

  // 出力ファイルを読み込み
  const data = await ffmpeg.readFile(outputName);
  const mimeType = format === "gif" ? "image/gif" : `video/${format}`;
  const blob = new Blob([data], { type: mimeType });

  // 元のファイル名から拡張子を取得して置き換え
  const originalName = file.name.substring(0, file.name.lastIndexOf("."));
  const filename = `${originalName}.${format}`;

  return { blob, filename };
}

/**
 * 動画変換コンポーネント
 * ffmpeg.wasmを使用してブラウザ上で動画ファイルを別のフォーマットに変換する
 * MP4、WebM、AVI、MOV、GIF形式に対応し、ビットレート・解像度・フレームレートなどの詳細設定が可能
 */
function VideoConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mp4" | "webm" | "avi" | "mov" | "gif">("mp4");
  const [videoBitrate, setVideoBitrate] = useState("2000");
  const [audioBitrate, setAudioBitrate] = useState("128");
  const [framerate, setFramerate] = useState("auto");
  const [width, setWidth] = useState("auto");
  const [height, setHeight] = useState("auto");
  const [videoCodec, setVideoCodec] = useState("libx264");
  const [audioCodec, setAudioCodec] = useState("aac");
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedFilename, setConvertedFilename] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  /**
   * スクリーンリーダー用のステータスメッセージを通知する
   * @param message - 通知するメッセージ
   */
  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
    }
  }, []);

  /**
   * ファイル選択時のハンドラー
   * @param e - ファイル入力の変更イベント
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        setConvertedBlob(null);
        announceStatus(`ファイルを選択しました: ${selectedFile.name}`);
      }
    },
    [announceStatus]
  );

  /**
   * 動画変換を実行するハンドラー
   * 選択されたファイルと設定オプションを使用してFFmpegで変換を行う
   */
  const handleConvert = useCallback(async () => {
    if (!file) return;

    setIsConverting(true);
    setProgress(0);
    announceStatus("変換を開始しています...");

    try {
      const options: ConversionOptions = {
        videoBitrate,
        audioBitrate,
        framerate,
        width,
        height,
        videoCodec,
        audioCodec,
      };

      const result = await convertVideoWithFFmpeg(
        file,
        format,
        options,
        setProgress
      );

      setConvertedBlob(result.blob);
      setConvertedFilename(result.filename);
      announceStatus("変換が完了しました");
    } catch (error) {
      console.error("変換エラー:", error);
      announceStatus("変換に失敗しました");
    } finally {
      setIsConverting(false);
    }
  }, [
    file,
    format,
    videoBitrate,
    audioBitrate,
    framerate,
    width,
    height,
    videoCodec,
    audioCodec,
    announceStatus,
  ]);

  /**
   * 変換済みファイルをダウンロードするハンドラー
   * Blob URLを作成してダウンロードを実行し、メモリリークを防ぐためURLを解放する
   */
  const handleDownload = useCallback(() => {
    if (!convertedBlob) return;

    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = convertedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    announceStatus("ダウンロードしました");
  }, [convertedBlob, convertedFilename, announceStatus]);

  /**
   * 選択されたファイルと変換結果をクリアするハンドラー
   * フォームを初期状態にリセットする
   */
  const handleClear = useCallback(() => {
    setFile(null);
    setConvertedBlob(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    announceStatus("クリアしました");
  }, [announceStatus]);

  /**
   * ドラッグオーバー時のハンドラー
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * ドラッグリーブ時のハンドラー
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  /**
   * ドロップ時のハンドラー
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("video/")) {
      setFile(droppedFile);
      setConvertedBlob(null);
      announceStatus(`ファイルを選択しました: ${droppedFile.name}`);
    } else {
      announceStatus("動画ファイルをドロップしてください");
    }
  }, [announceStatus]);

  // コーデックの選択肢をフォーマットに応じて更新
  useEffect(() => {
    if (format === "mp4") {
      setVideoCodec("libx264");
      setAudioCodec("aac");
    } else if (format === "webm") {
      setVideoCodec("libvpx");
      setAudioCodec("libvorbis");
    } else if (format === "avi") {
      setVideoCodec("mpeg4");
      setAudioCodec("mp3");
    } else if (format === "mov") {
      setVideoCodec("libx264");
      setAudioCodec("aac");
    } else if (format === "gif") {
      // GIF変換では独自のパレット生成フィルターを使用するため、
      // これらのコーデック設定は表示・状態管理のみに使用され、実際の変換処理では参照されない
      setVideoCodec("gif");
      setAudioCodec("none");
    }
  }, [format]);

  return (
    <>
      <div
        ref={statusRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      <div className="tool-container">
        <h1 className="page-title">動画変換</h1>

        <div className="converter-section">
          <h2 className="section-title">ファイル選択</h2>

          <div
            className={`dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="動画ファイルをアップロード"
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
                クリックして動画を選択、またはドラッグ&ドロップ
              </p>
              <p className="dropzone-hint">MP4, WebM, AVI, MOV など</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            id="videoFile"
            accept="video/*"
            onChange={handleFileChange}
            disabled={isConverting}
            aria-describedby="file-help"
            className="hidden-file-input"
          />

          {file && (
            <div className="selected-file" role="status">
              <strong>選択中:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        <div className="converter-section">
          <h2 className="section-title">変換設定</h2>

          <div className="option-group">
            <label htmlFor="format">出力フォーマット</label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
              disabled={isConverting}
            >
              <option value="mp4">MP4 (H.264)</option>
              <option value="webm">WebM (VP8)</option>
              <option value="avi">AVI (MPEG-4)</option>
              <option value="mov">MOV (H.264)</option>
              <option value="gif">GIF (アニメーション画像)</option>
            </select>
          </div>

          <div className="option-group">
            <label htmlFor="width">解像度（幅）</label>
            <select
              id="width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              disabled={isConverting}
            >
              <option value="auto">元のまま</option>
              <option value="640">640px</option>
              <option value="854">854px (480p)</option>
              <option value="1280">1280px (720p)</option>
              <option value="1920">1920px (1080p)</option>
              <option value="2560">2560px (1440p)</option>
              <option value="3840">3840px (4K)</option>
            </select>
          </div>

          <div className="option-group">
            <label htmlFor="height">解像度（高さ）</label>
            <select
              id="height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              disabled={isConverting}
            >
              <option value="auto">元のまま</option>
              <option value="360">360px</option>
              <option value="480">480px</option>
              <option value="720">720px (720p)</option>
              <option value="1080">1080px (1080p)</option>
              <option value="1440">1440px (1440p)</option>
              <option value="2160">2160px (4K)</option>
            </select>
          </div>

          <div className="option-group">
            <label htmlFor="framerate">フレームレート</label>
            <select
              id="framerate"
              value={framerate}
              onChange={(e) => setFramerate(e.target.value)}
              disabled={isConverting}
            >
              <option value="auto">元のまま</option>
              <option value="24">24 fps</option>
              <option value="30">30 fps</option>
              <option value="60">60 fps</option>
            </select>
          </div>

          <div className="option-group">
            <label htmlFor="videoBitrate">ビデオビットレート</label>
            <select
              id="videoBitrate"
              value={videoBitrate}
              onChange={(e) => setVideoBitrate(e.target.value)}
              disabled={isConverting}
            >
              <option value="auto">自動</option>
              <option value="1000">1000 kbps (低画質)</option>
              <option value="2000">2000 kbps (標準)</option>
              <option value="4000">4000 kbps (高画質)</option>
              <option value="8000">8000 kbps (最高画質)</option>
            </select>
          </div>

          <div className="option-group">
            <label htmlFor="audioBitrate">オーディオビットレート</label>
            <select
              id="audioBitrate"
              value={audioBitrate}
              onChange={(e) => setAudioBitrate(e.target.value)}
              disabled={isConverting}
            >
              <option value="auto">自動</option>
              <option value="96">96 kbps</option>
              <option value="128">128 kbps (標準)</option>
              <option value="192">192 kbps (高音質)</option>
              <option value="256">256 kbps (最高音質)</option>
            </select>
          </div>

          <div className="button-group" role="group" aria-label="操作">
            <button
              type="button"
              className="btn-primary"
              onClick={handleConvert}
              disabled={!file || isConverting}
            >
              {isConverting ? `変換中... ${progress}%` : "変換"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClear}
              disabled={isConverting}
            >
              クリア
            </button>
          </div>

          {isConverting && (
            <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} style={{ "--progress-width": `${progress}%` } as React.CSSProperties}>
              <div className="progress-fill" />
            </div>
          )}
        </div>

        {convertedBlob && (
          <div className="converter-section">
            <h2 className="section-title">変換結果</h2>

            <div className="result-info">
              <p>
                <strong>ファイル名:</strong> {convertedFilename}
              </p>
              <p>
                <strong>サイズ:</strong> {(convertedBlob.size / 1024 / 1024).toFixed(2)} MB
              </p>
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
          <h3 id="usage-title">動画変換とは</h3>
          <ul>
            <li>動画ファイルを異なるフォーマットに変換できます</li>
            <li>解像度やビットレートを調整してファイルサイズを最適化できます</li>
            <li>ブラウザ上で完結するため、ファイルがサーバーにアップロードされることはありません</li>
          </ul>
          <h3 id="options-title">オプションについて</h3>
          <ul>
            <li>
              <strong>出力フォーマット:</strong> 変換先の動画形式を選択します
            </li>
            <li>
              <strong>解像度:</strong> 動画の幅と高さを設定します（縦横比は保持されません）
            </li>
            <li>
              <strong>フレームレート:</strong> 1秒あたりのフレーム数を設定します
            </li>
            <li>
              <strong>ビデオビットレート:</strong> 動画の品質を決定します（高いほど高画質）
            </li>
            <li>
              <strong>オーディオビットレート:</strong> 音質を決定します（高いほど高音質）
            </li>
          </ul>
          <h3 id="tips-title">Tips</h3>
          <ul>
            <li>ファイルサイズを小さくしたい場合は、解像度とビットレートを下げてください</li>
            <li>大きなファイルは変換に時間がかかる場合があります</li>
            <li>ブラウザのメモリ制限により、非常に大きなファイルは変換できない場合があります</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
