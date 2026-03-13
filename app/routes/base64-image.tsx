/**
 * @fileoverview Base64画像デコードツール
 * Base64文字列を画像としてプレビューする機能を提供する
 */

import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";

export const Route = createFileRoute("/base64-image")({
  head: () => ({
    meta: [
    { title: "Base64画像デコード | Web ツール集" },
    { name: "description", content: "Base64文字列またはData URIを画像としてプレビュー・変換するツール。" },
    { property: "og:title", content: "Base64画像デコード | Web ツール集" },
    { property: "og:description", content: "Base64文字列またはData URIを画像としてプレビュー・変換するツール。" },
    { property: "og:url", content: `${SITE_BASE_URL}/base64-image` },
    { property: "og:type", content: "website" },
    { property: "og:image", content: SITE_OGP_IMAGE },
    { name: "twitter:title", content: "Base64画像デコード | Web ツール集" },
    { name: "twitter:description", content: "Base64文字列またはData URIを画像としてプレビュー・変換するツール。" },
  ],
  }),
  component: Base64ImageDecoder,
});

/**
 * サポートするMIMEタイプの定義
 * 注意: SVGはXSS脆弱性のリスクがあるため除外しています
 */
const MIME_TYPE_OPTIONS = [
  { value: "image/png", label: "PNG" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/gif", label: "GIF" },
  { value: "image/webp", label: "WebP" },
] as const;

/**
 * MIMEタイプの型
 */
type MimeType = (typeof MIME_TYPE_OPTIONS)[number]["value"];

/**
 * Base64文字列が有効かどうかを検証する
 * @param str - 検証する文字列
 * @returns 有効なBase64文字列の場合はtrue
 */
export function isValidBase64(str: string): boolean {
  if (!str || str.trim() === "") return false;
  const cleaned = str.trim().replace(/\s/g, "");
  return /^[A-Za-z0-9+/]+=*$/.test(cleaned) && cleaned.length % 4 === 0;
}

/**
 * 文字列がData URI形式かどうかを検証する
 * @param str - 検証する文字列
 * @returns Data URI形式の場合はtrue
 */
export function isValidDataUri(str: string): boolean {
  return /^data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/]+=*$/.test(str.trim());
}

/**
 * Data URIからMIMEタイプを抽出する
 * @param dataUri - Data URI文字列
 * @returns MIMEタイプ文字列（例: "image/png"）
 */
export function getMimeTypeFromDataUri(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : "image/png";
}

/**
 * ピュアBase64文字列をData URI形式に変換する
 * @param base64 - ピュアBase64文字列
 * @param mimeType - MIMEタイプ（デフォルト: "image/png"）
 * @returns Data URI文字列
 */
export function pureBase64ToDataUri(
  base64: string,
  mimeType: string = "image/png"
): string {
  return `data:${mimeType};base64,${base64.trim()}`;
}

/**
 * Data URI文字列からピュアBase64部分を抽出する
 * @param dataUri - Data URI文字列
 * @returns ピュアBase64文字列
 */
export function dataUriToPureBase64(dataUri: string): string {
  const match = dataUri.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : "";
}

/**
 * Base64画像デコードコンポーネント
 * Base64文字列またはData URIを入力して画像としてプレビュー表示する
 */
function Base64ImageDecoder() {
  const [decodeInput, setDecodeInput] = useState<string>("");
  const [decodePreview, setDecodePreview] = useState<string>("");
  const [decodeError, setDecodeError] = useState<string>("");
  const [decodeMimeType, setDecodeMimeType] = useState<MimeType>("image/png");
  const [detectedMimeType, setDetectedMimeType] = useState<string>("");

  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** 入力変化時のハンドラ */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDecodeInput(e.target.value);
      setDecodeError("");
      setDecodePreview("");
      setDetectedMimeType("");
    },
    []
  );

  /** Base64をデコードして画像プレビューを表示する */
  const handleDecode = useCallback(() => {
    const trimmed = decodeInput.trim();
    if (!trimmed) {
      showToast("Base64文字列を入力してください", "error");
      textareaRef.current?.focus();
      return;
    }

    let dataUri: string;
    let mimeType: string;

    if (isValidDataUri(trimmed)) {
      // Data URI形式
      dataUri = trimmed;
      mimeType = getMimeTypeFromDataUri(trimmed);
    } else if (isValidBase64(trimmed)) {
      // ピュアBase64 → Data URI変換
      mimeType = decodeMimeType;
      dataUri = pureBase64ToDataUri(trimmed, mimeType);
    } else {
      const errMsg = "有効なBase64文字列またはData URI（data:image/...;base64,...）を入力してください";
      setDecodeError(errMsg);
      announceStatus(`エラー: ${errMsg}`);
      showToast("無効なBase64文字列です", "error");
      return;
    }

    // 画像として検証（ハンドラをnullにしてメモリリークを防ぐ）
    const img = new Image();
    img.onload = () => {
      img.onload = null;
      img.onerror = null;
      setDecodePreview(dataUri);
      setDetectedMimeType(mimeType);
      setDecodeError("");
      announceStatus("デコードが完了しました");
      showToast("デコードが完了しました", "success");
    };
    img.onerror = () => {
      img.onload = null;
      img.onerror = null;
      setDecodePreview("");
      setDetectedMimeType("");
      const errMsg = "Base64文字列を画像として解釈できませんでした。形式を確認してください";
      setDecodeError(errMsg);
      announceStatus(`エラー: ${errMsg}`);
      showToast("画像のデコードに失敗しました", "error");
    };
    img.src = dataUri;
  }, [decodeInput, decodeMimeType, showToast, announceStatus]);

  /** 入力と結果をクリアする */
  const handleClear = useCallback(() => {
    setDecodeInput("");
    setDecodePreview("");
    setDecodeError("");
    setDetectedMimeType("");
    setDecodeMimeType("image/png");
    announceStatus("クリアしました");
    textareaRef.current?.focus();
  }, [announceStatus]);

  /** デコード結果のData URIをコピーする */
  const handleCopyDataUri = useCallback(async () => {
    if (!decodePreview) return;
    const success = await copy(decodePreview);
    if (success) {
      showToast("Data URIをコピーしました", "success");
      announceStatus("クリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [decodePreview, copy, showToast, announceStatus]);

  /** Enterキーでデコード実行 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDecode();
      }
    },
    [handleDecode]
  );

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">Base64文字列を入力</h2>
          <p className="section-description">
            Base64文字列またはData URI（data:image/png;base64,...）を入力してください
          </p>

          <div className="option-group">
            <label htmlFor="decodeMimeType" className="option-label">
              MIMEタイプ（ピュアBase64の場合に指定）
            </label>
            <select
              id="decodeMimeType"
              className="select-input"
              value={decodeMimeType}
              onChange={(e) => setDecodeMimeType(e.target.value as MimeType)}
              aria-label="デコード時のMIMEタイプ選択"
            >
              {MIME_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            ref={textareaRef}
            id="decodeInput"
            className="base64-decode-textarea"
            value={decodeInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...\nまたはピュアBase64文字列"}
            aria-label="デコードするBase64文字列または Data URI"
            aria-describedby={decodeError ? "decode-error-msg" : "decode-hint"}
            aria-invalid={!!decodeError}
            rows={8}
          />

          <p id="decode-hint" className="input-hint">
            Ctrl+Enter でデコードを実行できます
          </p>

          {decodeError && (
            <p
              id="decode-error-msg"
              className="error-message"
              role="alert"
              aria-live="assertive"
            >
              {decodeError}
            </p>
          )}

          <div className="button-group" role="group" aria-label="デコード操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleDecode}
              aria-label="Base64文字列を画像としてデコード"
            >
              デコード
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と結果をクリア"
            >
              クリア
            </Button>
          </div>
        </div>

        {decodePreview && (
          <>
            <div className="converter-section">
              <h2 className="section-title">デコード結果</h2>

              {detectedMimeType && (
                <div className="result-card" aria-label="検出された画像情報">
                  <div className="result-row">
                    <span className="result-label">MIMEタイプ</span>
                    <span className="result-value">{detectedMimeType}</span>
                  </div>
                </div>
              )}

              <div className="base64-decode-preview">
                <img
                  src={decodePreview}
                  alt="Base64デコードされた画像のプレビュー"
                />
              </div>

              <div
                className="button-group"
                role="group"
                aria-label="デコード結果の操作"
              >
                <Button
                  type="button"
                  className="btn-copy"
                  onClick={handleCopyDataUri}
                  aria-label="Data URIをクリップボードにコピー"
                >
                  Data URIをコピー
                </Button>
              </div>
            </div>
          </>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "Base64文字列またはData URI（data:image/png;base64,...）を入力",
                "ピュアBase64の場合は画像形式（MIMEタイプ）を選択してください",
                "「デコード」ボタンまたはCtrl+Enterで画像をプレビュー",
                "「Data URIをコピー」でData URI形式をクリップボードにコピー",
                "すべての処理はブラウザ内で完結（サーバーに送信されません）",
              ],
            },
            {
              title: "入力形式について",
              items: [
                "Data URI形式: data:image/png;base64,iVBORw0KGgo=...",
                "ピュアBase64: iVBORw0KGgoAAAANSUhEUg...",
                "Data URI形式の場合、MIMEタイプは自動的に検出されます",
                "ピュアBase64の場合は形式を選択する必要があります",
              ],
            },
            {
              title: "対応フォーマット",
              items: [
                "PNG・JPEG・GIF・WebP・SVG",
                "画像→Base64変換は「画像」メニューの「Base64変換」をご利用ください",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
