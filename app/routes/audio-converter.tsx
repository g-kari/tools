import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useToast } from "../components/Toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/audio-converter")({
  head: () => ({
    meta: [{ title: "オーディオ変換ツール" }],
  }),
  component: AudioConverter,
});

/**
 * オーディオ変換オプション
 */
interface ConversionOptions {
  /** ビットレート（kbps） */
  bitrate: string;
  /** サンプリングレート（Hz） */
  sampleRate: string;
  /** チャンネル（1: モノラル, 2: ステレオ） */
  channels: string;
}

/**
 * ffmpeg.wasmを使用してオーディオファイルを変換する
 * @param file - 変換元のファイル
 * @param format - 変換先のフォーマット ('mp3' | 'wav' | 'ogg')
 * @param options - 変換オプション
 * @param onProgress - 進捗コールバック
 * @returns 変換後のBlobとファイル名
 */
async function convertAudioWithFFmpeg(
  file: File,
  format: "mp3" | "wav" | "ogg",
  options: ConversionOptions,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
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

  // フォーマットに応じた変換コマンド
  let args: string[];
  if (format === "mp3") {
    args = [
      "-i",
      inputName,
      "-codec:a",
      "libmp3lame",
      "-b:a",
      `${options.bitrate}k`,
      "-ar",
      options.sampleRate,
      "-ac",
      options.channels,
      outputName,
    ];
  } else if (format === "wav") {
    args = [
      "-i",
      inputName,
      "-acodec",
      "pcm_s16le",
      "-ar",
      options.sampleRate,
      "-ac",
      options.channels,
      outputName,
    ];
  } else {
    // ogg
    args = [
      "-i",
      inputName,
      "-codec:a",
      "libvorbis",
      "-b:a",
      `${options.bitrate}k`,
      "-ar",
      options.sampleRate,
      "-ac",
      options.channels,
      outputName,
    ];
  }

  // 変換実行
  await ffmpeg.exec(args);

  // 出力ファイルを読み込み
  const data = await ffmpeg.readFile(outputName);
  const mimeType =
    format === "mp3"
      ? "audio/mpeg"
      : format === "wav"
        ? "audio/wav"
        : "audio/ogg";
  const blob = new Blob([data], { type: mimeType });

  const filename = `converted.${format}`;
  return { blob, filename };
}

function AudioConverter() {
  const { showToast } = useToast();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mp3" | "wav" | "ogg">("mp3");
  const [bitrate, setBitrate] = useState<string>("192");
  const [sampleRate, setSampleRate] = useState<string>("44100");
  const [channels, setChannels] = useState<string>("2");
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string>("");
  const [convertedFilename, setConvertedFilename] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (convertedUrl) {
        URL.revokeObjectURL(convertedUrl);
      }
    };
  }, [convertedUrl]);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("audio/")) {
          announceStatus("エラー: オーディオファイルを選択してください");
          showToast("オーディオファイルを選択してください", "error");
          return;
        }
        setSourceFile(file);
        setConvertedUrl("");
        setProgress(0);
        announceStatus(`ファイル ${file.name} を選択しました`);
      }
    },
    [announceStatus]
  );

  const handleConvert = useCallback(async () => {
    if (!sourceFile) {
      announceStatus("エラー: ファイルを選択してください");
      showToast("ファイルを選択してください", "error");
      fileInputRef.current?.focus();
      return;
    }

    setIsConverting(true);
    setIsLoading(true);
    setProgress(0);
    announceStatus("FFmpegを読み込んでいます...");

    try {
      const options: ConversionOptions = {
        bitrate,
        sampleRate,
        channels,
      };

      // ffmpeg.wasmを使用して変換
      const { blob, filename } = await convertAudioWithFFmpeg(
        sourceFile,
        format,
        options,
        (p) => {
          setProgress(p);
          setIsLoading(false);
          announceStatus(`変換中... ${p}%`);
        }
      );

      // Blob URLを作成
      if (convertedUrl) {
        URL.revokeObjectURL(convertedUrl);
      }
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);
      setConvertedFilename(filename);
      setProgress(100);

      announceStatus(`${format.toUpperCase()}形式への変換が完了しました`);
    } catch (error) {
      console.error("Conversion error:", error);
      announceStatus("エラー: 変換に失敗しました");
      showToast(
        `変換に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
        "error"
      );
    } finally {
      setIsConverting(false);
      setIsLoading(false);
    }
  }, [sourceFile, format, bitrate, sampleRate, channels, convertedUrl, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setSourceFile(null);
    setFormat("mp3");
    setBitrate("192");
    setSampleRate("44100");
    setChannels("2");
    setIsConverting(false);
    setProgress(0);
    setIsLoading(false);
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }
    setConvertedUrl("");
    setConvertedFilename("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    announceStatus("入力をクリアしました");
    fileInputRef.current?.focus();
  }, [convertedUrl, announceStatus]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith("audio/")) {
        announceStatus("エラー: オーディオファイルをドロップしてください");
        return;
      }
      setSourceFile(droppedFile);
      setConvertedUrl("");
      setProgress(0);
      announceStatus(`ファイル ${droppedFile.name} を選択しました`);
    }
  }, [announceStatus]);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="オーディオ変換フォーム"
        >
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
              aria-label="オーディオファイルをアップロード"
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
                  クリックして音声を選択、またはドラッグ&ドロップ
                </p>
                <p className="dropzone-hint">MP3, WAV, OGG, AAC, FLAC など</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              id="audioFile"
              accept="audio/*"
              onChange={handleFileChange}
              aria-describedby="file-help"
              style={{ display: "none" }}
            />

            {sourceFile && (
              <div className="selected-file" role="status">
                <strong>選択中:</strong> {sourceFile.name} ({(sourceFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          <div className="converter-section">
            <label htmlFor="outputFormat" className="section-title">
              出力フォーマット
            </label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as "mp3" | "wav" | "ogg")}
              disabled={isConverting}
            >
              <SelectTrigger id="outputFormat" aria-label="出力フォーマットを選択">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="wav">WAV</SelectItem>
                <SelectItem value="ogg">OGG (Vorbis)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="converter-section">
            <h3 className="section-title">変換オプション</h3>

            <div className="option-group">
              <label htmlFor="bitrate">
                ビットレート (kbps)
              </label>
              <Select
                value={bitrate}
                onValueChange={setBitrate}
                disabled={isConverting || format === "wav"}
              >
                <SelectTrigger id="bitrate" aria-label="ビットレートを選択">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="320">320 (最高品質)</SelectItem>
                  <SelectItem value="256">256 (高品質)</SelectItem>
                  <SelectItem value="192">192 (標準)</SelectItem>
                  <SelectItem value="128">128 (バランス)</SelectItem>
                  <SelectItem value="96">96 (低品質)</SelectItem>
                  <SelectItem value="64">64 (最低品質)</SelectItem>
                </SelectContent>
              </Select>
              {format === "wav" && (
                <p style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", marginTop: "4px" }}>
                  ※ WAV形式ではビットレート設定は使用されません
                </p>
              )}
            </div>

            <div className="option-group">
              <label htmlFor="sampleRate">
                サンプリングレート (Hz)
              </label>
              <Select
                value={sampleRate}
                onValueChange={setSampleRate}
                disabled={isConverting}
              >
                <SelectTrigger id="sampleRate" aria-label="サンプリングレートを選択">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="48000">48000 (最高品質)</SelectItem>
                  <SelectItem value="44100">44100 (CD品質)</SelectItem>
                  <SelectItem value="32000">32000</SelectItem>
                  <SelectItem value="22050">22050</SelectItem>
                  <SelectItem value="16000">16000</SelectItem>
                  <SelectItem value="11025">11025</SelectItem>
                  <SelectItem value="8000">8000 (電話品質)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="option-group">
              <label htmlFor="channels">
                チャンネル
              </label>
              <Select
                value={channels}
                onValueChange={setChannels}
                disabled={isConverting}
              >
                <SelectTrigger id="channels" aria-label="チャンネルを選択">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">ステレオ (2ch)</SelectItem>
                  <SelectItem value="1">モノラル (1ch)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isConverting && (
            <div className="converter-section">
              <label className="section-title">
                {isLoading ? "読み込み中..." : `変換進捗: ${progress}%`}
              </label>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "var(--md-sys-color-surface-variant)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: "var(--md-sys-color-primary)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}

          <div className="button-group" role="group" aria-label="変換操作">
            <button
              type="button"
              className="btn-primary"
              onClick={handleConvert}
              disabled={isConverting || !sourceFile}
              aria-label="オーディオファイルを変換"
            >
              {isConverting ? "変換中..." : "変換"}
            </button>
            <button
              type="button"
              className="btn-clear"
              onClick={handleClear}
              disabled={isConverting}
              aria-label="入力をクリア"
            >
              クリア
            </button>
          </div>

          {convertedUrl && (
            <div style={{ marginTop: "30px" }}>
              <h3 className="section-title">変換結果</h3>
              <audio
                controls
                src={convertedUrl}
                style={{ width: "100%", marginBottom: "12px" }}
                aria-label="変換されたオーディオのプレビュー"
              />
              <a
                href={convertedUrl}
                download={convertedFilename}
                className="btn-secondary"
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  textAlign: "center",
                }}
                aria-label={`変換されたファイル ${convertedFilename} をダウンロード`}
              >
                ダウンロード ({convertedFilename})
              </a>
            </div>
          )}
        </form>

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>「オーディオファイルを選択」からファイルを選択します</li>
            <li>「出力フォーマット」で変換先の形式を選択します</li>
            <li>「変換オプション」でビットレート、サンプリングレート、チャンネルを調整します</li>
            <li>「変換」ボタンをクリックして変換を実行します</li>
            <li>変換が完了すると、プレビューとダウンロードリンクが表示されます</li>
          </ul>
          <h3>対応フォーマット</h3>
          <ul>
            <li>入力: MP3, WAV, OGG, AAC, FLAC, M4A 等（FFmpegサポート形式）</li>
            <li>出力: MP3 (libmp3lame), WAV (PCM), OGG (Vorbis)</li>
          </ul>
          <h3>変換オプションについて</h3>
          <ul>
            <li><strong>ビットレート:</strong> 音質とファイルサイズのバランス。高いほど高音質で大きなサイズになります</li>
            <li><strong>サンプリングレート:</strong> 音質の細かさ。44100Hz（CD品質）が標準です</li>
            <li><strong>チャンネル:</strong> ステレオ（2ch）またはモノラル（1ch）を選択できます</li>
          </ul>
          <h3>技術情報</h3>
          <ul>
            <li>変換処理にはFFmpeg.wasmを使用しています</li>
            <li>すべての処理はブラウザ上で実行されます（サーバーへのアップロードなし）</li>
            <li>初回変換時にFFmpegライブラリ（約31MB）をダウンロードします</li>
            <li>大きなファイルの変換には時間がかかる場合があります</li>
          </ul>
          <h3>参考</h3>
          <ul>
            <li>
              <a
                href="https://zenn.dev/henvate/articles/cdd7aee45157cf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--md-sys-color-primary)",
                  textDecoration: "underline",
                }}
              >
                Next.js + FFmpeg.wasmで動画変換サービスを作った
              </a>
            </li>
            <li>
              <a
                href="https://ffmpegwasm.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--md-sys-color-primary)",
                  textDecoration: "underline",
                }}
              >
                FFmpeg.wasm 公式サイト
              </a>
            </li>
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
    </>
  );
}
