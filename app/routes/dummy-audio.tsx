import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";

export const Route = createFileRoute("/dummy-audio")({
  head: () => ({
    meta: [{ title: "ダミー音声生成ツール" }],
  }),
  component: DummyAudioGenerator,
});

type WaveformType = "sine" | "square" | "triangle" | "sawtooth" | "noise";

const WAVEFORM_OPTIONS: { value: WaveformType; label: string }[] = [
  { value: "sine", label: "サイン波" },
  { value: "square", label: "矩形波" },
  { value: "triangle", label: "三角波" },
  { value: "sawtooth", label: "ノコギリ波" },
  { value: "noise", label: "ホワイトノイズ" },
];

const SAMPLE_RATE = 44100;

function generateAudioBuffer(
  audioContext: AudioContext,
  waveform: WaveformType,
  frequency: number,
  duration: number,
  volume: number
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = buffer.getChannelData(0);
  const amplitude = volume / 100;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    switch (waveform) {
      case "sine":
        sample = Math.sin(2 * Math.PI * frequency * t);
        break;
      case "square":
        sample = Math.sin(2 * Math.PI * frequency * t) >= 0 ? 1 : -1;
        break;
      case "triangle":
        sample = 2 * Math.abs(2 * ((frequency * t) % 1) - 1) - 1;
        break;
      case "sawtooth":
        sample = 2 * ((frequency * t) % 1) - 1;
        break;
      case "noise":
        sample = Math.random() * 2 - 1;
        break;
    }

    channelData[i] = sample * amplitude;
  }

  return buffer;
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write audio data
  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function DummyAudioGenerator() {
  const [waveform, setWaveform] = useState<WaveformType>("sine");
  const [frequency, setFrequency] = useState(440);
  const [duration, setDuration] = useState(1);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
    }
    return audioContextRef.current;
  }, []);

  const handleGenerate = useCallback(() => {
    const audioContext = getAudioContext();
    audioBufferRef.current = generateAudioBuffer(
      audioContext,
      waveform,
      frequency,
      duration,
      volume
    );
    setIsGenerated(true);
    announceStatus("音声を生成しました");
  }, [waveform, frequency, duration, volume, getAudioContext, announceStatus]);

  const handlePlay = useCallback(async () => {
    if (!audioBufferRef.current) {
      handleGenerate();
    }

    const audioContext = getAudioContext();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioContext.destination);
    source.onended = () => {
      setIsPlaying(false);
    };
    source.start();
    sourceNodeRef.current = source;
    setIsPlaying(true);
    announceStatus("再生中...");
  }, [handleGenerate, getAudioContext, announceStatus]);

  const handleStop = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    announceStatus("停止しました");
  }, [announceStatus]);

  const handleDownload = useCallback(() => {
    if (!audioBufferRef.current) {
      handleGenerate();
    }

    if (!audioBufferRef.current) return;

    const wavData = audioBufferToWav(audioBufferRef.current);
    const blob = new Blob([wavData], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);

    const waveformLabel =
      WAVEFORM_OPTIONS.find((opt) => opt.value === waveform)?.label || waveform;
    const filename = `dummy_audio_${waveformLabel}_${frequency}Hz_${duration}s.wav`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    announceStatus("WAVファイルをダウンロードしました");
  }, [waveform, frequency, duration, handleGenerate, announceStatus]);

  const handleWaveformChange = useCallback((newWaveform: WaveformType) => {
    setWaveform(newWaveform);
    setIsGenerated(false);
    audioBufferRef.current = null;
  }, []);

  const handleFrequencyChange = useCallback((newFrequency: number) => {
    setFrequency(newFrequency);
    setIsGenerated(false);
    audioBufferRef.current = null;
  }, []);

  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
    setIsGenerated(false);
    audioBufferRef.current = null;
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setIsGenerated(false);
    audioBufferRef.current = null;
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          aria-label="ダミー音声生成フォーム"
        >
          <div className="converter-section">
            <h2 className="section-title">音声設定</h2>

            <div className="audio-options">
              <div className="option-group">
                <label htmlFor="waveform">波形タイプ:</label>
                <select
                  id="waveform"
                  value={waveform}
                  onChange={(e) =>
                    handleWaveformChange(e.target.value as WaveformType)
                  }
                  aria-describedby="waveform-help"
                >
                  {WAVEFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span id="waveform-help" className="sr-only">
                  生成する音声の波形タイプを選択します
                </span>
              </div>

              <div className="option-group">
                <label htmlFor="frequency">周波数 (Hz):</label>
                <input
                  type="number"
                  id="frequency"
                  min="20"
                  max="20000"
                  value={frequency}
                  onChange={(e) =>
                    handleFrequencyChange(
                      Math.max(20, Math.min(20000, parseInt(e.target.value) || 440))
                    )
                  }
                  disabled={waveform === "noise"}
                  aria-describedby="frequency-help"
                />
                <span id="frequency-help" className="sr-only">
                  20Hzから20000Hzの間で周波数を指定できます
                </span>
              </div>

              <div className="option-group">
                <label htmlFor="duration">持続時間 (秒):</label>
                <input
                  type="number"
                  id="duration"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={duration}
                  onChange={(e) =>
                    handleDurationChange(
                      Math.max(0.1, Math.min(10, parseFloat(e.target.value) || 1))
                    )
                  }
                  aria-describedby="duration-help"
                />
                <span id="duration-help" className="sr-only">
                  0.1秒から10秒の間で持続時間を指定できます
                </span>
              </div>

              <div className="option-group volume-group">
                <label htmlFor="volume">音量: {volume}%</label>
                <input
                  type="range"
                  id="volume"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  aria-describedby="volume-help"
                />
                <span id="volume-help" className="sr-only">
                  0%から100%の間で音量を指定できます
                </span>
              </div>
            </div>

            <div className="button-group" role="group" aria-label="音声操作">
              <button type="submit" className="btn-primary">
                音声生成
              </button>
              {!isPlaying ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handlePlay}
                >
                  再生
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleStop}
                >
                  停止
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownload}
              >
                WAVダウンロード
              </button>
            </div>
          </div>

          {isGenerated && (
            <div className="converter-section">
              <h2 className="section-title">生成情報</h2>
              <div className="audio-info">
                <div className="info-item">
                  <span className="info-label">波形:</span>
                  <span className="info-value">
                    {WAVEFORM_OPTIONS.find((opt) => opt.value === waveform)?.label}
                  </span>
                </div>
                {waveform !== "noise" && (
                  <div className="info-item">
                    <span className="info-label">周波数:</span>
                    <span className="info-value">{frequency} Hz</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">持続時間:</span>
                  <span className="info-value">{duration} 秒</span>
                </div>
                <div className="info-item">
                  <span className="info-label">音量:</span>
                  <span className="info-value">{volume}%</span>
                </div>
                <div className="info-item">
                  <span className="info-label">サンプルレート:</span>
                  <span className="info-value">{SAMPLE_RATE} Hz</span>
                </div>
                <div className="info-item">
                  <span className="info-label">形式:</span>
                  <span className="info-value">WAV (16bit PCM)</span>
                </div>
              </div>
            </div>
          )}
        </form>

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">ダミー音声生成とは</h3>
          <ul>
            <li>テストや開発用のダミー音声ファイルを生成します</li>
            <li>Web Audio APIを使用してブラウザ内で音声を生成</li>
            <li>WAVファイル（16bit PCM）としてダウンロード可能</li>
          </ul>
          <h3 id="waveform-title">波形タイプについて</h3>
          <ul>
            <li><strong>サイン波:</strong> 滑らかな正弦波、最も基本的な波形</li>
            <li><strong>矩形波:</strong> オン/オフが切り替わる四角い波形</li>
            <li><strong>三角波:</strong> 直線的に上下する波形</li>
            <li><strong>ノコギリ波:</strong> 一方向に上昇し急降下する波形</li>
            <li><strong>ホワイトノイズ:</strong> ランダムな音（周波数設定無効）</li>
          </ul>
          <h3 id="about-tool-title">使い方</h3>
          <ul>
            <li>波形タイプを選択します</li>
            <li>周波数、持続時間、音量を設定します</li>
            <li>「再生」ボタンでプレビュー、「WAVダウンロード」で保存</li>
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
        .audio-options {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          align-items: flex-start;
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

        .option-group select,
        .option-group input[type="number"] {
          padding: 0.5rem;
          border: 1px solid var(--md-sys-color-outline);
          border-radius: 8px;
          font-size: 1rem;
          background-color: var(--md-sys-color-surface);
          color: var(--md-sys-color-on-surface);
          min-width: 120px;
        }

        .option-group input[type="number"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .volume-group {
          min-width: 200px;
        }

        .option-group input[type="range"] {
          width: 100%;
          accent-color: var(--md-sys-color-primary);
        }

        .audio-info {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 8px;
        }

        .info-label {
          font-weight: 500;
          color: var(--md-sys-color-on-surface-variant);
        }

        .info-value {
          font-family: 'Roboto Mono', monospace;
          color: var(--md-sys-color-on-surface);
        }

        @media (max-width: 480px) {
          .audio-options {
            flex-direction: column;
          }

          .option-group {
            width: 100%;
          }

          .option-group select,
          .option-group input[type="number"] {
            width: 100%;
          }

          .audio-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
