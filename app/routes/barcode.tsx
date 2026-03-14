import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useRef, useCallback, useEffect } from "react";
import JsBarcode from "jsbarcode";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import {
  type BarcodeFormat,
  type BarcodeHeight,
  BARCODE_FORMATS,
  BARCODE_HEIGHTS,
  validateBarcodeInput,
  getFormatLabel,
  getFormatPlaceholder,
  getFormatDescription,
} from "~/utils/barcode";
import { isValidHexColor } from "~/utils/qr-code";

export const Route = createFileRoute("/barcode")({
  head: () => ({
    meta: [
      { title: "バーコード生成 | Web ツール集" },
      {
        name: "description",
        content:
          "CODE128・EAN-13・QRコードなど各種バーコード形式を即座に生成・ダウンロードできるツール。",
      },
      { property: "og:title", content: "バーコード生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "CODE128・EAN-13・QRコードなど各種バーコード形式を即座に生成・ダウンロードできるツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/barcode` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "バーコード生成 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "CODE128・EAN-13・QRコードなど各種バーコード形式を即座に生成・ダウンロードできるツール。",
      },
    ],
  }),
  component: BarcodeGenerator,
});

const FORMAT_OPTIONS: { value: BarcodeFormat; label: string }[] =
  BARCODE_FORMATS.map((fmt: BarcodeFormat) => ({
    value: fmt,
    label: getFormatLabel(fmt),
  }));

const HEIGHT_OPTIONS: { value: BarcodeHeight; label: string }[] =
  BARCODE_HEIGHTS.map((h: BarcodeHeight) => ({
    value: h,
    label: `${h}px`,
  }));

/**
 * バーコード生成コンポーネント
 * 各種バーコード形式でバーコードをリアルタイム生成する
 */
function BarcodeGenerator() {
  const [inputValue, setInputValue] = useState("Hello World");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [height, setHeight] = useState<BarcodeHeight>(100);
  const [lineWidth, setLineWidth] = useState(2);
  const [showText, setShowText] = useState(true);
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [hasBarcode, setHasBarcode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const { statusRef, announceStatus } = useStatusAnnouncement();

  /**
   * バーコードをSVG要素にレンダリングする
   */
  const renderBarcode = useCallback(() => {
    if (!svgRef.current) return;

    if (inputValue.length === 0) {
      setHasBarcode(false);
      setError(null);
      // SVGをクリア
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }
      svgRef.current.removeAttribute("width");
      svgRef.current.removeAttribute("height");
      return;
    }

    if (!validateBarcodeInput(inputValue, format)) {
      setHasBarcode(false);
      setError(
        `入力値が ${getFormatLabel(format)} 形式に合致しません。${getFormatDescription(format)}`
      );
      return;
    }

    if (
      !isValidHexColor(foregroundColor) ||
      !isValidHexColor(backgroundColor)
    ) {
      setHasBarcode(false);
      setError("カラーコードが無効です。#rrggbb形式で入力してください。");
      return;
    }

    try {
      JsBarcode(svgRef.current, inputValue, {
        format: format,
        lineColor: foregroundColor,
        background: backgroundColor,
        height: height,
        width: lineWidth,
        displayValue: showText,
        margin: 10,
      });
      setHasBarcode(true);
      setError(null);
    } catch (err) {
      setHasBarcode(false);
      setError(
        "バーコードの生成に失敗しました。入力値と形式の組み合わせを確認してください。"
      );
      console.error("Barcode generation error:", err);
    }
  }, [
    inputValue,
    format,
    height,
    lineWidth,
    showText,
    foregroundColor,
    backgroundColor,
  ]);

  // 入力変更時にバーコードをリアルタイム更新
  useEffect(() => {
    renderBarcode();
  }, [renderBarcode]);

  /**
   * SVGをCanvasに変換してPNG Blobを取得する
   */
  const getSvgAsPngBlob = useCallback(
    (callback: (blob: Blob | null) => void) => {
      if (!svgRef.current || !hasBarcode) {
        callback(null);
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            callback(blob);
          }, "image/png");
        } else {
          callback(null);
        }
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        callback(null);
      };

      img.src = url;
    },
    [hasBarcode, backgroundColor]
  );

  /**
   * バーコードをPNG形式でダウンロードする
   */
  const handleDownload = useCallback(() => {
    if (!hasBarcode) return;

    getSvgAsPngBlob((blob) => {
      if (!blob) {
        announceStatus("ダウンロードに失敗しました");
        return;
      }
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `barcode_${format}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } finally {
        URL.revokeObjectURL(url);
      }
      announceStatus("バーコードをダウンロードしました");
    });
  }, [hasBarcode, format, getSvgAsPngBlob, announceStatus]);

  /**
   * バーコードをクリップボードにコピーする（PNG Blob形式）
   */
  const handleCopyToClipboard = useCallback(async () => {
    if (!hasBarcode) return;

    const blob = await new Promise<Blob | null>((resolve) => {
      getSvgAsPngBlob((b) => resolve(b));
    });

    if (!blob) {
      announceStatus("クリップボードへのコピーに失敗しました");
      return;
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      announceStatus("バーコードをクリップボードにコピーしました");
    } catch (err) {
      console.error("Clipboard write failed:", err);
      announceStatus("クリップボードへのコピーに失敗しました");
    }
  }, [hasBarcode, getSvgAsPngBlob, announceStatus]);

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">バーコード設定</h2>

          <div className="option-group">
            <label htmlFor="barcode-format">バーコード形式:</label>
            <select
              id="barcode-format"
              value={format}
              onChange={(e) => {
                const newFormat = e.target.value as BarcodeFormat;
                setFormat(newFormat);
                setInputValue(getFormatPlaceholder(newFormat));
              }}
              aria-describedby="barcode-format-help"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span
              id="barcode-format-help"
              className="barcode-format-description"
            >
              {getFormatDescription(format)}
            </span>
          </div>

          <div className="option-group">
            <label htmlFor="barcode-value">入力値:</label>
            <Input
              type="text"
              id="barcode-value"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={getFormatPlaceholder(format)}
              aria-describedby="barcode-value-help"
            />
            <span id="barcode-value-help" className="sr-only">
              バーコードに変換する値を入力してください
            </span>
          </div>

          <div className="barcode-options-grid">
            <div className="option-group">
              <label htmlFor="barcode-height">高さ:</label>
              <select
                id="barcode-height"
                value={height}
                onChange={(e) =>
                  setHeight(Number(e.target.value) as BarcodeHeight)
                }
                aria-describedby="barcode-height-help"
              >
                {HEIGHT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span id="barcode-height-help" className="sr-only">
                バーコードの高さを選択します
              </span>
            </div>

            <div className="option-group">
              <label htmlFor="barcode-linewidth">線幅:</label>
              <select
                id="barcode-linewidth"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                aria-describedby="barcode-linewidth-help"
              >
                <option value={1}>細い (1px)</option>
                <option value={2}>標準 (2px)</option>
                <option value={3}>太い (3px)</option>
                <option value={4}>特太 (4px)</option>
              </select>
              <span id="barcode-linewidth-help" className="sr-only">
                バーコードのバー線幅を選択します
              </span>
            </div>

            <div className="option-group">
              <label htmlFor="barcode-fg-color">バー色（前景色）:</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="barcode-fg-color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="barcode-color-input"
                  aria-describedby="barcode-fg-color-help"
                />
                <input
                  type="text"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="前景色のHEX値"
                  className="barcode-hex-input"
                />
              </div>
              <span id="barcode-fg-color-help" className="sr-only">
                バーコードのバー（前景）の色を選択します
              </span>
            </div>

            <div className="option-group">
              <label htmlFor="barcode-bg-color">背景色:</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="barcode-bg-color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="barcode-color-input"
                  aria-describedby="barcode-bg-color-help"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="背景色のHEX値"
                  className="barcode-hex-input"
                />
              </div>
              <span id="barcode-bg-color-help" className="sr-only">
                バーコードの背景色を選択します
              </span>
            </div>

            <div className="option-group">
              <label className="barcode-toggle-label">
                <input
                  type="checkbox"
                  checked={showText}
                  onChange={(e) => setShowText(e.target.checked)}
                  aria-label="バーコード下部に数値・テキストを表示する"
                />
                数値テキストを表示
              </label>
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

          <div
            className="barcode-svg-container"
            aria-label="バーコードプレビューエリア"
          >
            <svg
              ref={svgRef}
              aria-label={
                hasBarcode
                  ? `バーコード: ${inputValue} (${getFormatLabel(format)})`
                  : "バーコードがここに表示されます"
              }
              role="img"
            />
            {inputValue.length === 0 && (
              <p className="barcode-placeholder-text">
                値を入力するとバーコードが生成されます
              </p>
            )}
          </div>

          <div
            className="barcode-download-section"
            role="group"
            aria-label="バーコード操作"
          >
            <Button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              disabled={!hasBarcode}
              aria-disabled={!hasBarcode}
            >
              PNGでダウンロード
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleCopyToClipboard}
              disabled={!hasBarcode}
              aria-disabled={!hasBarcode}
            >
              クリップボードにコピー
            </Button>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "バーコードについて",
              items: [
                "バーコードは黒白の縞模様でデータを表現する光学的な識別コードです",
                "1次元バーコードは読み取り機やスマートフォンのカメラで読み取れます",
                "用途や格納できるデータ量によって形式を使い分けます",
                "印刷時は十分なコントラスト（黒バー・白背景）を確保してください",
              ],
            },
            {
              title: "各形式の特徴",
              items: [
                "CODE 128: 英数字・記号を全般的に格納できる汎用形式",
                "EAN-13: 商品コードとして広く普及（日本ではJANコード）",
                "EAN-8: 小さな商品向けのコンパクトなEAN形式",
                "UPC-A: 北米で主流の商品コード（12桁）",
                "CODE 39: 大文字英数字のみ対応、工業・医療用途に多い",
                "ITF-14: 段ボール箱など梱包物の物流管理に使用（14桁）",
              ],
            },
            {
              title: "EAN-13 入力のポイント",
              items: [
                "12桁入力の場合はチェックディジットを自動付与します",
                "13桁入力の場合はチェックディジットを自動検証します",
                "日本のJANコードは先頭2桁が「45」または「49」です",
                "サンプル: 4901234567894（JANコード例）",
              ],
            },
            {
              title: "色のカスタマイズ",
              items: [
                "バーの色（前景色）は通常は黒（#000000）を使用します",
                "背景色は前景色と十分なコントラストを確保してください",
                "コントラスト比が低いと読み取れない場合があります",
                "白背景・黒バーが最も読み取りやすい組み合わせです",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
