import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { ImageUploadZone } from "~/components/ImageUploadZone";
import { formatFileSize } from "~/utils/image";
import { useClipboard } from "~/hooks/useClipboard";

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
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();
  const { copy } = useClipboard();

  const handleFileSelect = useCallback(
    async (file: File) => {
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
      } catch {
        showToast("変換に失敗しました", "error");
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const handleCopy = useCallback(async () => {
    if (!base64Data) return;

    const output = formatOutput(base64Data, outputFormat);
    const success = await copy(output);

    if (success) {
      showToast("クリップボードにコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [base64Data, outputFormat, copy, showToast]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setBase64Data("");
    setOutputFormat("dataUrl");
    setImageDimensions(null);

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

          <ImageUploadZone
            onFileSelect={handleFileSelect}
            onTypeError={() => showToast("画像ファイルを選択してください", "error")}
            disabled={isLoading}
            hint="PNG, JPEG, WebP, GIF など"
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
              <div className="format-options">
                {FORMAT_OPTIONS.map((option) => (
                  <label key={option.value} className="radio-option">
                    <input
                      type="radio"
                      name="outputFormat"
                      value={option.value}
                      checked={outputFormat === option.value}
                      onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                      disabled={isLoading}
                    />
                    <div className="radio-content">
                      <span className="radio-label">{option.label}</span>
                      <span className="radio-description">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
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
                <Button
                  type="button"
                  onClick={handleCopy}
                  disabled={isLoading || !base64Data}
                >
                  コピー
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
            </div>
          </>
        )}

        <TipsCard
          sections={[
            {
              title: "画像Base64変換とは",
              items: [
                "画像ファイルをBase64形式のテキストデータに変換します",
                "HTMLやCSSに直接埋め込むことができます",
                "小さな画像やアイコンの埋め込みに便利です",
                "すべての処理はブラウザ内で完結（サーバーにアップロードされません）",
              ],
            },
            {
              title: "出力形式について",
              items: [
                "Data URL: ブラウザで直接読み込める形式",
                "Base64のみ: エンコードされた文字列のみ",
                "HTML img形式: HTML imgタグとして使用可能",
                "CSS background形式: CSS背景画像として使用可能",
              ],
            },
            {
              title: "Tips",
              items: [
                "Base64変換すると元のファイルサイズより約33%増加します",
                "大きな画像はファイルサイズが大幅に増えるため推奨されません",
                "アイコンやロゴなど小さな画像に最適です",
                "Data URL形式ならHTMLのsrc属性に直接指定できます",
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
