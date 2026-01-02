import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { ColorInput } from "../components/ColorInput";
import { Slider } from "../components/Slider";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

export const Route = createFileRoute("/dummy-image")({
  head: () => ({
    meta: [{ title: "ダミー画像生成ツール" }],
  }),
  component: DummyImageGenerator,
});

type ImageFormat = "png" | "jpeg" | "webp";

const FORMAT_OPTIONS: { value: ImageFormat; label: string; mimeType: string }[] = [
  { value: "png", label: "PNG", mimeType: "image/png" },
  { value: "jpeg", label: "JPEG", mimeType: "image/jpeg" },
  { value: "webp", label: "WebP", mimeType: "image/webp" },
];

const PRESET_SIZES = [
  { label: "SNSアイコン", width: 400, height: 400 },
  { label: "OGP画像", width: 1200, height: 630 },
  { label: "HD (720p)", width: 1280, height: 720 },
  { label: "Full HD (1080p)", width: 1920, height: 1080 },
  { label: "スマホ縦", width: 375, height: 812 },
  { label: "タブレット", width: 768, height: 1024 },
];

const MIN_SIZE = 1;
const MAX_SIZE = 4096;

/**
 * Canvas上にダミー画像を描画する
 * @param canvas - 描画対象のCanvasElement
 * @param width - 画像の幅
 * @param height - 画像の高さ
 * @param bgColor - 背景色
 * @param textColor - テキスト色
 */
export function drawDummyImage(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  bgColor: string,
  textColor: string
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = width;
  canvas.height = height;

  // 背景を塗りつぶし
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // サイズテキストを描画（最小フォントサイズ12pxをSVG生成と統一）
  const text = `${width} × ${height}`;
  const fontSize = Math.max(12, Math.min(width, height) / 8);
  ctx.font = `bold ${fontSize}px 'Roboto', sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);
}

/**
 * Canvasの内容をBlobに変換する
 * @param canvas - 変換対象のCanvasElement
 * @param format - 画像形式
 * @param quality - 画質（0-1）
 * @returns Blobを含むPromise
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality: number = 0.92
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const mimeType = FORMAT_OPTIONS.find((f) => f.value === format)?.mimeType || "image/png";
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * ダウンロード用のファイル名を生成する
 * @param width - 画像の幅
 * @param height - 画像の高さ
 * @param format - 画像形式
 * @returns ファイル名
 */
export function generateFilename(width: number, height: number, format: ImageFormat): string {
  return `dummy_${width}x${height}.${format}`;
}

function DummyImageGenerator() {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [bgColor, setBgColor] = useState("#6750A4");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [format, setFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState(92);

  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // 画像を描画
  const renderImage = useCallback(() => {
    if (canvasRef.current) {
      drawDummyImage(canvasRef.current, width, height, bgColor, textColor);
    }
  }, [width, height, bgColor, textColor]);

  // パラメータ変更時に再描画
  useEffect(() => {
    renderImage();
  }, [renderImage]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const handleWidthChange = useCallback((value: number) => {
    setWidth(Math.max(MIN_SIZE, Math.min(MAX_SIZE, value || MIN_SIZE)));
  }, []);

  const handleHeightChange = useCallback((value: number) => {
    setHeight(Math.max(MIN_SIZE, Math.min(MAX_SIZE, value || MIN_SIZE)));
  }, []);

  const handlePresetSelect = useCallback((preset: { width: number; height: number }) => {
    setWidth(preset.width);
    setHeight(preset.height);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return;

    const blob = await canvasToBlob(canvasRef.current, format, quality / 100);
    if (!blob) {
      announceStatus("画像の生成に失敗しました");
      return;
    }

    const url = URL.createObjectURL(blob);
    const filename = generateFilename(width, height, format);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    announceStatus(`${format.toUpperCase()}ファイルをダウンロードしました`);
  }, [format, quality, width, height, announceStatus]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await canvasToBlob(canvasRef.current, "png");
      if (!blob) {
        announceStatus("画像の生成に失敗しました");
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      announceStatus("クリップボードにコピーしました");
    } catch (error) {
      console.error("Clipboard write failed:", error);
      announceStatus("クリップボードへのコピーに失敗しました");
    }
  }, [announceStatus]);

  const handleOpenApi = useCallback(() => {
    const bg = bgColor.replace(/^#/, "");
    const text = textColor.replace(/^#/, "");
    const url = `/api/image.svg?w=${width}&h=${height}&bg=${bg}&text=${text}`;
    window.open(url, "_blank");
  }, [width, height, bgColor, textColor]);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDownload();
          }}
          aria-label="ダミー画像生成フォーム"
        >
          <div className="converter-section">
            <h2 className="section-title">画像設定</h2>

            <Stack spacing={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  id="width"
                  label="幅 (px)"
                  type="number"
                  size="small"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                  slotProps={{
                    htmlInput: { min: MIN_SIZE, max: MAX_SIZE },
                  }}
                  sx={{ width: { xs: "100%", sm: 120 } }}
                />
                <TextField
                  id="height"
                  label="高さ (px)"
                  type="number"
                  size="small"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value))}
                  slotProps={{
                    htmlInput: { min: MIN_SIZE, max: MAX_SIZE },
                  }}
                  sx={{ width: { xs: "100%", sm: 120 } }}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <ColorInput
                  value={bgColor}
                  onChange={setBgColor}
                  id="bgColor"
                  label="背景色"
                  ariaLabel="背景色"
                />
                <ColorInput
                  value={textColor}
                  onChange={setTextColor}
                  id="textColor"
                  label="テキスト色"
                  ariaLabel="テキスト色"
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="format-label">形式</InputLabel>
                  <Select
                    labelId="format-label"
                    id="format"
                    value={format}
                    label="形式"
                    onChange={(e) => setFormat(e.target.value as ImageFormat)}
                  >
                    {FORMAT_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {format !== "png" && (
                  <Box sx={{ width: { xs: "100%", sm: 200 } }}>
                    <Slider
                      label="画質"
                      value={quality}
                      onChange={setQuality}
                      min={1}
                      max={100}
                      unit="%"
                      size="small"
                    />
                  </Box>
                )}
              </Stack>
            </Stack>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                プリセットサイズ
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {PRESET_SIZES.map((preset) => (
                  <Chip
                    key={preset.label}
                    label={`${preset.label} (${preset.width}×${preset.height})`}
                    onClick={() => handlePresetSelect(preset)}
                    variant={width === preset.width && height === preset.height ? "filled" : "outlined"}
                    color={width === preset.width && height === preset.height ? "primary" : "default"}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }} flexWrap="wrap" useFlexGap>
              <Button type="submit" variant="contained">
                ダウンロード
              </Button>
              <Button variant="outlined" onClick={handleCopyToClipboard}>
                クリップボードにコピー
              </Button>
              <Button variant="outlined" onClick={handleOpenApi}>
                APIで開く
              </Button>
            </Stack>
          </div>

          <div className="converter-section">
            <h2 className="section-title">プレビュー</h2>
            <div className="preview-container">
              <canvas
                ref={canvasRef}
                aria-label={`プレビュー画像 (${width}x${height})`}
              />
            </div>
            <div className="image-info">
              <div className="info-item">
                <span className="info-label">サイズ:</span>
                <span className="info-value">{width} × {height} px</span>
              </div>
              <div className="info-item">
                <span className="info-label">形式:</span>
                <span className="info-value">{FORMAT_OPTIONS.find((f) => f.value === format)?.label}</span>
              </div>
              {format !== "png" && (
                <div className="info-item">
                  <span className="info-label">画質:</span>
                  <span className="info-value">{quality}%</span>
                </div>
              )}
            </div>
          </div>
        </form>

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">ダミー画像生成とは</h3>
          <ul>
            <li>開発やデザインモックアップ用のプレースホルダー画像を生成します</li>
            <li>指定したサイズと色で画像を作成</li>
            <li>PNG、JPEG、WebP形式でダウンロード可能</li>
          </ul>
          <h3 id="format-title">形式について</h3>
          <ul>
            <li><strong>PNG:</strong> 可逆圧縮、透明度対応、ロゴやアイコンに最適</li>
            <li><strong>JPEG:</strong> 非可逆圧縮、写真に最適、ファイルサイズ小</li>
            <li><strong>WebP:</strong> 高圧縮率、モダンブラウザ対応</li>
          </ul>
          <h3 id="about-tool-title">使い方</h3>
          <ul>
            <li>幅と高さを指定、またはプリセットを選択</li>
            <li>背景色とテキスト色を設定</li>
            <li>プレビューで確認</li>
            <li>「ダウンロード」で画像を保存</li>
          </ul>
          <h3 id="api-title">APIエンドポイント</h3>
          <p>URLで直接画像を取得できます:</p>
          <ul>
            <li><strong>SVG:</strong> <code>/api/image.svg?w=800&h=600</code></li>
            <li><strong>PNG:</strong> <code>/api/image.png?w=800&h=600</code></li>
            <li><strong>JPEG:</strong> <code>/api/image.jpg?w=800&h=600&q=85</code></li>
            <li><strong>WebP:</strong> <code>/api/image.webp?w=800&h=600</code></li>
          </ul>
          <p>カスタム色の例:</p>
          <ul>
            <li><code>/api/image.png?w=1200&h=630&bg=FF0000&text=FFFFFF</code></li>
          </ul>
          <p>パラメータ:</p>
          <ul>
            <li><strong>w</strong>: 幅 (1-4096, デフォルト: 300)</li>
            <li><strong>h</strong>: 高さ (1-4096, デフォルト: 150)</li>
            <li><strong>bg</strong>: 背景色 HEX (デフォルト: 6750A4)</li>
            <li><strong>text</strong>: テキスト色 HEX (デフォルト: FFFFFF)</li>
            <li><strong>q</strong>: 画質 (1-100, デフォルト: 85) ※JPEGのみ</li>
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
        .image-options {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .preview-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 12px;
          overflow: auto;
          max-height: 400px;
          margin-bottom: 1rem;
        }

        .preview-container canvas {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .image-info {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
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
          .image-options {
            flex-direction: column;
          }

          .option-group {
            width: 100%;
          }

          .option-group select,
          .option-group input[type="number"] {
            width: 100%;
          }

          .color-input-wrapper {
            width: 100%;
          }

          .color-input-wrapper input[type="text"] {
            flex: 1;
          }

          .preset-buttons {
            flex-direction: column;
          }

          .btn-preset {
            width: 100%;
          }

          .image-info {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
