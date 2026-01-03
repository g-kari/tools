import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/image-base64")({
  head: () => ({
    meta: [{ title: "画像Base64変換ツール" }],
  }),
  component: ImageBase64Converter,
});

/**
 * 出力形式の定義
 */
type OutputFormat = "dataUrl" | "base64Only" | "htmlImg" | "cssBackground";

/**
 * 出力形式オプションの定義
 */
interface FormatOption {
  value: OutputFormat;
  label: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: "dataUrl",
    label: "Data URL",
    description: "data:image/png;base64,...",
  },
  {
    value: "base64Only",
    label: "Base64のみ",
    description: "iVBORw0KGgoAAAA...",
  },
  {
    value: "htmlImg",
    label: "HTML img形式",
    description: '<img src="data:..." />',
  },
  {
    value: "cssBackground",
    label: "CSS background形式",
    description: "background-image: url(...);",
  },
];

/**
 * ファイルサイズを人間が読みやすい形式にフォーマットする
 * @param bytes - バイト数
 * @returns フォーマットされた文字列（例: "1.5 MB"）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 画像ファイルをBase64エンコードする
 * @param file - 画像ファイル
 * @returns Base64エンコードされたData URL
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Data URLからBase64部分のみを抽出する
 * @param dataUrl - Data URL形式の文字列
 * @returns Base64文字列
 */
export function extractBase64(dataUrl: string): string {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  return matches ? matches[2] : "";
}

/**
 * 指定された形式で出力文字列を生成する
 * @param dataUrl - Data URL形式の文字列
 * @param format - 出力形式
 * @returns フォーマットされた文字列
 */
export function formatOutput(dataUrl: string, format: OutputFormat): string {
  switch (format) {
    case "dataUrl":
      return dataUrl;
    case "base64Only":
      return extractBase64(dataUrl);
    case "htmlImg":
      return `<img src="${dataUrl}" alt="Image" />`;
    case "cssBackground":
      return `background-image: url('${dataUrl}');`;
    default:
      return dataUrl;
  }
}

/**
 * 数値をカンマ区切りでフォーマットする
 * @param num - 数値
 * @returns カンマ区切りの文字列
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("ja-JP");
}

/**
 * 画像をBase64形式に変換するコンバーターコンポーネント
 * ドラッグ&ドロップ、ファイル選択、複数の出力形式をサポート
 */
function ImageBase64Converter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string>("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("dataUrl");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast("画像ファイルを選択してください", "error");
        return;
      }

      setIsLoading(true);
      setSelectedFile(file);

      try {
        const dataUrl = await imageToBase64(file);
        setBase64Data(dataUrl);

        // プレビュー用に画像サイズを取得
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          setIsLoading(false);
        };
        img.onerror = () => {
          showToast("画像の読み込みに失敗しました", "error");
          setIsLoading(false);
        };
        img.src = dataUrl;
        setPreview(dataUrl);

        showToast("Base64変換が完了しました", "success");
      } catch (error) {
        showToast("変換に失敗しました", "error");
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

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

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleCopy = useCallback(async () => {
    if (!base64Data) return;

    const output = formatOutput(base64Data, outputFormat);

    try {
      await navigator.clipboard.writeText(output);
      showToast("クリップボードにコピーしました", "success");
    } catch (error) {
      // フォールバック: textareaを選択してコピー
      if (textareaRef.current) {
        textareaRef.current.select();
        const success = document.execCommand("copy");
        if (success) {
          showToast("クリップボードにコピーしました", "success");
        } else {
          showToast("コピーに失敗しました", "error");
        }
      } else {
        showToast("コピーに失敗しました", "error");
      }
    }
  }, [base64Data, outputFormat, showToast]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setBase64Data("");
    setOutputFormat("dataUrl");
    setImageDimensions(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    showToast("クリアしました", "info");
  }, [showToast]);

  const outputText = base64Data ? formatOutput(base64Data, outputFormat) : "";
  const characterCount = outputText.length;
  const base64OnlyLength = base64Data ? extractBase64(base64Data).length : 0;

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
              <p className="dropzone-hint">PNG, JPEG, WebP, GIF など</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            id="imageFile"
            accept="image/*"
            onChange={handleInputChange}
            disabled={isLoading}
            className="hidden-file-input"
            aria-label="画像ファイルを選択"
          />
        </div>

        {selectedFile && (
          <>
            <div className="converter-section">
              <h2 className="section-title">画像情報</h2>
              <div className="image-info-grid">
                <div className="info-item">
                  <span className="info-label">ファイル名</span>
                  <span className="info-value">{selectedFile.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">ファイルサイズ</span>
                  <span className="info-value">{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">形式</span>
                  <span className="info-value">{selectedFile.type}</span>
                </div>
                {imageDimensions && (
                  <div className="info-item">
                    <span className="info-label">解像度</span>
                    <span className="info-value">{imageDimensions.width} × {imageDimensions.height} px</span>
                  </div>
                )}
              </div>
            </div>

            <div className="converter-section">
              <h2 className="section-title">プレビュー</h2>
              <div className="preview-container">
                {isLoading ? (
                  <div className="loading-enhanced">
                    <div className="spinner-enhanced" />
                    <span className="loading-text">読み込み中...</span>
                  </div>
                ) : preview ? (
                  <img
                    src={preview}
                    alt="プレビュー"
                    className="base64-preview-image"
                  />
                ) : null}
              </div>
            </div>

            <div className="converter-section">
              <h2 className="section-title">出力形式</h2>
              <RadioGroup value={outputFormat} onValueChange={(value) => setOutputFormat(value as OutputFormat)} disabled={isLoading}>
                <div className="format-options">
                  {FORMAT_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem value={option.value} id={`format-${option.value}`} />
                      <Label htmlFor={`format-${option.value}`} className="cursor-pointer">
                        <div className="radio-content">
                          <span className="radio-label">{option.label}</span>
                          <span className="radio-description">{option.description}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="converter-section">
              <h2 className="section-title">Base64文字列</h2>

              <div className="base64-stats">
                <div className="stat-item">
                  <span className="stat-label">文字数</span>
                  <span className="stat-value">{formatNumber(characterCount)} 文字</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Base64部分</span>
                  <span className="stat-value">{formatNumber(base64OnlyLength)} 文字</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">元ファイルサイズ</span>
                  <span className="stat-value">{formatFileSize(selectedFile.size)}</span>
                </div>
              </div>

              <Textarea
                ref={textareaRef}
                className="base64-output"
                value={outputText}
                readOnly
                rows={10}
                aria-label="Base64変換結果"
              />

              <div className="button-group" role="group" aria-label="操作">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopy}
                  disabled={isLoading || !base64Data}
                >
                  コピー
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
            </div>
          </>
        )}

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">画像Base64変換とは</h3>
          <ul>
            <li>画像ファイルをBase64形式のテキストデータに変換します</li>
            <li>HTMLやCSSに直接埋め込むことができます</li>
            <li>小さな画像やアイコンの埋め込みに便利です</li>
            <li>すべての処理はブラウザ内で完結（サーバーにアップロードされません）</li>
          </ul>
          <h3 id="format-title">出力形式について</h3>
          <ul>
            <li><strong>Data URL</strong>: ブラウザで直接読み込める形式</li>
            <li><strong>Base64のみ</strong>: エンコードされた文字列のみ</li>
            <li><strong>HTML img形式</strong>: HTML imgタグとして使用可能</li>
            <li><strong>CSS background形式</strong>: CSS背景画像として使用可能</li>
          </ul>
          <h3 id="tips-title">Tips</h3>
          <ul>
            <li>Base64変換すると元のファイルサイズより約33%増加します</li>
            <li>大きな画像はファイルサイズが大幅に増えるため推奨されません</li>
            <li>アイコンやロゴなど小さな画像に最適です</li>
            <li>Data URL形式ならHTMLのsrc属性に直接指定できます</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
