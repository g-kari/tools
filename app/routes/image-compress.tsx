import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { ImageUploadZone } from "~/components/ImageUploadZone";
import { MultiImageCompressItem } from "~/components/MultiImageCompressItem";
import { downloadBlob, calculateCompressionRatio } from "~/utils/image";
import { type CompressItem, type OutputFormat } from "~/types/image-compress";
import JSZip from "jszip";

export const Route = createFileRoute("/image-compress")({
  head: () => ({
    meta: [
    { title: "画像圧縮ツール | Web ツール集" },
    { name: "description", content: "PNG・JPEG画像をブラウザ上で圧縮・最適化。複数ファイル対応・ZIP一括ダウンロード。" },
    { property: "og:title", content: "画像圧縮ツール | Web ツール集" },
    { property: "og:description", content: "PNG・JPEG画像をブラウザ上で圧縮・最適化。複数ファイル対応・ZIP一括ダウンロード。" },
    { property: "og:url", content: `${SITE_BASE_URL}/image-compress` },
    { property: "og:type", content: "website" },
    { property: "og:image", content: SITE_OGP_IMAGE },
    { name: "twitter:title", content: "画像圧縮ツール | Web ツール集" },
    { name: "twitter:description", content: "PNG・JPEG画像をブラウザ上で圧縮・最適化。複数ファイル対応・ZIP一括ダウンロード。" },
  ],
  }),
  component: ImageCompressor,
});

const FORMAT_OPTIONS: { value: OutputFormat; label: string; mimeType: string }[] = [
  { value: "jpeg", label: "JPEG", mimeType: "image/jpeg" },
  { value: "webp", label: "WebP", mimeType: "image/webp" },
  { value: "png", label: "PNG", mimeType: "image/png" },
];

export { calculateCompressionRatio } from "~/utils/image";

/**
 * 画像を圧縮する
 * @param file - 圧縮する画像ファイル
 * @param quality - 画質（0-1）
 * @param format - 出力形式
 * @returns 圧縮されたBlobを含むPromise
 */
export async function compressImage(
  file: File,
  quality: number,
  format: OutputFormat
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      // PNGの透過対応: JPEGの場合は白背景を塗る
      if (format === "jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const mimeType = FORMAT_OPTIONS.find((f) => f.value === format)?.mimeType || "image/jpeg";

      // PNGは画質パラメータを無視
      const qualityParam = format === "png" ? undefined : quality;

      canvas.toBlob(
        (blob) => resolve(blob),
        mimeType,
        qualityParam
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * ダウンロード用のファイル名を生成する
 * @param originalName - 元のファイル名
 * @param format - 出力形式
 * @returns 新しいファイル名
 */
export function generateFilename(originalName: string, format: OutputFormat): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}_compressed.${format}`;
}

/**
 * ファイル重複チェック: 同名・同サイズのファイルを除外して返す
 * @param existingItems - 既存の圧縮アイテムリスト
 * @param newFiles - 追加しようとするファイルリスト
 * @returns 重複を除いた新規ファイルリスト
 */
export function filterDuplicateFiles(existingItems: CompressItem[], newFiles: File[]): File[] {
  return newFiles.filter((newFile) => {
    return !existingItems.some(
      (item) =>
        item.originalFile.name === newFile.name &&
        item.originalFile.size === newFile.size
    );
  });
}

/**
 * 新しいCompressItemを作成する
 * @param file - 元の画像ファイル
 * @param previewUrl - プレビュー用のObject URL
 * @returns CompressItem
 */
export function createCompressItem(file: File, previewUrl: string): CompressItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    originalFile: file,
    previewUrl,
    compressedBlob: null,
    compressedPreviewUrl: null,
    status: "pending",
  };
}

/**
 * ZIPファイル名を生成する (例: compressed_images_20260314.zip)
 * @returns ZIPファイル名
 */
export function buildZipFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `compressed_images_${year}${month}${day}.zip`;
}

/**
 * 完了アイテムの集計情報を取得する
 * @param items - 圧縮アイテムリスト
 * @returns 集計情報（元サイズ合計、圧縮後サイズ合計、圧縮率）
 */
export function getTotalCompressionSummary(items: CompressItem[]): {
  originalTotal: number;
  compressedTotal: number;
  ratio: number;
} {
  const doneItems = items.filter(
    (item) => item.status === "done" && item.compressedBlob !== null
  );

  if (doneItems.length === 0) {
    return { originalTotal: 0, compressedTotal: 0, ratio: 0 };
  }

  const originalTotal = doneItems.reduce(
    (sum, item) => sum + item.originalFile.size,
    0
  );
  const compressedTotal = doneItems.reduce(
    (sum, item) => sum + (item.compressedBlob?.size ?? 0),
    0
  );
  const ratio = calculateCompressionRatio(originalTotal, compressedTotal);

  return { originalTotal, compressedTotal, ratio };
}

/**
 * 画像圧縮ツールのメインコンポーネント（複数画像対応）
 */
function ImageCompressor() {
  const [items, setItems] = useState<CompressItem[]>([]);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const { showToast } = useToast();

  // クリーンアップ用のref
  const itemsRef = useRef<CompressItem[]>([]);
  itemsRef.current = items;

  // コンポーネントアンマウント時に全Object URLを解放
  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.compressedPreviewUrl) {
          URL.revokeObjectURL(item.compressedPreviewUrl);
        }
      }
    };
  }, []);

  /**
   * 単一アイテムを圧縮する内部関数
   */
  const compressItem = useCallback(
    async (item: CompressItem, currentQuality: number, currentFormat: OutputFormat) => {
      // compressingに更新
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "compressing" } : i
        )
      );

      const blob = await compressImage(item.originalFile, currentQuality / 100, currentFormat);

      if (blob) {
        const compressedPreviewUrl = URL.createObjectURL(blob);
        setItems((prev) => {
          const targetItem = prev.find((i) => i.id === item.id);
          if (!targetItem) {
            URL.revokeObjectURL(compressedPreviewUrl);
            return prev;
          }
          return prev.map((i) => {
            if (i.id === item.id) {
              // 古いcompressedPreviewUrlを解放
              if (i.compressedPreviewUrl) {
                URL.revokeObjectURL(i.compressedPreviewUrl);
              }
              return {
                ...i,
                status: "done",
                compressedBlob: blob,
                compressedPreviewUrl,
              };
            }
            return i;
          });
        });
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: "圧縮に失敗しました" }
              : i
          )
        );
      }
    },
    []
  );

  /**
   * 複数ファイルを受け取り、重複除外してitemsに追加し即座に圧縮開始する
   */
  const handleFilesSelect = useCallback(
    async (files: File[]) => {
      const uniqueFiles = filterDuplicateFiles(items, files);

      if (uniqueFiles.length === 0) {
        showToast("重複するファイルはスキップされました", "info");
        return;
      }

      if (uniqueFiles.length < files.length) {
        showToast(
          `${files.length - uniqueFiles.length}件の重複ファイルをスキップしました`,
          "info"
        );
      }

      // 新しいアイテムを作成
      const newItems: CompressItem[] = uniqueFiles.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        return createCompressItem(file, previewUrl);
      });

      setItems((prev) => [...prev, ...newItems]);

      // 即座に並列圧縮開始
      await Promise.all(
        newItems.map((item) => compressItem(item, quality, format))
      );

      showToast(`${uniqueFiles.length}件の画像を圧縮しました`, "success");
    },
    [items, quality, format, compressItem, showToast]
  );

  /**
   * 全アイテムを再圧縮する（品質・形式変更時）
   */
  const handleCompressAll = useCallback(async () => {
    if (items.length === 0) return;

    const pendingItems = items.filter(
      (item) => item.status !== "compressing"
    );

    await Promise.all(
      pendingItems.map((item) => compressItem(item, quality, format))
    );

    showToast("全画像を再圧縮しました", "success");
  }, [items, quality, format, compressItem, showToast]);

  /**
   * 完了アイテムをZIPにまとめてダウンロードする
   */
  const handleDownloadZip = useCallback(async () => {
    const doneItems = items.filter(
      (item) => item.status === "done" && item.compressedBlob
    );

    if (doneItems.length === 0) {
      showToast("ダウンロード可能な画像がありません", "error");
      return;
    }

    const zip = new JSZip();
    for (const item of doneItems) {
      const filename = generateFilename(item.originalFile.name, format);
      zip.file(filename, item.compressedBlob!);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, buildZipFilename());
    showToast(`${doneItems.length}件の画像をZIPでダウンロードしました`, "success");
  }, [items, format, showToast]);

  /**
   * 個別ダウンロード
   */
  const handleDownloadItem = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || !item.compressedBlob) return;

      const filename = generateFilename(item.originalFile.name, format);
      downloadBlob(item.compressedBlob, filename);
      showToast("ダウンロードを開始しました", "success");
    },
    [items, format, showToast]
  );

  /**
   * 個別削除
   */
  const handleRemoveItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (item) {
          URL.revokeObjectURL(item.previewUrl);
          if (item.compressedPreviewUrl) {
            URL.revokeObjectURL(item.compressedPreviewUrl);
          }
        }
        return prev.filter((i) => i.id !== id);
      });
    },
    []
  );

  /**
   * 全アイテムをクリア
   */
  const handleClearAll = useCallback(() => {
    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl);
      if (item.compressedPreviewUrl) {
        URL.revokeObjectURL(item.compressedPreviewUrl);
      }
    }
    setItems([]);
    showToast("全画像をクリアしました", "info");
  }, [items, showToast]);

  const isAnyCompressing = items.some((item) => item.status === "compressing");
  const doneCount = items.filter((item) => item.status === "done").length;
  const summary = getTotalCompressionSummary(items);

  return (
    <>
      <div className="tool-container">
        {/* ドロップゾーン */}
        <div className="converter-section">
          <h2 className="section-title">画像選択</h2>
          <ImageUploadZone
            onFileSelect={handleFilesSelect}
            onTypeError={() => showToast("画像ファイルを選択してください", "error")}
            disabled={isAnyCompressing}
            multiple={true}
            text="クリックして画像を選択、またはドラッグ&ドロップ（複数可）"
            hint="PNG, JPEG, WebP など（複数ファイル対応）"
            ariaLabel="画像ファイルをアップロード（複数可）"
          />
          <p className="compress-drop-hint">
            複数のファイルを同時にドロップするか、クリックして複数選択できます
          </p>
        </div>

        {/* 設定パネル */}
        {items.length > 0 && (
          <div className="converter-section">
            <h2 className="section-title">圧縮設定</h2>

            <div className="compress-options">
              <div className="option-group">
                <label htmlFor="quality">画質: {quality}%</label>
                <input
                  type="range"
                  id="quality"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  disabled={isAnyCompressing}
                  aria-describedby="quality-help"
                />
                <span id="quality-help" className="option-help">
                  値が低いほどファイルサイズが小さくなります
                  {format === "png" && "（PNGは画質設定が無視されます）"}
                </span>
              </div>

              <div className="option-group">
                <label htmlFor="format">出力形式</label>
                <select
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  disabled={isAnyCompressing}
                  aria-describedby="format-help"
                >
                  {FORMAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span id="format-help" className="option-help">
                  WebPは高い圧縮率、JPEGは広い互換性
                </span>
              </div>
            </div>

            {/* 集計情報 */}
            {doneCount > 0 && (
              <div className="compression-stats" aria-label="圧縮統計">
                <div className="stat-item">
                  <span className="stat-label">完了枚数</span>
                  <span className="stat-value">{doneCount} / {items.length}</span>
                </div>
                <div className="stat-item stat-arrow" aria-hidden="true">→</div>
                <div className="stat-item">
                  <span className="stat-label">削減率（平均）</span>
                  <span className={`stat-value ${summary.ratio > 0 ? "stat-positive" : "stat-negative"}`}>
                    {summary.ratio > 0 ? `-${summary.ratio}%` : `+${Math.abs(summary.ratio)}%`}
                  </span>
                </div>
              </div>
            )}

            {/* 一括操作ボタン */}
            <div className="compress-bulk-actions" role="group" aria-label="一括操作">
              <Button
                type="button"
                onClick={handleCompressAll}
                disabled={isAnyCompressing || items.length === 0}
              >
                全て再圧縮
              </Button>
              <Button
                type="button"
                onClick={handleDownloadZip}
                disabled={isAnyCompressing || doneCount === 0}
              >
                ZIPでまとめてダウンロード ({doneCount}件)
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="btn-clear"
                onClick={handleClearAll}
                disabled={isAnyCompressing}
              >
                全てクリア
              </Button>
            </div>
          </div>
        )}

        {/* 画像グリッド */}
        {items.length > 0 && (
          <div className="converter-section">
            <h2 className="section-title">
              圧縮画像一覧 ({items.length}件)
            </h2>
            <div className="compress-image-list" role="list" aria-label="圧縮画像リスト">
              {items.map((item) => (
                <MultiImageCompressItem
                  key={item.id}
                  item={item}
                  onDownload={handleDownloadItem}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "画像圧縮とは",
              items: [
                "画像のファイルサイズを削減し、Webサイトの読み込み速度を改善します",
                "視覚的な品質を維持しながらファイルサイズを大幅に削減可能",
                "すべての処理はブラウザ内で完結（サーバーにアップロードされません）",
              ],
            },
            {
              title: "形式について",
              items: [
                "JPEG: 写真に最適、広い互換性、透過非対応",
                "WebP: 高い圧縮率、モダンブラウザ対応、透過対応",
                "PNG: 可逆圧縮、透過対応、ファイルサイズ大",
              ],
            },
            {
              title: "Tips",
              items: [
                "複数の画像を一度にドロップして一括圧縮できます",
                "写真は60-80%の画質でほとんど見分けがつきません",
                "WebP形式はJPEGより約25-35%小さくなります",
                "透過が必要な場合はWebPまたはPNGを選択",
                "ZIPでまとめてダウンロードすることができます",
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
