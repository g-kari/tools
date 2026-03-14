import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import "../styles/tools/svg-optimizer.css";
import {
  optimizeSvg,
  getSampleSvg,
  getDefaultOptions,
  formatBytes,
} from "../utils/svg-optimizer";
import type { SvgOptimizeResult } from "../utils/svg-optimizer";

export const Route = createFileRoute("/svg-optimizer")({
  head: () => ({
    meta: [
      { title: "SVG最適化 | Web ツール集" },
      {
        name: "description",
        content:
          "SVGファイルの最適化・圧縮・整形ができるオンラインツール。メタデータ削除、数値精度調整、空白圧縮に対応。",
      },
      { property: "og:title", content: "SVG最適化 | Web ツール集" },
      {
        property: "og:description",
        content:
          "SVGファイルの最適化・圧縮・整形ができるオンラインツール。メタデータ削除、数値精度調整、空白圧縮に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/svg-optimizer` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "SVG最適化 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "SVGファイルの最適化・圧縮・整形ができるオンラインツール。メタデータ削除、数値精度調整、空白圧縮に対応。",
      },
    ],
  }),
  component: SvgOptimizerPage,
});

/**
 * SVGオプティマイザーのメインコンポーネント
 * SVGコードを入力として最適化・圧縮・整形を行う
 */
function SvgOptimizerPage() {
  const { showToast } = useToast();
  const [svgInput, setSvgInput] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SvgOptimizeResult | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const defaults = getDefaultOptions();
  const [removeMetadata, setRemoveMetadata] = useState(defaults.removeMetadata);
  const [removeUnusedAttrs, setRemoveUnusedAttrs] = useState(
    defaults.removeUnusedAttrs
  );
  const [precision, setPrecision] = useState(defaults.precision);
  const [prettify, setPrettify] = useState(defaults.prettify);
  const [removeXmlDeclaration, setRemoveXmlDeclaration] = useState(
    defaults.removeXmlDeclaration
  );
  const [removeEmptyGroups, setRemoveEmptyGroups] = useState(
    defaults.removeEmptyGroups
  );

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleOptimize = useCallback(() => {
    setError(null);
    setOutputText("");
    setStats(null);

    try {
      const result = optimizeSvg(svgInput, {
        removeMetadata,
        removeUnusedAttrs,
        precision,
        prettify,
        removeXmlDeclaration,
        removeEmptyGroups,
      });
      setOutputText(result.output);
      setStats(result);
      announceStatus(
        `SVGを最適化しました（${result.reductionPercent}%削減）`
      );
      showToast(
        `SVGを最適化しました（${result.reductionPercent}%削減）`,
        "success"
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [
    svgInput,
    removeMetadata,
    removeUnusedAttrs,
    precision,
    prettify,
    removeXmlDeclaration,
    removeEmptyGroups,
    announceStatus,
    showToast,
  ]);

  const handleLoadSample = useCallback(() => {
    setSvgInput(getSampleSvg());
    setOutputText("");
    setError(null);
    setStats(null);
    announceStatus("サンプルSVGを読み込みました");
    showToast("サンプルSVGを読み込みました", "success");
  }, [announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setSvgInput("");
    setOutputText("");
    setError(null);
    setStats(null);
    announceStatus("入力と結果をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleCopyOutput = useCallback(async () => {
    if (!outputText) {
      showToast("コピーする結果がありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      announceStatus("最適化SVGをクリップボードにコピーしました");
      showToast("最適化SVGをコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, announceStatus, showToast]);

  const handleDownload = useCallback(() => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized.svg";
    a.click();
    URL.revokeObjectURL(url);
    showToast("SVGファイルをダウンロードしました", "success");
  }, [outputText, showToast]);

  // Ctrl+Enter で最適化実行
  useKeyboardShortcut("Enter", handleOptimize, { ctrl: true });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <h1 className="tool-title">SVGオプティマイザー</h1>
        <p className="tool-description">
          SVGファイルの最適化・圧縮・整形ができるオンラインツール。メタデータ削除、数値精度調整、空白圧縮に対応。
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="SVG最適化フォーム"
        >
          <div className="so-layout">
            {/* 左パネル: SVG入力 */}
            <div className="so-panel">
              <span className="so-panel-label">SVG入力</span>
              <textarea
                ref={inputRef}
                id="svgInput"
                className="so-textarea"
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                placeholder={"SVGコードを貼り付けてください...\n例: <svg ...>...</svg>"}
                aria-label="SVG入力欄"
                aria-describedby="so-input-help"
                spellCheck={false}
              />
              <span id="so-input-help" className="sr-only">
                最適化したいSVGコードを入力してください
              </span>

              {/* オプション設定 */}
              <div
                className="so-options"
                role="group"
                aria-label="最適化オプション"
              >
                <div className="so-options-row">
                  <label className="so-option-label">
                    <input
                      type="checkbox"
                      checked={removeMetadata}
                      onChange={(e) => setRemoveMetadata(e.target.checked)}
                    />
                    メタデータ削除
                  </label>
                  <label className="so-option-label">
                    <input
                      type="checkbox"
                      checked={removeUnusedAttrs}
                      onChange={(e) => setRemoveUnusedAttrs(e.target.checked)}
                    />
                    デフォルト属性削除
                  </label>
                  <label className="so-option-label">
                    <input
                      type="checkbox"
                      checked={removeXmlDeclaration}
                      onChange={(e) => setRemoveXmlDeclaration(e.target.checked)}
                    />
                    XML宣言削除
                  </label>
                </div>
                <div className="so-options-row">
                  <label className="so-option-label">
                    <input
                      type="checkbox"
                      checked={removeEmptyGroups}
                      onChange={(e) => setRemoveEmptyGroups(e.target.checked)}
                    />
                    空グループ削除
                  </label>
                  <label className="so-option-label">
                    <input
                      type="checkbox"
                      checked={prettify}
                      onChange={(e) => setPrettify(e.target.checked)}
                    />
                    整形（prettify）
                  </label>
                </div>
                <div className="so-options-row">
                  <label className="so-option-label" htmlFor="so-precision">
                    精度（小数桁数）:
                  </label>
                  <input
                    id="so-precision"
                    type="number"
                    className="so-precision-input"
                    min="0"
                    max="10"
                    value={precision}
                    onChange={(e) =>
                      setPrecision(
                        Math.max(0, Math.min(10, parseInt(e.target.value) || 0))
                      )
                    }
                    aria-label="数値の精度（小数点以下の桁数）"
                  />
                </div>
              </div>

              <div className="so-actions">
                <button
                  type="button"
                  className="so-btn"
                  onClick={handleLoadSample}
                  aria-label="サンプルSVGを読み込む"
                >
                  サンプル読込
                </button>
                <button
                  type="button"
                  className="so-btn"
                  onClick={handleClear}
                  aria-label="入力と結果をクリアする"
                >
                  クリア
                </button>
                <button
                  type="button"
                  className="so-btn so-btn--primary"
                  onClick={handleOptimize}
                  aria-label="SVGを最適化する"
                >
                  最適化
                </button>
              </div>
            </div>

            {/* 右パネル: 最適化結果出力 */}
            <div className="so-panel">
              <span className="so-panel-label">最適化結果</span>

              {stats && (
                <div
                  className="so-stats"
                  role="status"
                  aria-label="最適化統計"
                >
                  <span className="so-stat-item">
                    <span className="so-stat-label">元サイズ:</span>
                    <span className="so-stat-value">
                      {formatBytes(stats.originalSize)}
                    </span>
                  </span>
                  <span className="so-stat-item">
                    <span className="so-stat-label">最適化後:</span>
                    <span className="so-stat-value">
                      {formatBytes(stats.optimizedSize)}
                    </span>
                  </span>
                  <span className="so-stat-item">
                    <span className="so-stat-label">削減率:</span>
                    <span className="so-stat-value">
                      {stats.reductionPercent}%
                    </span>
                  </span>
                </div>
              )}

              <div
                className="so-result-area"
                role="region"
                aria-label="最適化されたSVGコード"
                aria-live="polite"
              >
                {outputText ? (
                  outputText
                ) : (
                  <span className="so-result-empty">
                    {error
                      ? "エラーが発生しました"
                      : "SVGを入力して「最適化」ボタンを押してください（Ctrl+Enter）"}
                  </span>
                )}
              </div>

              <div className="so-actions">
                <button
                  type="button"
                  className="so-btn"
                  onClick={handleCopyOutput}
                  disabled={!outputText}
                  aria-label="最適化SVGをクリップボードにコピーする"
                >
                  コピー
                </button>
                <button
                  type="button"
                  className="so-btn"
                  onClick={handleDownload}
                  disabled={!outputText}
                  aria-label="最適化SVGファイルをダウンロードする"
                >
                  ダウンロード
                </button>
              </div>
            </div>
          </div>

          <ErrorMessage message={error} />
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「SVG入力」欄にSVGコードを貼り付けます",
                "「サンプル読込」ボタンでサンプルSVGを読み込めます",
                "「最適化」ボタンまたはCtrl+EnterでSVGを最適化します",
                "最適化後は「コピー」や「ダウンロード」ボタンで結果を取得できます",
              ],
            },
            {
              title: "最適化オプション",
              items: [
                "メタデータ削除: コメント、エディタ固有の情報を除去",
                "デフォルト属性削除: 初期値と同じ属性を除去（opacity=\"1\"等）",
                "XML宣言削除: <?xml ...?> 宣言を除去",
                "空グループ削除: 中身のない<g>要素を除去",
                "整形: インデント付きで整形出力（圧縮の逆）",
                "精度: 座標の小数点以下桁数を制限してサイズ削減",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
