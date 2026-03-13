import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { ImageUploadZone } from "~/components/ImageUploadZone";
import { downloadBlob, formatFileSize } from "~/utils/image";
import {
  convertToDiscordFormat,
  generateDiscordStickerFilename,
  DISCORD_STICKER_SIZE,
  DISCORD_STICKER_MAX_BYTES,
} from "~/utils/discord-image";

export const Route = createFileRoute("/discord-sticker")({
  head: () => ({
    meta: [{ title: "Discordスタンプコンバーター" }],
  }),
  component: DiscordStickerConverter,
});

/**
 * Discordスタンプコンバーターコンポーネント
 * 画像を320x320px・PNG・512KB以下のDiscordスタンプ用フォーマットに変換する
 */
function DiscordStickerConverter() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedPreview, setConvertedPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (convertedPreview) URL.revokeObjectURL(convertedPreview);
    };
  }, [originalPreview, convertedPreview]);

  /**
   * ファイル選択時のハンドラー
   * @param files - 選択されたファイルの配列
   */
  const handleFileSelect = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;

      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (convertedPreview) URL.revokeObjectURL(convertedPreview);

      setOriginalFile(file);
      setOriginalPreview(URL.createObjectURL(file));
      setConvertedBlob(null);
      setConvertedPreview(null);
    },
    [originalPreview, convertedPreview]
  );

  /**
   * 変換ボタンのハンドラー
   * Canvas APIを使用して画像を320x320pxの正方形キャンバスに中央配置して変換する
   */
  const handleConvert = useCallback(async () => {
    if (!originalFile) return;

    setIsLoading(true);
    try {
      const blob = await convertToDiscordFormat(originalFile, {
        type: "sticker",
      });

      if (convertedPreview) URL.revokeObjectURL(convertedPreview);
      setConvertedBlob(blob);
      setConvertedPreview(URL.createObjectURL(blob));
      showToast("Discordスタンプ用に変換しました", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "変換に失敗しました",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [originalFile, convertedPreview, showToast]);

  /**
   * ダウンロードボタンのハンドラー
   */
  const handleDownload = useCallback(() => {
    if (!convertedBlob || !originalFile) return;
    const filename = generateDiscordStickerFilename(originalFile.name);
    downloadBlob(convertedBlob, filename);
    showToast("ダウンロードを開始しました", "success");
  }, [convertedBlob, originalFile, showToast]);

  /**
   * クリアボタンのハンドラー
   */
  const handleClear = useCallback(() => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (convertedPreview) URL.revokeObjectURL(convertedPreview);

    setOriginalFile(null);
    setOriginalPreview(null);
    setConvertedBlob(null);
    setConvertedPreview(null);
    showToast("クリアしました", "info");
  }, [originalPreview, convertedPreview, showToast]);

  return (
    <div className="tool-container">
      {!originalFile ? (
        <>
          <div className="converter-section">
            <h2 className="section-title">画像選択</h2>
            <ImageUploadZone
              onFileSelect={handleFileSelect}
              onTypeError={() =>
                showToast("画像ファイルを選択してください", "error")
              }
              hint="PNG, JPEG, WebP など（透過PNGを推奨）"
              ariaLabel="Discordスタンプに変換する画像をアップロード"
              inputId="discordStickerFile"
            />
          </div>

          <TipsCard
            sections={[
              {
                title: "Discordスタンプコンバーターとは",
                items: [
                  "Discordのスタンプとして使用できる形式に画像を変換するツールです",
                  `変換後の仕様: ${DISCORD_STICKER_SIZE}×${DISCORD_STICKER_SIZE}px（固定）、PNG形式、512KB以下`,
                  "画像はアスペクト比を維持して中央に配置し、余白は透明になります",
                ],
              },
              {
                title: "使い方",
                items: [
                  "変換したい画像をアップロード",
                  "「変換」ボタンをクリック",
                  "プレビューを確認してダウンロード",
                  "Discordのサーバー設定からスタンプとして登録",
                ],
              },
              {
                title: "推奨画像について",
                items: [
                  "透過PNG形式の画像を使用すると背景が透明になります",
                  "正方形に近い画像の方が余白が少なくなります",
                  "高解像度の画像（320px以上）を使用すると品質が維持されます",
                ],
              },
            ]}
          />
        </>
      ) : (
        <>
          <div className="converter-section">
            <h2 className="section-title">元画像</h2>
            <div className="discord-converter-source">
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="元画像プレビュー"
                  className="discord-converter-thumbnail"
                />
              )}
              <div className="discord-converter-info">
                <span className="discord-converter-filename">
                  {originalFile.name}
                </span>
                <span>{formatFileSize(originalFile.size)}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClear}
              disabled={isLoading}
            >
              別の画像を選択
            </Button>
          </div>

          <div className="converter-section">
            <div className="discord-converter-spec">
              <p className="discord-converter-spec-text">
                変換後: {DISCORD_STICKER_SIZE}×{DISCORD_STICKER_SIZE}px / PNG /
                最大512KB（余白は透明）
              </p>
            </div>
          </div>

          <div className="converter-section">
            <div className="button-group" role="group" aria-label="操作ボタン">
              <Button
                type="button"
                onClick={handleConvert}
                disabled={isLoading}
              >
                {isLoading ? "変換中..." : "変換"}
              </Button>
            </div>
          </div>

          {convertedBlob && convertedPreview && (
            <div className="converter-section">
              <h2 className="section-title">変換結果</h2>
              <div className="discord-converter-result">
                <div className="discord-converter-result-preview-wrapper discord-converter-sticker-preview">
                  <img
                    src={convertedPreview}
                    alt="変換後のDiscordスタンププレビュー"
                    className="discord-converter-result-image"
                  />
                </div>
                <div className="discord-converter-result-info">
                  <div className="discord-converter-result-stat">
                    <span className="discord-converter-result-label">
                      サイズ
                    </span>
                    <span className="discord-converter-result-value">
                      {DISCORD_STICKER_SIZE}×{DISCORD_STICKER_SIZE}px
                    </span>
                  </div>
                  <div className="discord-converter-result-stat">
                    <span className="discord-converter-result-label">
                      ファイルサイズ
                    </span>
                    <span
                      className={`discord-converter-result-value ${convertedBlob.size > DISCORD_STICKER_MAX_BYTES ? "discord-converter-over-limit" : "discord-converter-ok"}`}
                    >
                      {formatFileSize(convertedBlob.size)}
                      {convertedBlob.size > DISCORD_STICKER_MAX_BYTES
                        ? " ⚠ 512KB超過"
                        : " ✓ 512KB以下"}
                    </span>
                  </div>
                  <div className="discord-converter-result-stat">
                    <span className="discord-converter-result-label">形式</span>
                    <span className="discord-converter-result-value">PNG</span>
                  </div>
                </div>
              </div>
              <Button type="button" onClick={handleDownload}>
                ダウンロード
              </Button>
            </div>
          )}

          <TipsCard
            sections={[
              {
                title: "Discordスタンプ登録のヒント",
                items: [
                  "Discordのサーバー設定 → スタンプタブから登録できます",
                  "スタンプはNitroまたはサーバーブーストが必要な場合があります",
                  "スタンプにはタイトルと絵文字の説明文を設定できます",
                  "ブラウザ内で処理するため、画像はサーバーにアップロードされません",
                ],
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
