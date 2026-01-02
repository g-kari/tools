import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Dropzone } from "../components/Dropzone";
import { Slider } from "../components/Slider";
import { formatFileSize } from "../utils/format";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

export const Route = createFileRoute("/image-compress")({
  head: () => ({
    meta: [{ title: "画像圧縮ツール" }],
  }),
  component: ImageCompressor,
});

type OutputFormat = "jpeg" | "webp" | "png";

const FORMAT_OPTIONS: { value: OutputFormat; label: string; mimeType: string }[] = [
  { value: "jpeg", label: "JPEG", mimeType: "image/jpeg" },
  { value: "webp", label: "WebP", mimeType: "image/webp" },
  { value: "png", label: "PNG", mimeType: "image/png" },
];

/**
 * 圧縮率を計算する
 * @param originalSize - 元のファイルサイズ（バイト）
 * @param compressedSize - 圧縮後のファイルサイズ（バイト）
 * @returns 圧縮率（パーセント）
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round((1 - compressedSize / originalSize) * 100);
}

/**
 * 画像を圧縮する
 * @param file - 圧縮する画像ファイル
 * @param quality - 画質（0-1）
 * @param format - 出力形式
 * @returns 圧縮されたBlobを含むPromise
 */
export async function compressImage(
  file: File,
  quality: number,
  format: OutputFormat
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      // PNGの透過対応: JPEGの場合は白背景を塗る
      if (format === "jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const mimeType = FORMAT_OPTIONS.find((f) => f.value === format)?.mimeType || "image/jpeg";

      // PNGは画質パラメータを無視
      const qualityParam = format === "png" ? undefined : quality;

      canvas.toBlob(
        (blob) => resolve(blob),
        mimeType,
        qualityParam
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * ダウンロード用のファイル名を生成する
 * @param originalName - 元のファイル名
 * @param format - 出力形式
 * @returns 新しいファイル名
 */
export function generateFilename(originalName: string, format: OutputFormat): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}_compressed.${format}`;
}

function ImageCompressor() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToast();

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (compressedPreview) URL.revokeObjectURL(compressedPreview);
    };
  }, [originalPreview, compressedPreview]);

  // 画質/形式変更時に自動で再圧縮（デバウンス付き）
  useEffect(() => {
    if (!originalFile || isLoading) return;

    const timeoutId = setTimeout(() => {
      handleCompress();
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, format]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast("画像ファイルを選択してください", "error");
        return;
      }

      // 既存のプレビューをクリーンアップ
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (compressedPreview) URL.revokeObjectURL(compressedPreview);

      const preview = URL.createObjectURL(file);
      setOriginalFile(file);
      setOriginalPreview(preview);
      setCompressedBlob(null);
      setCompressedPreview(null);

      // 自動で圧縮を開始
      setIsLoading(true);
      const blob = await compressImage(file, quality / 100, format);
      setIsLoading(false);

      if (blob) {
        setCompressedBlob(blob);
        setCompressedPreview(URL.createObjectURL(blob));
        showToast("画像を圧縮しました", "success");
      } else {
        showToast("画像の圧縮に失敗しました", "error");
      }
    },
    [originalPreview, compressedPreview, quality, format, showToast]
  );

  const handleCompress = useCallback(async () => {
    if (!originalFile) return;

    setIsLoading(true);
    const blob = await compressImage(originalFile, quality / 100, format);
    setIsLoading(false);

    if (blob) {
      if (compressedPreview) URL.revokeObjectURL(compressedPreview);
      setCompressedBlob(blob);
      setCompressedPreview(URL.createObjectURL(blob));
    } else {
      showToast("画像の圧縮に失敗しました", "error");
    }
  }, [originalFile, quality, format, compressedPreview, showToast]);

  const handleDownload = useCallback(() => {
    if (!compressedBlob || !originalFile) return;

    const url = URL.createObjectURL(compressedBlob);
    const filename = generateFilename(originalFile.name, format);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("ダウンロードを開始しました", "success");
  }, [compressedBlob, originalFile, format, showToast]);

  const handleClear = useCallback(() => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (compressedPreview) URL.revokeObjectURL(compressedPreview);

    setOriginalFile(null);
    setOriginalPreview(null);
    setCompressedBlob(null);
    setCompressedPreview(null);

    showToast("クリアしました", "info");
  }, [originalPreview, compressedPreview, showToast]);

  const compressionRatio = originalFile && compressedBlob
    ? calculateCompressionRatio(originalFile.size, compressedBlob.size)
    : 0;

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">画像選択</h2>

          <Dropzone
            onFileSelect={handleFileSelect}
            accept="image/*"
            disabled={isLoading}
            ariaLabel="画像ファイルをアップロード"
            text="クリックして画像を選択、またはドラッグ&ドロップ"
            hint="PNG, JPEG, WebP など"
          />
        </div>

        {originalFile && (
          <>
            <div className="converter-section">
              <h2 className="section-title">圧縮設定</h2>

              <Stack spacing={3} sx={{ mb: 3 }}>
                <Box>
                  <Slider
                    label="画質"
                    value={quality}
                    onChange={setQuality}
                    min={1}
                    max={100}
                    unit="%"
                    disabled={isLoading}
                    helpText={`値が低いほどファイルサイズが小さくなります${format === "png" ? "（PNGは画質設定が無視されます）" : ""}`}
                  />
                </Box>

                <FormControl size="small" sx={{ maxWidth: 200 }}>
                  <InputLabel id="format-label">出力形式</InputLabel>
                  <Select
                    labelId="format-label"
                    id="format"
                    value={format}
                    label="出力形式"
                    onChange={(e) => setFormat(e.target.value as OutputFormat)}
                    disabled={isLoading}
                  >
                    {FORMAT_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    WebPは高い圧縮率、JPEGは広い互換性
                  </FormHelperText>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleDownload}
                  disabled={isLoading || !compressedBlob}
                >
                  ダウンロード
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  クリア
                </Button>
              </Stack>
            </div>

            <div className="converter-section">
              <h2 className="section-title">比較プレビュー</h2>

              {compressedBlob && (
                <div className="compression-stats">
                  <div className="stat-item">
                    <span className="stat-label">元のサイズ</span>
                    <span className="stat-value">{formatFileSize(originalFile.size)}</span>
                  </div>
                  <div className="stat-item stat-arrow" aria-hidden="true">→</div>
                  <div className="stat-item">
                    <span className="stat-label">圧縮後</span>
                    <span className="stat-value">{formatFileSize(compressedBlob.size)}</span>
                  </div>
                  <div className="stat-item stat-ratio">
                    <span className="stat-label">削減率</span>
                    <span className={`stat-value ${compressionRatio > 0 ? "stat-positive" : "stat-negative"}`}>
                      {compressionRatio > 0 ? `-${compressionRatio}%` : `+${Math.abs(compressionRatio)}%`}
                    </span>
                  </div>
                </div>
              )}

              <div className="preview-comparison">
                <div className="preview-panel">
                  <h3 className="preview-label">元の画像</h3>
                  <div className="preview-image-container">
                    {originalPreview ? (
                      <img
                        src={originalPreview}
                        alt="元の画像"
                        className="preview-image"
                      />
                    ) : (
                      <span className="preview-placeholder">プレビューなし</span>
                    )}
                  </div>
                </div>
                <div className="preview-panel">
                  <h3 className="preview-label">圧縮後</h3>
                  <div className="preview-image-container">
                    {isLoading ? (
                      <div className="loading-enhanced">
                        <div className="spinner-enhanced" />
                        <span className="loading-text">圧縮中...</span>
                      </div>
                    ) : compressedPreview ? (
                      <img
                        src={compressedPreview}
                        alt="圧縮後の画像"
                        className="preview-image"
                      />
                    ) : (
                      <span className="preview-placeholder">圧縮待ち</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">画像圧縮とは</h3>
          <ul>
            <li>画像のファイルサイズを削減し、Webサイトの読み込み速度を改善します</li>
            <li>視覚的な品質を維持しながらファイルサイズを大幅に削減可能</li>
            <li>すべての処理はブラウザ内で完結（サーバーにアップロードされません）</li>
          </ul>
          <h3 id="format-title">形式について</h3>
          <ul>
            <li><strong>JPEG:</strong> 写真に最適、広い互換性、透過非対応</li>
            <li><strong>WebP:</strong> 高い圧縮率、モダンブラウザ対応、透過対応</li>
            <li><strong>PNG:</strong> 可逆圧縮、透過対応、ファイルサイズ大</li>
          </ul>
          <h3 id="tips-title">Tips</h3>
          <ul>
            <li>写真は60-80%の画質でほとんど見分けがつきません</li>
            <li>WebP形式はJPEGより約25-35%小さくなります</li>
            <li>透過が必要な場合はWebPまたはPNGを選択</li>
          </ul>
        </aside>
      </div>

      <style>{`
        .compression-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .stat-arrow {
          font-size: 1.5rem;
          color: var(--md-sys-color-primary);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--md-sys-color-on-surface-variant);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 500;
          font-family: 'Roboto Mono', monospace;
          color: var(--md-sys-color-on-surface);
        }

        .stat-ratio .stat-value {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
        }

        .stat-positive {
          background-color: var(--md-sys-color-primary-container);
          color: var(--md-sys-color-on-primary-container);
        }

        .stat-negative {
          background-color: var(--md-sys-color-error-container);
          color: var(--md-sys-color-error);
        }

        .preview-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .preview-panel {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .preview-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--md-sys-color-on-surface-variant);
          text-align: center;
        }

        .preview-image-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0.5rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 8px;
          min-height: 200px;
          max-height: 400px;
          overflow: hidden;
        }

        .preview-image {
          max-width: 100%;
          max-height: 380px;
          object-fit: contain;
          border-radius: 4px;
        }

        .preview-placeholder {
          color: var(--md-sys-color-on-surface-variant);
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .preview-comparison {
            grid-template-columns: 1fr;
          }

          .compression-stats {
            flex-direction: column;
          }

          .stat-arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </>
  );
}
