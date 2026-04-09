import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { ImageUploadZone } from "~/components/ImageUploadZone";
import { downloadBlob } from "~/utils/image";

export const Route = createFileRoute("/background-removal")({
  head: () => ({
    meta: [
      { title: "AI背景除去 | Web ツール集" },
      {
        name: "description",
        content:
          "AIで画像の背景を自動除去するオンラインツール。人物・商品・動物など複雑な形状にも対応。ブラウザ内で完結しサーバーへの送信なし。",
      },
      { property: "og:title", content: "AI背景除去 | Web ツール集" },
      {
        property: "og:description",
        content:
          "AIで画像の背景を自動除去するオンラインツール。人物・商品・動物など複雑な形状にも対応。ブラウザ内で完結しサーバーへの送信なし。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/background-removal` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "AI背景除去 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "AIで画像の背景を自動除去するオンラインツール。人物・商品・動物など複雑な形状にも対応。ブラウザ内で完結しサーバーへの送信なし。",
      },
    ],
  }),
  component: BackgroundRemoval,
});

type ProcessStatus = "idle" | "loading" | "done" | "error";

interface ProgressState {
  key: string;
  value: number;
  total: number;
}

function BackgroundRemoval() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const { showToast } = useToast();

  const originalUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  const handleFileSelect = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // 既存のURLをクリーンアップ
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);

    const url = URL.createObjectURL(file);
    originalUrlRef.current = url;
    resultUrlRef.current = null;

    setOriginalFile(file);
    setOriginalUrl(url);
    setResultBlob(null);
    setResultUrl(null);
    setStatus("idle");
    setProgress(null);
  }, []);

  const handleRemoveBackground = useCallback(async () => {
    if (!originalFile) return;

    setStatus("loading");
    setProgress(null);

    try {
      // 動的インポートでCloudflare Workers互換性を確保
      const { removeBackground } = await import("@imgly/background-removal");

      const blob = await removeBackground(originalFile, {
        progress: (key: string, current: number, total: number) => {
          setProgress({ key, value: current, total });
        },
      });

      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;

      setResultBlob(blob);
      setResultUrl(url);
      setStatus("done");
      setProgress(null);
      showToast("背景を除去しました", "success");
    } catch (err) {
      console.error("背景除去エラー:", err);
      setStatus("error");
      setProgress(null);
      showToast("背景除去に失敗しました", "error");
    }
  }, [originalFile, showToast]);

  const handleDownload = useCallback(() => {
    if (!resultBlob || !originalFile) return;
    const baseName = originalFile.name.replace(/\.[^/.]+$/, "");
    downloadBlob(resultBlob, `${baseName}_no_bg.png`);
    showToast("ダウンロードしました", "success");
  }, [resultBlob, originalFile, showToast]);

  const handleClear = useCallback(() => {
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    originalUrlRef.current = null;
    resultUrlRef.current = null;

    setOriginalFile(null);
    setOriginalUrl(null);
    setResultBlob(null);
    setResultUrl(null);
    setStatus("idle");
    setProgress(null);
  }, []);

  const isLoading = status === "loading";

  // プログレスのパーセント計算
  const progressPercent =
    progress && progress.total > 0 ? Math.round((progress.value / progress.total) * 100) : 0;

  const progressLabel = (() => {
    if (!progress) return "処理中...";
    const key = progress.key;
    if (key.includes("fetch")) return "モデルをダウンロード中...";
    if (key.includes("load")) return "モデルを読み込み中...";
    if (key.includes("inference") || key.includes("run")) return "AI処理中...";
    return "処理中...";
  })();

  return (
    <div className="tool-container">
      {/* アップロードゾーン */}
      <div className="converter-section">
        <h2 className="section-title">画像選択</h2>
        <ImageUploadZone
          onFileSelect={handleFileSelect}
          onTypeError={() => showToast("画像ファイルを選択してください", "error")}
          disabled={isLoading}
          multiple={false}
          text="クリックして画像を選択、またはドラッグ&ドロップ"
          hint="PNG, JPEG, WebP など"
          ariaLabel="画像ファイルをアップロード"
        />
      </div>

      {/* 操作エリア */}
      {originalFile && (
        <div className="converter-section">
          <div className="bg-removal-actions">
            <Button type="button" onClick={handleRemoveBackground} disabled={isLoading}>
              {isLoading ? "処理中..." : "背景を除去"}
            </Button>
            {status === "done" && resultBlob && (
              <Button type="button" variant="secondary" onClick={handleDownload}>
                PNG でダウンロード
              </Button>
            )}
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
          <p className="bg-removal-meta">
            {originalFile.name} ({(originalFile.size / 1024).toFixed(0)} KB)
          </p>
        </div>
      )}

      {/* プレビュー */}
      {originalFile && (
        <div className="converter-section">
          <h2 className="section-title">プレビュー</h2>
          <div className="bg-removal-preview-area">
            {/* 元画像 */}
            <div className="bg-removal-panel">
              <span className="bg-removal-panel-label">元画像</span>
              <div className="bg-removal-image-wrapper">
                {originalUrl && <img src={originalUrl} alt="元画像" />}
              </div>
            </div>

            {/* 処理結果 */}
            <div className="bg-removal-panel">
              <span className="bg-removal-panel-label">背景除去後</span>
              <div
                className={`bg-removal-image-wrapper ${status === "done" ? "checkerboard" : ""}`}
              >
                {/* プログレスオーバーレイ */}
                {isLoading && (
                  <div className="bg-removal-progress-overlay" aria-live="polite">
                    <span className="bg-removal-progress-text">{progressLabel}</span>
                    <div
                      className="bg-removal-progress-bar-wrapper"
                      role="progressbar"
                      aria-valuenow={progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="bg-removal-progress-bar"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {progress && progress.total > 0 && (
                      <span className="bg-removal-progress-text">{progressPercent}%</span>
                    )}
                  </div>
                )}

                {/* 結果画像 */}
                {status === "done" && resultUrl && <img src={resultUrl} alt="背景除去後" />}

                {/* プレースホルダー */}
                {status === "idle" && (
                  <div className="bg-removal-placeholder">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    <span>「背景を除去」ボタンを押してください</span>
                  </div>
                )}

                {/* エラー */}
                {status === "error" && (
                  <div className="bg-removal-placeholder">
                    <span>処理に失敗しました</span>
                    <span>再度お試しください</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <TipsCard
        sections={[
          {
            title: "AI背景除去とは",
            items: [
              "機械学習モデルが画像を解析し、背景と前景を自動的に分離します",
              "人物・動物・商品・ロゴなど幅広い被写体に対応",
              "すべての処理はブラウザ内で完結（画像はサーバーに送信されません）",
            ],
          },
          {
            title: "使い方",
            items: [
              "画像をアップロード（PNG・JPEG・WebP など）",
              "「背景を除去」ボタンをクリック",
              "初回はAIモデルのダウンロードが必要です（数十MB）",
              "処理完了後、PNG でダウンロード",
            ],
          },
          {
            title: "Tips",
            items: [
              "2回目以降はモデルがキャッシュされるため高速に動作します",
              "前景と背景のコントラストが明確な画像ほど精度が上がります",
              "出力はアルファチャンネル付きのPNG形式です",
              "色指定で背景を除去したい場合は「透過画像」ツールをお試しください",
            ],
          },
        ]}
      />
    </div>
  );
}
