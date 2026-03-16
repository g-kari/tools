import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "../components/TipsCard";
import { ImageUploadZone } from "../components/ImageUploadZone";
import {
  CVD_INFOS,
  applySimulation,
  fileToImageData,
  imageDataToBlob,
  type CvdInfo,
} from "../utils/color-blind";

export const Route = createFileRoute("/color-blind")({
  head: () => ({
    meta: [
      { title: "色覚シミュレーター | Web ツール集" },
      {
        name: "description",
        content:
          "色覚異常シミュレーター。Deuteranopia・Protanopia・Tritanopiaなど6種類の色覚タイプで画像がどのように見えるか確認できるアクセシビリティツール。",
      },
      {
        property: "og:title",
        content: "色覚シミュレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "色覚異常シミュレーター。6種類の色覚タイプで画像の見え方を確認できるアクセシビリティツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/color-blind` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "色覚シミュレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "色覚異常シミュレーター。6種類の色覚タイプで画像の見え方を確認できるアクセシビリティツール。",
      },
    ],
  }),
  component: ColorBlindSimulator,
});

/**
 * SVG feColorMatrix フィルター定義コンポーネント
 * CSS filter: url(#id) で参照するため、非表示でページに埋め込む
 */
function CvdFilters() {
  return (
    <svg aria-hidden="true" focusable="false" className="cvd-svg-filters">
      <defs>
        {CVD_INFOS.map((info) => (
          <filter id={`cvd-filter-${info.id}`} key={info.id}>
            <feColorMatrix type="matrix" values={info.svgMatrix} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

/**
 * 個別の色覚シミュレーションカード
 */
function SimulationCard({
  info,
  imageUrl,
  onDownload,
}: {
  info: CvdInfo;
  imageUrl: string;
  onDownload: (info: CvdInfo) => void;
}) {
  return (
    <div
      className="cvd-card"
      role="group"
      aria-label={`${info.label} シミュレーション`}
    >
      <div className="cvd-card-header">
        <span className="cvd-card-label">{info.label}</span>
        <span className="cvd-card-english">{info.english}</span>
      </div>
      <div className="cvd-card-image-wrapper">
        {/* 動的フィルター参照のため inline style を使用（静的 CSS では表現不可） */}
        <img
          src={imageUrl}
          alt={`${info.label}（${info.english}）でのシミュレーション`}
          className="cvd-card-image"
          style={{ filter: `url(#cvd-filter-${info.id})` }}
        />
      </div>
      <p className="cvd-card-desc">{info.description}</p>
      <button
        type="button"
        className="cvd-download-btn"
        onClick={() => onDownload(info)}
        aria-label={`${info.label}のシミュレーション画像をダウンロード`}
      >
        ダウンロード
      </button>
    </div>
  );
}

/**
 * 色覚シミュレーターコンポーネント
 * 画像をアップロードして6種類の色覚異常シミュレーションを確認できる
 */
function ColorBlindSimulator() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { showToast } = useToast();

  const handleFileSelect = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setImageFile(file);
    },
    [imageUrl]
  );

  const handleDownload = useCallback(
    async (info: CvdInfo) => {
      if (!imageFile) return;
      try {
        const { imageData } = await fileToImageData(imageFile);
        const simulated = applySimulation(imageData, info.matrix3x3);
        const blob = await imageDataToBlob(simulated);
        if (!blob) {
          showToast("ダウンロードに失敗しました", "error");
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const baseName = imageFile.name.replace(/\.[^/.]+$/, "");
        a.href = url;
        a.download = `${baseName}_${info.id}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`${info.label}の画像をダウンロードしました`, "success");
      } catch {
        showToast("ダウンロードに失敗しました", "error");
      }
    },
    [imageFile, showToast]
  );

  const handleClear = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageFile(null);
  }, [imageUrl]);

  return (
    <>
      <CvdFilters />
      <div className="tool-container">
        {/* アップロードゾーン */}
        <div className="converter-section">
          <h2 className="section-title">画像をアップロード</h2>
          <ImageUploadZone
            onFileSelect={handleFileSelect}
            onTypeError={() =>
              showToast("画像ファイルを選択してください", "error")
            }
            text="クリックして画像を選択、またはドラッグ&ドロップ"
            hint="PNG, JPEG, WebP など"
            ariaLabel="色覚シミュレーション用の画像をアップロード"
          />
        </div>

        {/* シミュレーション結果 */}
        {imageUrl && (
          <>
            {/* 元の画像 */}
            <div className="converter-section">
              <div className="cvd-original-header">
                <h2 className="section-title">元の画像</h2>
                <button
                  type="button"
                  className="cvd-clear-btn"
                  onClick={handleClear}
                  aria-label="画像をクリアして新しい画像を選択"
                >
                  クリア
                </button>
              </div>
              <div className="cvd-original-wrapper">
                <img
                  src={imageUrl}
                  alt="アップロードした元の画像"
                  className="cvd-original-image"
                />
              </div>
            </div>

            {/* シミュレーション一覧 */}
            <div className="converter-section">
              <h2 className="section-title">色覚シミュレーション</h2>
              <p className="cvd-grid-hint">
                各カードの「ダウンロード」ボタンでシミュレーション結果を PNG
                で保存できます
              </p>
              <div
                className="cvd-grid"
                aria-label="色覚異常シミュレーション一覧"
              >
                {CVD_INFOS.map((info) => (
                  <SimulationCard
                    key={info.id}
                    info={info}
                    imageUrl={imageUrl}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <TipsCard
          sections={[
            {
              title: "色覚シミュレーターとは",
              items: [
                "色覚異常（色盲）を持つ人がどのように色を見ているかをシミュレーションするツールです",
                "デザインやUIのアクセシビリティ確認に活用できます",
                "すべての処理はブラウザ内で完結し、画像はサーバーに送信されません",
                "シミュレーション結果をPNG形式でダウンロードできます",
              ],
            },
            {
              title: "色覚異常の種類",
              items: [
                "第二色覚異常（Deuteranopia）: 最も一般的。赤と緑の区別が困難。男性の約6%",
                "第一色覚異常（Protanopia）: 赤の感受性欠如。男性の約2%",
                "第三色覚異常（Tritanopia）: 青の感受性欠如。約0.01%（非常に稀）",
                "第二色覚弱（Deuteranomaly）: 緑感受性が弱い。男性の約5%",
                "第一色覚弱（Protanomaly）: 赤感受性が弱い。男性の約1%",
                "全色盲（Achromatopsia）: 色の識別が全くできない。約0.003%",
              ],
            },
            {
              title: "アクセシビリティ改善のヒント",
              items: [
                "色だけで情報を伝えない（形状・パターン・テキストを併用する）",
                "赤と緑のみの組み合わせを避ける",
                "十分なコントラスト比を確保する（WCAG AA: 4.5:1以上）",
                "色覚シミュレーターで確認しながらカラーパレットを選定する",
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
