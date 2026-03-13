import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { ImageUploadZone } from "~/components/ImageUploadZone";
import { downloadBlob, formatFileSize } from "~/utils/image";
import {
  convertToDiscordFormat,
  generateDiscordEmojiFilename,
  DISCORD_EMOJI_MAX_SIZE,
  DISCORD_EMOJI_MAX_BYTES,
} from "~/utils/discord-image";

export const Route = createFileRoute("/discord-emoji")({
  head: () => ({
    meta: [{ title: "Discord絵文字コンバーター" }],
  }),
  component: DiscordEmojiConverter,
});

/** リサイズモードの選択肢 */
const RESIZE_MODES = [
  {
    value: "fit" as const,
    label: "フィット（アスペクト比維持）",
    description: "縦横比を維持して128px以内に収めます",
  },
  {
    value: "crop" as const,
    label: "クロップ（正方形）",
    description: "中央を正方形に切り取って128x128にします",
  },
];

/**
 * Discord絵文字コンバーターコンポーネント
 * 画像を128x128px以内・PNG・256KB以下のDiscord絵文字用フォーマットに変換する
 */
function DiscordEmojiConverter() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedPreview, setConvertedPreview] = useState<string | null>(null);
  const [resizeMode, setResizeMode] = useState<"fit" | "crop">("fit");
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
   * Canvas APIを使用して画像を変換する
   */
  const handleConvert = useCallback(async () => {
    if (!originalFile) return;

    setIsLoading(true);
    try {
      const blob = await convertToDiscordFormat(originalFile, {
        type: "emoji",
        emojiResizeMode: resizeMode,
      });

      if (convertedPreview) URL.revokeObjectURL(convertedPreview);
      setConvertedBlob(blob);
      setConvertedPreview(URL.createObjectURL(blob));

      if (blob.size > DISCORD_EMOJI_MAX_BYTES) {
        showToast(
          `変換後のサイズが${Math.round(blob.size / 1024)}KBです。256KB以下にできませんでした。`,
          "warning"
        );
      } else {
        showToast("Discord絵文字用に変換しました", "success");
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "変換に失敗しました",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [originalFile, resizeMode, convertedPreview, showToast]);

  /**
   * ダウンロードボタンのハンドラー
   */
  const handleDownload = useCallback(() => {
    if (!convertedBlob || !originalFile) return;
    const filename = generateDiscordEmojiFilename(originalFile.name);
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
              hint="PNG, JPEG, WebP, GIF など"
              ariaLabel="Discord絵文字に変換する画像をアップロード"
              inputId="discordEmojiFile"
            />
          </div>

          <TipsCard
            sections={[
              {
                title: "Discord絵文字コンバーターとは",
                items: [
                  `Discordの絵文字（カスタム絵文字）として使用できる形式に画像を変換するツールです`,
                  `変換後の仕様: 最大${DISCORD_EMOJI_MAX_SIZE}×${DISCORD_EMOJI_MAX_SIZE}px、PNG形式、256KB以下`,
                ],
              },
              {
                title: "使い方",
                items: [
                  "変換したい画像をアップロード",
                  "リサイズモードを選択（フィットまたはクロップ）",
                  "「変換」ボタンをクリック",
                  "プレビューを確認してダウンロード",
                  "Discordのサーバー設定からカスタム絵文字として登録",
                ],
              },
              {
                title: "リサイズモードについて",
                items: [
                  "フィット: 縦横比を維持して128px以内に収めます（非正方形になる場合あり）",
                  "クロップ: 中央を128×128の正方形に切り取ります（端が切れる場合あり）",
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
            <h2 className="section-title">リサイズモード</h2>
            <div
              className="discord-converter-modes"
              role="group"
              aria-label="リサイズモード選択"
            >
              {RESIZE_MODES.map((mode) => (
                <label key={mode.value} className="discord-converter-mode-label">
                  <input
                    type="radio"
                    name="resizeMode"
                    value={mode.value}
                    checked={resizeMode === mode.value}
                    onChange={() => setResizeMode(mode.value)}
                    disabled={isLoading}
                    className="discord-converter-mode-radio"
                  />
                  <span className="discord-converter-mode-name">
                    {mode.label}
                  </span>
                  <span className="discord-converter-mode-desc">
                    {mode.description}
                  </span>
                </label>
              ))}
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
                <div className="discord-converter-result-preview-wrapper">
                  <img
                    src={convertedPreview}
                    alt="変換後のDiscord絵文字プレビュー"
                    className="discord-converter-result-image"
                  />
                </div>
                <div className="discord-converter-result-info">
                  <div className="discord-converter-result-stat">
                    <span className="discord-converter-result-label">
                      ファイルサイズ
                    </span>
                    <span
                      className={`discord-converter-result-value ${convertedBlob.size > DISCORD_EMOJI_MAX_BYTES ? "discord-converter-over-limit" : "discord-converter-ok"}`}
                    >
                      {formatFileSize(convertedBlob.size)}
                      {convertedBlob.size > DISCORD_EMOJI_MAX_BYTES
                        ? " ⚠ 256KB超過"
                        : " ✓ 256KB以下"}
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
                title: "Discord絵文字登録のヒント",
                items: [
                  "Discordのサーバー設定 → 絵文字タブから登録できます",
                  "Nitroなしの場合、各サーバーで最大50個まで登録可能",
                  "アニメーションGIFの絵文字はNitroが必要です",
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
