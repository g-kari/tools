import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";

export const Route = createFileRoute("/audio-converter")({
  head: () => ({
    meta: [{ title: "オーディオ変換ツール" }],
  }),
  component: AudioConverter,
});

/**
 * オーディオファイルを指定形式に変換する
 * @param audioBuffer - 変換元のAudioBuffer
 * @param format - 変換先のフォーマット ('mp3' | 'wav' | 'ogg')
 * @returns 変換後のBlobとファイル名
 */
async function convertAudio(
  audioBuffer: AudioBuffer,
  format: "mp3" | "wav" | "ogg"
): Promise<{ blob: Blob; filename: string }> {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();

  const renderedBuffer = await offlineContext.startRendering();

  let blob: Blob;
  let mimeType: string;

  if (format === "wav") {
    // WAV形式に変換
    const wavData = audioBufferToWav(renderedBuffer);
    mimeType = "audio/wav";
    blob = new Blob([wavData], { type: mimeType });
  } else {
    // MP3, OGG等はMediaRecorderを使用
    mimeType = format === "mp3" ? "audio/mpeg" : "audio/ogg";
    blob = await encodeWithMediaRecorder(renderedBuffer, mimeType);
  }

  const filename = `converted.${format}`;
  return { blob, filename };
}

/**
 * AudioBufferをWAV形式のArrayBufferに変換
 * @param buffer - 変換元のAudioBuffer
 * @returns WAV形式のArrayBuffer
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = new Float32Array(buffer.length * numberOfChannels);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      data[i * numberOfChannels + channel] = channelData[i];
    }
  }

  const dataLength = data.length * bytesPerSample;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAVヘッダーを書き込み
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // PCMデータを書き込み
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(
      offset,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true
    );
    offset += 2;
  }

  return arrayBuffer;
}

/**
 * DataViewに文字列を書き込む
 * @param view - 書き込み先のDataView
 * @param offset - 書き込み開始位置
 * @param string - 書き込む文字列
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * MediaRecorderを使用してAudioBufferをエンコード
 * @param buffer - エンコード元のAudioBuffer
 * @param mimeType - エンコード先のMIMEタイプ
 * @returns エンコード後のBlob
 */
async function encodeWithMediaRecorder(
  buffer: AudioBuffer,
  mimeType: string
): Promise<Blob> {
  // AudioBufferを再生可能なストリームに変換
  const audioContext = new AudioContext();
  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  const destination = audioContext.createMediaStreamDestination();
  source.connect(destination);

  const mediaRecorder = new MediaRecorder(destination.stream, {
    mimeType: mimeType,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };

    mediaRecorder.onerror = () => {
      reject(new Error("Encoding failed"));
    };

    mediaRecorder.start();
    source.start();

    // バッファの再生時間後に停止
    setTimeout(() => {
      mediaRecorder.stop();
      audioContext.close();
    }, (buffer.duration + 0.1) * 1000);
  });
}

function AudioConverter() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mp3" | "wav" | "ogg">("mp3");
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string>("");
  const [convertedFilename, setConvertedFilename] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

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
    announceStatus("変換を開始しています...");

    try {
      // ファイルをArrayBufferとして読み込み
      const arrayBuffer = await sourceFile.arrayBuffer();

      // AudioContextでデコード
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // 指定フォーマットに変換
      const { blob, filename } = await convertAudio(audioBuffer, format);

      // Blob URLを作成
      if (convertedUrl) {
        URL.revokeObjectURL(convertedUrl);
      }
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);
      setConvertedFilename(filename);

      announceStatus(`${format.toUpperCase()}形式への変換が完了しました`);
      await audioContext.close();
    } catch (error) {
      console.error("Conversion error:", error);
      announceStatus("エラー: 変換に失敗しました");
      alert(
        `変換に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`
      );
    } finally {
      setIsConverting(false);
    }
  }, [sourceFile, format, convertedUrl, announceStatus]);

  const handleClear = useCallback(() => {
    setSourceFile(null);
    setFormat("mp3");
    setIsConverting(false);
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
              MP3, WAV, OGG等のオーディオファイルを選択してください
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
              <option value="ogg">OGG</option>
            </select>
          </div>

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
            <li>入力: MP3, WAV, OGG, AAC, FLAC 等（ブラウザ対応形式）</li>
            <li>出力: MP3, WAV, OGG</li>
          </ul>
          <h3>注意事項</h3>
          <ul>
            <li>
              変換処理はブラウザ上で実行されます（サーバーにアップロードされません）
            </li>
            <li>大きなファイルの変換には時間がかかる場合があります</li>
            <li>
              ブラウザの対応状況により、一部のフォーマットが利用できない場合があります
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
