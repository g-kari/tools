import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { ImageUploadZone } from "~/components/ImageUploadZone";
import { TipsCard } from "~/components/TipsCard";
import { useToast } from "~/components/Toast";
import { formatFileSize } from "~/utils/image";
import {
  parseExif,
  stripExif,
  groupEntriesByCategory,
  isJpegFile,
  type ExifEntry,
  type GpsCoordinate,
} from "~/utils/exif";
import "../styles/tools/exif-viewer.css";

export const Route = createFileRoute("/exif-viewer")({
  head: () => ({
    meta: [
      { title: "EXIFビューワー | Web ツール集" },
      {
        name: "description",
        content:
          "JPEG画像のEXIFメタデータ（撮影日時・カメラ情報・GPS位置情報など）を表示。プライバシー保護のためEXIFデータを除去したファイルをダウンロード可能。",
      },
      { property: "og:title", content: "EXIFビューワー | Web ツール集" },
      {
        property: "og:description",
        content:
          "JPEG画像のEXIFメタデータを表示・削除。GPS情報・カメラ情報・撮影日時などを確認できます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/exif-viewer` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "EXIFビューワー | Web ツール集" },
      {
        name: "twitter:description",
        content: "JPEG画像のEXIFメタデータを表示・削除。",
      },
    ],
  }),
  component: ExifViewerPage,
});

/** カテゴリの表示設定 */
const CATEGORY_CONFIG = {
  camera: { label: "カメラ情報", icon: "📷" },
  datetime: { label: "日時情報", icon: "📅" },
  gps: { label: "GPS・位置情報", icon: "📍" },
  basic: { label: "基本情報", icon: "🖼️" },
  other: { label: "撮影設定", icon: "⚙️" },
} as const;

/** EXIFエントリテーブル */
function ExifTable({ entries }: { entries: ExifEntry[] }) {
  return (
    <div className="exif-table" role="table" aria-label="EXIFデータ">
      {entries.map((entry) => (
        <div key={entry.tagId} className="exif-table-row" role="row">
          <div className="exif-table-key" role="cell">
            {entry.tag}
          </div>
          <div className="exif-table-val" role="cell">
            {entry.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/** GPS マップリンク */
function GpsMapLink({ gps }: { gps: GpsCoordinate }) {
  if (!gps.mapsUrl) return null;
  return (
    <div className="exif-gps-link-wrapper">
      <a
        href={gps.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="exif-gps-link"
        aria-label={`Google Mapsで位置を確認 (緯度: ${gps.latitude?.toFixed(6)}, 経度: ${gps.longitude?.toFixed(6)})`}
      >
        🗺️ Google Mapsで確認
      </a>
    </div>
  );
}

/**
 * EXIFビューワーページ
 */
function ExifViewerPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [exifData, setExifData] = useState<ReturnType<typeof groupEntriesByCategory> | null>(null);
  const [gps, setGps] = useState<GpsCoordinate>({ latitude: null, longitude: null, mapsUrl: null });
  const [hasExif, setHasExif] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isStripped, setIsStripped] = useState(false);

  const { showToast } = useToast();

  const handleFileSelect = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;

      if (!isJpegFile(file)) {
        showToast("JPEG（.jpg/.jpeg）ファイルを選択してください", "error");
        return;
      }

      setIsStripped(false);

      // 画像プレビュー用 URL を生成
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setImageFile(file);

      // 画像サイズを取得
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;

      // EXIF 解析
      file.arrayBuffer().then((buffer) => {
        const result = parseExif(buffer);
        setHasExif(result.hasExif);
        setGps(result.gps);
        setExifData(groupEntriesByCategory(result.entries));
      });
    },
    [imageUrl, showToast],
  );

  const handleTypeError = useCallback(() => {
    showToast("JPEG（.jpg/.jpeg）ファイルを選択してください", "error");
  }, [showToast]);

  const handleStripExif = useCallback(() => {
    if (!imageFile) return;
    imageFile.arrayBuffer().then((buffer) => {
      const stripped = stripExif(buffer);
      if (!stripped) {
        showToast("EXIFの除去に失敗しました", "error");
        return;
      }
      // ダウンロード
      const url = URL.createObjectURL(stripped);
      const a = document.createElement("a");
      a.href = url;
      const baseName = imageFile.name.replace(/\.[^.]+$/, "");
      a.download = `${baseName}_no-exif.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsStripped(true);
      showToast("EXIFデータを除去してダウンロードしました", "success");
    });
  }, [imageFile, showToast]);

  const handleReset = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(null);
    setImageUrl(null);
    setExifData(null);
    setGps({ latitude: null, longitude: null, mapsUrl: null });
    setHasExif(false);
    setDimensions(null);
    setIsStripped(false);
  }, [imageUrl]);

  const totalEntries = exifData
    ? Object.values(exifData).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <div className="tool-container">
      {/* アップロードエリア */}
      {!imageFile && (
        <div className="exif-upload-section">
          <ImageUploadZone
            onFileSelect={handleFileSelect}
            onTypeError={handleTypeError}
            accept="image/jpeg,.jpg,.jpeg"
            hint="JPEG (.jpg, .jpeg) のみ対応"
            text="クリックして画像を選択、またはドラッグ&ドロップ"
            ariaLabel="JPEG画像をアップロード"
            inputId="exifImageFile"
          />
        </div>
      )}

      {/* 画像プレビュー + EXIF データ */}
      {imageFile && (
        <>
          {/* GPS 位置情報の警告 */}
          {gps.latitude !== null && (
            <div className="exif-privacy-banner" role="alert">
              <span className="exif-privacy-icon" aria-hidden="true">
                ⚠️
              </span>
              <div className="exif-privacy-text">
                <span className="exif-privacy-title">GPS位置情報が含まれています</span>
                <span className="exif-privacy-desc">
                  この画像には撮影場所の緯度・経度情報が埋め込まれています。SNSなどに公開する前に「EXIF除去」をご検討ください。
                </span>
              </div>
            </div>
          )}

          <div className="exif-preview-section">
            {/* 左側: 画像プレビュー + ファイル情報 */}
            <div className="exif-image-panel">
              <div className="exif-image-wrap">
                {imageUrl && <img src={imageUrl} alt={imageFile.name} loading="lazy" />}
              </div>

              <div className="exif-file-info" aria-label="ファイル情報">
                <div className="exif-file-info-row">
                  <span className="exif-file-info-label">ファイル名</span>
                  <span className="exif-file-info-value">{imageFile.name}</span>
                </div>
                <div className="exif-file-info-row">
                  <span className="exif-file-info-label">ファイルサイズ</span>
                  <span className="exif-file-info-value">{formatFileSize(imageFile.size)}</span>
                </div>
                {dimensions && (
                  <div className="exif-file-info-row">
                    <span className="exif-file-info-label">解像度</span>
                    <span className="exif-file-info-value">
                      {dimensions.width} × {dimensions.height} px
                    </span>
                  </div>
                )}
                <div className="exif-file-info-row">
                  <span className="exif-file-info-label">EXIFデータ</span>
                  <span className="exif-file-info-value">
                    {hasExif ? `${totalEntries} 項目` : "なし"}
                  </span>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="exif-action-row">
                {hasExif && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleStripExif}
                    aria-label="EXIFデータを除去してダウンロード"
                  >
                    🗑️ EXIF除去してDL
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleReset}
                  aria-label="別の画像を選択"
                >
                  別の画像を選択
                </button>
              </div>

              {isStripped && (
                <div className="exif-stripped-notice" role="status" aria-live="polite">
                  ✅ EXIFを除去した画像をダウンロードしました
                </div>
              )}
            </div>

            {/* 右側: EXIF データ表示 */}
            <div className="exif-data-panel">
              {!hasExif ? (
                <div className="exif-no-data" aria-label="EXIFデータなし">
                  <span className="exif-no-data-icon" aria-hidden="true">
                    🔍
                  </span>
                  <span className="exif-no-data-title">EXIFデータなし</span>
                  <span className="exif-no-data-desc">
                    この画像にはEXIFメタデータが含まれていません
                  </span>
                </div>
              ) : (
                <>
                  {/* サマリーバッジ */}
                  <div className="exif-summary-row" aria-label="EXIFデータサマリー">
                    <span className="exif-badge">📊 {totalEntries} 項目</span>
                    {exifData?.camera && exifData.camera.length > 0 && (
                      <span className="exif-badge">📷 カメラ情報あり</span>
                    )}
                    {exifData?.datetime && exifData.datetime.length > 0 && (
                      <span className="exif-badge">📅 日時情報あり</span>
                    )}
                    {gps.latitude !== null && (
                      <span className="exif-badge has-gps">📍 GPS情報あり</span>
                    )}
                  </div>

                  {/* カテゴリ別 EXIF データ */}
                  {exifData &&
                    (
                      Object.entries(CATEGORY_CONFIG) as [
                        keyof typeof CATEGORY_CONFIG,
                        (typeof CATEGORY_CONFIG)[keyof typeof CATEGORY_CONFIG],
                      ][]
                    ).map(([key, config]) => {
                      const entries = exifData[key];
                      if (!entries || entries.length === 0) return null;
                      return (
                        <section
                          key={key}
                          className="exif-category-section"
                          aria-label={config.label}
                        >
                          <div className="exif-category-header">
                            <span className="exif-category-icon" aria-hidden="true">
                              {config.icon}
                            </span>
                            {config.label}
                          </div>
                          <ExifTable entries={entries} />
                          {key === "gps" && <GpsMapLink gps={gps} />}
                        </section>
                      );
                    })}
                </>
              )}
            </div>
          </div>
        </>
      )}

      <TipsCard
        sections={[
          {
            title: "使い方",
            items: [
              "JPEG（.jpg/.jpeg）ファイルをドラッグ&ドロップ、またはクリックして選択します",
              "画像に含まれるEXIFメタデータ（カメラ情報・撮影日時・GPS位置情報など）が表示されます",
              "GPS位置情報が含まれる場合は警告が表示されます",
              "「EXIF除去してDL」ボタンで、EXIFデータを取り除いた画像をダウンロードできます",
              "すべての処理はブラウザ内で完結し、画像データがサーバーに送信されることはありません",
            ],
          },
          {
            title: "EXIFデータとは",
            items: [
              "EXIF（Exchangeable Image File Format）は、デジタルカメラやスマートフォンが撮影時に画像に埋め込むメタデータです",
              "カメラのメーカー・モデル、レンズ情報、ISO感度、シャッタースピード、絞り値などの撮影設定が含まれます",
              "撮影日時の正確な情報も記録されます（タイムゾーン情報を含む場合あり）",
              "スマートフォンで撮影した場合、GPS情報（緯度・経度）が含まれることがあります",
              "SNSやウェブへ画像を公開する際は、プライバシー保護のためEXIFデータの確認・削除をお勧めします",
            ],
          },
        ]}
      />
    </div>
  );
}
