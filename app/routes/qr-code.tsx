import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import {
  type QrSize,
  type QrErrorCorrectionLevel,
  QR_SIZES,
  validateQrInput,
  getQrSizeLabel,
  isValidHexColor,
} from "~/utils/qr-code";

export const Route = createFileRoute("/qr-code")({
  head: () => ({
    meta: [{ title: "QRコード生成ツール" }],
  }),
  component: QrCodeGenerator,
});

const SIZE_OPTIONS: { value: QrSize; label: string }[] = QR_SIZES.map(
  (size) => ({
    value: size,
    label: `${getQrSizeLabel(size)}`,
  })
);

const ERROR_CORRECTION_OPTIONS: {
  value: QrErrorCorrectionLevel;
  label: string;
  description: string;
}[] = [
  { value: "L", label: "L (7%)", description: "低い復元能力・データ量少" },
  { value: "M", label: "M (15%)", description: "標準的な復元能力" },
  { value: "Q", label: "Q (25%)", description: "高い復元能力" },
  { value: "H", label: "H (30%)", description: "最高の復元能力・データ量多" },
];

/**
 * QRコード生成コンポーネント
 * テキストやURLからQRコードをリアルタイムで生成する
 */
function QrCodeGenerator() {
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState<QrSize>(256);
  const [errorLevel, setErrorLevel] = useState<QrErrorCorrectionLevel>("M");
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [hasQr, setHasQr] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  /**
   * QRコードをCanvasに描画する
   */
  const renderQrCode = useCallback(async () => {
    if (!canvasRef.current) return;

    if (!validateQrInput(text)) {
      setHasQr(false);
      setError(
        text.length === 0
          ? null
          : "入力が長すぎます。4296文字以内で入力してください。"
      );
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        canvasRef.current.width = size;
        canvasRef.current.height = size;
        ctx.clearRect(0, 0, size, size);
      }
      return;
    }

    if (!isValidHexColor(foregroundColor) || !isValidHexColor(backgroundColor)) {
      setHasQr(false);
      setError("カラーコードが無効です。#rrggbb形式で入力してください。");
      return;
    }

    try {
      await QRCode.toCanvas(canvasRef.current, text, {
        width: size,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
        margin: 2,
      });
      setHasQr(true);
      setError(null);
    } catch (err) {
      setHasQr(false);
      setError("QRコードの生成に失敗しました。入力内容を確認してください。");
      console.error("QR code generation error:", err);
    }
  }, [text, size, errorLevel, foregroundColor, backgroundColor]);

  // 入力変更時にQRコードをリアルタイム更新
  useEffect(() => {
    renderQrCode();
  }, [renderQrCode]);

  /**
   * QRコードをPNG形式でダウンロードする
   */
  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !hasQr) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) {
        announceStatus("ダウンロードに失敗しました");
        return;
      }
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `qrcode_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } finally {
        URL.revokeObjectURL(url);
      }
      announceStatus("QRコードをダウンロードしました");
    }, "image/png");
  }, [hasQr, announceStatus]);

  /**
   * QRコードをクリップボードにコピーする（Blob形式）
   */
  const handleCopyToClipboard = useCallback(async () => {
    if (!canvasRef.current || !hasQr) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b), "image/png");
      });

      if (!blob) {
        announceStatus("クリップボードへのコピーに失敗しました");
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      announceStatus("QRコードをクリップボードにコピーしました");
    } catch (err) {
      console.error("Clipboard write failed:", err);
      announceStatus("クリップボードへのコピーに失敗しました");
    }
  }, [hasQr, announceStatus]);

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">QRコード設定</h2>

          <div className="option-group">
            <label htmlFor="qr-text">テキスト / URL:</label>
            <Input
              type="text"
              id="qr-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://example.com またはテキストを入力"
              aria-describedby="qr-text-help"
            />
            <span id="qr-text-help" className="sr-only">
              QRコードに変換するテキストまたはURLを入力してください
            </span>
          </div>

          <div className="qr-options-grid">
            <div className="option-group">
              <label htmlFor="qr-size">サイズ:</label>
              <select
                id="qr-size"
                value={size}
                onChange={(e) => setSize(Number(e.target.value) as QrSize)}
                aria-describedby="qr-size-help"
              >
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span id="qr-size-help" className="sr-only">
                生成するQRコードのサイズを選択します
              </span>
            </div>

            <div className="option-group">
              <label htmlFor="qr-error-level">エラー訂正レベル:</label>
              <select
                id="qr-error-level"
                value={errorLevel}
                onChange={(e) =>
                  setErrorLevel(e.target.value as QrErrorCorrectionLevel)
                }
                aria-describedby="qr-error-level-help"
              >
                {ERROR_CORRECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
              <span id="qr-error-level-help" className="sr-only">
                QRコードのエラー訂正レベルを選択します。レベルが高いほど破損しても読み取れます
              </span>
            </div>

            <div className="option-group">
              <label htmlFor="qr-fg-color">前景色（ドット色）:</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="qr-fg-color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="qr-color-input"
                  aria-describedby="qr-fg-color-help"
                />
                <input
                  type="text"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="前景色のHEX値"
                  className="qr-hex-input"
                />
              </div>
              <span id="qr-fg-color-help" className="sr-only">
                QRコードのドット（前景）の色を選択します
              </span>
            </div>

            <div className="option-group">
              <label htmlFor="qr-bg-color">背景色:</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="qr-bg-color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="qr-color-input"
                  aria-describedby="qr-bg-color-help"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="背景色のHEX値"
                  className="qr-hex-input"
                />
              </div>
              <span id="qr-bg-color-help" className="sr-only">
                QRコードの背景色を選択します
              </span>
            </div>
          </div>
        </div>

        <div className="converter-section">
          <h2 className="section-title">プレビュー</h2>

          {error && (
            <div className="error-message" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="qr-canvas-container" aria-label="QRコードプレビューエリア">
            <canvas
              ref={canvasRef}
              aria-label={
                hasQr
                  ? `QRコード: ${text}`
                  : "QRコードがここに表示されます"
              }
              role="img"
            />
            {text.length === 0 && (
              <p className="qr-placeholder-text">
                テキストまたはURLを入力するとQRコードが生成されます
              </p>
            )}
          </div>

          <div className="qr-download-section" role="group" aria-label="QRコード操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              disabled={!hasQr}
              aria-disabled={!hasQr}
            >
              PNGでダウンロード
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleCopyToClipboard}
              disabled={!hasQr}
              aria-disabled={!hasQr}
            >
              クリップボードにコピー
            </Button>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "QRコードとは",
              items: [
                "Quick Response Codeの略で、2次元バーコードの一種です",
                "URLやテキストを素早く共有するのに便利です",
                "スマートフォンのカメラで簡単に読み取れます",
                "最大4296文字（英数字）まで格納できます",
              ],
            },
            {
              title: "エラー訂正レベルについて",
              items: [
                "L (7%): 最小限の冗長データ。シンプルなコードに最適",
                "M (15%): バランスの取れた標準設定。一般的な用途に推奨",
                "Q (25%): 汚れや損傷に強い。印刷物に適している",
                "H (30%): 最高の耐久性。ロゴを重ねる場合や過酷な環境向け",
              ],
            },
            {
              title: "活用例",
              items: [
                "WebサイトURLの共有（名刺、チラシ、ポスター）",
                "Wi-Fiの接続情報の共有",
                "連絡先情報（vCard形式）の共有",
                "テキストメモやアプリリンクの共有",
              ],
            },
            {
              title: "色のカスタマイズ",
              items: [
                "前景色はQRコードのドット（モジュール）の色です",
                "背景色は前景色と十分なコントラストを確保してください",
                "コントラスト比が低いとスキャンできない場合があります",
                "白背景・黒ドットが最も読み取りやすい組み合わせです",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
