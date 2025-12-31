import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export const Route = createFileRoute("/audio-converter")({
  head: () => ({
    meta: [{ title: "オーディオ変換ツール" }],
  }),
  component: AudioConverter,
});

/**
 * ffmpeg.wasmを使用してオーディオファイルを変換する
 * @param file - 変換元のファイル
 * @param format - 変換先のフォーマット ('mp3' | 'wav' | 'ogg')
 * @param onProgress - 進捗コールバック
 * @returns 変換後のBlobとファイル名
 */
async function convertAudioWithFFmpeg(
  file: File,
  format: "mp3" | "wav" | "ogg",
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
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
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
    args = ["-i", inputName, "-codec:a", "libmp3lame", "-qscale:a", "2", outputName];
  } else if (format === "wav") {
    args = ["-i", inputName, "-acodec", "pcm_s16le", "-ar", "44100", outputName];
  } else {
    // ogg
    args = ["-i", inputName, "-codec:a", "libvorbis", "-qscale:a", "5", outputName];
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
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mp3" | "wav" | "ogg">("mp3");
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string>("");
  const [convertedFilename, setConvertedFilename] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
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
          alert("オーディオファイルを選択してください");
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
      alert("ファイルを選択してください");
      fileInputRef.current?.focus();
      return;
    }

    setIsConverting(true);
    setIsLoading(true);
    setProgress(0);
    announceStatus("FFmpegを読み込んでいます...");

    try {
      // ffmpeg.wasmを使用して変換
      const { blob, filename } = await convertAudioWithFFmpeg(
        sourceFile,
        format,
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
      alert(
        `変換に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`
      );
    } finally {
      setIsConverting(false);
      setIsLoading(false);
    }
  }, [sourceFile, format, convertedUrl, announceStatus]);

  const handleClear = useCallback(() => {
    setSourceFile(null);
    setFormat("mp3");
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

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="オーディオ変換フォーム"
        >
          <div className="converter-section">
            <label htmlFor="audioFile" className="section-title">
              オーディオファイルを選択
            </label>
            <input
              id="audioFile"
              type="file"
              ref={fileInputRef}
              accept="audio/*"
              onChange={handleFileChange}
              aria-describedby="file-help"
              aria-label="変換するオーディオファイルを選択"
              style={{
                padding: "12px",
                fontSize: "16px",
                border: "1px solid var(--md-sys-color-outline)",
                borderRadius: "4px",
                backgroundColor: "var(--md-sys-color-surface-container)",
                color: "var(--md-sys-color-on-surface)",
                width: "100%",
              }}
            />
            <span id="file-help" className="sr-only">
              MP3, WAV, OGG, AAC, FLAC等のオーディオファイルを選択してください
            </span>
            {sourceFile && (
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  color: "var(--md-sys-color-on-surface-variant)",
                }}
              >
                選択中: {sourceFile.name} ({(sourceFile.size / 1024).toFixed(2)}{" "}
                KB)
              </p>
            )}
          </div>

          <div className="converter-section">
            <label htmlFor="outputFormat" className="section-title">
              出力フォーマット
            </label>
            <select
              id="outputFormat"
              value={format}
              onChange={(e) =>
                setFormat(e.target.value as "mp3" | "wav" | "ogg")
              }
              aria-label="出力フォーマットを選択"
              disabled={isConverting}
              style={{
                padding: "12px",
                fontSize: "16px",
                border: "1px solid var(--md-sys-color-outline)",
                borderRadius: "4px",
                backgroundColor: "var(--md-sys-color-surface-container)",
                color: "var(--md-sys-color-on-surface)",
                width: "100%",
              }}
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="ogg">OGG (Vorbis)</option>
            </select>
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
            <li>「変換」ボタンをクリックして変換を実行します</li>
            <li>変換が完了すると、プレビューとダウンロードリンクが表示されます</li>
          </ul>
          <h3>対応フォーマット</h3>
          <ul>
            <li>入力: MP3, WAV, OGG, AAC, FLAC, M4A 等（FFmpegサポート形式）</li>
            <li>出力: MP3 (高品質), WAV (PCM 44.1kHz), OGG (Vorbis)</li>
          </ul>
          <h3>技術情報</h3>
          <ul>
            <li>変換処理にはFFmpeg.wasmを使用しています</li>
            <li>すべての処理はブラウザ上で実行されます（サーバーへのアップロードなし）</li>
            <li>初回変換時にFFmpegライブラリ（約31MB）をダウンロードします</li>
            <li>大きなファイルの変換には時間がかかる場合があります</li>
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
