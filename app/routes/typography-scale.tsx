import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  generateScale,
  generateOutput,
  SCALE_RATIOS,
  type OutputFormat,
  type ScaleStep,
} from "~/utils/typography-scale";

export const Route = createFileRoute("/typography-scale")({
  head: () => ({
    meta: [
      { title: "タイポグラフィスケール生成 | Web ツール集" },
      {
        name: "description",
        content:
          "モジュラースケール理論に基づきCSSタイポグラフィスケールを生成。CSS変数・SCSS・JSON・Tailwind形式で出力。Golden Ratio等のプリセット比率対応。",
      },
      {
        property: "og:title",
        content: "タイポグラフィスケール生成 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "モジュラースケール理論に基づきCSSタイポグラフィスケールを生成。CSS変数・SCSS・JSON・Tailwind形式で出力。",
      },
      {
        property: "og:url",
        content: `${SITE_BASE_URL}/typography-scale`,
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: TypographyScalePage,
});

const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "css", label: "CSS変数" },
  { value: "scss", label: "SCSS変数" },
  { value: "json", label: "JSON" },
  { value: "tailwind", label: "Tailwind" },
];

/** スケールプレビューの各行コンポーネント */
function ScalePreviewRow({ step }: { step: ScaleStep }) {
  const isBase = step.step === 0;
  return (
    <div
      className={`type-scale-preview-row${isBase ? " is-base" : ""}`}
      aria-label={`${step.label}: ${step.sizePx.toFixed(2)}px`}
    >
      <div className="type-scale-preview-meta">
        <span className="type-scale-preview-label">{step.label}</span>
        <span className="type-scale-preview-size">{step.sizePx.toFixed(2)}px</span>
        <span className="type-scale-preview-rem">{step.sizeRem.toFixed(4)}rem</span>
      </div>
      <div className="type-scale-preview-text" aria-hidden="true">
        <span style={{ fontSize: `${step.sizePx}px` }}>Aa</span>
      </div>
    </div>
  );
}

/**
 * タイポグラフィスケール生成ページコンポーネント
 */
function TypographyScalePage() {
  const { copy } = useClipboard();
  const { showToast } = useToast();

  const [baseSizePx, setBaseSizePx] = useState(16);
  const [rootFontSizePx, setRootFontSizePx] = useState(16);
  const [ratioIndex, setRatioIndex] = useState(4); // Perfect Fourth
  const [customRatio, setCustomRatio] = useState("");
  const [useCustomRatio, setUseCustomRatio] = useState(false);
  const [stepsUp, setStepsUp] = useState(5);
  const [stepsDown, setStepsDown] = useState(2);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("css");

  const ratio = useMemo(() => {
    if (useCustomRatio) {
      const parsed = parseFloat(customRatio);
      return isNaN(parsed) || parsed <= 1 ? SCALE_RATIOS[ratioIndex].value : parsed;
    }
    return SCALE_RATIOS[ratioIndex].value;
  }, [useCustomRatio, customRatio, ratioIndex]);

  const scaleSteps = useMemo(
    () =>
      generateScale({
        baseSizePx,
        rootFontSizePx,
        ratio,
        stepsUp,
        stepsDown,
      }),
    [baseSizePx, rootFontSizePx, ratio, stepsUp, stepsDown],
  );

  const outputCode = useMemo(
    () => generateOutput(scaleSteps, outputFormat),
    [scaleSteps, outputFormat],
  );

  const handleCopy = useCallback(async () => {
    const success = await copy(outputCode);
    if (success) {
      showToast("コードをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [outputCode, copy, showToast]);

  const handleBaseSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 1 && v <= 96) setBaseSizePx(v);
  };

  const handleRootSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 1 && v <= 96) setRootFontSizePx(v);
  };

  const handleStepsUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 0 && v <= 8) setStepsUp(v);
  };

  const handleStepsDownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 0 && v <= 4) setStepsDown(v);
  };

  return (
    <div className="tool-container">
      {/* 設定パネル */}
      <div className="type-scale-settings">
        {/* 基準サイズ */}
        <div className="type-scale-settings-row">
          <div className="type-scale-field">
            <label htmlFor="base-size" className="type-scale-field-label">
              基準フォントサイズ
            </label>
            <div className="type-scale-field-input-wrap">
              <input
                id="base-size"
                type="number"
                min={1}
                max={96}
                value={baseSizePx}
                onChange={handleBaseSizeChange}
                className="type-scale-number-input"
                aria-label="基準フォントサイズ（px）"
              />
              <span className="type-scale-field-unit">px</span>
            </div>
          </div>

          <div className="type-scale-field">
            <label htmlFor="root-size" className="type-scale-field-label">
              ルートフォントサイズ
            </label>
            <div className="type-scale-field-input-wrap">
              <input
                id="root-size"
                type="number"
                min={1}
                max={96}
                value={rootFontSizePx}
                onChange={handleRootSizeChange}
                className="type-scale-number-input"
                aria-label="ルートフォントサイズ（px）、rem計算の基準"
              />
              <span className="type-scale-field-unit">px</span>
            </div>
          </div>

          <div className="type-scale-field">
            <label htmlFor="steps-up" className="type-scale-field-label">
              上方向ステップ数
            </label>
            <input
              id="steps-up"
              type="number"
              min={0}
              max={8}
              value={stepsUp}
              onChange={handleStepsUpChange}
              className="type-scale-number-input"
              aria-label="基準より大きいフォントサイズのステップ数"
            />
          </div>

          <div className="type-scale-field">
            <label htmlFor="steps-down" className="type-scale-field-label">
              下方向ステップ数
            </label>
            <input
              id="steps-down"
              type="number"
              min={0}
              max={4}
              value={stepsDown}
              onChange={handleStepsDownChange}
              className="type-scale-number-input"
              aria-label="基準より小さいフォントサイズのステップ数"
            />
          </div>
        </div>

        {/* スケール比率 */}
        <div className="type-scale-ratio-section">
          <p className="type-scale-field-label">スケール比率</p>
          <div className="type-scale-ratio-grid" role="group" aria-label="スケール比率の選択">
            {SCALE_RATIOS.map((r, i) => (
              <button
                key={r.value}
                type="button"
                className={`type-scale-ratio-btn${!useCustomRatio && ratioIndex === i ? " active" : ""}`}
                onClick={() => {
                  setRatioIndex(i);
                  setUseCustomRatio(false);
                }}
                aria-pressed={!useCustomRatio && ratioIndex === i}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* カスタム比率 */}
          <div className="type-scale-custom-ratio">
            <label className="type-scale-custom-ratio-label">
              <input
                type="checkbox"
                checked={useCustomRatio}
                onChange={(e) => setUseCustomRatio(e.target.checked)}
                aria-label="カスタム比率を使用"
              />
              カスタム比率
            </label>
            {useCustomRatio && (
              <input
                type="number"
                step="0.001"
                min="1.001"
                max="3"
                value={customRatio}
                onChange={(e) => setCustomRatio(e.target.value)}
                placeholder="例: 1.333"
                className="type-scale-number-input"
                aria-label="カスタムスケール比率（1より大きい値）"
              />
            )}
          </div>
        </div>
      </div>

      {/* プレビュー */}
      <div className="type-scale-preview-section">
        <h2 className="section-title">
          スケールプレビュー
          <span className="type-scale-ratio-badge">
            比率: {ratio.toFixed(3)} | {scaleSteps.length} ステップ
          </span>
        </h2>
        <div
          className="type-scale-preview-list"
          role="list"
          aria-label="タイポグラフィスケールプレビュー"
        >
          {[...scaleSteps].reverse().map((step) => (
            <ScalePreviewRow key={step.step} step={step} />
          ))}
        </div>
      </div>

      {/* 出力フォーマット選択 + コード出力 */}
      <div className="output-section">
        <div className="type-scale-output-header">
          <div className="type-scale-format-tabs" role="tablist" aria-label="出力フォーマット">
            {OUTPUT_FORMATS.map((fmt) => (
              <button
                key={fmt.value}
                type="button"
                role="tab"
                aria-selected={outputFormat === fmt.value}
                className={`type-scale-format-tab${outputFormat === fmt.value ? " active" : ""}`}
                onClick={() => setOutputFormat(fmt.value)}
              >
                {fmt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-copy"
            onClick={handleCopy}
            aria-label="生成コードをクリップボードにコピー"
          >
            コピー
          </button>
        </div>
        <textarea
          readOnly
          value={outputCode}
          className="type-scale-code-output"
          aria-label="生成されたコード（読み取り専用）"
          aria-readonly="true"
          rows={scaleSteps.length + 2}
          data-testid="output-code"
        />
      </div>

      <TipsCard
        sections={[
          {
            title: "モジュラースケールとは",
            items: [
              "モジュラースケールは、一定の比率で倍増する連続した数値のセットです",
              "タイポグラフィに適用すると、視覚的に調和のとれたフォントサイズの階層が生まれます",
              "基準サイズ × 比率^ステップ でサイズを計算します",
            ],
          },
          {
            title: "推奨スケール比率",
            items: [
              "Perfect Fourth (1.333): Webで最も広く使われる。落ち着いた階層感",
              "Major Third (1.250): コンパクトなデザインに適した穏やかな比率",
              "Golden Ratio (1.618): 強い視覚的インパクト。大型ディスプレイ向け",
              "Minor Third (1.200): 小さな画面やUIコンポーネントに最適",
            ],
          },
          {
            title: "出力形式の使い方",
            items: [
              "CSS変数: :root に追加し、var(--type-lg) などで利用",
              "SCSS変数: $type-lg のように $変数名 で参照",
              "JSON: デザイントークンとして設計ツールで活用",
              "Tailwind: tailwind.config.js の theme.extend.fontSize に貼り付け",
            ],
          },
        ]}
      />
    </div>
  );
}
